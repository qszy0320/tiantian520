import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { TextUpdateModal } from './TextUpdateModal';
import { ImageUpdateModal } from './ImageUpdateModal';
import { ProfileData } from '../types';

interface ProfileWidgetProps {
    data: ProfileData;
    onUpdate: (data: ProfileData) => void;
}

export const ProfileWidget: React.FC<ProfileWidgetProps> = ({ data, onUpdate }) => {
  // Date and Day state handled locally as it's real-time
  const [currentDate, setCurrentDate] = useState("");
  const [currentDay, setCurrentDay] = useState("");
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    field: 'name' | 'handle' | 'quote' | null;
    initialValue: string;
    multiline: boolean;
  }>({ isOpen: false, field: null, initialValue: '', multiline: false });

  // Update date/time effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format Date: MM月DD日
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      setCurrentDate(`${month}月${date}日`);
      
      // Format Day: 星期X
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      setCurrentDay(days[now.getDay()]);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (field: 'name' | 'handle' | 'quote', value: string, multiline = false) => {
    setModalState({ isOpen: true, field, initialValue: value, multiline });
  };

  const handleSave = (newValue: string) => {
    if (!modalState.field) return;
    onUpdate({ ...data, [modalState.field]: newValue });
  };

  return (
    <>
    <div className="w-full flex flex-col gap-4">
        {/* Profile Header */}
        <div className="bg-white/40 backdrop-blur-sm rounded-3xl px-4 pt-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div 
                    className="w-14 h-14 bg-white rounded-2xl shadow-sm p-1 overflow-hidden border-2 border-white cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsImageModalOpen(true)}
                >
                     <img 
                        src={data.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col justify-center items-start">
                    <button onClick={() => openModal('name', data.name)} className="text-xs text-stone-600 font-medium mb-0.5 hover:bg-black/5 px-1 -ml-1 rounded transition-colors text-left">
                        {data.name}
                    </button>
                    <button onClick={() => openModal('handle', data.handle)} className="text-xs text-stone-400 hover:bg-black/5 px-1 -ml-1 rounded transition-colors text-left">
                        {data.handle}
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col items-end text-[10px] text-stone-500 font-medium gap-1">
                <div className="flex items-center gap-1 opacity-60 px-1 -mr-1 select-none">
                     <span>{currentDate}</span>
                </div>
                <div className="flex items-center gap-1 opacity-60 px-1 -mr-1 select-none">
                    <Heart size={10} fill="currentColor" />
                    <span>{currentDay}</span>
                </div>
            </div>
        </div>

        {/* Quote Bubble */}
        <div className="bg-white rounded-3xl p-6 shadow-sm relative group cursor-pointer min-h-[80px] flex items-center justify-center" onClick={() => openModal('quote', data.quote, true)}>
             <div className="absolute -top-2 left-8 w-4 h-4 bg-white transform rotate-45"></div>
             <p className="text-lg text-stone-600 font-bold leading-relaxed tracking-wide text-center group-hover:opacity-70 transition-opacity">
                {data.quote}
             </p>
        </div>
    </div>

    <TextUpdateModal 
        isOpen={modalState.isOpen}
        initialValue={modalState.initialValue}
        multiline={modalState.multiline}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSave}
    />

    <ImageUpdateModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        onSave={(url) => onUpdate({ ...data, avatar: url })} 
    />
    </>
  );
};