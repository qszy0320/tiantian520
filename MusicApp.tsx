import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Play, Pause, SkipBack, SkipForward, Music, Disc, Upload, Link, X, Trash2, FileText, Image as ImageIcon, Edit2 } from 'lucide-react';
import { Song } from '../types';
import { StatusBar } from './StatusBar';

interface MusicAppProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Song[];
  onUpdatePlaylist: (newPlaylist: Song[]) => void;
  // New props for global state
  currentSongIndex: number;
  setCurrentSongIndex: (index: React.SetStateAction<number>) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setIsPlayerVisible?: (visible: boolean) => void;
}

// Helper to parse lyrics
const parseLyrics = (lrcString?: string): { time: number; text: string }[] => {
    if (!lrcString) return [];
    const lines = lrcString.split('\n');
    const result: { time: number; text: string }[] = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    // Check if it's NOT an LRC file (plain text)
    const isLrc = lines.some(line => timeReg.test(line));

    if (!isLrc) {
        return lines.map((line, index) => ({ time: index * 5, text: line })).filter(l => l.text.trim());
    }

    for (const line of lines) {
        const match = line.match(timeReg);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3]);
            // normalize time to seconds
            const time = minutes * 60 + seconds + milliseconds / (match[3].length === 3 ? 1000 : 100);
            const text = line.replace(timeReg, '').trim();
            if (text) {
                result.push({ time, text });
            }
        }
    }
    return result;
};

