import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StatusBar } from './components/StatusBar';
import { AppIcon } from './components/AppIcon';
import { InstagramWidget } from './components/InstagramWidget';
import { ProfileWidget } from './components/ProfileWidget';
import { BrowserWidget } from './components/BrowserWidget';
import { SystemWidget } from './components/SystemWidget';
import { BeautifyApp } from './components/BeautifyApp';
import { ApiSettingsApp } from './components/ApiSettingsApp';
import { SettingsApp } from './components/SettingsApp';
import { MusicApp } from './components/MusicApp';
import { WorldBookApp } from './components/WorldBookApp';
import { QQApp } from './components/QQApp';
import { SocialApp } from './components/SocialApp';
import { MessageCircle, Phone, Globe, Camera, Settings, Headphones, Book, Search, Instagram, Gamepad2, Heart, Ghost, BookOpen, Utensils, Coffee, Home, Sparkles, Image as ImageIcon } from 'lucide-react';
import { ApiPreset, MinMaxSettings, ProfileData, InstagramData, BrowserData, SystemData, AppBackupData, Song, WorldBookEntry, Sticker, Contact as ContactType, ForbiddenWordEntry, Message, Moment, UserProfile } from './types';

const STORAGE_KEY = 'soft-home-theme-data-v1';

// Page 1 Icons
const RAW_TOP_ICONS = [
  { label: 'QQ', icon: <MessageCircle size={28} strokeWidth={1.5} /> },
  { label: '美化', icon: <ImageIcon size={28} strokeWidth={1.5} /> },
  { label: 'api设置', icon: <Sparkles size={28} strokeWidth={1.5} /> },
  { label: '设置', icon: <Settings size={28} strokeWidth={1.5} /> },
];

const RAW_BOTTOM_ICONS = [
  { label: '音乐', icon: <Headphones size={28} strokeWidth={1.5} /> },
  { label: '世界书', icon: <Book size={28} strokeWidth={1.5} /> },
  { label: '查手机', icon: <Search size={28} strokeWidth={1.5} /> },
  { label: 'ins', icon: <Instagram size={28} strokeWidth={1.5} /> },
];

const PAGE_2_ICONS = [
    { label: '游戏', icon: <Gamepad2 size={28} strokeWidth={1.5} /> },
    { label: '情侣空间', icon: <Heart size={28} strokeWidth={1.5} /> },
    { label: '旮旯给木', icon: <Ghost size={28} strokeWidth={1.5} /> },
    { label: '小说', icon: <BookOpen size={28} strokeWidth={1.5} /> },
    { label: '塔罗', icon: <Sparkles size={28} strokeWidth={1.5} /> },
    { label: '菜谱', icon: <Utensils size={28} strokeWidth={1.5} /> },
    { label: '陪伴', icon: <Coffee size={28} strokeWidth={1.5} /> },
    { label: '小家', icon: <Home size={28} strokeWidth={1.5} /> },
];

const RAW_DOCK_ICONS = [
    { label: 'Phone', icon: <Phone size={28} strokeWidth={1.5} /> },
    { label: 'Message', icon: <MessageCircle size={28} strokeWidth={1.5} /> },
    { label: 'Browser', icon: <Globe size={28} strokeWidth={1.5} /> },
    { label: 'Camera', icon: <Camera size={28} strokeWidth={1.5} /> },
];

