import React, { useState, useEffect } from 'react';
import { Cloud, Star, Search, Heart, RefreshCw, X } from 'lucide-react';
import { SystemData } from '../types';
import { TextUpdateModal } from './TextUpdateModal';
import { ImageUpdateModal } from './ImageUpdateModal';

interface SystemWidgetProps {
  type: 'header' | 'dashboard' | 'chart' | 'search' | 'memo';
  className?: string;
  data?: SystemData;
  onUpdate?: (data: SystemData) => void;
}

// Internal Memo Edit Modal Component
const MemoEditModal = ({ isOpen, onClose, initialTitle, initialContent, onSave }: { isOpen: boolean, onClose: () => void, initialTitle: string, initialContent: string, onSave: (t: string, c: string) => void }) => {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setContent(initialContent);
        }
    }, [isOpen, initialTitle, initialContent]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6 relative animate-in zoom-in duration-200 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors">
                    <X size={20} />
                </button>
                <h3 className="text-lg font-bold text-stone-700 text-center mb-2">编辑备忘录</h3>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400 uppercase ml-1">标题</label>
                    <input 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full text-lg font-bold text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                        placeholder="标题"
                    />
                </div>
                
                <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold text-stone-400 uppercase ml-1">内容</label>
                    <textarea 
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full h-40 text-sm text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-stone-200 transition-all resize-none"
                        placeholder="记点什么..."
                    />
                </div>

                <button 
                    onClick={() => { onSave(title, content); onClose(); }}
                    className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                >
                    保存
                </button>
            </div>
        </div>
    );
};