export const MusicApp: React.FC<MusicAppProps> = ({
  isOpen, onClose, playlist, onUpdatePlaylist,
  currentSongIndex, setCurrentSongIndex, isPlaying, setIsPlaying, audioRef, setIsPlayerVisible
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  
  // UI Only State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<'cover' | 'lyrics'>('cover');

  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const currentSong = playlist[currentSongIndex];

  // Parse lyrics when song changes
  const parsedLyrics = useMemo(() => {
      return parseLyrics(currentSong?.lyrics);
  }, [currentSong]);

  // Sync progress bar and find current lyric index
  const activeLyricIndex = useMemo(() => {
      if (parsedLyrics.length === 0) return -1;
      // findLastIndex replacement
      for (let i = parsedLyrics.length - 1; i >= 0; i--) {
          if (parsedLyrics[i].time <= currentTime) {
              return i;
          }
      }
      return -1;
  }, [currentTime, parsedLyrics]);

  // Scroll lyrics
  useEffect(() => {
      if (viewMode === 'lyrics' && lyricsContainerRef.current && activeLyricIndex !== -1) {
          const activeEl = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement;
          if (activeEl) {
              activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activeLyricIndex, viewMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleTimeUpdate);
    };
  }, [audioRef]); 

  const handlePlayPause = () => {
    if (!currentSong) return;
    setIsPlaying(!isPlaying);
    setIsPlayerVisible?.(true);
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
    setIsPlayerVisible?.(true);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
    setIsPlayerVisible?.(true);
  };

  const handleEditSong = (e: React.MouseEvent, song: Song) => {
      e.stopPropagation();
      setEditingSong(song);
      setIsAddModalOpen(true);
  };

  const handleDeleteSong = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newPlaylist = playlist.filter(s => s.id !== id);
    onUpdatePlaylist(newPlaylist);
    if (currentSongIndex >= newPlaylist.length) {
        if (newPlaylist.length === 0) {
            setIsPlaying(false);
            setIsPlayerVisible?.(false);
        } else {
            setCurrentSongIndex(Math.max(0, newPlaylist.length - 1));
            setIsPlaying(false);
        }
    }
  };

  const handleSaveSong = (song: Song) => {
    if (editingSong) {
        const newPlaylist = playlist.map(s => s.id === song.id ? song : s);
        onUpdatePlaylist(newPlaylist);
    } else {
        onUpdatePlaylist([...playlist, song]);
    }
    setEditingSong(null);
    setIsAddModalOpen(false);
  };

  // --- UI Formatting ---
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-stone-50/90 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
      <StatusBar className="bg-white" />
      
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md shadow-sm z-10 shrink-0">
        <div className="flex items-center">
            <button 
            onClick={onClose} 
            className="p-2 -ml-2 hover:bg-stone-100/50 rounded-full transition-colors"
            >
            <ArrowLeft size={24} className="text-stone-700" />
            </button>
            <h1 className="text-lg font-bold text-stone-800 ml-2">音乐播放器</h1>
        </div>
        <button 
          onClick={() => { setEditingSong(null); setIsAddModalOpen(true); }}
          className="p-2 -mr-2 hover:bg-stone-100/50 rounded-full transition-colors text-stone-700"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Player Section */}
        <div className="px-6 py-8 flex flex-col items-center bg-white/60 backdrop-blur-sm border-b border-stone-100">
            
            {/* View Switching Container */}
            <div className="relative mb-8 w-64 h-64">
                {viewMode === 'cover' ? (
                     /* Album Art View */
                     <div 
                        className={`w-64 h-64 bg-stone-100/50 rounded-3xl shadow-inner flex items-center justify-center relative overflow-hidden cursor-pointer ${isPlaying ? 'animate-pulse' : ''}`}
                        onClick={() => setViewMode('lyrics')}
                     >
                        <div className="absolute inset-0 bg-gradient-to-tr from-stone-200 to-stone-50 opacity-50"></div>
                        <div className={`w-32 h-32 rounded-full border-4 border-stone-200 flex items-center justify-center bg-white shadow-lg overflow-hidden ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                            {currentSong?.coverUrl ? (
                                <img src={currentSong.coverUrl} className="w-full h-full object-cover" />
                            ) : (
                                <Music size={40} className="text-stone-300" />
                            )}
                        </div>
                    </div>
                ) : (
                    /* Lyrics View */
                    <div 
                        className="w-full h-full rounded-3xl bg-stone-100/50 shadow-inner flex flex-col relative overflow-hidden cursor-pointer"
                        onClick={() => setViewMode('cover')}
                    >
                         <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-stone-50 via-transparent to-stone-50 z-10"></div>
                         <div 
                            ref={lyricsContainerRef}
                            className="flex-1 overflow-y-auto no-scrollbar py-24 px-4 text-center space-y-4 scroll-smooth"
                         >
                             {parsedLyrics.length > 0 ? (
                                 parsedLyrics.map((line, idx) => (
                                     <p 
                                        key={idx} 
                                        className={`transition-all duration-300 text-sm font-medium ${idx === activeLyricIndex ? 'text-stone-800 scale-110 font-bold' : 'text-stone-400'}`}
                                     >
                                         {line.text}
                                     </p>
                                 ))
                             ) : (
                                 <div className="h-full flex items-center justify-center text-stone-400 text-xs">
                                     暂无歌词
                                 </div>
                             )}
                         </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="text-center mb-8 w-full">
                <h2 className="text-xl font-bold text-stone-800 mb-1 truncate px-4">
                    {currentSong?.title || "未播放音乐"}
                </h2>
                <p className="text-sm text-stone-400 font-medium truncate px-4">
                    {currentSong?.artist || "请点击右上角添加音乐"}
                </p>
            </div>

            {/* Progress Bar (Visual) */}
            <div className="w-full mb-8">
                 <div className="w-full h-1.5 bg-stone-100/50 rounded-full overflow-hidden mb-2">
                     <div 
                        className="h-full bg-stone-800 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                     ></div>
                 </div>
                 <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                     <span>{formatTime(currentTime)}</span>
                     <span>{formatTime(duration)}</span>
                 </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8">
                <button 
                    onClick={handlePrev}
                    className="p-3 text-stone-400 hover:text-stone-600 transition-colors active:scale-95"
                >
                    <SkipBack size={28} fill="currentColor" />
                </button>
                <button 
                    onClick={handlePlayPause}
                    className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center text-white shadow-xl shadow-stone-200 hover:scale-105 active:scale-95 transition-all"
                >
                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                <button 
                    onClick={handleNext}
                    className="p-3 text-stone-400 hover:text-stone-600 transition-colors active:scale-95"
                >
                    <SkipForward size={28} fill="currentColor" />
                </button>
            </div>
        </div>

        {/* Playlist Section */}
        <div className="px-4 py-6">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 px-2">播放列表 ({playlist.length})</h3>
            <div className="flex flex-col gap-2">
                {playlist.length === 0 ? (
                    <div className="text-center py-8 text-stone-300 text-sm">暂无歌曲</div>
                ) : (
                    playlist.map((song, idx) => (
                        <div 
                            key={song.id}
                            onClick={() => { 
                                setCurrentSongIndex(idx); 
                                setIsPlaying(true); 
                                setIsPlayerVisible?.(true);
                            }}
                            className={`flex items-center p-3 rounded-2xl transition-all cursor-pointer group ${
                                idx === currentSongIndex 
                                ? 'bg-stone-800 text-white shadow-md' 
                                : 'bg-white/60 hover:bg-stone-100/50 text-stone-600'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 shrink-0 overflow-hidden relative">
                                {song.coverUrl ? (
                                     <img src={song.coverUrl} className="w-full h-full object-cover opacity-90" />
                                ) : (
                                     idx === currentSongIndex && isPlaying ? (
                                        <div className="flex items-end gap-0.5 h-3">
                                            <div className="w-0.5 bg-current h-full animate-[bounce_1s_infinite]"></div>
                                            <div className="w-0.5 bg-current h-2/3 animate-[bounce_1.2s_infinite]"></div>
                                            <div className="w-0.5 bg-current h-full animate-[bounce_0.8s_infinite]"></div>
                                        </div>
                                     ) : (
                                        <Disc size={14} className={idx === currentSongIndex ? 'text-white' : 'text-stone-300'} />
                                     )
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{song.title}</h4>
                                <p className={`text-[10px] truncate ${idx === currentSongIndex ? 'text-stone-300' : 'text-stone-400'}`}>
                                    {song.artist}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => handleEditSong(e, song)}
                                    className={`p-2 rounded-full transition-colors ${
                                        idx === currentSongIndex ? 'hover:bg-white/20 text-stone-300' : 'hover:bg-stone-200/50 text-stone-400'
                                    }`}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteSong(e, song.id)}
                                    className={`p-2 rounded-full transition-colors ${
                                        idx === currentSongIndex ? 'hover:bg-white/20 text-stone-300' : 'hover:bg-stone-200/50 text-stone-400'
                                    }`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      <AddMusicModal 
        isOpen={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setEditingSong(null); }}
        onSave={handleSaveSong}
        initialSong={editingSong}
      />
    </div>
  );
};

// --- Internal Sub-Component: Add Music Modal ---
interface AddMusicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (song: Song) => void;
    initialSong?: Song | null;
}

const AddMusicModal: React.FC<AddMusicModalProps> = ({ isOpen, onClose, onSave, initialSong }) => {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // New states for cover and lyrics
    const [coverUrl, setCoverUrl] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [lyricsFileName, setLyricsFileName] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const lyricsInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialSong) {
                setTitle(initialSong.title);
                setArtist(initialSong.artist);
                setUrl(initialSong.url);
                setCoverUrl(initialSong.coverUrl || '');
                setLyrics(initialSong.lyrics || '');
                setMode(initialSong.url.startsWith('data:') ? 'file' : 'url');
            } else {
                setTitle('');
                setArtist('');
                setUrl('');
                setCoverUrl('');
                setLyrics('');
                setLyricsFileName('');
                setMode('file');
            }
        }
    }, [isOpen, initialSong]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            const reader = new FileReader();
            reader.onload = () => {
                setUrl(reader.result as string);
                // Auto-fill title if empty and not editing
                if (!title && !initialSong) {
                    setTitle(file.name.replace(/\.[^/.]+$/, ""));
                }
                setIsLoading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCoverUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLyricsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLyricsFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                setLyrics(reader.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && artist && url) {
            onSave({
                id: initialSong ? initialSong.id : crypto.randomUUID(),
                title,
                artist,
                url,
                coverUrl: coverUrl || undefined,
                lyrics: lyrics || undefined,
                addedAt: initialSong ? initialSong.addedAt : Date.now()
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6" onClick={onClose}>
            <div 
                className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[85vh] no-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
                >
                    <X size={20} />
                </button>
                
                <h3 className="text-lg font-bold text-stone-700 mb-6 text-center">{initialSong ? '编辑歌曲' : '添加歌曲'}</h3>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <input 
                            type="text" 
                            placeholder="歌曲昵称"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-800 transition-all"
                            required
                        />
                    </div>
                    <div>
                        <input 
                            type="text" 
                            placeholder="歌手/作者"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-800 transition-all"
                            required
                        />
                    </div>

                    {/* Cover Art Section */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <label className="text-xs font-bold text-stone-400 mb-2 block uppercase">专辑封面</label>
                        <div className="flex gap-2">
                             <div 
                                className="w-16 h-16 bg-white border border-stone-200 rounded-lg flex items-center justify-center cursor-pointer shrink-0 overflow-hidden relative"
                                onClick={() => coverInputRef.current?.click()}
                             >
                                 {coverUrl ? (
                                     <img src={coverUrl} className="w-full h-full object-cover" />
                                 ) : (
                                     <ImageIcon size={20} className="text-stone-300" />
                                 )}
                             </div>
                             <input 
                                type="file" 
                                ref={coverInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleCoverChange}
                             />
                             <div className="flex-1 flex flex-col justify-center">
                                 <input 
                                    type="text" 
                                    placeholder="或输入图片URL..." 
                                    value={coverUrl}
                                    onChange={(e) => setCoverUrl(e.target.value)}
                                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs outline-none focus:border-stone-400"
                                 />
                                 <button type="button" onClick={() => coverInputRef.current?.click()} className="text-xs text-stone-500 font-bold mt-1 text-left hover:text-stone-800">
                                     上传本地图片
                                 </button>
                             </div>
                        </div>
                    </div>

                    {/* Lyrics Section */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                         <label className="text-xs font-bold text-stone-400 mb-2 block uppercase">歌词文件</label>
                         <button 
                            type="button"
                            onClick={() => lyricsInputRef.current?.click()}
                            className="w-full flex items-center justify-between bg-white border border-stone-200 px-3 py-2.5 rounded-lg active:bg-stone-100 transition-colors"
                         >
                             <div className="flex items-center gap-2 text-stone-600">
                                 <FileText size={16} />
                                 <span className="text-xs font-medium truncate max-w-[150px]">
                                     {lyricsFileName || (initialSong?.lyrics ? "已加载歌词" : "选择 .lrc / .txt 文件")}
                                 </span>
                             </div>
                             <Upload size={14} className="text-stone-400" />
                         </button>
                         <input 
                            type="file" 
                            ref={lyricsInputRef} 
                            className="hidden" 
                            accept=".lrc,.txt" 
                            onChange={handleLyricsChange}
                         />
                    </div>

                    {/* Source Toggle */}
                    <div className="flex bg-stone-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setMode('file')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'file' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
                        >
                            本地文件
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('url')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'url' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
                        >
                            URL 链接
                        </button>
                    </div>

                    {mode === 'file' ? (
                        <div className="relative">
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${url ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-stone-200 text-stone-400 hover:bg-stone-50'}`}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : url ? (
                                    <>
                                        <Music size={24} />
                                        <span className="text-xs font-bold">文件已就绪</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={24} />
                                        <span className="text-xs font-bold">点击上传音频</span>
                                    </>
                                )}
                            </button>
                            <input 
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="audio/*"
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <Link size={16} className="absolute left-3 top-3.5 text-stone-400" />
                            <input 
                                type="url" 
                                placeholder="https://example.com/song.mp3"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full pl-9 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-800 transition-all font-mono"
                            />
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={!title || !artist || !url || isLoading}
                        className="mt-2 w-full bg-stone-800 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-stone-200 hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        {initialSong ? '确认修改' : '确认添加'}
                    </button>
                </form>
            </div>
        </div>
    );
}