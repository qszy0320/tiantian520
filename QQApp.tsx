import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Users, User, Star, Search, Plus, ArrowLeft, ChevronRight, Settings, Image as ImageIcon, Heart, MessageSquare, Wallet, Camera, UserPlus, Upload, Save, Edit3, Trash2, Send, Smile, Phone, Download, FileText, Mic, MoreHorizontal, Play, Loader2, PlusCircle, RotateCcw, Gift, Video, Footprints, Map as MapIcon, Book, Wifi, X, Link, CheckCircle, Circle, AtSign, EyeOff, ArrowRightLeft, PhoneOff, SwitchCamera, PhoneIncoming, XCircle, Check, MicOff, Volume2, QrCode, Clock, RefreshCw, Sparkles, Copy, CheckSquare, Square, DownloadCloud, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ImageUpdateModal } from './ImageUpdateModal';
import { StatusBar } from './StatusBar';
import { MinMaxSettings, ApiPreset, WorldBookEntry, Sticker, Contact, UserProfile, Song, Message, Moment, ForbiddenWordEntry } from '../types';

// Helper for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safe ID Generator
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface QQAppProps {
  isOpen: boolean;
  onClose: () => void;
  minmaxSettings: MinMaxSettings;
  apiPresets: ApiPreset[];
  activePresetId: string | null;
  worldBooks: WorldBookEntry[];
  stickers: Sticker[];
  onUpdateStickers: (stickers: Sticker[]) => void;
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
  
  chatHistory: Record<string, Message[]>;
  onUpdateChatHistory: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  voiceHistory: Record<string, Message[]>;
  onUpdateVoiceHistory: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  videoHistory: Record<string, Message[]>;
  onUpdateVideoHistory: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  moments: Moment[];
  onUpdateMoments: (moments: Moment[]) => void;
  currentUser: UserProfile;
  onUpdateCurrentUser: (user: UserProfile) => void;
  
  savedProfiles?: UserProfile[];
  onUpdateSavedProfiles?: (profiles: UserProfile[]) => void;

  forbiddenWords?: ForbiddenWordEntry[];
  statusBarProps?: {
    musicState: { isPlaying: boolean; currentSong?: Song; isVisible?: boolean; };
    musicControls: { onPlayPause: () => void; onNext: () => void; onPrev: () => void; onClose: () => void; };
    audioRef: React.RefObject<HTMLAudioElement | null>;
  }
}

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors active:scale-95 ${active ? 'text-stone-800' : 'text-stone-400'}`}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

const Header = ({ title, onClose, rightAction }: { title: string, onClose: () => void, rightAction?: React.ReactNode }) => (
    <div className="h-14 px-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-50">
        <button onClick={onClose} className="p-2 -ml-2 text-stone-600 hover:bg-stone-50/50 rounded-full">
            <ArrowLeft size={22} />
        </button>
        <span className="font-bold text-lg text-stone-800 truncate max-w-[200px] text-center">{title}</span>
        <div className="w-9 flex items-center justify-end">
            {rightAction}
        </div>
    </div>
);

const ChatMenuButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-stone-600 group-active:scale-95 transition-transform border border-stone-100 shadow-sm hover:bg-stone-50">
            {icon}
        </div>
        <span className="text-xs text-stone-500 font-medium">{label}</span>
    </button>
);

export const QQApp: React.FC<QQAppProps> = ({ 
    isOpen, onClose, minmaxSettings, apiPresets, activePresetId, worldBooks, stickers, onUpdateStickers, contacts, onUpdateContacts, statusBarProps, forbiddenWords = [],
    chatHistory, onUpdateChatHistory, voiceHistory, onUpdateVoiceHistory, videoHistory, onUpdateVideoHistory, moments, onUpdateMoments, currentUser, onUpdateCurrentUser,
    savedProfiles = [], onUpdateSavedProfiles
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'contacts' | 'moments' | 'me'>('messages');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  
  // View State
  const [currentView, setCurrentView] = useState<'main' | 'add_contact' | 'edit_profile' | 'contact_detail' | 'chat' | 'chat_settings' | 'post_moment' | 'contact_selector' | 'video_call' | 'voice_call' | 'settings' | 'accounts' | 'add_account'>('main');
  const [activeChatContact, setActiveChatContact] = useState<Contact | null>(null);
  const [contactMoodStatuses, setContactMoodStatuses] = useState<Record<string, string>>({});
  
  // Moments Interaction
  const [activeMomentMenuId, setActiveMomentMenuId] = useState<string | null>(null);
  const [commentingMomentId, setCommentingMomentId] = useState<string | null>(null);

  // Call State
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const callTimerRef = useRef<number | null>(null);

  // Forms & Inputs
  const [editingProfile, setEditingProfile] = useState<UserProfile>(currentUser);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRemark, setNewContactRemark] = useState('');
  const [newContactAvatar, setNewContactAvatar] = useState('');
  const [newContactPersona, setNewContactPersona] = useState('');

  // Chat Interface State
  const [inputMessage, setInputMessage] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message Interaction State
  const [contextMenuMsgId, setContextMenuMsgId] = useState<string | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [isMessageEditModalOpen, setIsMessageEditModalOpen] = useState(false);
  const [editingMsgContent, setEditingMsgContent] = useState('');

  // Red Packet / Transfer Details
  const [detailModalMsg, setDetailModalMsg] = useState<Message | null>(null);

  // Audition State in Settings
  const [auditionText, setAuditionText] = useState('你好，我是甜甜。');
  
  // Modals
  const [isMomentsBgModalOpen, setIsMomentsBgModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isChatBgModalOpen, setIsChatBgModalOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [redPacketModalOpen, setRedPacketModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);

  // Red Packet & Transfer Inputs
  const [rpTitleInput, setRpTitleInput] = useState('恭喜发财，大吉大利');
  const [rpAmountInput, setRpAmountInput] = useState('');
  const [tfAmountInput, setTfAmountInput] = useState('');
  const [tfRemarkInput, setTfRemarkInput] = useState('');

  // Disguised Photo State
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [disguisedPhotoText, setDisguisedPhotoText] = useState('');

  const [expandedVoiceIds, setExpandedVoiceIds] = useState<Set<string>>(new Set());

  // Long press handling
  const longPressTimer = useRef<number | null>(null);
  const handleMessagePressStart = (msgId: string) => {
    longPressTimer.current = window.setTimeout(() => {
        setContextMenuMsgId(msgId);
    }, 600); // 600ms for long press
  };
  const handleMessagePressEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  // Sync Profile
  useEffect(() => {
    if (currentView === 'edit_profile') setEditingProfile(currentUser);
  }, [currentView, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    if (currentView === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, currentView, activeChatContact, isPlusMenuOpen, isTyping]);

  // Call Timer Logic
  useEffect(() => {
      if (currentView === 'video_call' || currentView === 'voice_call') {
          setCallDuration(0);
          callTimerRef.current = window.setInterval(() => {
              setCallDuration(prev => prev + 1);
          }, 1000);
      } else {
          if (callTimerRef.current) {
              clearInterval(callTimerRef.current);
              callTimerRef.current = null;
          }
      }
      return () => {
          if (callTimerRef.current) clearInterval(callTimerRef.current);
      };
  }, [currentView]);

  if (!isOpen) return null;

  // Helpers
  const getDisplayName = (contact: Contact) => contact.remark || contact.name;
  const formatClockTime = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };
  const getTimeString = (zone: string) => {
      try {
          return new Date().toLocaleTimeString('zh-CN', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {
          return "时间未知";
      }
  };
  const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenChat = (contact: Contact) => {
      setActiveChatContact(contact);
      setIsPlusMenuOpen(false);
      setIsMultiSelectMode(false);
      setSelectedMsgIds(new Set());
      setCurrentView('chat');
  };

  // --- AI Handlers ---
  const triggerAIResponse = async (contact: Contact, currentHistory: Message[]) => {
      const activePreset = apiPresets.find(p => p.id === activePresetId);
      if (!activePreset) return;

      setIsTyping(true);

      const relevantWorldBooks = worldBooks.filter(wb => wb.scope === 'global' || (wb.scope === 'local' && wb.characterName === contact.name));
      const worldInfoText = relevantWorldBooks.map(wb => `[${wb.name}]: ${wb.content}`).join('\n');
      
      const systemPrompt = `
