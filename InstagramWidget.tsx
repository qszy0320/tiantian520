import React, { useState } from 'react';
import { Music, Star, Trash2 } from 'lucide-react';
import { ImageUpdateModal } from './ImageUpdateModal';
import { TextUpdateModal } from './TextUpdateModal';
import { InstagramData } from '../types';

interface InstagramWidgetProps {
  data: InstagramData;
  onUpdate: (data: InstagramData) => void;
}

export const InstagramWidget: React.FC<InstagramWidgetProps> = ({ data, onUpdate }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const [textModalState, setTextModalState] = useState<{
    isOpen: boolean;
    field: 'title' | 'tag' | null;
    initialValue: string;
  }>({ isOpen: false, field: null, initialValue: '' });

  const openTextModal = (field: 'title' | 'tag', value: string) => {
    setTextModalState({ isOpen: true, field, initialValue: value });
  };

  const handleTextSave = (newValue: string) => {
    if (textModalState.field) {
        onUpdate({ ...data, [textModalState.field]: newValue });
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-3 shadow-sm flex flex-col h-full relative overflow-hidden group">
        {/* Header */}
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center gap-1">
            <button 
                onClick={() => openTextModal('title', data.title)}
                className="font-bold text-stone-400 text-xs hover:bg-stone-100 px-1 -ml-1 rounded transition-colors text-left"
            >
                {data.title}
            </button>
          </div>
          <div className="w-5 h-5 rounded-full border border-stone-200 flex items-center justify-center">
              <Music size={10} className="text-stone-300" />
          </div>
        </div>

        {/* Content Image */}
        <div 
          className="flex-1 rounded-xl overflow-hidden relative mb-2 cursor-pointer group/image"
          onClick={() => setIsImageModalOpen(true)}
        >
           <img 
              src={data.image} 
              alt="Widget content" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
           />
           <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors flex items-center justify-center">
             {/* Optional hover hint */}
           </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-1">
           <div className="p-1.5 rounded-full bg-stone-100 text-stone-400">
              <Star size={14} />
           </div>
           <button 
              onClick={() => openTextModal('tag', data.tag)}
              className="bg-stone-200/50 px-3 py-1 rounded-full hover:bg-stone-200 transition-colors"
           >
              <span className="text-[10px] font-bold text-stone-500">{data.tag}</span>
           </button>
           <div className="p-1.5 rounded-full bg-stone-100 text-stone-400">
              <Trash2 size={14} />
           </div>
        </div>
      </div>
      
      <ImageUpdateModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        onSave={(url) => onUpdate({ ...data, image: url })} 
      />

      <TextUpdateModal
        isOpen={textModalState.isOpen}
        initialValue={textModalState.initialValue}
        onClose={() => setTextModalState(prev => ({ ...prev, isOpen: false }))}
        onSave={handleTextSave}
      />
    </>
  );
};