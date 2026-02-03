import React, { useState, useRef } from 'react';
import { ArrowLeft, Save, Download, Upload, ShieldAlert, Plus, Trash2, Edit2, X, Tag, Image, MessageCircle, Settings, FileBox } from 'lucide-react';
import { MinMaxSettings, Song, ForbiddenWordEntry } from '../types';
import { StatusBar } from './StatusBar';

interface SettingsAppProps {
  isOpen: boolean;
  onClose: () => void;
  minmaxSettings: MinMaxSettings;
  onSaveMinMax: (settings: MinMaxSettings) => void;
  onExportBackup: (type: 'full' | 'appearance' | 'chat' | 'settings') => void;
  onImportBackup: (file: File) => Promise<void>;
  forbiddenWords?: ForbiddenWordEntry[];
  onUpdateForbiddenWords?: (words: ForbiddenWordEntry[]) => void;
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

// Internal Modal for adding/editing forbidden words
const ForbiddenWordModal = ({ isOpen, onClose, onSave, initialData }: { isOpen: boolean, onClose: () => void, onSave: (word: string, category: string) => void, initialData?: ForbiddenWordEntry }) => {
    const [word, setWord] = useState(initialData?.word || '');
    const [category, setCategory] = useState(initialData?.category || 'General');

    // Reset when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setWord(initialData?.word || '');
            setCategory(initialData?.category || '通用');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-stone-800 text-center">{initialData ? '编辑违禁词' : '添加违禁词'}</h3>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400">词汇内容</label>
                    <input 
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm mt-1 outline-none focus:border-stone-400"
                        value={word}
                        onChange={e => setWord(e.target.value)}
                        placeholder="输入禁止输出的词汇..."
                        autoFocus
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400">分类标签</label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {['通用', '敏感', '暴力', 'OOC', '其他'].map(cat => (
                            <button 
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${category === cat ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <input 
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm mt-1 outline-none focus:border-stone-400"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="自定义分类..."
                    />
                </div>

                <button 
                    onClick={() => {
                        if (word.trim()) {
                            onSave(word.trim(), category.trim() || '通用');
                            onClose();
                        }
                    }}
                    className="w-full bg-stone-800 text-white py-2.5 rounded-xl font-bold mt-2"
                >
                    保存
                </button>
            </div>
        </div>
    );
};

export const SettingsApp: React.FC<SettingsAppProps> = ({
  isOpen, onClose, minmaxSettings, onSaveMinMax, onExportBackup, onImportBackup, statusBarProps, forbiddenWords = [], onUpdateForbiddenWords
}) => {
  const [localSettings, setLocalSettings] = useState<MinMaxSettings>(minmaxSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Forbidden words state
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<ForbiddenWordEntry | undefined>(undefined);

  // Sync local state when prop updates (e.g. after import)
  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(minmaxSettings);
    }
  }, [isOpen, minmaxSettings]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onImportBackup(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert('备份导入成功！');
      } catch (err) {
        alert('导入失败，请检查文件格式');
      }
    }
  };

  // Forbidden Words Handlers
  const handleSaveWord = (word: string, category: string) => {
      if (!onUpdateForbiddenWords) return;
      
      if (editingWord) {
          onUpdateForbiddenWords(forbiddenWords.map(w => w.id === editingWord.id ? { ...w, word, category } : w));
      } else {
          // simple random ID generation
          const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
          onUpdateForbiddenWords([...forbiddenWords, { id: newId, word, category }]);
      }
      setEditingWord(undefined);
  };

  const handleDeleteWord = (id: string) => {
      if (onUpdateForbiddenWords && confirm('确定删除该违禁词吗？')) {
          onUpdateForbiddenWords(forbiddenWords.filter(w => w.id !== id));
      }
  };

  return (
    <div className="absolute inset-0 z-50 bg-stone-50/90 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
      <StatusBar className="bg-white" {...statusBarProps} />
      {/* Header */}
      <div className="px-4 py-4 flex items-center bg-white/80 backdrop-blur-md shadow-sm z-10 shrink-0">
        <button 
          onClick={onClose} 
          className="p-2 -ml-2 hover:bg-stone-100/50 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-stone-700" />
        </button>
        <h1 className="text-lg font-bold text-stone-800 ml-2">设置中心</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8 no-scrollbar">
        
        {/* SECTION 1: DATA MANAGEMENT */}
        <section className="space-y-3">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">数据管理</h2>
            <div className="bg-white/60 rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                {/* Full Backup */}
                <button 
                    onClick={() => onExportBackup('full')}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors border-b border-stone-100 text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <FileBox size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-stone-700">导出完整备份</div>
                            <div className="text-xs text-stone-400">保存所有数据</div>
                        </div>
                    </div>
                </button>

                {/* Split Backups */}
                <div className="grid grid-cols-3 border-b border-stone-100">
                    <button 
                        onClick={() => onExportBackup('appearance')}
                        className="flex flex-col items-center justify-center p-4 hover:bg-white/50 transition-colors border-r border-stone-100 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-2 group-hover:bg-purple-100">
                            <Image size={16} />
                        </div>
                        <span className="text-xs font-bold text-stone-600">美化备份</span>
                    </button>
                    <button 
                        onClick={() => onExportBackup('chat')}
                        className="flex flex-col items-center justify-center p-4 hover:bg-white/50 transition-colors border-r border-stone-100 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center mb-2 group-hover:bg-pink-100">
                            <MessageCircle size={16} />
                        </div>
                        <span className="text-xs font-bold text-stone-600">聊天记录</span>
                    </button>
                    <button 
                        onClick={() => onExportBackup('settings')}
                        className="flex flex-col items-center justify-center p-4 hover:bg-white/50 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2 group-hover:bg-orange-100">
                            <Settings size={16} />
                        </div>
                        <span className="text-xs font-bold text-stone-600">配置备份</span>
                    </button>
                </div>
                
                {/* Import */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center p-4 hover:bg-white/50 transition-colors text-left group"
                >
                     <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                <Upload size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-stone-700">导入备份</div>
                                <div className="text-xs text-stone-400">智能识别备份类型并导入</div>
                            </div>
                        </div>
                    </div>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                />
            </div>
        </section>

        {/* SECTION 2: FORBIDDEN WORDS */}
        {onUpdateForbiddenWords && (
            <section className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">违禁词设置</h2>
                    <button 
                        onClick={() => { setEditingWord(undefined); setIsWordModalOpen(true); }}
                        className="flex items-center gap-1 text-[10px] font-bold bg-stone-800 text-white px-2 py-1 rounded-md active:scale-95 transition-transform"
                    >
                        <Plus size={12} /> 添加
                    </button>
                </div>
                
                <div className="bg-white/60 rounded-2xl shadow-sm border border-stone-100 p-2 min-h-[100px]">
                    {forbiddenWords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-24 text-stone-400 gap-2">
                            <ShieldAlert size={24} className="opacity-20" />
                            <span className="text-xs">暂无违禁词</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {forbiddenWords.map(entry => (
                                <div key={entry.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-50 hover:border-stone-200 transition-colors group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center shrink-0">
                                            <ShieldAlert size={16} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-stone-700 truncate">{entry.word}</span>
                                            <div className="flex items-center gap-1">
                                                <Tag size={10} className="text-stone-300" />
                                                <span className="text-[10px] text-stone-400 truncate">{entry.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button 
                                            onClick={() => { setEditingWord(entry); setIsWordModalOpen(true); }}
                                            className="p-2 text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteWord(entry.id)}
                                            className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-[10px] text-stone-400 mt-2 text-center">AI 联系人将严格避免输出上述词汇</p>
                </div>
            </section>
        )}

        {/* SECTION 3: MINMAX SETTINGS */}
        <section className="space-y-3">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">MinMax 语音设置</h2>
            <div className="bg-white/60 rounded-2xl shadow-sm border border-stone-100 p-5 space-y-4">
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">API Key</label>
                    <input 
                        type="password" 
                        value={localSettings.apiKey}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full p-3 bg-stone-50/50 rounded-xl text-sm font-mono border border-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-colors"
                        placeholder="MinMax API Key"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Group ID</label>
                    <input 
                        type="text" 
                        value={localSettings.groupId}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, groupId: e.target.value }))}
                        className="w-full p-3 bg-stone-50/50 rounded-xl text-sm font-mono border border-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-colors"
                        placeholder="Group ID"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Model</label>
                    <input 
                        type="text" 
                        value={localSettings.model || 'speech-01'}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full p-3 bg-stone-50/50 rounded-xl text-sm font-mono border border-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-colors"
                        placeholder="speech-01"
                    />
                </div>

                <button 
                    onClick={() => onSaveMinMax(localSettings)}
                    className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-stone-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Save size={16} />
                    保存设置
                </button>
            </div>
        </section>

        {/* Footer Info */}
        <div className="mt-auto py-4 text-center">
            <p className="text-[10px] text-stone-300">Build 2024.10.15 • Aesthetic OS</p>
        </div>

      </div>

      <ForbiddenWordModal 
        isOpen={isWordModalOpen} 
        onClose={() => setIsWordModalOpen(false)} 
        onSave={handleSaveWord}
        initialData={editingWord}
      />
    </div>
  );
};