You are "${contact.name}". Persona: ${contact.persona}. User: "${currentUser.name}".
ONLINE MODE: This is a real-time chat.
- DO NOT include actions, psychological descriptions, or narrative text (like *smiles* or [thinking to self]).
- Talk naturally, briefly, and casually like you are texting on QQ.
- STATUS: You must decide your mood based on the plot. Use [STATUS: mood] at the VERY START of your response to update your permanent status bar (e.g., [STATUS: 手机在线], [STATUS: 心动中], [STATUS: 忙碌], [STATUS: 激动]). Ensure it fits your persona and world setting. No OOC.
- Split your response into at least 5 separate messages. 
- Use the delimiter [MSG_SPLIT] to separate each message in your output.
World: ${worldInfoText}
Settings: Max Word: ${contact.offlineWordCount || 50}.
${forbiddenWords.length > 0 ? `Forbidden: ${forbiddenWords.map(w => w.word).join(', ')}` : ""}

Example output:
[STATUS: 开心] [MSG_SPLIT] 你好呀！ [MSG_SPLIT] 刚刚在看好笑的视频 [MSG_SPLIT] 哎呀 [MSG_SPLIT] 真的太有趣了 [MSG_SPLIT] 你今天过得怎么样？
      `.trim();

      const apiMessages = [
          { role: 'system', content: systemPrompt },
          ...currentHistory.slice(-20).map(msg => ({
              role: msg.isSelf ? 'user' : 'assistant',
              content: msg.type === 'text' ? msg.text : (msg.type === 'simulated_image' ? `[Photo: ${msg.simulated_text}]` : `[${msg.type}]`)
          }))
      ];

      try {
          let baseUrl = activePreset.baseUrl.trim().replace(/\/+$/, '');
          if (!baseUrl.includes('/v1')) baseUrl = `${baseUrl}/v1/chat/completions`;
          else baseUrl = `${baseUrl}/chat/completions`;

          const response = await fetch(baseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activePreset.apiKey}` },
              body: JSON.stringify({
                  model: activePreset.selectedModel,
                  messages: apiMessages,
                  temperature: 0.85
              })
          });

          if (!response.ok) throw new Error("API Error");
          const data = await response.json();
          const aiRawText = data.choices?.[0]?.message?.content || "";
          
          const moodMatch = aiRawText.match(/\[STATUS:\s*(.*?)\]/);
          if (moodMatch && moodMatch[1]) {
              setContactMoodStatuses(prev => ({ ...prev, [contact.id]: moodMatch[1].trim() }));
          }

          const cleanedText = aiRawText.replace(/\[STATUS:.*?\]/g, '').trim();

          let parts = cleanedText.split('[MSG_SPLIT]').map(p => p.trim()).filter(p => p);
          if (parts.length < 5 && parts.length > 0) {
              const fullStr = parts.join(' ');
              parts = fullStr.split(/([。！？\n])/).reduce((acc: string[], val, i, arr) => {
                  if (i % 2 === 0) acc.push(val + (arr[i+1] || ''));
                  return acc;
              }, []).filter(p => p.trim().length > 1);
          }

          for (let i = 0; i < parts.length; i++) {
              await sleep(800 + Math.random() * 1200); 
              
              const newMessage: Message = {
                  id: generateId(),
                  type: 'text',
                  text: parts[i],
                  isSelf: false,
                  timestamp: Date.now()
              };
              
              onUpdateChatHistory(prev => {
                  const h = prev[contact.id] || [];
                  return { ...prev, [contact.id]: [...h, newMessage] };
              });
          }
      } catch (error) {
          console.error(error);
      } finally {
          setIsTyping(false);
      }
  };

  const handleSendMessage = async (message: Message, triggerAI: boolean = false) => {
      if (!activeChatContact) return;
      const contactId = activeChatContact.id;
      
      // Update history immediately using functional update to prevent race conditions
      onUpdateChatHistory(prev => {
          const h = prev[contactId] || [];
          return { ...prev, [contactId]: [...h, message] };
      });
      
      // Simulated auto-claim for UI richness
      if (message.type === 'redPacket' || message.type === 'transfer') {
          await sleep(2000 + Math.random() * 1500);
          onUpdateChatHistory(prev => {
              const h = prev[contactId] || [];
              const updated = h.map(m => m.id === message.id ? { ...m, status: 'claimed' as const } : m);
              return { ...prev, [contactId]: updated };
          });
      }

      if (triggerAI) {
          // Trigger AI with current view of history (this is safe enough as AI will see the user's latest text)
          // We get the latest history from state to pass to AI
          const latestHistory = [...(chatHistory[contactId] || []), message];
          await triggerAIResponse(activeChatContact, latestHistory);
      }
  };

  const handleDeleteMessage = (msgId: string) => {
      if (!activeChatContact) return;
      const contactId = activeChatContact.id;
      onUpdateChatHistory(prev => ({
          ...prev,
          [contactId]: (prev[contactId] || []).filter(m => m.id !== msgId)
      }));
      setContextMenuMsgId(null);
  };

  const handleDeleteSelected = () => {
      if (!activeChatContact) return;
      const contactId = activeChatContact.id;
      onUpdateChatHistory(prev => ({
          ...prev,
          [contactId]: (prev[contactId] || []).filter(m => !selectedMsgIds.has(m.id))
      }));
      setSelectedMsgIds(new Set());
      setIsMultiSelectMode(false);
  };

  const handleUpdateMessageContent = () => {
      if (!activeChatContact || !contextMenuMsgId) return;
      const contactId = activeChatContact.id;
      onUpdateChatHistory(prev => ({
          ...prev,
          [contactId]: (prev[contactId] || []).map(m => m.id === contextMenuMsgId ? { ...m, text: editingMsgContent } : m)
      }));
      setIsMessageEditModalOpen(false);
      setContextMenuMsgId(null);
  };

  const handleSaveContact = () => {
      if (!newContactName.trim()) { alert('请输入联系人名字'); return; }
      const newContact: Contact = {
          id: generateId(),
          name: newContactName,
          remark: newContactRemark,
          avatar: newContactAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newContactName}`,
          persona: newContactPersona,
          voiceId: '',
          chatBackground: '',
          timeSensingEnabled: false,
          aiTimezone: 'Asia/Shanghai',
          offlineWordCount: 50,
          offlineStyleId: 'normal'
      };
      onUpdateContacts([...contacts, newContact]);
      setNewContactName(''); setNewContactRemark(''); setNewContactAvatar(''); setNewContactPersona('');
      setCurrentView('main');
  };

  const handleEndCall = () => {
      if (!activeChatContact) return;
      const type = currentView === 'video_call' ? 'videoCallLog' : 'voiceCallLog';
      const logMsg: Message = {
          id: generateId(),
          type: type,
          text: `通话时长 ${formatDuration(callDuration)}`,
          isSelf: true,
          timestamp: Date.now()
      };
      handleSendMessage(logMsg, false);
      setCurrentView('chat');
  };

  const handleRegenerate = () => {
      if (!activeChatContact) return;
      const contactId = activeChatContact.id;
      
      onUpdateChatHistory(prev => {
          const history = prev[contactId] || [];
          if (history.length === 0) return prev;
          const newHistory = [...history];
          while (newHistory.length > 0 && !newHistory[newHistory.length - 1].isSelf) {
              newHistory.pop();
          }
          // We can't easily trigger the AI response loop from within a functional update return 
          // but we can compute the new state and then trigger the side effect.
          return { ...prev, [contactId]: newHistory };
      });

      // Simple delay to allow state update to propagate before we trigger AI response
      setTimeout(() => {
          const currentH = chatHistory[contactId] || [];
          const lastSelfIdx = [...currentH].reverse().findIndex(m => m.isSelf);
          if (lastSelfIdx !== -1) {
              triggerAIResponse(activeChatContact, currentH.slice(0, currentH.length - lastSelfIdx));
          }
      }, 0);
  };

  // --- Views Render ---

  // 1. VIDEO CALL
  if (currentView === 'video_call' && activeChatContact) {
      return (
          <div className="absolute inset-0 z-[60] bg-stone-900 flex flex-col items-center animate-in slide-in-from-bottom duration-500 overflow-hidden font-sans">
              <StatusBar className="bg-transparent text-white" {...statusBarProps} theme="light" />
              <div className="flex-1 w-full relative">
                  <div className="absolute inset-0 bg-stone-800">
                      <img src={activeChatContact.avatar} className="w-full h-full object-cover opacity-40 blur-md" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                              <img src={activeChatContact.avatar} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-white font-bold text-2xl drop-shadow-md">{activeChatContact.name}</span>
                          <span className="text-white/60 text-sm mt-2 font-mono">{formatDuration(callDuration)}</span>
                      </div>
                  </div>
                  <div className="absolute top-4 right-4 w-28 h-40 bg-black rounded-xl overflow-hidden border-2 border-white/20 shadow-lg z-20">
                      <img src={currentUser.avatar} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-16 left-0 right-0 flex justify-around items-center px-10 z-30">
                      <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-stone-800/50 text-white'}`}><MicOff size={24} /></button>
                      <button onClick={handleEndCall} className="p-5 rounded-full bg-red-500 text-white shadow-xl active:scale-95"><PhoneOff size={32} /></button>
                      <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className={`p-4 rounded-full ${isSpeakerOn ? 'bg-white text-black' : 'bg-stone-800/50 text-white'}`}><Volume2 size={24} /></button>
                  </div>
              </div>
          </div>
      );
  }

  // 2. VOICE CALL
  if (currentView === 'voice_call' && activeChatContact) {
      return (
          <div className="absolute inset-0 z-[60] bg-gradient-to-b from-stone-800 to-stone-900 flex flex-col items-center animate-in slide-in-from-bottom duration-500 text-white">
              <StatusBar className="bg-transparent text-white" {...statusBarProps} theme="light" />
              <div className="flex-1 flex flex-col items-center justify-center gap-8 mb-20">
                  <div className="relative">
                      <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl relative z-10">
                          <img src={activeChatContact.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 bg-white/10 rounded-full animate-ping -z-0"></div>
                  </div>
                  <div className="text-center">
                      <h2 className="text-2xl font-bold">{activeChatContact.name}</h2>
                      <p className="text-white/40 font-mono tracking-widest mt-1">{formatDuration(callDuration)}</p>
                  </div>
              </div>
              <div className="w-full flex justify-around items-center px-12 pb-20 z-20">
                  <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full ${isMuted ? 'bg-white text-stone-900' : 'bg-white/10'}`}><MicOff size={24} /></button>
                  <button onClick={handleEndCall} className="p-5 rounded-full bg-red-500 text-white shadow-2xl active:scale-95"><PhoneOff size={32} /></button>
                  <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className={`p-4 rounded-full ${isSpeakerOn ? 'bg-white text-stone-900' : 'bg-white/10'}`}><Volume2 size={24} /></button>
              </div>
          </div>
      );
  }

  // 3. CHAT VIEW
  if (currentView === 'chat' && activeChatContact) {
      const history = chatHistory[activeChatContact.id] || [];
      const moodStatus = contactMoodStatuses[activeChatContact.id] || "手机在线";
      const bgImage = activeChatContact.chatBackground ? `url(${activeChatContact.chatBackground})` : (currentUser.globalChatBackground ? `url(${currentUser.globalChatBackground})` : 'none');

      return (
          <div className="absolute inset-0 z-50 bg-[#f5f5f5] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
              <StatusBar className="bg-[#f5f5f5]" {...statusBarProps} />
              <div className="h-14 px-4 flex items-center justify-between border-b border-stone-200 bg-[#f5f5f5] sticky top-0 z-20">
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => { setIsMultiSelectMode(false); setCurrentView('main'); }}>
                      <ArrowLeft size={24} />
                      <div className="flex flex-col ml-2">
                          <span className="font-bold text-lg leading-tight">{getDisplayName(activeChatContact)}</span>
                          <span className="text-[10px] text-stone-500 font-medium h-3 flex items-center">
                              {isTyping ? "对方正在输入中..." : moodStatus}
                          </span>
                      </div>
                  </div>
                  {isMultiSelectMode ? (
                      <button onClick={() => { setIsMultiSelectMode(false); setSelectedMsgIds(new Set()); }} className="text-stone-700 text-sm font-bold">取消</button>
                  ) : (
                      <button onClick={() => setCurrentView('chat_settings')} className="p-2"><MoreHorizontal size={24} /></button>
                  )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundImage: bgImage, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {history.map((msg) => (
                      <div key={msg.id} className={`flex w-full ${msg.isSelf ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                          <div className={`flex max-w-[85%] gap-2 ${msg.isSelf ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                              {isMultiSelectMode && (
                                  <div 
                                    className="pt-2 cursor-pointer"
                                    onClick={() => {
                                        setSelectedMsgIds(prev => {
                                            const next = new Set(prev);
                                            if (next.has(msg.id)) next.delete(msg.id);
                                            else next.add(msg.id);
                                            return next;
                                        });
                                    }}
                                  >
                                      {selectedMsgIds.has(msg.id) ? <CheckSquare size={20} className="text-stone-800" /> : <Square size={20} className="text-stone-300" />}
                                  </div>
                              )}
                              <img src={msg.isSelf ? currentUser.avatar : activeChatContact.avatar} className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm border border-white" />
                              
                              {msg.type === 'image' ? (
                                  <div 
                                    onClick={() => !isMultiSelectMode && setContextMenuMsgId(msg.id)}
                                    className="max-w-[200px] overflow-hidden rounded-xl shadow-sm border border-white/50 cursor-pointer"
                                  >
                                      <img src={msg.imageUrl} className="w-full h-auto object-cover" />
                                  </div>
                              ) : msg.type === 'simulated_image' ? (
                                  <div 
                                    className={`w-40 h-40 bg-white border border-stone-200 rounded-xl shadow-sm flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden`}
                                    onClick={() => {
                                        if (isMultiSelectMode) return;
                                        setContextMenuMsgId(msg.id);
                                    }}
                                  >
                                      {flippedIds.has(msg.id) ? (
                                          <div className="p-4 text-center text-sm font-medium text-stone-600 animate-in zoom-in duration-300">
                                              {msg.simulated_text}
                                          </div>
                                      ) : (
                                          <div className="animate-in fade-in duration-300">
                                              <Camera size={40} className="text-stone-100" />
                                          </div>
                                      )}
                                      <button 
                                        className="absolute bottom-2 right-2 p-1.5 bg-stone-100 rounded-lg text-stone-400 opacity-40 hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFlippedIds(prev => {
                                                const next = new Set(prev);
                                                if (next.has(msg.id)) next.delete(msg.id);
                                                else next.add(msg.id);
                                                return next;
                                            });
                                        }}
                                      >
                                          <RefreshCw size={12} />
                                      </button>
                                  </div>
                              ) : msg.type === 'redPacket' ? (
                                  <div 
                                    onClick={() => !isMultiSelectMode && setDetailModalMsg(msg)}
                                    onMouseDown={() => handleMessagePressStart(msg.id)}
                                    onMouseUp={handleMessagePressEnd}
                                    onMouseLeave={handleMessagePressEnd}
                                    onTouchStart={() => handleMessagePressStart(msg.id)}
                                    onTouchEnd={handleMessagePressEnd}
                                    className={`w-60 rounded-xl shadow-xl overflow-hidden text-white flex flex-col p-4 gap-4 cursor-pointer active:brightness-90 transition-all border ${msg.status === 'claimed' ? 'bg-stone-300 border-stone-200 text-stone-500' : 'bg-stone-800 border-stone-700 text-white'}`}
                                  >
                                      <div className="flex items-start gap-3">
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner border ${msg.status === 'claimed' ? 'bg-stone-200 border-stone-100' : 'bg-stone-700 border-stone-600'}`}>
                                              <Gift size={28} className={msg.status === 'claimed' ? 'text-stone-400 opacity-60' : 'text-stone-300'} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <div className={`font-bold text-[15px] leading-tight mt-0.5 line-clamp-2 ${msg.status === 'claimed' ? 'opacity-60' : ''}`}>{msg.redPacketTitle || '恭喜发财，大吉大利'}</div>
                                              <div className={`text-[11px] font-medium mt-1 ${msg.status === 'claimed' ? 'text-stone-400' : 'text-stone-400'}`}>
                                                  {msg.status === 'claimed' ? '红包已领取' : '查看红包'}
                                              </div>
                                          </div>
                                      </div>
                                      <div className={`border-t pt-2 text-[10px] font-bold flex justify-between items-center ${msg.status === 'claimed' ? 'border-stone-200 text-stone-400' : 'border-white/5 text-stone-500'}`}>
                                          <span>QQ红包</span>
                                      </div>
                                  </div>
                              ) : msg.type === 'transfer' ? (
                                  <div 
                                    onClick={() => !isMultiSelectMode && setDetailModalMsg(msg)}
                                    onMouseDown={() => handleMessagePressStart(msg.id)}
                                    onMouseUp={handleMessagePressEnd}
                                    onMouseLeave={handleMessagePressEnd}
                                    onTouchStart={() => handleMessagePressStart(msg.id)}
                                    onTouchEnd={handleMessagePressEnd}
                                    className={`w-60 rounded-xl shadow-md overflow-hidden flex flex-col p-4 gap-4 cursor-pointer active:brightness-95 transition-all border ${msg.status === 'claimed' ? 'bg-stone-50 border-stone-100 text-stone-300' : 'bg-stone-100 border-stone-200 text-stone-800'}`}
                                  >
                                      <div className="flex items-start gap-3">
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border ${msg.status === 'claimed' ? 'bg-white border-stone-50' : 'bg-white border-stone-200'}`}>
                                              <Wallet size={28} className={msg.status === 'claimed' ? 'text-stone-200 opacity-60' : 'text-stone-500'} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <div className={`font-bold text-[15px] leading-tight mt-0.5 truncate ${msg.status === 'claimed' ? 'opacity-50' : ''}`}>¥{msg.transferAmount || '0.00'}</div>
                                              <div className="text-[11px] text-stone-400 font-medium mt-1 line-clamp-1">
                                                  {msg.status === 'claimed' ? '已收款' : (msg.transferRemark || '转账给您')}
                                              </div>
                                          </div>
                                      </div>
                                      <div className={`border-t pt-2 text-[10px] font-bold ${msg.status === 'claimed' ? 'border-stone-100 text-stone-200' : 'border-stone-200 text-stone-400'}`}>QQ转账</div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-end gap-1">
                                      <div 
                                        onClick={() => {
                                            if (isMultiSelectMode) return;
                                            setContextMenuMsgId(msg.id);
                                        }}
                                        className={`relative px-3 py-2 rounded-xl text-base shadow-sm cursor-pointer ${msg.isSelf ? 'bg-stone-800 text-white' : 'bg-white text-black'} ${msg.type.includes('CallLog') ? 'bg-stone-200/50 italic text-stone-500' : ''} ${msg.type === 'voice' ? 'min-w-[80px]' : ''}`}
                                      >
                                          {msg.type === 'voice' ? (
                                              <div className="flex items-center gap-2">
                                                  <Wifi size={16} className="rotate-90" />
                                                  <span>{msg.voiceDuration || Math.ceil(msg.text.length * 0.5)}"</span>
                                              </div>
                                          ) : msg.text}
                                      </div>
                                      {expandedVoiceIds.has(msg.id) && msg.type === 'voice' && (
                                          <div className={`px-3 py-1.5 rounded-lg text-xs shadow-sm bg-white/80 backdrop-blur-sm border border-stone-100 text-stone-500 animate-in slide-in-from-top-1 duration-200`}>
                                              {msg.text}
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>

              {/* Context Menu Overlay */}
              {contextMenuMsgId && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-[2px]" onClick={() => setContextMenuMsgId(null)}>
                      <div className="bg-white rounded-2xl shadow-2xl w-48 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                          {history.find(m => m.id === contextMenuMsgId)?.type === 'text' && (
                              <button onClick={() => { setEditingMsgContent(history.find(m => m.id === contextMenuMsgId)?.text || ''); setIsMessageEditModalOpen(true); }} className="w-full px-4 py-3.5 text-left text-sm font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-3 border-b border-stone-50">
                                  <Edit3 size={18} className="text-stone-400" /> 编辑内容
                              </button>
                          )}
                          {history.find(m => m.id === contextMenuMsgId)?.type === 'voice' && (
                              <button 
                                onClick={() => {
                                    setExpandedVoiceIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(contextMenuMsgId)) next.delete(contextMenuMsgId);
                                        else next.add(contextMenuMsgId);
                                        return next;
                                    });
                                    setContextMenuMsgId(null);
                                }} 
                                className="w-full px-4 py-3.5 text-left text-sm font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-3 border-b border-stone-50"
                              >
                                  <MessageSquare size={18} className="text-stone-400" /> 转文字
                              </button>
                          )}
                          <button onClick={() => { setIsMultiSelectMode(true); setSelectedMsgIds(new Set([contextMenuMsgId])); setContextMenuMsgId(null); }} className="w-full px-4 py-3.5 text-left text-sm font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-3 border-b border-stone-50">
                              <CheckSquare size={18} className="text-stone-400" /> 批量多选
                          </button>
                          <button onClick={() => handleDeleteMessage(contextMenuMsgId)} className="w-full px-4 py-3.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3">
                              <Trash2 size={18} className="text-red-300" /> 彻底删除
                          </button>
                      </div>
                  </div>
              )}

              {/* Red Packet / Transfer Detail Modal */}
              {detailModalMsg && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setDetailModalMsg(null)}>
                      <div className="bg-[#fdfdfd] rounded-[2.5rem] w-full max-w-xs shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                          <div className={`h-40 flex flex-col items-center justify-center relative ${detailModalMsg.type === 'redPacket' ? (detailModalMsg.status === 'claimed' ? 'bg-stone-400 text-stone-100' : 'bg-stone-800 text-stone-100') : (detailModalMsg.status === 'claimed' ? 'bg-stone-50 text-stone-400' : 'bg-stone-100 text-stone-800')}`}>
                              <button onClick={() => setDetailModalMsg(null)} className="absolute top-6 left-6 opacity-40 hover:opacity-100"><X size={20} /></button>
                              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-lg ${detailModalMsg.type === 'redPacket' ? 'bg-stone-700 border border-stone-600' : 'bg-white border border-stone-200'}`}>
                                  {detailModalMsg.type === 'redPacket' ? <Gift size={32} className="text-stone-200" /> : <Wallet size={32} className="text-stone-500" />}
                              </div>
                              <span className="text-xs font-bold opacity-60 tracking-widest uppercase">
                                  {detailModalMsg.type === 'redPacket' ? (detailModalMsg.status === 'claimed' ? 'Red Packet Claimed' : 'Red Packet Received') : (detailModalMsg.status === 'claimed' ? 'Transfer Confirmed' : 'Transfer Received')}
                              </span>
                          </div>

                          <div className="p-10 flex flex-col items-center text-center">
                              <div className="flex items-baseline gap-1 mb-2">
                                  <span className="text-2xl font-bold text-stone-400">¥</span>
                                  <span className={`text-5xl font-black tracking-tight ${detailModalMsg.status === 'claimed' ? 'text-stone-400' : 'text-stone-800'}`}>
                                      {detailModalMsg.type === 'redPacket' ? detailModalMsg.redPacketAmount : detailModalMsg.transferAmount}
                                  </span>
                              </div>
                              <p className="text-sm font-bold text-stone-400 mt-2 px-4 leading-relaxed">
                                  {detailModalMsg.type === 'redPacket' ? detailModalMsg.redPacketTitle : detailModalMsg.transferRemark}
                              </p>
                              
                              <div className="mt-12 w-full pt-8 border-t border-stone-100 flex flex-col items-center gap-6">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-stone-300 uppercase tracking-widest">
                                      <ShieldCheck size={14} />
                                      Securely Processed by QQ
                                  </div>
                                  <button 
                                    onClick={() => setDetailModalMsg(null)}
                                    className="w-full bg-stone-800 text-white py-4 rounded-3xl font-black text-sm shadow-xl shadow-stone-200 active:scale-[0.98] transition-transform"
                                  >
                                      DONE
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Input Bar or Multi-select Toolbar */}
              {isMultiSelectMode ? (
                  <div className="bg-white border-t border-stone-200 p-4 flex items-center justify-between z-30 animate-in slide-in-from-bottom duration-200">
                      <div className="text-sm font-bold text-stone-400">已选择 {selectedMsgIds.size} 条记录</div>
                      <div className="flex gap-3">
                          <button onClick={() => { setIsMultiSelectMode(false); setSelectedMsgIds(new Set()); }} className="px-5 py-2 text-sm font-bold text-stone-600 bg-stone-100 rounded-lg">取消</button>
                          <button onClick={handleDeleteSelected} disabled={selectedMsgIds.size === 0} className="px-5 py-2 text-sm font-bold text-white bg-red-500 rounded-lg disabled:opacity-50">删除</button>
                      </div>
                  </div>
              ) : (
                  <div className="bg-[#f7f7f7] border-t border-stone-200 p-2 flex items-end gap-2 z-30">
                      <button className="p-2 text-stone-600 active:scale-90" onClick={() => setVoiceModalOpen(true)}><Mic size={24} /></button>
                      <textarea 
                          value={inputMessage} 
                          onChange={e => setInputMessage(e.target.value)} 
                          onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (inputMessage.trim()) {
                                      handleSendMessage({ id: generateId(), type: 'text', text: inputMessage, isSelf: true, timestamp: Date.now() }, false);
                                      setInputMessage('');
                                  }
                              }
                          }}
                          className="flex-1 bg-white rounded-lg p-2 outline-none resize-none max-h-24 font-medium" 
                          rows={1} 
                          placeholder="发消息..." 
                      />
                      <button className="p-2 text-stone-600 active:scale-90" onClick={() => setStickerModalOpen(true)}><Smile size={24} /></button>
                      {inputMessage.trim() ? (
                          <button onClick={() => { handleSendMessage({ id: generateId(), type: 'text', text: inputMessage, isSelf: true, timestamp: Date.now() }, true); setInputMessage(''); }} className="bg-stone-800 text-white px-4 py-2 rounded-lg font-bold active:scale-95">发送</button>
                      ) : (
                          <button onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)} className="p-2 text-stone-600 active:scale-90"><PlusCircle size={24} /></button>
                      )}
                  </div>
              )}

              {isPlusMenuOpen && !isMultiSelectMode && (
                  <div className="h-64 bg-[#f7f7f7] border-t border-stone-200 p-6 grid grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-200 overflow-y-auto no-scrollbar">
                      <ChatMenuButton icon={<ImageIcon size={24} />} label="相册" onClick={() => setAlbumModalOpen(true)} />
                      <ChatMenuButton icon={<Camera size={24} />} label="拍摄" onClick={() => setCameraModalOpen(true)} />
                      <ChatMenuButton icon={<Video size={24} />} label="视频通话" onClick={() => setCurrentView('video_call')} />
                      <ChatMenuButton icon={<Phone size={24} />} label="语音通话" onClick={() => setCurrentView('voice_call')} />
                      <ChatMenuButton icon={<Gift size={24} />} label="红包" onClick={() => { setRpTitleInput('恭喜发财，大吉大利'); setRpAmountInput(''); setRedPacketModalOpen(true); }} />
                      <ChatMenuButton icon={<Wallet size={24} />} label="转账" onClick={() => { setTfAmountInput(''); setTfRemarkInput(''); setTransferModalOpen(true); }} />
                      <ChatMenuButton icon={<FileText size={24} />} label="线下" />
                      <ChatMenuButton icon={<RotateCcw size={24} />} label="重回" onClick={handleRegenerate} />
                  </div>
              )}

              {/* Edit Message Modal */}
              {isMessageEditModalOpen && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setIsMessageEditModalOpen(false)}>
                      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl relative animate-in zoom-in duration-200 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setIsMessageEditModalOpen(false)} className="absolute top-4 right-4 text-stone-400"><X size={20} /></button>
                          <h3 className="text-lg font-bold text-stone-700 text-center">编辑消息</h3>
                          <textarea 
                            value={editingMsgContent}
                            onChange={e => setEditingMsgContent(e.target.value)}
                            className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl h-40 text-sm outline-none resize-none focus:border-stone-400 transition-colors"
                            autoFocus
                          />
                          <button 
                            onClick={handleUpdateMessageContent}
                            className="w-full bg-stone-800 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-95"
                          >
                              保存并更新
                          </button>
                      </div>
                  </div>
              )}

              <ImageUpdateModal 
                isOpen={albumModalOpen} 
                onClose={() => setAlbumModalOpen(false)} 
                onSave={url => handleSendMessage({ id: generateId(), type: 'image', imageUrl: url, text: '[图片]', isSelf: true, timestamp: Date.now() }, false)} 
                hideSimulate={true}
              />

              {cameraModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setCameraModalOpen(false)}>
                      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl relative animate-in zoom-in duration-200 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setCameraModalOpen(false)} className="absolute top-4 right-4 text-stone-400"><X size={20} /></button>
                          <h3 className="text-lg font-bold text-stone-700 text-center flex items-center justify-center gap-2"><Camera size={20}/> 拍摄照片</h3>
                          <div className="w-full aspect-square bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-center shadow-inner relative overflow-hidden">
                              {disguisedPhotoText ? (
                                  <div className="p-6 text-center text-sm font-bold text-stone-400 bg-white shadow-sm rounded-lg border border-stone-100 animate-in fade-in zoom-in">
                                      {disguisedPhotoText}
                                  </div>
                              ) : (
                                  <Camera size={60} className="text-stone-100" />
                              )}
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">模拟拍摄内容</label>
                             <textarea 
                                value={disguisedPhotoText}
                                onChange={e => setDisguisedPhotoText(e.target.value)}
                                className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl h-24 text-xs resize-none outline-none focus:border-stone-400 transition-colors"
                                placeholder="输入照片呈现的文字内容..."
                                autoFocus
                             />
                          </div>
                          <button 
                            disabled={!disguisedPhotoText.trim()}
                            onClick={() => {
                                handleSendMessage({ id: generateId(), type: 'simulated_image', simulated_text: disguisedPhotoText, text: '[拍摄照片]', isSelf: true, timestamp: Date.now() }, false);
                                setDisguisedPhotoText('');
                                setCameraModalOpen(false);
                            }}
                            className="w-full bg-stone-800 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-stone-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              <Send size={18} /> 发送模拟照片
                          </button>
                      </div>
                  </div>
              )}

              {voiceModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setVoiceModalOpen(false)}>
                      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl relative animate-in zoom-in duration-200 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setVoiceModalOpen(false)} className="absolute top-4 right-4 text-stone-400"><X size={20} /></button>
                          <h3 className="text-lg font-bold text-stone-700 text-center flex items-center justify-center gap-2"><Mic size={20}/> 语音输入</h3>
                          <div className="w-full h-32 bg-stone-50 rounded-2xl border border-stone-100 p-4 flex flex-col gap-2">
                             <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">输入语音转换的文字</label>
                             <textarea 
                                value={voiceInputText}
                                onChange={e => setVoiceInputText(e.target.value)}
                                className="w-full flex-1 bg-transparent text-sm resize-none outline-none text-stone-800"
                                placeholder="说点什么..."
                                autoFocus
                             />
                          </div>
                          <button 
                            disabled={!voiceInputText.trim()}
                            onClick={() => {
                                handleSendMessage({ 
                                    id: generateId(), 
                                    type: 'voice', 
                                    text: voiceInputText, 
                                    voiceDuration: Math.ceil(voiceInputText.length * 0.5), 
                                    isSelf: true, 
                                    timestamp: Date.now() 
                                }, false);
                                setVoiceInputText('');
                                setVoiceModalOpen(false);
                            }}
                            className="w-full bg-stone-800 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              <Send size={18} /> 发送语音
                          </button>
                      </div>
                  </div>
              )}

              {redPacketModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setRedPacketModalOpen(false)}>
                      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl relative animate-in zoom-in duration-200 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setRedPacketModalOpen(false)} className="absolute top-4 right-4 text-stone-400"><X size={20} /></button>
                          <h3 className="text-lg font-bold text-stone-700 text-center">发送红包</h3>
                          <div className="space-y-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">红包标题</label>
                                  <input 
                                    value={rpTitleInput}
                                    onChange={e => setRpTitleInput(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-stone-200 outline-none" 
                                    placeholder="恭喜发财，大吉大利" 
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">金额 (¥)</label>
                                  <input 
                                    value={rpAmountInput}
                                    onChange={e => setRpAmountInput(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-stone-200 outline-none" 
                                    placeholder="0.00" 
                                    type="number" 
                                  />
                              </div>
                          </div>
                          <button 
                            disabled={!rpAmountInput}
                            onClick={() => {
                                handleSendMessage({ id: generateId(), type: 'redPacket', redPacketTitle: rpTitleInput, redPacketAmount: rpAmountInput, text: '[红包]', isSelf: true, timestamp: Date.now(), status: 'unclaimed' }, false);
                                setRedPacketModalOpen(false);
                            }} 
                            className="w-full bg-red-500 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-95 disabled:opacity-50"
                          >
                              发红包
                          </button>
                      </div>
                  </div>
              )}

              {transferModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setTransferModalOpen(false)}>
                      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl relative animate-in zoom-in duration-200 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setTransferModalOpen(false)} className="absolute top-4 right-4 text-stone-400"><X size={20} /></button>
                          <h3 className="text-lg font-bold text-stone-700 text-center">发起转账</h3>
                          <div className="space-y-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">转账金额 (¥)</label>
                                  <input 
                                    value={tfAmountInput}
                                    onChange={e => setTfAmountInput(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-stone-200 outline-none" 
                                    placeholder="0.00" 
                                    type="number" 
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">备注信息</label>
                                  <input 
                                    value={tfRemarkInput}
                                    onChange={e => setTfRemarkInput(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-stone-200 outline-none" 
                                    placeholder="转账给您" 
                                  />
                              </div>
                          </div>
                          <button 
                            disabled={!tfAmountInput}
                            onClick={() => {
                                handleSendMessage({ id: generateId(), type: 'transfer', transferAmount: tfAmountInput, transferRemark: tfRemarkInput || '转账给您', text: '[转账]', isSelf: true, timestamp: Date.now(), status: 'unclaimed' }, false);
                                setTransferModalOpen(false);
                            }} 
                            className="w-full bg-orange-500 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-95 disabled:opacity-50"
                          >
                              确认转账
                          </button>
                      </div>
                  </div>
              )}

              {stickerModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setStickerModalOpen(false)}>
                      <div className="bg-white rounded-t-3xl w-full max-w-md h-[50vh] p-6 shadow-2xl relative animate-in slide-in-from-bottom duration-300 overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-bold text-stone-700">表情包</h3>
                              <button onClick={() => setStickerModalOpen(false)}><X size={24} className="text-stone-400" /></button>
                          </div>
                          {stickers.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full opacity-30 text-stone-400 gap-2">
                                  <Smile size={60} />
                                  <p className="font-bold">暂无表情包</p>
                              </div>
                          ) : (
                              <div className="grid grid-cols-4 gap-4">
                                  {stickers.map(s => (
                                      <div key={s.id} onClick={() => {
                                          handleSendMessage({ id: generateId(), type: 'sticker', stickerUrl: s.url, stickerName: s.name, text: '[表情]', isSelf: true, timestamp: Date.now() }, false);
                                          setStickerModalOpen(false);
                                      }} className="aspect-square bg-stone-50 rounded-lg overflow-hidden cursor-pointer active:scale-95">
                                          <img src={s.url} className="w-full h-full object-contain" />
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // 4. CHAT SETTINGS (NEW IMAGE STYLE)
  if (currentView === 'chat_settings' && activeChatContact) {
      return (
          <div className="absolute inset-0 z-50 bg-[#FDFDFD] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden font-sans">
              <StatusBar className="bg-white" {...statusBarProps} />
              
              {/* Header */}
              <div className="h-14 px-4 flex items-center justify-between border-b border-stone-50 bg-white sticky top-0 z-20">
                  <button onClick={() => setCurrentView('chat')} className="p-2 -ml-2 text-stone-400 hover:bg-stone-50 rounded-full transition-colors">
                      <ArrowLeft size={24} />
                  </button>
                  <span className="font-bold text-lg text-stone-800">聊天设置</span>
                  <div className="w-9"></div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-8 pb-32 space-y-10">
                  
                  {/* Top Profile Section */}
                  <div className="flex items-start gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-stone-100 shadow-sm shrink-0">
                          <img src={activeChatContact.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-6 pt-1">
                          <div className="space-y-1">
                              <label className="text-sm font-bold text-stone-800">QQ名/真名</label>
                              <input 
                                value={activeChatContact.name} 
                                onChange={e => {
                                    const updated = contacts.map(c => c.id === activeChatContact.id ? { ...c, name: e.target.value } : c);
                                    onUpdateContacts(updated);
                                    setActiveChatContact({ ...activeChatContact, name: e.target.value });
                                }}
                                className="w-full bg-transparent text-stone-400 font-medium outline-none text-base"
                                placeholder="测试"
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-sm font-bold text-stone-800">备注</label>
                              <input 
                                value={activeChatContact.remark || ''} 
                                onChange={e => {
                                    const updated = contacts.map(c => c.id === activeChatContact.id ? { ...c, remark: e.target.value } : c);
                                    onUpdateContacts(updated);
                                    setActiveChatContact({ ...activeChatContact, remark: e.target.value });
                                }}
                                className="w-full bg-transparent text-stone-400 font-medium outline-none text-base"
                                placeholder="点击设置备注"
                              />
                          </div>
                          <div className="space-y-1 group cursor-pointer" onClick={() => setIsChatBgModalOpen(true)}>
                              <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                      <label className="text-sm font-bold text-stone-800">聊天背景</label>
                                      <p className="text-stone-300 font-medium text-base">点击更换</p>
                                  </div>
                                  <div className="w-10 h-10 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-center text-stone-200">
                                      {activeChatContact.chatBackground ? <img src={activeChatContact.chatBackground} className="w-full h-full object-cover rounded-lg" /> : <ImageIcon size={20} />}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* MinMax Section */}
                  <div className="space-y-4 pt-4">
                      <h2 className="text-lg font-bold text-stone-800">minmax设置</h2>
                      <div className="bg-[#F8F9FA] rounded-2xl p-6 space-y-6">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Voice ID</label>
                              <input 
                                className="w-full bg-white border border-stone-100 rounded-xl p-4 text-sm font-medium text-stone-800 outline-none focus:ring-1 focus:ring-stone-200 transition-all shadow-sm"
                                value={activeChatContact.voiceId || ''} 
                                onChange={e => {
                                    const updated = contacts.map(c => c.id === activeChatContact.id ? { ...c, voiceId: e.target.value } : c);
                                    onUpdateContacts(updated);
                                    setActiveChatContact({ ...activeChatContact, voiceId: e.target.value });
                                }}
                                placeholder="输入 Voice ID"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">语音试听</label>
                              <div className="flex gap-3">
                                  <textarea 
                                    className="flex-1 bg-white border border-stone-100 rounded-xl p-4 text-sm font-medium text-stone-800 outline-none h-20 resize-none shadow-sm"
                                    value={auditionText}
                                    onChange={e => setAuditionText(e.target.value)}
                                  />
                                  <button className="w-14 h-14 bg-[#8C8C8C] rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform shrink-0 mt-3 shadow-md">
                                      <Play size={24} fill="currentColor" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-4 pt-4">
                      <button 
                        onClick={() => {
                            const data = JSON.stringify({ name: activeChatContact.name, persona: activeChatContact.persona, voiceId: activeChatContact.voiceId }, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${activeChatContact.name}-persona.json`;
                            a.click();
                        }}
                        className="w-full bg-[#F8F9FA] p-5 rounded-2xl flex items-center justify-between group active:scale-[0.99] transition-transform"
                      >
                          <span className="text-sm font-bold text-stone-800">导出人设设置</span>
                          <DownloadCloud size={20} className="text-stone-300 group-hover:text-stone-500 transition-colors" />
                      </button>

                      <button 
                        onClick={() => setIsClearHistoryConfirmOpen(true)}
                        className="w-full bg-[#F8F9FA] p-5 rounded-2xl flex items-center justify-between group active:scale-[0.99] transition-transform"
                      >
                          <span className="text-sm font-bold text-red-400">清空聊天记录</span>
                          <Trash2 size={20} className="text-stone-200 group-hover:text-red-300 transition-colors" />
                      </button>
                  </div>

              </div>

              {/* Floating Save Button */}
              <button 
                onClick={() => setCurrentView('chat')}
                className="absolute bottom-8 right-6 bg-black text-white px-6 py-4 rounded-full flex items-center gap-3 shadow-2xl shadow-stone-300 active:scale-95 transition-transform"
              >
                  <Save size={20} />
                  <span className="font-bold">保存</span>
              </button>

              {/* Custom History Clear Confirmation Modal */}
              {isClearHistoryConfirmOpen && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setIsClearHistoryConfirmOpen(false)}>
                      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl relative animate-in zoom-in duration-200 flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
                          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                              <AlertTriangle size={32} />
                          </div>
                          <div className="text-center space-y-2">
                              <h3 className="text-lg font-bold text-stone-800">确认清空记录？</h3>
                              <p className="text-xs text-stone-400 px-2 font-medium">该操作无法撤销，所有与此好友的对话、图片、文件记录都将被删除。</p>
                          </div>
                          <div className="w-full flex gap-3 mt-2">
                              <button 
                                onClick={() => setIsClearHistoryConfirmOpen(false)}
                                className="flex-1 bg-stone-100 text-stone-600 py-3 rounded-2xl font-bold active:scale-95 transition-transform text-sm"
                              >
                                  取消
                              </button>
                              <button 
                                onClick={() => {
                                    onUpdateChatHistory(prev => ({ ...prev, [activeChatContact.id]: [] }));
                                    setIsClearHistoryConfirmOpen(false);
                                }}
                                className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-bold active:scale-95 transition-transform text-sm"
                              >
                                  确认清空
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              <ImageUpdateModal 
                isOpen={isChatBgModalOpen} 
                onClose={() => setIsChatBgModalOpen(false)} 
                hideSimulate={true}
                onSave={url => {
                    const updated = contacts.map(c => c.id === activeChatContact.id ? { ...c, chatBackground: url } : c);
                    onUpdateContacts(updated);
                    setActiveChatContact({ ...activeChatContact, chatBackground: url });
                }} 
              />
          </div>
      );
  }

  // 5. ADD CONTACT
  if (currentView === 'add_contact') {
      return (
          <div className="absolute inset-0 z-50 bg-stone-100 flex flex-col animate-in slide-in-from-right duration-300 font-sans overflow-hidden">
              <StatusBar className="bg-white border-b border-stone-200" {...statusBarProps} />
              <div className="h-14 px-4 flex items-center justify-between bg-white sticky top-0 z-20">
                  <button onClick={() => setCurrentView('main')} className="p-2 -ml-2 text-stone-600 active:scale-95 transition-transform"><ArrowLeft size={22} /></button>
                  <span className="font-bold text-lg text-stone-800">添加朋友</span>
                  <div className="w-9"></div>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
                  <div className="bg-white p-6 rounded-2xl space-y-6 shadow-sm border border-stone-200">
                      <div className="flex flex-col items-center gap-3">
                         <div onClick={() => setIsAvatarModalOpen(true)} className="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden relative cursor-pointer group">
                             {newContactAvatar ? <img src={newContactAvatar} className="w-full h-full object-cover" /> : <Camera size={32} className="text-stone-300" />}
                             <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-stone-600 text-[10px] font-bold tracking-widest uppercase">Change</div>
                         </div>
                      </div>
                      <div className="space-y-4">
                          <div className="border-b border-stone-100 pb-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Nickname</label><input value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="必填" className="w-full p-2 bg-transparent text-stone-800 font-bold outline-none placeholder:text-stone-300" /></div>
                          <div className="border-b border-stone-100 pb-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Remark</label><input value={newContactRemark} onChange={e => setNewContactRemark(e.target.value)} placeholder="可选" className="w-full p-2 bg-transparent text-stone-800 font-bold outline-none placeholder:text-stone-300" /></div>
                          <div><label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Persona Setting</label><textarea value={newContactPersona} onChange={e => setNewContactPersona(e.target.value)} placeholder="角色人设描述..." className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl mt-1 h-32 resize-none text-xs text-stone-600 outline-none focus:border-stone-400 transition-colors" /></div>
                      </div>
                  </div>
                  <button onClick={handleSaveContact} className="w-full bg-stone-800 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 hover:bg-black transition-all mb-4">保存并添加</button>
              </div>
              <ImageUpdateModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onSave={setNewContactAvatar} hideSimulate={true} />
          </div>
      );
  }

  // 6. MAIN TABS
  return (
    <div className="absolute inset-0 z-[200] pointer-events-auto bg-stone-50/90 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom duration-300 font-sans text-stone-800 overflow-hidden">
        <StatusBar className="bg-white/80" {...statusBarProps} />
        {activeTab !== 'me' && activeTab !== 'moments' && (
             <div className="h-14 px-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                 <div className="flex items-center gap-1">
                     <button onClick={onClose} className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-full active:scale-90"><ArrowLeft size={24} /></button>
                     {activeTab === 'messages' && <span className="font-bold text-lg ml-1">消息</span>}
                     {activeTab === 'contacts' && <span className="font-bold text-lg ml-1">联系人</span>}
                 </div>
                 <div className="flex gap-2">
                     {activeTab === 'contacts' && <button onClick={() => setCurrentView('add_contact')} className="p-2 text-stone-600 hover:bg-stone-100 rounded-full active:scale-90"><UserPlus size={24} /></button>}
                     <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-full transition-transform active:scale-90"><Plus size={24} /></button>
                 </div>
                 {isAddMenuOpen && (
                     <div className="absolute top-12 right-4 bg-white rounded-xl shadow-xl py-2 w-32 border border-stone-100 animate-in fade-in zoom-in-95 z-50 overflow-hidden">
                         <button onClick={() => { setIsAddMenuOpen(false); setCurrentView('add_contact'); }} className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm font-bold flex items-center gap-2"><UserPlus size={16} /> 添加好友</button>
                         <button className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm font-bold flex items-center gap-2"><MessageSquare size={16} /> 发起群聊</button>
                     </div>
                 )}
             </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar" onClick={() => setIsAddMenuOpen(false)}>
            {activeTab === 'messages' && (
                <div className="divide-y divide-stone-100">
                    <div className="px-4 py-2"><div className="bg-white/80 p-2 rounded-xl flex items-center gap-2 text-stone-400 border border-stone-100"><Search size={16} /> <span className="text-xs">搜索</span></div></div>
                    {contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-20 text-stone-400 gap-2 opacity-30"><MessageSquare size={60} /><p className="text-sm font-bold">暂无消息</p></div>
                    ) : (
                        contacts.map(contact => {
                            const lastMsg = chatHistory[contact.id]?.slice(-1)[0];
                            return (
                                <div key={contact.id} onClick={() => handleOpenChat(contact)} className="flex items-center gap-3 p-4 bg-white/40 active:bg-white transition-colors cursor-pointer">
                                    <img src={contact.avatar} className="w-12 h-12 rounded-full bg-stone-200 object-cover shadow-sm border border-white" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-base text-stone-800 truncate">{getDisplayName(contact)}</span>
                                            {lastMsg && <span className="text-[10px] text-stone-400">{formatClockTime(lastMsg.timestamp)}</span>}
                                        </div>
                                        <div className="text-xs text-stone-400 truncate">{lastMsg ? lastMsg.text : '暂无消息'}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'contacts' && (
                 <div className="flex flex-col h-full">
                     <div className="p-4 space-y-2">
                         <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-3 shadow-sm border border-white active:scale-95 transition-transform cursor-pointer" onClick={() => setCurrentView('add_contact')}>
                             <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shadow-inner"><UserPlus size={20} /></div>
                             <span className="font-bold text-sm">新朋友</span>
                         </div>
                     </div>
                     <div className="px-5 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">My Contacts</div>
                     <div className="flex-1 bg-white/40 divide-y divide-stone-50">
                         {contacts.map(contact => (
                             <div key={contact.id} onClick={() => handleOpenChat(contact)} className="flex items-center gap-3 p-4 active:bg-white transition-colors cursor-pointer">
                                 <img src={contact.avatar} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
                                 <span className="font-bold text-sm text-stone-700">{getDisplayName(contact)}</span>
                             </div>
                         ))}
                     </div>
                 </div>
            )}

            {activeTab === 'moments' && (
                <div className="min-h-full pb-24 bg-white">
                    <div className="relative h-64 bg-stone-200 group">
                        <img src={currentUser.momentsBackground || ""} className="w-full h-full object-cover" />
                        <div className="absolute bottom-[-20px] right-4 flex items-end gap-4">
                            <span className="text-white font-bold text-lg drop-shadow-md mb-8">{currentUser.name}</span>
                            <img src={currentUser.avatar} className="w-20 h-20 rounded-2xl border-4 border-white bg-stone-100 shadow-lg object-cover" />
                        </div>
                        <button onClick={onClose} className="absolute top-4 left-4 bg-black/20 backdrop-blur-md p-2 rounded-full text-white active:bg-black/40"><ArrowLeft size={20} /></button>
                        <button className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsMomentsBgModalOpen(true)}><ImageIcon size={20} /></button>
                    </div>
                    <div className="pt-16 px-5 space-y-10">
                        {moments.map(m => (
                            <div key={m.id} className="flex gap-3 animate-in fade-in duration-500 border-b border-stone-50 pb-8">
                                <img src={m.author.avatar} className="w-10 h-10 rounded-xl bg-stone-100 object-cover mt-1" />
                                <div className="flex-1">
                                    <span className="font-bold text-[#576b95] text-sm">{m.author.name}</span>
                                    <p className="text-stone-800 text-[15px] mt-1 leading-relaxed">{m.content}</p>
                                    <div className="flex justify-between items-center mt-3 relative">
                                        <span className="text-[10px] text-stone-300 font-bold uppercase tracking-tighter">{formatClockTime(m.timestamp)}</span>
                                        <button onClick={() => setActiveMomentMenuId(activeMomentMenuId === m.id ? null : m.id)} className="bg-stone-50 text-stone-400 p-1 rounded active:bg-stone-100"><MoreHorizontal size={14} /></button>
                                        {activeMomentMenuId === m.id && (
                                            <div className="absolute right-8 top-0 bg-stone-800 text-white rounded-lg flex items-center shadow-xl z-20 overflow-hidden">
                                                <button className="px-4 py-2 text-[10px] font-bold border-r border-stone-700 hover:bg-stone-700">赞</button>
                                                <button onClick={() => { setActiveMomentMenuId(null); setCommentingMomentId(m.id); }} className="px-4 py-2 text-[10px] font-bold hover:bg-stone-700">评论</button>
                                            </div>
                                        )}
                                    </div>
                                    {m.comments.length > 0 && (
                                        <div className="bg-stone-50 rounded-xl mt-3 p-3 text-xs space-y-1.5 shadow-inner">
                                            {m.comments.map(c => <div key={c.id} className="leading-tight"><span className="font-bold text-[#576b95]">{c.authorName}: </span><span className="text-stone-600">{c.content}</span></div>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'me' && (
                <div className="flex flex-col bg-stone-50 min-h-full">
                    <div className="p-8 pt-16 flex items-center gap-4 bg-white mb-3 shadow-sm active:bg-stone-50 transition-colors cursor-pointer" onClick={() => {}}>
                         <img src={currentUser.avatar} className="w-16 h-16 rounded-full border-4 border-stone-50 shadow-sm object-cover" />
                         <div className="flex-1"><h2 className="text-xl font-bold text-stone-800">{currentUser.name}</h2><p className="text-xs text-stone-400 mt-1">ID: {currentUser.account}</p></div>
                         <ChevronRight size={20} className="text-stone-200" />
                    </div>
                    <div className="space-y-px bg-stone-100">
                         <div className="bg-white p-4 flex items-center justify-between active:bg-stone-50"><div className="flex items-center gap-3"><Wallet size={20} className="text-blue-500" /><span className="text-sm font-bold text-stone-700">QQ钱包</span></div><ChevronRight size={16} className="text-stone-100" /></div>
                         <div className="bg-white p-4 flex items-center justify-between active:bg-stone-50" onClick={() => setCurrentView('settings')}><div className="flex items-center gap-3"><Settings size={20} className="text-stone-500" /><span className="text-sm font-bold text-stone-700">设置中心</span></div><ChevronRight size={16} className="text-stone-100" /></div>
                    </div>
                </div>
            )}
        </div>

        <div className="h-16 bg-white/90 backdrop-blur-md border-t border-stone-100 flex items-center justify-around pb-2 z-30 shrink-0">
            <TabButton active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} icon={<MessageCircle size={24} fill={activeTab === 'messages' ? "currentColor" : "none"} />} label="消息" />
            <TabButton active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} icon={<Users size={24} fill={activeTab === 'contacts' ? "currentColor" : "none"} />} label="联系人" />
            <TabButton active={activeTab === 'moments'} onClick={() => setActiveTab('moments')} icon={<Star size={24} fill={activeTab === 'moments' ? "currentColor" : "none"} />} label="动态" />
            <TabButton active={activeTab === 'me'} onClick={() => setActiveTab('me')} icon={<div className={`w-6 h-6 rounded-full overflow-hidden border ${activeTab === 'me' ? 'border-stone-800' : 'border-transparent'}`}><img src={currentUser.avatar} className="w-full h-full object-cover" /></div>} label="我" />
        </div>

        <ImageUpdateModal isOpen={isMomentsBgModalOpen} onClose={() => setIsMomentsBgModalOpen(false)} onSave={url => onUpdateCurrentUser({...currentUser, momentsBackground: url})} />
        <ImageUpdateModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onSave={setNewContactAvatar} hideSimulate={true} />
    </div>
  );
};