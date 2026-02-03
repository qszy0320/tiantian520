
import React from 'react';

export interface AppIconProps {
  label: string;
  icon?: React.ReactNode;
  image?: string;
  onClick?: () => void;
}

export interface WidgetProps {
  className?: string;
}

export interface ApiPreset {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
}

export interface MinMaxSettings {
  apiKey: string;
  groupId: string;
  voiceId: string;
  model: string;
}

export interface ProfileData {
  name: string;
  handle: string;
  quote: string;
  avatar: string;
}

export interface InstagramData {
  image: string;
  title: string;
  tag: string;
}

export interface BrowserData {
  image: string;
  address: string;
}

export interface SystemData {
  headerTag: string;
  headerLeft: string;
  headerRight: string;
  battery: string;
  tempLabel: string;
  tempValue: string;
  dateLabel: string;
  dateValue: string;
  chartTag: string;
  chartTitle: string;
  chartSub1: string;
  chartSub2: string;
  chartFooter: string;
  chartBottomLeft: string;
  memoTitle: string;
  memoContent: string;
  dashboardImage: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl?: string;
  lyrics?: string;
  addedAt: number;
}

export interface WorldBookEntry {
  id: string;
  name: string;
  content: string;
  tags: string[];
  scope: 'global' | 'local';
  characterName?: string;
  createdAt: number;
}

export interface Sticker {
  id: string;
  name: string;
  url: string;
}

export interface OfflineStyle {
  id: string;
  name: string;
  description: string;
}

export interface ForbiddenWordEntry {
  id: string;
  word: string;
  category: string;
}

export interface Contact {
  id: string;
  name: string; // Real Name
  remark?: string; // Remark/Alias
  avatar: string;
  persona: string;
  voiceId?: string;
  chatBackground?: string;
  
  // Time Sensing Settings
  timeSensingEnabled?: boolean;
  aiTimezone?: string;
  userTimezone?: string;

  // Offline Mode Settings
  offlineWordCount?: number;
  offlineStyleId?: string;
  customStyles?: OfflineStyle[];
  disabledStyleIds?: string[];
}

export interface UserProfile {
  id?: string; // Unique ID for profile switching
  name: string;
  avatar: string;
  account: string;
  signature: string;
  persona: string;
  momentsBackground?: string;
  globalChatBackground?: string; // New: Global Chat Background Setting
}

// --- Chat & Social Types (Moved from QQApp) ---

export interface Message {
    id: string;
    text: string;
    type: 'text' | 'voice' | 'redPacket' | 'sticker' | 'image' | 'transfer' | 'simulated_image' | 'videoCallLog' | 'voiceCallLog' | 'system';
    isSelf: boolean;
    timestamp: number;
    voiceDuration?: number;
    redPacketTitle?: string;
    redPacketAmount?: string;
    transferAmount?: string;
    transferRemark?: string;
    imageUrl?: string;
    stickerUrl?: string;
    stickerName?: string;
    status?: 'claimed' | 'rejected' | 'unclaimed';
    simulated_text?: string; // For disguised photos
}

export interface MomentComment {
    id: string;
    authorName: string;
    content: string;
    isSelf: boolean;
}

export interface Moment {
    id: string;
    author: UserProfile;
    content: string;
    images: string[];
    timestamp: number;
    location?: string; // Added location field
    likes: string[]; // List of names
    comments: MomentComment[];
    excludedIds: string[];
    mentionedIds: string[];
}

export interface AppBackupData {
  version: number;
  
  // Appearance
  wallpaper: string;
  customFont: string;
  iconOverrides: Record<string, string>;
  profileData: ProfileData; // Widget Profile
  instagramData: InstagramData;
  browserData: BrowserData;
  systemData: SystemData;

  // Settings
  apiPresets: ApiPreset[];
  activePresetId: string | null;
  minmaxSettings: MinMaxSettings;
  playlist: Song[];

  // Chat Data
  contacts: Contact[];
  worldBooks: WorldBookEntry[];
  stickers: Sticker[];
  forbiddenWords: ForbiddenWordEntry[];
  qqUserProfile: UserProfile; // QQ Identity
  savedQqProfiles?: UserProfile[]; // Saved Accounts for switching
  chatHistory: Record<string, Message[]>;
  voiceHistory: Record<string, Message[]>;
  videoHistory: Record<string, Message[]>;
  moments: Moment[];
}
