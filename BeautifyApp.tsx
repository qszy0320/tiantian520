import React, { useState } from 'react';
import { ArrowLeft, Image, Type, Grid, ChevronRight } from 'lucide-react';
import { ImageUpdateModal } from './ImageUpdateModal';
import { FontUpdateModal } from './FontUpdateModal';
import { StatusBar } from './StatusBar';
import { Song } from '../types';

interface BeautifyAppProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateWallpaper: (url: string) => void;
  onUpdateIcon: (label: string, url: string) => void;
  onUpdateFont: (url: string) => void;
  iconList: Array<{ label: string; icon: React.ReactNode }>;
  iconOverrides: Record<string, string>;
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

export const BeautifyApp: React.FC<BeautifyAppProps> = ({ 
  isOpen, onClose, onUpdateWallpaper, onUpdateIcon, onUpdateFont, iconList, iconOverrides, statusBarProps
}) => {
  const [activeTab, setActiveTab] = useState<'wallpaper' | 'icons' | 'font'>('wallpaper');
  
  // State for modals
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  
  // State for icon editing
  const [editingIconLabel, setEditingIconLabel] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-stone-50/90 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
      <StatusBar className="bg-white" {...statusBarProps} />
      {/* Header */}
      <div className="px-4 py-4 flex items-center bg-white/80 backdrop-blur-md shadow-sm z-10">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-stone-100/50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-stone-700" />
        </button>
        <h1 className="text-lg font-bold text-stone-800 ml-2">美化中心</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2">
        <button 
          onClick={() => setActiveTab('wallpaper')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'wallpaper' ? 'bg-stone-800 text-white shadow-md' : 'bg-white/80 text-stone-500 hover:bg-white'}`}
        >
          壁纸
        </button>
        <button 
          onClick={() => setActiveTab('icons')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'icons' ? 'bg-stone-800 text-white shadow-md' : 'bg-white/80 text-stone-500 hover:bg-white'}`}
        >
          图标
        </button>
        <button 
          onClick={() => setActiveTab('font')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'font' ? 'bg-stone-800 text-white shadow-md' : 'bg-white/80 text-stone-500 hover:bg-white'}`}
        >
          字体
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        
        {/* WALLPAPER TAB */}
        {activeTab === 'wallpaper' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-stone-100/50 rounded-2xl flex items-center justify-center text-stone-300 mb-4">
                <Image size={32} />
              </div>
              <h2 className="text-lg font-bold text-stone-700 mb-1">更换桌面壁纸</h2>
              <p className="text-sm text-stone-400 mb-6">支持上传本地图片或使用网络链接</p>
              
              <button 
                onClick={() => setIsWallpaperModalOpen(true)}
                className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold shadow-lg shadow-stone-200 active:scale-95 transition-transform"
              >
                设置壁纸
              </button>
            </div>
          </div>
        )}

        {/* ICONS TAB */}
        {activeTab === 'icons' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-stone-100 p-4 animate-in fade-in duration-300">
             <h2 className="text-sm font-bold text-stone-400 mb-4 uppercase tracking-wider ml-1">点击图标进行修改</h2>
             <div className="grid grid-cols-4 gap-4">
                {iconList.map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setEditingIconLabel(item.label)}>
                        <div className="w-14 h-14 rounded-2xl border border-stone-100 overflow-hidden relative shadow-sm group-hover:shadow-md transition-all group-active:scale-95 bg-white/80 flex items-center justify-center">
                             {iconOverrides[item.label] ? (
                                 <img src={iconOverrides[item.label]} alt={item.label} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="text-stone-400">{item.icon}</div>
                             )}
                             {/* Edit overlay */}
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                             </div>
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium truncate w-full text-center">{item.label}</span>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* FONT TAB */}
        {activeTab === 'font' && (
           <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-stone-100/50 rounded-2xl flex items-center justify-center text-stone-300 mb-4">
                <Type size={32} />
              </div>
              <h2 className="text-lg font-bold text-stone-700 mb-1">更换全局字体</h2>
              <p className="text-sm text-stone-400 mb-6">上传 .ttf/.woff 文件或输入 URL</p>
              
              <button 
                onClick={() => setIsFontModalOpen(true)}
                className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold shadow-lg shadow-stone-200 active:scale-95 transition-transform"
              >
                设置字体
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ImageUpdateModal 
        isOpen={isWallpaperModalOpen} 
        onClose={() => setIsWallpaperModalOpen(false)} 
        onSave={onUpdateWallpaper} 
      />

      <ImageUpdateModal 
        isOpen={!!editingIconLabel} 
        onClose={() => setEditingIconLabel(null)} 
        onSave={(url) => {
            if (editingIconLabel) onUpdateIcon(editingIconLabel, url);
        }} 
      />

      <FontUpdateModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
        onSave={onUpdateFont}
      />
    </div>
  );
};