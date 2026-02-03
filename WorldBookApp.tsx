import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Globe, User, Tag, Trash2, X, Book, Check, Edit2 } from 'lucide-react';
import { WorldBookEntry, Contact, Song } from '../types';
import { StatusBar } from './StatusBar';

interface WorldBookAppProps {
  isOpen: boolean;
  onClose: () => void;
  entries: WorldBookEntry[];
  onUpdateEntries: (entries: WorldBookEntry[]) => void;
  contacts: Contact[];
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

export const WorldBookApp: React.FC<WorldBookAppProps> = ({
  isOpen, onClose, entries, onUpdateEntries, contacts, statusBarProps
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorldBookEntry | null>(null);

  if (!isOpen) return null;

  const handleSave = (entry: WorldBookEntry) => {
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    if (existingIndex >= 0) {
        // Update existing
        const newEntries = [...entries];
        newEntries[existingIndex] = entry;
        onUpdateEntries(newEntries);
    } else {
        // Add new
        onUpdateEntries([...entries, entry]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条世界书吗？')) {
        onUpdateEntries(entries.filter(e => e.id !== id));
    }
  };

  const openAddModal = () => {
      setEditingEntry(null);
      setIsModalOpen(true);
  };

  const openEditModal = (entry: WorldBookEntry) => {
      setEditingEntry(entry);
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingEntry(null);
  };

  return (
    <div className="absolute inset-0 z-50 bg-stone-50/90 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
      <StatusBar className="bg-white" {...statusBarProps} />
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md shadow-sm z-10 shrink-0">
        <div className="flex items-center">
            <button 
            onClick={onClose} 
            className="p-2 -ml-2 hover:bg-stone-100/50 rounded-full transition-colors"
            >
            <ArrowLeft size={24} className="text-stone-700" />
            </button>
            <h1 className="text-lg font-bold text-stone-800 ml-2">世界书</h1>
        </div>
        <button 
          onClick={openAddModal}
          className="p-2 -mr-2 hover:bg-stone-100/50 rounded-full transition-colors text-stone-700"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {entries.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-stone-300 gap-4">
              <Book size={48} className="opacity-20" />
              <p className="text-sm font-medium">暂无世界书条目</p>
           </div>
        ) : (
            entries.map(entry => (
                <div key={entry.id} className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-stone-100 group relative">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-lg ${entry.scope === 'global' ? 'bg-indigo-50/80 text-indigo-500' : 'bg-orange-50/80 text-orange-500'}`}>
                                {entry.scope === 'global' ? <Globe size={14} /> : <User size={14} />}
                            </span>
                            <h3 className="font-bold text-stone-700">{entry.name}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => openEditModal(entry)}
                                className="text-stone-300 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-indigo-50/80 transition-colors"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button 
                                onClick={() => handleDelete(entry.id)}
                                className="text-stone-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50/80 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    
                    <p className="text-xs text-stone-500 leading-relaxed mb-3 line-clamp-3 bg-stone-50/30 p-2 rounded-lg whitespace-pre-wrap">
                        {entry.content}
                    </p>

                    <div className="flex flex-wrap gap-2 items-center">
                        {entry.scope === 'local' && entry.characterName && (
                            <div className="flex items-center gap-1 text-[10px] bg-orange-50/80 text-orange-600 px-2 py-1 rounded-md font-medium">
                                <User size={10} />
                                {entry.characterName}
                            </div>
                        )}
                        {entry.tags.map((tag, i) => (
                             <div key={i} className="flex items-center gap-1 text-[10px] bg-stone-100/80 text-stone-500 px-2 py-1 rounded-md">
                                <Tag size={10} />
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>

      <AddWorldBookModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialData={editingEntry}
        contacts={contacts}
      />
    </div>
  );
};

// --- Sub-component: Add/Edit Modal ---
interface AddWorldBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: WorldBookEntry) => void;
    initialData: WorldBookEntry | null;
    contacts: Contact[];
}

const AddWorldBookModal: React.FC<AddWorldBookModalProps> = ({ isOpen, onClose, onSave, initialData, contacts }) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [scope, setScope] = useState<'global' | 'local'>('global');
    const [characterName, setCharacterName] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setContent(initialData.content);
                setTags(initialData.tags.join(' '));
                setScope(initialData.scope);
                setCharacterName(initialData.characterName || '');
            } else {
                // Reset for new entry
                setName('');
                setContent('');
                setTags('');
                setScope('global');
                setCharacterName('');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const tagList = tags.split(/[,，\s]+/).filter(t => t.trim().length > 0);

        onSave({
            id: initialData ? initialData.id : crypto.randomUUID(),
            name,
            content,
            tags: tagList,
            scope,
            characterName: scope === 'local' ? characterName : undefined,
            createdAt: initialData ? initialData.createdAt : Date.now()
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm sm:p-6" onClick={onClose}>
            <div 
                className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 relative animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-stone-700">{initialData ? '编辑世界书' : '添加世界书'}</h3>
                    <button 
                        onClick={onClose}
                        className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 ml-1 uppercase">名称</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="条目名称 (如: 魔法系统)"
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-800 transition-all"
                            autoFocus={!initialData}
                        />
                    </div>

                    {/* Scope Selection */}
                    <div className="space-y-1">
                         <label className="text-xs font-bold text-stone-400 ml-1 uppercase">类型范围</label>
                         <div className="grid grid-cols-2 gap-3">
                             <button
                                type="button"
                                onClick={() => setScope('global')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${scope === 'global' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-1 ring-indigo-200' : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50'}`}
                             >
                                 <Globe size={16} />
                                 <span className="text-xs font-bold">全局世界书</span>
                                 {scope === 'global' && <Check size={14} className="ml-auto" />}
                             </button>
                             <button
                                type="button"
                                onClick={() => setScope('local')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${scope === 'local' ? 'bg-orange-50 border-orange-200 text-orange-600 ring-1 ring-orange-200' : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50'}`}
                             >
                                 <User size={16} />
                                 <span className="text-xs font-bold">局部 (角色)</span>
                                 {scope === 'local' && <Check size={14} className="ml-auto" />}
                             </button>
                         </div>
                    </div>

                    {/* Conditional Role Input/Select */}
                    {scope === 'local' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                             <label className="text-xs font-bold text-orange-400 ml-1 uppercase">关联角色</label>
                             <select 
                                value={characterName}
                                onChange={(e) => setCharacterName(e.target.value)}
                                className="w-full p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200 transition-all text-orange-800 appearance-none"
                            >
                                <option value="" disabled>选择 QQ 联系人...</option>
                                {contacts.map(contact => (
                                    <option key={contact.id} value={contact.name}>
                                        {contact.remark || contact.name}
                                    </option>
                                ))}
                            </select>
                            {contacts.length === 0 && (
                                <p className="text-[10px] text-orange-400 mt-1">
                                    暂无 QQ 联系人，请先在 QQ 应用中添加联系人。
                                </p>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 ml-1 uppercase">内容描述</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="详细描述..."
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-800 transition-all min-h-[120px] resize-none"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 ml-1 uppercase">标签 (空格分隔)</label>
                        <div className="relative">
                            <Tag size={16} className="absolute left-3 top-3.5 text-stone-400" />
                            <input 
                                type="text" 
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="设定 背景 道具..."
                                className="w-full pl-9 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-800 transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={!name}
                        className="mt-2 w-full bg-stone-800 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-stone-200 hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        {initialData ? '保存修改' : '保存条目'}
                    </button>
                </form>
            </div>
        </div>
    );
}