import React, { useState } from 'react';
import { ArrowLeft, Plus, Check, Trash2, Server, Key, Globe, RefreshCw, AlertCircle, Save, ChevronDown } from 'lucide-react';
import { ApiPreset, Song } from '../types';
import { StatusBar } from './StatusBar';

interface ApiSettingsAppProps {
  isOpen: boolean;
  onClose: () => void;
  presets: ApiPreset[];
  activePresetId: string | null;
  onSavePreset: (preset: ApiPreset) => void;
  onDeletePreset: (id: string) => void;
  onSelectPreset: (id: string) => void;
  statusBarProps?: {
    musicState: {
        isPlaying: boolean;
        currentSong?: Song;
        isVisible?: boolean;
    };
    musicControls: {
        onPlayPause: () => void;
        onNext: () => void;
        onPrev: () => void;
        onClose: () => void;
    };
    audioRef: React.RefObject<HTMLAudioElement | null>;
  }
}

export const ApiSettingsApp: React.FC<ApiSettingsAppProps> = ({
  isOpen, onClose, presets, activePresetId, onSavePreset, onDeletePreset, onSelectPreset, statusBarProps
}) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingPreset, setEditingPreset] = useState<Partial<ApiPreset>>({});
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (preset?: ApiPreset) => {
    if (preset) {
      setEditingPreset(preset);
      // If editing, we might want to populate fetched models immediately or just let them re-fetch
      // For simplicity, we start with the saved model in the list but don't auto-fetch to save bandwidth
      setFetchedModels([preset.selectedModel]); 
    } else {
      setEditingPreset({
        id: crypto.randomUUID(),
        name: '',
        baseUrl: '',
        apiKey: '',
        selectedModel: ''
      });
      setFetchedModels([]);
    }
    setError('');
    setView('edit');
  };

  const handleFetchModels = async () => {
    if (!editingPreset.baseUrl || !editingPreset.apiKey) {
      setError('请填写完整的 API 地址和密钥');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // Normalize URL: remove trailing slashes
      let url = editingPreset.baseUrl.trim().replace(/\/+$/, '');
      
      // Heuristic: Append /v1/models if not present, or assume user knows what they are doing if they provided a full path
      // Most standardized APIs (OpenAI, DeepSeek, etc) use /v1/models
      const targetUrl = url.includes('/v1') ? `${url}/models` : `${url}/v1/models`;

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${editingPreset.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`请求失败: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      
      // Standard OpenAI format: { data: [{ id: 'model-name', ... }] }
      if (data.data && Array.isArray(data.data)) {
        const modelIds = data.data.map((m: any) => m.id);
        setFetchedModels(modelIds);
        if (modelIds.length > 0 && !editingPreset.selectedModel) {
             setEditingPreset(prev => ({ ...prev, selectedModel: modelIds[0] }));
        }
      } else {
        throw new Error('无法识别返回的数据格式');
      }
    } catch (err: any) {
      setError(err.message || '拉取模型失败，请检查网络或配置');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!editingPreset.name || !editingPreset.baseUrl || !editingPreset.apiKey || !editingPreset.selectedModel) {
      setError('请填写所有必填项并选择一个模型');
      return;
    }
    onSavePreset(editingPreset as ApiPreset);
    setView('list');
  };

  return (
    <div className="absolute inset-0 z-50 bg-stone-50/90 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
      <StatusBar className="bg-white" {...statusBarProps} />
      {/* Header */}
      <div className="px-4 py-4 flex items-center bg-white/80 backdrop-blur-md shadow-sm z-10 shrink-0">
        <button 
          onClick={view === 'edit' ? () => setView('list') : onClose} 
          className="p-2 -ml-2 hover:bg-stone-100/50 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-stone-700" />
        </button>
        <h1 className="text-lg font-bold text-stone-800 ml-2">
          {view === 'list' ? 'API 设置' : (editingPreset.id ? '编辑预设' : '新建预设')}
        </h1>
        {view === 'list' && (
          <button 
            onClick={() => handleStartEdit()} 
            className="ml-auto p-2 bg-stone-800 text-white rounded-full hover:bg-stone-700 transition-colors shadow-md active:scale-95"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          {presets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-400 gap-4">
              <Server size={48} className="opacity-20" />
              <p className="text-sm font-medium">暂无 API 预设，请点击右上角添加</p>
            </div>
          ) : (
            presets.map(preset => (
              <div 
                key={preset.id}
                className={`group relative rounded-2xl p-5 border transition-all duration-200 ${
                  activePresetId === preset.id 
                    ? 'bg-white/80 border-stone-800 shadow-md ring-1 ring-stone-800/10' 
                    : 'bg-white/60 border-stone-100 shadow-sm hover:border-stone-300'
                }`}
                onClick={() => onSelectPreset(preset.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-base ${activePresetId === preset.id ? 'text-stone-800' : 'text-stone-600'}`}>
                    {preset.name}
                  </h3>
                  {activePresetId === preset.id && (
                    <div className="bg-stone-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={10} />
                      Current
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Globe size={12} />
                        <span className="truncate">{preset.baseUrl}</span>
                    </div>
                     <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Server size={12} />
                        <span className="truncate">{preset.selectedModel}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleStartEdit(preset); }}
                     className="p-1.5 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200"
                   >
                     <RefreshCw size={14} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.id); }}
                     className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EDIT VIEW */}
      {view === 'edit' && (
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
          
          {/* Preset Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 ml-1 uppercase">预设名称</label>
            <div className="bg-white/60 p-4 rounded-2xl border border-stone-200 shadow-sm focus-within:ring-2 focus-within:ring-stone-800 focus-within:border-transparent transition-all">
                <input 
                    type="text" 
                    value={editingPreset.name || ''}
                    onChange={(e) => setEditingPreset({...editingPreset, name: e.target.value})}
                    placeholder="例如: DeepSeek, OpenAI..."
                    className="w-full text-stone-800 placeholder:text-stone-300 outline-none font-medium bg-transparent"
                />
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-4">
             <label className="text-xs font-bold text-stone-500 ml-1 uppercase">连接配置</label>
             
             <div className="bg-white/60 rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="flex items-center p-4 border-b border-stone-100">
                    <Globe size={18} className="text-stone-400 shrink-0 mr-3" />
                    <input 
                        type="text" 
                        value={editingPreset.baseUrl || ''}
                        onChange={(e) => setEditingPreset({...editingPreset, baseUrl: e.target.value})}
                        placeholder="API Base URL (e.g. https://api.deepseek.com)"
                        className="w-full text-sm text-stone-800 placeholder:text-stone-300 outline-none font-mono bg-transparent"
                    />
                </div>
                <div className="flex items-center p-4">
                    <Key size={18} className="text-stone-400 shrink-0 mr-3" />
                    <input 
                        type="password" 
                        value={editingPreset.apiKey || ''}
                        onChange={(e) => setEditingPreset({...editingPreset, apiKey: e.target.value})}
                        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full text-sm text-stone-800 placeholder:text-stone-300 outline-none font-mono bg-transparent"
                    />
                </div>
             </div>
          </div>

          {/* Fetch Models Action */}
          <div className="flex items-center gap-2">
              <button 
                onClick={handleFetchModels}
                disabled={isLoading}
                className="flex-1 bg-stone-100/50 text-stone-600 font-bold py-3 rounded-xl text-sm hover:bg-stone-200/50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-stone-100"
              >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <RefreshCw size={16} />
                )}
                拉取模型列表
              </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50/90 text-red-500 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={14} />
                {error}
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-stone-500 ml-1 uppercase">选择模型</label>
             <div className="relative">
                <select 
                    value={editingPreset.selectedModel || ''}
                    onChange={(e) => setEditingPreset({...editingPreset, selectedModel: e.target.value})}
                    className="w-full appearance-none bg-white/60 p-4 pr-10 rounded-2xl border border-stone-200 shadow-sm text-stone-800 font-medium outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all"
                >
                    <option value="" disabled>请选择或输入模型...</option>
                    {fetchedModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                    {!fetchedModels.includes(editingPreset.selectedModel || '') && editingPreset.selectedModel && (
                        <option value={editingPreset.selectedModel}>{editingPreset.selectedModel}</option>
                    )}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
             </div>
             <p className="text-[10px] text-stone-400 ml-1">
                {fetchedModels.length > 0 ? `已获取 ${fetchedModels.length} 个可用模型` : '点击上方按钮获取模型列表，或直接在保存前确认。'}
             </p>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            className="mt-auto w-full bg-stone-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-stone-200 hover:bg-stone-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            保存设置
          </button>
        </div>
      )}

    </div>
  );
};