import React, { useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Repeat, Send, Home, Search, Bell, User, MoreHorizontal, PlusSquare, Image as ImageIcon } from 'lucide-react';
import { StatusBar } from './StatusBar';
import { Song } from '../types';

interface SocialAppProps {
  isOpen: boolean;
  onClose: () => void;
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

interface Post {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}

const DUMMY_POSTS: Post[] = [
  {
    id: '1',
    author: {
      name: '甜甜酱',
      handle: '@Tian',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Bear'
    },
    content: '今天的阳光真好 ✨ 去公园散步拍到了很可爱的云！☁️\n#日常 #生活碎片 #OOTD',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2067&auto=format&fit=crop',
    timestamp: '2m',
    stats: { likes: 124, comments: 12, shares: 5 }
  },
  {
    id: '2',
    author: {
      name: 'CoffeeLover',
      handle: '@barista_daily',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix'
    },
    content: 'Morning brew. Nothing beats the smell of fresh coffee on a Monday. ☕️',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop',
    timestamp: '1h',
    stats: { likes: 892, comments: 45, shares: 21 }
  },
  {
    id: '3',
    author: {
      name: 'TechInsider',
      handle: '@tech_news',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Gizmo'
    },
    content: 'Just got my hands on the new retro transparent aesthetics console. The design language is absolutely stunning. Thoughts? 🎮',
    timestamp: '3h',
    stats: { likes: 3421, comments: 512, shares: 890 }
  },
  {
    id: '4',
    author: {
      name: 'ArtGallery',
      handle: '@digital_art',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mimi'
    },
    content: 'WIP of my latest landscape study. Trying to capture the "Soft Home" vibe.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=2045&auto=format&fit=crop',
    timestamp: '5h',
    stats: { likes: 567, comments: 34, shares: 12 }
  }
];

export const SocialApp: React.FC<SocialAppProps> = ({ isOpen, onClose, statusBarProps }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'add' | 'activity' | 'profile'>('home');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleLike = (id: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const NavItem = ({ tab, icon }: { tab: typeof activeTab, icon: React.ReactNode }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`p-3 rounded-full transition-all duration-200 ${activeTab === tab ? 'text-stone-800 scale-110' : 'text-stone-400 hover:text-stone-600'}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="absolute inset-0 z-50 bg-[#fafaf9] flex flex-col animate-in slide-in-from-bottom duration-300 font-sans">
      <StatusBar className="bg-white/80 backdrop-blur-md" {...statusBarProps} />
      
      {/* Top Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-100">
        <button onClick={onClose} className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-full">
            <ArrowLeft size={22} />
        </button>
        <div className="flex flex-col items-center">
             {/* Logo / Title */}
             <span className="font-bold text-lg text-stone-800 tracking-tight">Social</span>
        </div>
        <div className="w-9"></div> {/* Spacer for alignment */}
      </div>

      {/* Main Feed Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {activeTab === 'home' && (
          <div className="flex flex-col divide-y divide-stone-100">
            {DUMMY_POSTS.map(post => (
              <div key={post.id} className="bg-white p-4 flex flex-col gap-3">
                {/* Post Header */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <img src={post.author.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-stone-100 border border-stone-100" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-800 text-sm">{post.author.name}</span>
                        <span className="text-stone-400 text-xs">{post.timestamp}</span>
                      </div>
                      <span className="text-stone-500 text-xs">{post.author.handle}</span>
                    </div>
                  </div>
                  <button className="text-stone-400 hover:bg-stone-50 p-1 rounded-full">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="pl-[52px]">
                   <p className="text-sm text-stone-800 whitespace-pre-wrap mb-3 leading-relaxed">
                     {post.content}
                   </p>
                   
                   {post.image && (
                     <div className="rounded-xl overflow-hidden border border-stone-100 mb-3">
                        <img src={post.image} alt="Post content" className="w-full h-auto max-h-80 object-cover" />
                     </div>
                   )}

                   {/* Actions */}
                   <div className="flex items-center justify-between pr-4 mt-2">
                      <button 
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors group ${likedPosts.has(post.id) ? 'text-rose-500' : 'text-stone-500 hover:text-rose-500'}`}
                      >
                         <Heart size={18} fill={likedPosts.has(post.id) ? "currentColor" : "none"} className={`transition-transform ${likedPosts.has(post.id) ? 'scale-110' : 'group-active:scale-90'}`} />
                         <span>{post.stats.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                      </button>

                      <button className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-blue-500 transition-colors group">
                         <MessageCircle size={18} className="group-active:scale-90 transition-transform" />
                         <span>{post.stats.comments}</span>
                      </button>

                      <button className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-green-500 transition-colors group">
                         <Repeat size={18} className="group-active:scale-90 transition-transform" />
                         <span>{post.stats.shares}</span>
                      </button>

                      <button className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors group">
                         <Send size={18} className="group-active:scale-90 transition-transform" />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder Views for other tabs */}
        {activeTab === 'search' && (
            <div className="p-4 flex flex-col items-center justify-center h-full text-stone-400 gap-4">
                <Search size={48} className="opacity-20" />
                <p>探索页面开发中...</p>
            </div>
        )}
        {activeTab === 'profile' && (
            <div className="bg-white min-h-full">
                <div className="h-32 bg-stone-200"></div>
                <div className="px-4 relative mb-4">
                    <div className="w-20 h-20 rounded-full border-4 border-white bg-stone-100 absolute -top-10 overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Bear" className="w-full h-full object-cover" />
                    </div>
                    <div className="pt-12 flex justify-end">
                        <button className="px-4 py-1.5 rounded-full border border-stone-300 text-xs font-bold text-stone-700">编辑资料</button>
                    </div>
                    <div className="mt-2">
                        <h2 className="text-xl font-bold text-stone-800">甜甜酱</h2>
                        <p className="text-sm text-stone-500">@Tian</p>
                        <p className="text-sm text-stone-700 mt-2">˚⋆ꔫ あなたの涙は私心の雨 .⁺⊹₊</p>
                    </div>
                    <div className="flex gap-4 mt-4 text-sm">
                        <span><strong className="text-stone-800">142</strong> <span className="text-stone-500">关注</span></span>
                        <span><strong className="text-stone-800">8.9k</strong> <span className="text-stone-500">粉丝</span></span>
                    </div>
                </div>
                <div className="border-t border-stone-100">
                    <div className="flex">
                        <div className="flex-1 p-3 text-center border-b-2 border-stone-800 font-bold text-sm text-stone-800">推文</div>
                        <div className="flex-1 p-3 text-center border-b border-stone-100 font-bold text-sm text-stone-400">回复</div>
                        <div className="flex-1 p-3 text-center border-b border-stone-100 font-bold text-sm text-stone-400">喜欢</div>
                    </div>
                    {/* Reuse post component or simplified view here */}
                    <div className="p-8 text-center text-stone-300 text-xs">
                        加载中...
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-100 px-6 py-2 pb-6 flex justify-between items-center z-50">
         <NavItem tab="home" icon={<Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />} />
         <NavItem tab="search" icon={<Search size={24} strokeWidth={activeTab === 'search' ? 2.5 : 2} />} />
         <button className="p-2 bg-stone-800 rounded-xl text-white shadow-lg active:scale-95 transition-transform">
             <PlusSquare size={24} />
         </button>
         <NavItem tab="activity" icon={<Bell size={24} strokeWidth={activeTab === 'activity' ? 2.5 : 2} />} />
         <NavItem tab="profile" icon={<User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />} />
      </div>
    </div>
  );
};