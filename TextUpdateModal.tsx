import React, { useState, useEffect } from 'react';
import { X, Type } from 'lucide-react';

interface TextUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialValue: string;
  title?: string;
  multiline?: boolean;
}

export const TextUpdateModal: React.FC<TextUpdateModalProps> = ({ 
  isOpen, onClose, onSave, initialValue, title = "编辑文字", multiline = false 
}) => {
  const [text, setText] = useState(initialValue);

  // Reset text when modal opens with new initialValue
  useEffect(() => {
    if (isOpen) {
      setText(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-2 mb-6 justify-center">
            <Type size={18} className="text-stone-400"/>
            <h3 className="text-lg font-bold text-stone-700">{title}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {multiline ? (
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 text-stone-600 placeholder:text-stone-400 min-h-[100px] resize-none"
                    autoFocus
                />
            ) : (
                <input 
                    type="text" 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 text-stone-600 placeholder:text-stone-400"
                    autoFocus
                />
            )}
            
            <button 
                type="submit"
                disabled={!text.trim()}
                className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-md shadow-stone-200 hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
                保存修改
            </button>
        </form>
      </div>
    </div>
  );
};