export const SystemWidget: React.FC<SystemWidgetProps> = ({ type, className = '', data, onUpdate }) => {
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      field: keyof SystemData | null;
      value: string;
  }>({ isOpen: false, field: null, value: '' });

  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const openModal = (field: keyof SystemData) => {
      if (!data) return;
      setModalConfig({
          isOpen: true,
          field,
          value: data[field]
      });
  };

  const handleSave = (newValue: string) => {
      if (onUpdate && data && modalConfig.field) {
          onUpdate({
              ...data,
              [modalConfig.field]: newValue
          });
      }
  };

  // 1. Top Header Text Area
  if (type === 'header' && data) {
    return (
      <div className={`w-full flex flex-col items-center justify-center py-2 ${className}`}>
         <div className="bg-white/40 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm mb-2 cursor-pointer hover:bg-white/60 transition-colors" onClick={() => openModal('headerTag')}>
            <span className="text-stone-400 text-xs font-medium tracking-widest">{data.headerTag}</span>
         </div>
         {/* Render Modal if needed */}
         <TextUpdateModal 
            isOpen={modalConfig.isOpen} 
            onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
            onSave={handleSave}
            initialValue={modalConfig.value}
         />
      </div>
    );
  }

  // 2. Dashboard (Temp, Date, Photo)
  if (type === 'dashboard' && data) {
    return (
      <>
        <div className={`bg-white/60 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white flex justify-between items-center relative overflow-hidden ${className}`}>
           <div className="flex flex-col gap-3 z-10">
               <div className="flex items-center gap-2">
                   <span className="text-stone-600 font-bold text-sm cursor-pointer hover:bg-white/50 px-1 rounded" onClick={() => openModal('battery')}>{data.battery}</span>
               </div>
               <div className="flex flex-col gap-1 text-xs text-stone-500 font-medium">
                   <div className="flex items-center gap-2">
                       <span className="text-stone-400 cursor-pointer hover:text-stone-600" onClick={() => openModal('tempLabel')}>{data.tempLabel}</span>
                       <span className="cursor-pointer hover:text-stone-600" onClick={() => openModal('tempValue')}>{data.tempValue}</span>
                   </div>
                   <div className="flex items-center gap-2">
                       <span className="text-stone-400 cursor-pointer hover:text-stone-600" onClick={() => openModal('dateLabel')}>{data.dateLabel}</span>
                       <span className="cursor-pointer hover:text-stone-600" onClick={() => openModal('dateValue')}>{data.dateValue}</span>
                   </div>
               </div>
           </div>
  
           {/* Photo Frame */}
           <div 
              className="relative transform rotate-2 hover:rotate-0 transition-transform duration-300 cursor-pointer"
              onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(true);
              }}
           >
               <div className="w-20 h-24 bg-white p-1.5 shadow-md flex flex-col">
                   <div className="w-full h-16 bg-stone-200 overflow-hidden">
                       <img src={data.dashboardImage || "https://api.dicebear.com/7.x/notionists/svg?seed=Bear"} className="w-full h-full object-cover opacity-80" />
                   </div>
                   <div className="flex-1 flex items-center justify-center">
                       <span className="text-[6px] text-stone-300">mood</span>
                   </div>
               </div>
               <div className="absolute -top-2 -right-2 text-stone-400">
                   <Star size={14} />
               </div>
           </div>
        </div>
        <TextUpdateModal 
            isOpen={modalConfig.isOpen} 
            onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
            onSave={handleSave}
            initialValue={modalConfig.value}
        />
        <ImageUpdateModal 
            isOpen={isImageModalOpen} 
            onClose={() => setIsImageModalOpen(false)} 
            onSave={(url) => onUpdate && onUpdate({ ...data, dashboardImage: url })} 
        />
      </>
    );
  }

  // 2b. Memo Widget
  if (type === 'memo' && data) {
    return (
        <>
            <div 
                className={`bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white flex flex-col gap-3 relative overflow-hidden group min-h-[140px] cursor-pointer transition-transform active:scale-[0.99] hover:bg-white/70 ${className}`}
                onClick={() => setIsMemoModalOpen(true)}
            >
                 {/* Decorative Tape */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-stone-200/50 rotate-[-2deg] rounded-sm backdrop-blur-sm"></div>

                 <div className="flex justify-between items-center z-10 pt-2">
                     <span className="font-bold text-stone-700 text-lg">
                         {data.memoTitle}
                     </span>
                     <div className="w-2 h-2 rounded-full bg-stone-300"></div>
                 </div>
                 
                 <div className="flex-1 text-sm text-stone-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                     {data.memoContent}
                 </div>
            </div>

            <MemoEditModal 
                isOpen={isMemoModalOpen}
                onClose={() => setIsMemoModalOpen(false)}
                initialTitle={data.memoTitle}
                initialContent={data.memoContent}
                onSave={(title, content) => {
                    if (onUpdate) onUpdate({ ...data, memoTitle: title, memoContent: content });
                }}
            />
        </>
    );
  }

  // 3. Line Chart Widget
  if (type === 'chart' && data) {
      return (
        <>
        <div className={`bg-white/60 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-white flex flex-col relative ${className}`}>
            {/* Top Text */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                    <div 
                        className="bg-stone-400 text-white text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer hover:bg-stone-500 transition-colors"
                        onClick={() => openModal('chartTag')}
                    >
                        {data.chartTag}
                    </div>
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center border border-stone-200">
                        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Mimi" className="w-full h-full object-cover opacity-50" />
                    </div>
                    <span className="text-xs text-stone-600 font-bold mt-1 cursor-pointer hover:bg-white/50 px-1 rounded" onClick={() => openModal('chartTitle')}>
                        {data.chartTitle}
                    </span>
                </div>
                <div className="flex flex-col items-end text-[10px] text-stone-500">
                    <div className="flex items-center gap-1 cursor-pointer hover:bg-white/50 px-1 rounded" onClick={() => openModal('chartSub1')}>
                        <span className="text-stone-300 text-[8px]">{data.chartSub1}</span>
                        <Heart size={10} />
                    </div>
                    <div className="flex items-center gap-1 mt-1 cursor-pointer hover:bg-white/50 px-1 rounded" onClick={() => openModal('chartSub2')}>
                        <span>{data.chartSub2}</span>
                        <Heart size={10} />
                    </div>
                </div>
            </div>

            {/* Simulated Line Chart */}
            <div className="h-12 w-full relative flex items-center px-2">
                {/* Line */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                    <polyline 
                        points="0,30 20%,35 40%,30 60%,40 80%,20 100%,35" 
                        fill="none" 
                        stroke="#a8a29e" 
                        strokeWidth="1.5" 
                    />
                </svg>
                {/* Stars/Points */}
                <div className="w-full flex justify-between items-center z-10 text-stone-500">
                    <Star size={10} style={{ marginTop: '20px' }} fill="currentColor" />
                    <Star size={10} style={{ marginTop: '30px' }} fill="currentColor" />
                    <Star size={10} style={{ marginTop: '20px' }} fill="currentColor" />
                    <Star size={10} style={{ marginTop: '40px' }} fill="currentColor" />
                    <Star size={10} style={{ marginTop: '0px' }} fill="currentColor" />
                    <Star size={10} style={{ marginTop: '30px' }} fill="currentColor" />
                </div>
            </div>
            
            <div className="text-center mt-2">
                <span className="text-[10px] text-stone-400 font-medium cursor-pointer hover:text-stone-600" onClick={() => openModal('chartFooter')}>{data.chartFooter}</span>
            </div>
            
            <div className="absolute bottom-2 left-2 text-stone-300 text-[10px] cursor-pointer hover:text-stone-500" onClick={() => openModal('chartBottomLeft')}> {data.chartBottomLeft} </div>
            <div className="absolute top-10 left-4 opacity-10 rotate-12">
                <Cloud size={40} />
            </div>
        </div>
        <TextUpdateModal 
            isOpen={modalConfig.isOpen} 
            onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
            onSave={handleSave}
            initialValue={modalConfig.value}
        />
        </>
      );
  }

  // 4. Search Bar
  if (type === 'search') {
      return (
          <div className={`w-full flex justify-center ${className}`}>
              <div className="bg-stone-200/50 backdrop-blur-md px-6 py-2.5 rounded-full flex items-center gap-2 shadow-inner w-32 justify-center">
                  <Search size={14} className="text-stone-500" />
                  <span className="text-xs font-bold text-stone-500">搜索</span>
              </div>
          </div>
      )
  }

  return null;
};