export default function App() {
  // --- Initialization from LocalStorage ---
  const [isLoaded, setIsLoaded] = useState(false);

  // --- Theme State ---
  const [wallpaper, setWallpaper] = useState<string>('https://ci.xiaohongshu.com/notes_pre_post/1040g3k831qfnu45l726g5pa44ljs617pekh1d6o?imageView2/2/w/0/format/jpg');
  const [customFont, setCustomFont] = useState<string>('');
  const [iconOverrides, setIconOverrides] = useState<Record<string, string>>({});
  
  // --- Page State ---
  const [currentPage, setCurrentPage] = useState(0);
  
  // --- Data State ---
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "甜甜酱", handle: "@Tian", quote: "˚⋆ꔫ あなたの涙は私心の雨 .⁺⊹₊",
    avatar: "https://ci.xiaohongshu.com/notes_pre_post/1040g3k031jnjm1b22u405o1d3hmg8hd3rg33n50?imageView2/2/w/0/format/jpg"
  });
  const [instagramData, setInstagramData] = useState<InstagramData>({
    image: "https://ci.xiaohongshu.com/notes_pre_post/1040g3k031rnkia7k2a6g5o94hku0892g6940djo?imageView2/2/w/0/format/jpg",
    title: "Instagram", tag: "heart"
  });
  const [browserData, setBrowserData] = useState<BrowserData>({
    image: "https://ci.xiaohongshu.com/notes_pre_post/1040g3k031jnjm1b22u4g5o1d3hmg8hd3kh18as0?imageView2/2/w/0/format/jpg",
    address: "Tian"
  });
  const [systemData, setSystemData] = useState<SystemData>({
    headerTag: "˚.꧞涙の雨が 頬をかすめて.꧞⊹⁺", headerLeft: "에이 ...", headerRight: "夢醒36s",
    battery: "Tian", tempLabel: "  𓈒𓏸 ⊹⁺ 𝐷𝑢𝑙𝑙 𝑟𝑎𝑖𝑛𓈒𓏸˚ ₊", tempValue: "",
    dateLabel: "₍^.  ̫ .^₎ のᗦ↞︎◃︎", dateValue: "", chartTag: "誒",
    chartTitle: "28 街悬日。", chartSub1: "0.06% love", chartSub2: "無法解開的梦",
    chartFooter: "Top Widgets*", chartBottomLeft: "< 6",
    memoTitle: "Memo", memoContent: "· Buy flowers 🌸\n· Read a book 📖\n· Sleep early 💤",
    dashboardImage: "https://api.dicebear.com/7.x/notionists/svg?seed=Bear"
  });

  // --- Settings State ---
  const [apiPresets, setApiPresets] = useState<ApiPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [minmaxSettings, setMinMaxSettings] = useState<MinMaxSettings>({
    apiKey: '', groupId: '', voiceId: '', model: 'speech-01'
  });
  const [forbiddenWords, setForbiddenWords] = useState<ForbiddenWordEntry[]>([]);

  // --- Music State ---
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- World Book, Stickers & Chat ---
  const [worldBooks, setWorldBooks] = useState<WorldBookEntry[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [voiceHistory, setVoiceHistory] = useState<Record<string, Message[]>>({});
  const [videoHistory, setVideoHistory] = useState<Record<string, Message[]>>({});
  const [moments, setMoments] = useState<Moment[]>([]);
  const [qqUserProfile, setQqUserProfile] = useState<UserProfile>({
      id: 'default', name: '甜甜酱', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Bear',
      account: '10086', signature: '每一天都要开心鸭！',
      persona: '你是一个活泼开朗的少女，喜欢分享日常，说话语气可爱，经常使用颜文字。',
      momentsBackground: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2067&auto=format&fit=crop'
  });
  const [savedQqProfiles, setSavedQqProfiles] = useState<UserProfile[]>([qqUserProfile]);

  // --- Load and Save Persistence Logic ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.wallpaper) setWallpaper(data.wallpaper);
        if (data.customFont) setCustomFont(data.customFont);
        if (data.iconOverrides) setIconOverrides(data.iconOverrides);
        if (data.profileData) setProfileData(data.profileData);
        if (data.instagramData) setInstagramData(data.instagramData);
        if (data.browserData) setBrowserData(data.browserData);
        if (data.systemData) setSystemData(data.systemData);
        if (data.apiPresets) setApiPresets(data.apiPresets);
        if (data.activePresetId) setActivePresetId(data.activePresetId);
        if (data.minmaxSettings) setMinMaxSettings(data.minmaxSettings);
        if (data.forbiddenWords) setForbiddenWords(data.forbiddenWords);
        if (data.playlist) setPlaylist(data.playlist);
        if (data.worldBooks) setWorldBooks(data.worldBooks);
        if (data.stickers) setStickers(data.stickers);
        if (data.contacts) setContacts(data.contacts);
        if (data.chatHistory) setChatHistory(data.chatHistory);
        if (data.voiceHistory) setVoiceHistory(data.voiceHistory);
        if (data.videoHistory) setVideoHistory(data.videoHistory);
        if (data.moments) setMoments(data.moments);
        if (data.qqUserProfile) setQqUserProfile(data.qqUserProfile);
        if (data.savedQqProfiles) setSavedQqProfiles(data.savedQqProfiles);
      } catch (e) { console.error("Persistence Load Error", e); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
        const dataToSave = {
          wallpaper, customFont, iconOverrides, profileData, instagramData, browserData, systemData,
          apiPresets, activePresetId, minmaxSettings, forbiddenWords, playlist, worldBooks, stickers,
          contacts, chatHistory, voiceHistory, videoHistory, moments, qqUserProfile, savedQqProfiles
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.error("Failed to save to localStorage", e);
        // Optional: Alert user if quota exceeded
    }
  }, [
    isLoaded, wallpaper, customFont, iconOverrides, profileData, instagramData, browserData, systemData,
    apiPresets, activePresetId, minmaxSettings, forbiddenWords, playlist, worldBooks, stickers,
    contacts, chatHistory, voiceHistory, videoHistory, moments, qqUserProfile, savedQqProfiles
  ]);

  // --- App Visibility State ---
  const [isBeautifyOpen, setIsBeautifyOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMusicAppOpen, setIsMusicAppOpen] = useState(false);
  const [isWorldBookOpen, setIsWorldBookOpen] = useState(false);
  const [isQQAppOpen, setIsQQAppOpen] = useState(false);
  const [isSocialAppOpen, setIsSocialAppOpen] = useState(false);

  // --- Audio Logic ---
  const currentSong = playlist[currentSongIndex];
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentSong) {
        audioRef.current.play().catch(e => {
            console.error("Playback failed", e);
            setIsPlaying(false);
        });
      } else { audioRef.current.pause(); }
    }
  }, [isPlaying, currentSongIndex, playlist, currentSong]);

  const handleMusicNext = () => {
    if (playlist.length === 0) return;
    setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
    setIsPlayerVisible(true);
  };
  const handleMusicPrev = () => {
    if (playlist.length === 0) return;
    setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
    setIsPlayerVisible(true);
  };
  const handleMusicToggle = () => {
      if (!currentSong) return;
      setIsPlaying(!isPlaying);
      setIsPlayerVisible(true);
  };
  const handleMusicClose = () => {
      setIsPlaying(false);
      setIsPlayerVisible(false);
  };

  const statusBarProps = {
      musicState: { isPlaying, currentSong, isVisible: isPlayerVisible },
      musicControls: { onPlayPause: handleMusicToggle, onNext: handleMusicNext, onPrev: handleMusicPrev, onClose: handleMusicClose },
      audioRef
  };

  const allIcons = useMemo(() => [...RAW_TOP_ICONS, ...RAW_BOTTOM_ICONS, ...PAGE_2_ICONS, ...RAW_DOCK_ICONS], []);

  const handleIconClick = (label: string) => {
      if (label === '美化') setIsBeautifyOpen(true);
      else if (label === 'api设置') setIsApiSettingsOpen(true);
      else if (label === '设置') setIsSettingsOpen(true);
      else if (label === '音乐') setIsMusicAppOpen(true);
      else if (label === '世界书' || label === '小说') setIsWorldBookOpen(true);
      else if (label === 'QQ' || label === 'Message') setIsQQAppOpen(true);
      else if (label === 'ins' || label === '情侣空间') setIsSocialAppOpen(true);
      else if (label === '小家') alert("欢迎回到温馨小家 🏠");
      else if (label === '游戏') alert("游戏中心开发中... 🎮");
      else if (label === '塔罗') alert("今日运势：大吉 ✨");
  };

  const handleUpdateIcon = (label: string, url: string) => {
      setIconOverrides(prev => ({ ...prev, [label]: url }));
  };

  const handleSavePreset = (preset: ApiPreset) => {
      setApiPresets(prev => {
          const index = prev.findIndex(p => p.id === preset.id);
          if (index >= 0) {
              const newPresets = [...prev];
              newPresets[index] = preset;
              return newPresets;
          }
          return [...prev, preset];
      });
      if (!activePresetId) setActivePresetId(preset.id);
  };

  const handleDeletePreset = (id: string) => {
      setApiPresets(prev => prev.filter(p => p.id !== id));
      if (activePresetId === id) setActivePresetId(null);
  };

  const handleExportBackup = (type: 'full' | 'appearance' | 'chat' | 'settings' = 'full') => {
      const baseBackup: Partial<AppBackupData> = { version: 1 };
      if (type === 'full' || type === 'appearance') {
          baseBackup.wallpaper = wallpaper; baseBackup.customFont = customFont; baseBackup.iconOverrides = iconOverrides;
          baseBackup.profileData = profileData; baseBackup.instagramData = instagramData; baseBackup.browserData = browserData; baseBackup.systemData = systemData;
      }
      if (type === 'full' || type === 'chat') {
          baseBackup.contacts = contacts; baseBackup.worldBooks = worldBooks; baseBackup.stickers = stickers;
          baseBackup.forbiddenWords = forbiddenWords; baseBackup.chatHistory = chatHistory; baseBackup.voiceHistory = voiceHistory;
          baseBackup.videoHistory = videoHistory; baseBackup.moments = moments; baseBackup.qqUserProfile = qqUserProfile; baseBackup.savedQqProfiles = savedQqProfiles;
      }
      if (type === 'full' || type === 'settings') {
          baseBackup.apiPresets = apiPresets; baseBackup.activePresetId = activePresetId; baseBackup.minmaxSettings = minmaxSettings; baseBackup.playlist = playlist;
      }
      const blob = new Blob([JSON.stringify(baseBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soft-home-${type}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (file: File) => {
      return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const data = JSON.parse(e.target?.result as string) as Partial<AppBackupData>;
                  if (data) {
                      if (data.wallpaper !== undefined) setWallpaper(data.wallpaper);
                      if (data.customFont !== undefined) setCustomFont(data.customFont);
                      if (data.iconOverrides) setIconOverrides(data.iconOverrides);
                      if (data.profileData) setProfileData(data.profileData);
                      if (data.instagramData) setInstagramData(data.instagramData);
                      if (data.browserData) setBrowserData(data.browserData);
                      if (data.systemData) setSystemData(data.systemData);
                      if (data.apiPresets) setApiPresets(data.apiPresets);
                      if (data.activePresetId !== undefined) setActivePresetId(data.activePresetId);
                      if (data.minmaxSettings) setMinMaxSettings(data.minmaxSettings);
                      if (data.playlist) setPlaylist(data.playlist);
                      if (data.contacts) setContacts(data.contacts);
                      if (data.worldBooks) setWorldBooks(data.worldBooks);
                      if (data.stickers) setStickers(data.stickers);
                      if (data.forbiddenWords) setForbiddenWords(data.forbiddenWords);
                      if (data.chatHistory) setChatHistory(data.chatHistory);
                      if (data.voiceHistory) setVoiceHistory(data.voiceHistory);
                      if (data.videoHistory) setVideoHistory(data.videoHistory);
                      if (data.moments) setMoments(data.moments);
                      if (data.qqUserProfile) setQqUserProfile(data.qqUserProfile);
                      if (data.savedQqProfiles) setSavedQqProfiles(data.savedQqProfiles);
                      resolve();
                  } else { reject(new Error("Invalid backup data")); }
              } catch (err) { reject(err); }
          };
          reader.onerror = reject;
          reader.readAsText(file);
      });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollLeft = e.currentTarget.scrollLeft;
      const width = e.currentTarget.offsetWidth;
      setCurrentPage(Math.round(scrollLeft / width));
  };

  if (!isLoaded) return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 font-bold">Loading Theme...</div>;

  return (
    <>
    {customFont && (
        <style>{`@font-face { font-family: 'CustomThemeFont'; src: url('${customFont}'); } body, .font-sans { font-family: 'CustomThemeFont', sans-serif !important; }`}</style>
    )}
    <audio ref={audioRef} src={currentSong?.url} onEnded={handleMusicNext} />
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 flex justify-center selection:bg-stone-200">
      <div 
        className="w-full max-w-[420px] bg-[#fdfdfc] min-h-screen flex flex-col shadow-2xl relative overflow-hidden bg-cover bg-center transition-all duration-500"
        style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : {}}
      >
        <div className="relative z-0 flex flex-col h-full">
            <StatusBar {...statusBarProps} />
            <div className="flex-1 w-full overflow-x-auto snap-x snap-mandatory no-scrollbar flex" onScroll={handleScroll}>
                <div className="w-full h-full flex-shrink-0 snap-center overflow-y-auto no-scrollbar px-6 pt-6 pb-8 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-4 gap-x-4 gap-y-10 auto-rows-[68px]">
                            <div className="col-span-2 row-span-2 h-full"><InstagramWidget data={instagramData} onUpdate={setInstagramData} /></div>
                            {RAW_TOP_ICONS.map((item, idx) => (
                                <div key={idx} className="col-span-1"><AppIcon label={item.label} icon={item.icon} image={iconOverrides[item.label]} onClick={() => handleIconClick(item.label)} /></div>
                            ))}
                        </div>
                    </div>
                    <div className="w-full"><ProfileWidget data={profileData} onUpdate={setProfileData} /></div>
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-4 gap-x-4 gap-y-10 auto-rows-[68px]">
                            <div className="col-span-2 row-span-2 grid grid-cols-2 gap-x-4 gap-y-4">
                                {RAW_BOTTOM_ICONS.map((item, idx) => (
                                    <div key={idx} className="col-span-1"><AppIcon label={item.label} icon={item.icon} image={iconOverrides[item.label]} onClick={() => handleIconClick(item.label)} /></div>
                                ))}
                            </div>
                            <div className="col-span-2 row-span-2 h-full"><BrowserWidget data={browserData} onUpdate={setBrowserData} /></div>
                        </div>
                    </div>
                </div>
                <div className="w-full h-full flex-shrink-0 snap-center overflow-y-auto no-scrollbar px-6 pt-4 pb-8 flex flex-col gap-6">
                    <SystemWidget type="header" data={systemData} onUpdate={setSystemData} />
                    <div className="w-full"><SystemWidget type="dashboard" data={systemData} onUpdate={setSystemData} /></div>
                    <div className="w-full"><SystemWidget type="memo" data={systemData} onUpdate={setSystemData} /></div>
                    <div className="grid grid-cols-4 gap-x-4 gap-y-8 mt-2">
                        {PAGE_2_ICONS.map((item, idx) => (
                            <div key={idx} className="col-span-1"><AppIcon label={item.label} icon={item.icon} image={iconOverrides[item.label]} onClick={() => handleIconClick(item.label)} /></div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-center gap-1.5 pb-2 z-10 pointer-events-none">
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentPage === 0 ? 'bg-stone-800 w-3' : 'bg-stone-300/80 backdrop-blur-sm'}`} />
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentPage === 1 ? 'bg-stone-800 w-3' : 'bg-stone-300/80 backdrop-blur-sm'}`} />
            </div>
            <div className="mt-auto pb-6 px-6">
                <div className="flex justify-between items-center px-2">
                    {RAW_DOCK_ICONS.map((item, idx) => (
                         <div key={idx} className="w-[60px] h-[60px] bg-white rounded-2xl shadow-sm flex items-center justify-center active:scale-95 transition-transform duration-200 cursor-pointer group overflow-hidden" onClick={() => handleIconClick(item.label)}>
                            {iconOverrides[item.label] ? ( <img src={iconOverrides[item.label]} alt={item.label} className="w-full h-full object-cover" /> ) : ( <div className="text-stone-400 group-hover:text-stone-500 transition-colors">{item.icon}</div> )}
                         </div>
                    ))}
                </div>
            </div>
        </div>
        <BeautifyApp isOpen={isBeautifyOpen} onClose={() => setIsBeautifyOpen(false)} onUpdateWallpaper={setWallpaper} onUpdateFont={setCustomFont} onUpdateIcon={handleUpdateIcon} iconList={allIcons} iconOverrides={iconOverrides} statusBarProps={statusBarProps} />
        <ApiSettingsApp isOpen={isApiSettingsOpen} onClose={() => setIsApiSettingsOpen(false)} presets={apiPresets} activePresetId={activePresetId} onSavePreset={handleSavePreset} onDeletePreset={handleDeletePreset} onSelectPreset={setActivePresetId} statusBarProps={statusBarProps} />
        <SettingsApp isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} minmaxSettings={minmaxSettings} onSaveMinMax={setMinMaxSettings} onExportBackup={handleExportBackup} onImportBackup={handleImportBackup} statusBarProps={statusBarProps} forbiddenWords={forbiddenWords} onUpdateForbiddenWords={setForbiddenWords} />
        <MusicApp isOpen={isMusicAppOpen} onClose={() => setIsMusicAppOpen(false)} playlist={playlist} onUpdatePlaylist={setPlaylist} currentSongIndex={currentSongIndex} setCurrentSongIndex={setCurrentSongIndex} isPlaying={isPlaying} setIsPlaying={setIsPlaying} audioRef={audioRef} setIsPlayerVisible={setIsPlayerVisible} />
        <WorldBookApp isOpen={isWorldBookOpen} onClose={() => setIsWorldBookOpen(false)} entries={worldBooks} onUpdateEntries={setWorldBooks} contacts={contacts} statusBarProps={statusBarProps} />
        <QQApp isOpen={isQQAppOpen} onClose={() => setIsQQAppOpen(false)} minmaxSettings={minmaxSettings} apiPresets={apiPresets} activePresetId={activePresetId} worldBooks={worldBooks} stickers={stickers} onUpdateStickers={setStickers} contacts={contacts} onUpdateContacts={setContacts} statusBarProps={statusBarProps} forbiddenWords={forbiddenWords} chatHistory={chatHistory} onUpdateChatHistory={setChatHistory} voiceHistory={voiceHistory} onUpdateVoiceHistory={setVoiceHistory} videoHistory={videoHistory} onUpdateVideoHistory={setVideoHistory} moments={moments} onUpdateMoments={setMoments} currentUser={qqUserProfile} onUpdateCurrentUser={setQqUserProfile} savedProfiles={savedQqProfiles} onUpdateSavedProfiles={setSavedQqProfiles} />
        <SocialApp isOpen={isSocialAppOpen} onClose={() => setIsSocialAppOpen(false)} statusBarProps={statusBarProps} />
      </div>
    </div>
    </>
  );
}