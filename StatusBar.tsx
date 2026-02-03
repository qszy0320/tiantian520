import React, { useState, useEffect, useRef } from 'react';
import { Battery, BatteryCharging, Play, Pause, SkipForward, SkipBack, X, Music } from 'lucide-react';
import { Song } from '../types';

interface StatusBarProps {
    theme?: 'dark' | 'light';
    className?: string;
    musicState?: {
        isPlaying: boolean;
        currentSong?: Song;
        isVisible?: boolean;
    };
    musicControls?: {
        onPlayPause: () => void;
        onNext: () => void;
        onPrev: () => void;
        onClose: () => void;
    };
    audioRef?: React.RefObject<HTMLAudioElement | null>;
}

// Simple lyrics parser duplication to avoid file dep issues in this context
const parseLyrics = (lrcString?: string): { time: number; text: string }[] => {
    if (!lrcString) return [];
    const lines = lrcString.split('\n');
    const result: { time: number; text: string }[] = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    const isLrc = lines.some(line => timeReg.test(line));

    if (!isLrc) return [];

    for (const line of lines) {
        const match = line.match(timeReg);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3]);
            const time = minutes * 60 + seconds + milliseconds / (match[3].length === 3 ? 1000 : 100);
            const text = line.replace(timeReg, '').trim();
            if (text) result.push({ time, text });
        }
    }
    return result;
};

