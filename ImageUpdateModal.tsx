import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link, X, Image as ImageIcon, Type, RefreshCw } from 'lucide-react';

interface ImageUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  hideSimulate?: boolean;
  initialTab?: 'upload' | 'url' | 'simulate';
}

export const ImageUpdateModal: React.FC<ImageUpdateModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  hideSimulate = false,
  initialTab = 'upload'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'simulate'>(initialTab);
  const [url, setUrl] = useState('');
  const [simText, setSimText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
        setUrl('');
        setSimText('');
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Generate Simulated Image on text change
  useEffect(() => {
      if (activeTab === 'simulate' && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              // Settings
              const size = 500;
              canvas.width = size;
              canvas.height = size;
              
              // Background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, size, size);
              
              // Text
              ctx.fillStyle = '#000000';
              ctx.font = 'bold 40px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Simple Wrap
              const words = simText.split('');
              let line = '';
              const lines = [];
              const maxWidth = 400;
              const lineHeight = 50;

              for(let n = 0; n < words.length; n++) {
                  const testLine = line + words[n];
                  const metrics = ctx.measureText(testLine);
                  const testWidth = metrics.width;
                  if (testWidth > maxWidth && n > 0) {
                      lines.push(line);
                      line = words[n];
                  } else {
                      line = testLine;
                  }
              }
              lines.push(line);

              // Draw
              const startY = (size - lines.length * lineHeight) / 2 + (lineHeight / 2);
              lines.forEach((l, i) => {
                  ctx.fillText(l, size / 2, startY + (i * lineHeight));
              });
          }
      }
  }, [simText, activeTab]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onSave(reader.result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onSave(url);
      onClose();
    }
  };

  const handleSimulateSubmit = () => {
      if (canvasRef.current) {
          const dataUrl = canvasRef.current.toDataURL('image/png');
          onSave(dataUrl);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6" onClick={onClose}>
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
        
        <h3 className="text-lg font-bold text-stone-700 mb-4 text-center">添加图片</h3>
        
        {/* Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-4">
            <button onClick={() => setActiveTab('upload')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'upload' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}>本地</button>
            <button onClick={() => setActiveTab('url')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'url' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}>链接</button>
            {!hideSimulate && (
                <button onClick={() => setActiveTab('simulate')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'simulate' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}>模拟</button>
            )}
        </div>

        <div className="space-y-4">
          
          {/* 1. UPLOAD */}
          {activeTab === 'upload' && (
              <>
                <div className="w-full h-32 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-center text-stone-300">
                    <ImageIcon size={32} />
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-stone-200 text-stone-500 hover:border-stone-400 hover:bg-stone-50 transition-all active:scale-95"
                >
                    <Upload size={18} />
                    <span className="font-medium text-sm">选择本地图片</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
              </>
          )}

          {/* 2. URL */}
          {activeTab === 'url' && (
              <form onSubmit={handleUrlSubmit} className="flex flex-col gap-4">
                <div className="w-full h-32 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-center overflow-hidden relative">
                    {url ? (
                        <img src={url} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display='none'} />
                    ) : (
                        <Link size={32} className="text-stone-300" />
                    )}
                </div>
                <div className="relative">
                    <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="输入图片链接..."
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                    />
                </div>
                <button 
                    type="submit"
                    disabled={!url}
                    className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-stone-700 disabled:opacity-50"
                >
                    确认使用
                </button>
              </form>
          )}

          {/* 3. SIMULATE */}
          {activeTab === 'simulate' && !hideSimulate && (
              <div className="flex flex-col gap-4">
                  <div className="w-full aspect-square bg-stone-50 rounded-xl border border-stone-200 overflow-hidden shadow-inner flex items-center justify-center">
                      <canvas ref={canvasRef} className="w-full h-full object-contain" />
                  </div>
                  <input 
                      type="text"
                      value={simText}
                      onChange={e => setSimText(e.target.value)}
                      placeholder="输入要显示的文字..."
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                      autoFocus
                  />
                  <button 
                    onClick={handleSimulateSubmit}
                    disabled={!simText}
                    className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-stone-700 disabled:opacity-50"
                  >
                    生成并发送
                  </button>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};