const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const StatusBar: React.FC<StatusBarProps> = ({ 
    theme = 'dark', 
    className = '',
    musicState,
    musicControls,
    audioRef
}) => {
  const [time, setTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  
  // Lyrics state for island
  const [currentLyric, setCurrentLyric] = useState('');
  
  // Progress Bar State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isDraggingRef = useRef(false);

  // Close island (collapse) when player is hidden/closed
  useEffect(() => {
    if (!musicState?.isVisible) {
        setIsIslandExpanded(false);
    }
  }, [musicState?.isVisible]);

  // Sync lyrics & Progress in island
  useEffect(() => {
    const audioEl = audioRef?.current;
    if (!audioEl) {
        setCurrentLyric('');
        return;
    }

    const parsed = musicState?.currentSong?.lyrics ? parseLyrics(musicState.currentSong.lyrics) : [];

    const handleTimeUpdate = () => {
        // Only update UI state if not dragging
        if (!isDraggingRef.current) {
            setCurrentTime(audioEl.currentTime);
        }
        setDuration(audioEl.duration || 0);

        // Update Lyrics
        if (parsed.length > 0) {
            const ct = audioEl.currentTime;
            let active;
            for (let i = parsed.length - 1; i >= 0; i--) {
                if (parsed[i].time <= ct) {
                    active = parsed[i];
                    break;
                }
            }
            setCurrentLyric(active ? active.text : '');
        } else {
            setCurrentLyric('');
        }
    };

    // Initial check
    handleTimeUpdate();

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleTimeUpdate);
    return () => {
        audioEl.removeEventListener('timeupdate', handleTimeUpdate);
        audioEl.removeEventListener('loadedmetadata', handleTimeUpdate);
    };
  }, [audioRef, musicState?.currentSong]);


  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef?.current) {
        audioRef.current.currentTime = newTime;
    }
  };

  const handleSeekStart = () => {
      isDraggingRef.current = true;
  };

  const handleSeekEnd = () => {
      isDraggingRef.current = false;
  };

  useEffect(() => {
    // --- Time Logic ---
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // --- Battery Logic ---
    let batteryCleanup: (() => void) | undefined;

    const initBattery = async () => {
      try {
        // @ts-ignore
        if (navigator.getBattery) {
          // @ts-ignore
          const battery = await navigator.getBattery();
          
          const updateBattery = () => {
            setBatteryLevel(battery.level);
            setIsCharging(battery.charging);
          };

          updateBattery();
          
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);

          batteryCleanup = () => {
             battery.removeEventListener('levelchange', updateBattery);
             battery.removeEventListener('chargingchange', updateBattery);
          };
        } else {
            setBatteryLevel(1); 
        }
      } catch (e) {
        setBatteryLevel(1);
      }
    };

    initBattery();

    return () => {
      clearInterval(timeInterval);
      if (batteryCleanup) batteryCleanup();
    };
  }, []);

  const textColor = theme === 'light' ? 'text-white' : 'text-stone-800';

  return (
    <>
      {/* Backdrop for closing expanded island */}
      {isIslandExpanded && (
          <div 
              className="fixed inset-0 z-[60] bg-transparent" 
              onClick={() => setIsIslandExpanded(false)}
          />
      )}

      <div className={`flex justify-between items-center px-6 py-3 ${textColor} text-sm font-semibold select-none relative transition-colors duration-300 ${className} ${isIslandExpanded ? 'z-[70]' : 'z-[50]'}`}>
        <div className="tracking-wide text-[15px] font-medium z-10">{time}</div>
        
        {/* Dynamic Island Music Player */}
        {musicState?.isVisible && musicState.currentSong && (
            <div 
              className={`absolute left-1/2 -translate-x-1/2 top-2 bg-black text-white rounded-[32px] shadow-2xl cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
                  isIslandExpanded 
                  ? 'w-[350px] h-[170px] px-6 py-5 cursor-default' 
                  : 'w-[90px] h-[28px] px-2 hover:scale-105 active:scale-95'
              }`}
              onClick={(e) => {
                  e.stopPropagation(); 
                  if (!isIslandExpanded) setIsIslandExpanded(true);
              }}
            >
                {/* Background Blur Layer */}
                {musicState.currentSong.coverUrl && (
                    <div className="absolute inset-0 z-0 pointer-events-none">
                         <img 
                            src={musicState.currentSong.coverUrl} 
                            alt="blur-bg" 
                            className="w-full h-full object-cover opacity-50 blur-xl scale-150 transform translate-z-0"
                         />
                         <div className="absolute inset-0 bg-black/20" />
                    </div>
                )}

                <div className="relative z-10 w-full h-full">
                    {!isIslandExpanded ? (
                        /* Collapsed State */
                        <div className="w-full h-full flex items-center justify-center gap-1.5 pointer-events-none">
                            <div className="flex gap-[3px] items-end h-3">
                                <div className={`w-[3px] bg-green-400 rounded-full ${musicState.isPlaying ? 'h-full animate-[bounce_1s_infinite]' : 'h-1'}`}></div>
                                <div className={`w-[3px] bg-green-400 rounded-full ${musicState.isPlaying ? 'h-2/3 animate-[bounce_1.2s_infinite]' : 'h-1'}`}></div>
                                <div className={`w-[3px] bg-green-400 rounded-full ${musicState.isPlaying ? 'h-full animate-[bounce_0.8s_infinite]' : 'h-1'}`}></div>
                                <div className={`w-[3px] bg-green-400 rounded-full ${musicState.isPlaying ? 'h-1/2 animate-[bounce_0.6s_infinite]' : 'h-1'}`}></div>
                            </div>
                        </div>
                    ) : (
                        /* Expanded State */
                        <div className="w-full h-full flex flex-col justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Header: Cover, Title, Close */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3.5 overflow-hidden">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden">
                                        {musicState.currentSong.coverUrl ? (
                                            <img src={musicState.currentSong.coverUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <Music size={22} className="text-white/80" />
                                        )}
                                    </div>
                                    <div className="flex flex-col overflow-hidden min-w-0 pr-2">
                                        <span className="text-[15px] font-bold truncate text-white leading-tight">{musicState.currentSong.title}</span>
                                        <span className="text-xs text-white/60 truncate leading-tight mt-0.5">{musicState.currentSong.artist}</span>
                                    </div>
                                </div>
                                <button 
                                  onClick={(e) => { 
                                      e.stopPropagation(); 
                                      musicControls?.onClose();
                                      setIsIslandExpanded(false);
                                  }}
                                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors -mr-1 shrink-0"
                                >
                                   <X size={18} className="text-white/90" />
                                </button>
                            </div>
                            
                            {/* Lyric Line - Wider Area */}
                            <div className="w-full flex items-center justify-center h-8 my-1 px-1 overflow-hidden">
                                <p className="text-[15px] font-medium text-green-300 truncate text-center opacity-90 animate-in fade-in slide-in-from-bottom-1 w-full">
                                    {currentLyric || "..."}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full flex items-center gap-3 mb-3 px-1" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] text-white/60 font-mono w-8 text-right shrink-0">{formatTime(currentTime)}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    onMouseDown={handleSeekStart}
                                    onMouseUp={handleSeekEnd}
                                    onTouchStart={handleSeekStart}
                                    onTouchEnd={handleSeekEnd}
                                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                                />
                                <span className="text-[10px] text-white/60 font-mono w-8 shrink-0">{formatTime(duration)}</span>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-10">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); musicControls?.onPrev(); }}
                                   className="text-white hover:text-white/80 transition-colors active:scale-90 p-1"
                                 >
                                     <SkipBack size={24} fill="currentColor" />
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); musicControls?.onPlayPause(); }}
                                   className="text-white hover:text-green-400 transition-colors active:scale-90 p-1"
                                 >
                                     {musicState.isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); musicControls?.onNext(); }}
                                   className="text-white hover:text-white/80 transition-colors active:scale-90 p-1"
                                 >
                                     <SkipForward size={24} fill="currentColor" />
                                 </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        <div className="flex items-center space-x-1.5 z-10">
          
          {/* Battery Section */}
          <div className="flex items-center gap-1">
              {batteryLevel !== null && (
                  <span className="text-[10px] font-bold">{Math.round(batteryLevel * 100)}%</span>
              )}
              <div className="relative">
                  {isCharging ? (
                      <BatteryCharging size={20} />
                  ) : (
                      <Battery size={20} />
                  )}
              </div>
          </div>
        </div>
      </div>
    </>
  );
};