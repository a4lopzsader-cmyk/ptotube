import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Menu, Search, Video, Bell, User, Home, Compass, 
  PlaySquare, Clock, ThumbsUp, ThumbsDown, Share2, 
  MoreVertical, Send, LogOut, Upload, X, CheckCircle, 
  FileVideo, Image as ImageIcon, Play, Pause, Volume2, 
  VolumeX, Maximize, Minimize, Settings, SkipForward
} from 'lucide-react';

// --- Types ---

interface User {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  avatar: string;
  subscribers: string[];
  subscribedTo: string[];
  joinedAt: number;
}

interface VideoData {
  id: string;
  uploaderId: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  views: number;
  likes: string[];
  dislikes: string[];
  createdAt: number;
  tags: string[];
}

interface Comment {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  createdAt: number;
}

// --- IndexedDB Helper (For Persistent Video Storage) ---

const DB_NAME = 'ProTubeData';
const STORE_NAME = 'video_files';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveVideoFile = async (id: string, file: Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(file, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getVideoFile = async (id: string): Promise<Blob | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- Mock Data & Storage Helper ---

const STORAGE_KEYS = {
  USERS: 'protube_users',
  VIDEOS: 'protube_videos',
  COMMENTS: 'protube_comments',
  CURRENT_USER: 'protube_current_user_id',
};

const SAMPLE_VIDEOS: VideoData[] = [
  {
    id: 'v1',
    uploaderId: 'u1',
    title: 'Welcome to PROTUBE - The Future of Video',
    description: 'This is the very first video on Protube. Explore the features! We have a new custom player, sleek design, and smooth animations.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
    views: 12543,
    likes: [],
    dislikes: [],
    createdAt: Date.now() - 10000000,
    tags: ['intro', 'welcome']
  },
  {
    id: 'v2',
    uploaderId: 'u1',
    title: 'Amazing Nature 4K - Breath of the Wild',
    description: 'Relaxing nature scenes. Experience the beauty of the digital world with our new high-quality playback interface.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Elephants_Dream_poster_source.jpg',
    views: 8900,
    likes: [],
    dislikes: [],
    createdAt: Date.now() - 5000000,
    tags: ['nature', '4k']
  }
];

const SAMPLE_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: '297545710Aa',
    displayName: 'ProTube Official',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    subscribers: [],
    subscribedTo: [],
    joinedAt: Date.now()
  }
];

class DataManager {
  users: User[] = [];
  videos: VideoData[] = [];
  comments: Comment[] = [];

  constructor() {
    this.load();
    if (this.users.length === 0) {
      this.users = SAMPLE_USERS;
      this.videos = SAMPLE_VIDEOS;
      this.save();
    } else {
      // Force update admin password if it exists (for existing local storage)
      const admin = this.users.find(u => u.username === 'admin');
      if (admin) {
        admin.password = '297545710Aa';
        this.save();
      }
    }
  }

  load() {
    const u = localStorage.getItem(STORAGE_KEYS.USERS);
    const v = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    const c = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    this.users = u ? JSON.parse(u) : [];
    this.videos = v ? JSON.parse(v) : [];
    this.comments = c ? JSON.parse(c) : [];
  }

  save() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(this.videos));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(this.comments));
  }

  // User Actions
  register(username: string, displayName: string, password: string): User | null {
    if (this.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return null; // Username taken
    }
    const newUser: User = {
      id: 'u' + Date.now(),
      username,
      password,
      displayName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      subscribers: [],
      subscribedTo: [],
      joinedAt: Date.now()
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  login(username: string, password: string): User | undefined {
    return this.users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
  }

  getUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  // Video Actions
  addVideo(video: VideoData) {
    this.videos.unshift(video);
    this.save();
  }

  getVideo(id: string): VideoData | undefined {
    return this.videos.find(v => v.id === id);
  }

  addView(id: string) {
    const v = this.getVideo(id);
    if (v) {
      v.views++;
      this.save();
    }
  }

  toggleLike(videoId: string, userId: string, isLike: boolean) {
    const v = this.getVideo(videoId);
    if (!v) return;

    const likeIdx = v.likes.indexOf(userId);
    const dislikeIdx = v.dislikes.indexOf(userId);

    if (isLike) {
      if (likeIdx > -1) {
        v.likes.splice(likeIdx, 1);
      } else {
        v.likes.push(userId);
        if (dislikeIdx > -1) v.dislikes.splice(dislikeIdx, 1);
      }
    } else {
      if (dislikeIdx > -1) {
        v.dislikes.splice(dislikeIdx, 1);
      } else {
        v.dislikes.push(userId);
        if (likeIdx > -1) v.likes.splice(likeIdx, 1);
      }
    }
    this.save();
  }

  // Comment Actions
  addComment(comment: Comment) {
    this.comments.push(comment);
    this.save();
  }

  getComments(videoId: string) {
    return this.comments.filter(c => c.videoId === videoId).sort((a, b) => b.createdAt - a.createdAt);
  }

  // Subscription Actions
  toggleSubscribe(subscriberId: string, targetChannelId: string) {
    const subscriber = this.getUser(subscriberId);
    const channel = this.getUser(targetChannelId);
    if (!subscriber || !channel) return;

    const subIndex = subscriber.subscribedTo.indexOf(targetChannelId);
    if (subIndex > -1) {
      // Unsubscribe
      subscriber.subscribedTo.splice(subIndex, 1);
      const targetSubIndex = channel.subscribers.indexOf(subscriberId);
      if (targetSubIndex > -1) channel.subscribers.splice(targetSubIndex, 1);
    } else {
      // Subscribe
      subscriber.subscribedTo.push(targetChannelId);
      channel.subscribers.push(subscriberId);
    }
    this.save();
  }
}

const db = new DataManager();

// --- Utils ---

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// --- Verified Badge Component ---

const VerifiedBadge = ({ size = "w-3.5 h-3.5" }: { size?: string }) => (
  <CheckCircle className={`${size} text-black fill-blue-400 ml-1 inline-block flex-shrink-0`} strokeWidth={2.5} />
);

// --- Components ---

const Navbar = ({ 
  user, 
  onLoginClick, 
  onLogout, 
  onUploadClick, 
  onSearch, 
  onHome, 
  onMenuToggle
}: any) => {
  const [query, setQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0f0f0f]/95 backdrop-blur-md flex items-center justify-between px-4 z-50 border-b border-white/5 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div onClick={onHome} className="flex items-center gap-1.5 cursor-pointer group">
          <div className="bg-red-600 text-white p-1 rounded-lg shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
            <Video className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">PROTUBE</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
        <div className="flex w-full relative group">
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-gray-700/50 rounded-full px-5 py-2.5 pl-12 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white transition-all placeholder-gray-500 shadow-inner"
          />
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
          <button type="submit" className="absolute right-0 top-0 bottom-0 px-6 bg-[#2a2a2a] rounded-r-full border-l border-gray-700/50 hover:bg-[#333] transition-colors">
            <Search className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="md:hidden p-2 text-white">
          <Search className="w-6 h-6" />
        </button>
        
        {user ? (
          <>
            <button onClick={onUploadClick} className="hidden sm:flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-full text-gray-200 hover:text-white transition active:scale-95" title="Upload Video">
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium">Create</span>
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full text-gray-200 hidden sm:block transition relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0f0f0f]"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 rounded-full overflow-hidden ml-2 border-2 border-transparent hover:border-gray-500 transition focus:outline-none focus:border-blue-500"
              >
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-[#222] rounded-2xl shadow-2xl py-2 border border-white/5 animate-fade-in origin-top-right">
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                       <img src={user.avatar} className="w-10 h-10 rounded-full" />
                       <div className="overflow-hidden">
                          <p className="text-sm font-semibold truncate text-white flex items-center">
                            {user.displayName}
                            {user.username === 'admin' && <VerifiedBadge />}
                          </p>
                          <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                       </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">Manage your account</div>
                  </div>
                  <div className="py-2">
                    <button onClick={onLogout} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex items-center gap-3 text-gray-200">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center gap-2 border border-white/20 bg-white/5 text-blue-400 px-5 py-2 rounded-full hover:bg-blue-500/10 font-medium text-sm transition-all hover:border-blue-500/50"
          >
            <User className="w-5 h-5" />
            Sign in
          </button>
        )}
      </div>
      
      {/* Overlay to close menu */}
      {isProfileOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)}></div>}
    </nav>
  );
};

const Sidebar = ({ isOpen, activeView, setView }: any) => {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'shorts', icon: Compass, label: 'Shorts' },
    { id: 'subscriptions', icon: PlaySquare, label: 'Subscriptions' },
    { id: 'history', icon: Clock, label: 'History' },
  ];

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#0f0f0f] overflow-y-auto px-3 py-4 hidden lg:flex flex-col z-40 border-r border-white/5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`w-full flex items-center gap-5 px-4 py-3 rounded-xl mb-1 transition-all duration-200 group ${
            activeView === item.id 
              ? 'bg-white/10 font-semibold text-white' 
              : 'hover:bg-white/5 text-gray-300 hover:text-white'
          }`}
        >
          <item.icon className={`w-5 h-5 ${activeView === item.id ? 'fill-current' : 'group-hover:scale-110 transition-transform'}`} />
          <span className="text-sm tracking-wide">{item.label}</span>
        </button>
      ))}
      <div className="border-t border-white/10 my-4 mx-2" />
      <div className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        You
      </div>
       <button className="w-full flex items-center gap-5 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white mb-1 transition-all">
          <User className="w-5 h-5" />
          <span className="text-sm">Your Channel</span>
        </button>
    </aside>
  );
};

const VideoCard = ({ video, onClick }: { video: VideoData, onClick: () => void }) => {
  const uploader = db.getUser(video.uploaderId);
  return (
    <div className="flex flex-col gap-3 cursor-pointer group" onClick={onClick}>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 shadow-md">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 text-xs rounded-md font-medium text-white shadow-sm">
          {Math.floor(Math.random() * 10) + 1}:{Math.floor(Math.random() * 50 + 10)}
        </div>
      </div>
      <div className="flex gap-3 px-1">
        <div className="flex-shrink-0">
           <img src={uploader?.avatar} className="w-9 h-9 rounded-full bg-gray-700 object-cover ring-2 ring-transparent group-hover:ring-gray-600 transition-all" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
            {video.title}
          </h3>
          <div className="mt-1">
             <p className="text-gray-400 text-sm hover:text-white transition-colors flex items-center">
                {uploader?.displayName}
                {uploader?.username === 'admin' && <VerifiedBadge />}
             </p>
             <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                {formatViews(video.views)} views • {timeAgo(video.createdAt)}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Custom Video Player ---
const CustomPlayer = ({ video, onEnded, autoPlay }: { video: VideoData, onEnded?: () => void, autoPlay?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playSrc, setPlaySrc] = useState<string>('');
  
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const controlsTimeoutRef = useRef<number | null>(null);

  // Load video source (local blob or remote URL)
  useEffect(() => {
    let active = true;
    let objUrl: string | null = null;

    const loadSource = async () => {
      if (video.url.startsWith('local:')) {
         const videoId = video.url.split('local:')[1];
         try {
           const blob = await getVideoFile(videoId);
           if (blob && active) {
             objUrl = URL.createObjectURL(blob);
             setPlaySrc(objUrl);
           }
         } catch (e) {
           console.error("Failed to load local video", e);
         }
      } else {
         if (active) setPlaySrc(video.url);
      }
    };

    loadSource();

    return () => {
      active = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [video]);

  useEffect(() => {
    if (autoPlay && videoRef.current && playSrc) {
      videoRef.current.play().catch(() => {
        setPlaying(false);
      });
    }
  }, [playSrc, autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (autoPlay) setPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else setVolume(1);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playing) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group shadow-2xl ring-1 ring-white/10"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {playSrc ? (
        <video 
          ref={videoRef}
          src={playSrc}
          poster={video.thumbnail}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); onEnded && onEnded(); }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Big Center Play Button Animation */}
      {!playing && playSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all">
          <button onClick={togglePlay} className="w-20 h-20 bg-white/20 hover:bg-red-600 rounded-full flex items-center justify-center backdrop-blur-md transition-all transform hover:scale-110 group-hover:opacity-100">
             <Play className="w-10 h-10 fill-white text-white ml-1" />
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 ${showControls || !playing ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="relative group/slider w-full h-4 flex items-center cursor-pointer mb-2">
           <input 
             type="range" 
             min="0" 
             max={duration || 100} 
             value={currentTime} 
             onChange={handleSeek}
             className="video-range absolute z-20 w-full opacity-0 cursor-pointer h-full"
           />
           {/* Visual Track */}
           <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden relative">
             <div 
               className="h-full bg-red-600 relative" 
               style={{ width: `${(currentTime / duration) * 100}%` }}
             >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/slider:scale-100 transition-transform shadow-lg ring-2 ring-white/50"></div>
             </div>
           </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
              {playing ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6" />}
            </button>
            
            <button className="text-white hover:text-gray-300 hidden sm:block">
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-gray-300">
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300 ease-out flex items-center">
                 <input 
                   type="range" 
                   min="0" 
                   max="1" 
                   step="0.05" 
                   value={volume} 
                   onChange={handleVolumeChange}
                   className="w-20 h-1 bg-white/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                 />
              </div>
            </div>

            <div className="text-xs font-medium text-gray-200">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button className="text-white hover:text-gray-300 animate-spin-slow">
               <Settings className="w-5 h-5" />
             </button>
             <button onClick={toggleFullscreen} className="text-white hover:text-gray-300">
               {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </div>
      
      {/* Title Overlay (Top Gradient) */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
         <h2 className="text-white font-medium text-lg drop-shadow-md truncate pr-12">{video.title}</h2>
      </div>
    </div>
  );
};

const VideoPlayer = ({ videoId, currentUser, onNavigateChannel }: any) => {
  const [video, setVideo] = useState<VideoData | undefined>(db.getVideo(videoId));
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [related, setRelated] = useState<VideoData[]>([]);

  const refreshData = () => {
    const v = db.getVideo(videoId);
    setVideo(v);
    if (v) {
      setComments(db.getComments(videoId));
      const uploader = db.getUser(v.uploaderId);
      if (currentUser && uploader) {
        setIsSubscribed(currentUser.subscribedTo.includes(uploader.id));
      }
    }
  };

  useEffect(() => {
    refreshData();
    db.addView(videoId);
    setRelated(db.videos.filter(v => v.id !== videoId).slice(0, 10));
    window.scrollTo(0, 0);
  }, [videoId]);

  if (!video) return <div className="p-20 text-center text-gray-500 text-lg">Video not found.</div>;

  const uploader = db.getUser(video.uploaderId);
  const isLiked = currentUser && video.likes.includes(currentUser.id);
  const isDisliked = currentUser && video.dislikes.includes(currentUser.id);

  const handleLike = (like: boolean) => {
    if (!currentUser) return alert("Please sign in to like videos.");
    db.toggleLike(videoId, currentUser.id, like);
    refreshData();
  };

  const handleSubscribe = () => {
    if (!currentUser) return alert("Please sign in to subscribe.");
    db.toggleSubscribe(currentUser.id, video.uploaderId);
    refreshData();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Please sign in to comment.");
    if (!newComment.trim()) return;

    db.addComment({
      id: 'c' + Date.now(),
      videoId,
      userId: currentUser.id,
      text: newComment,
      createdAt: Date.now()
    });
    setNewComment('');
    refreshData();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-[1800px] mx-auto animate-fade-in">
      <div className="flex-1">
        
        {/* New Custom Player */}
        <CustomPlayer video={video} autoPlay={true} />

        <div className="mt-4">
           <h1 className="text-xl sm:text-2xl font-bold mb-2 line-clamp-2">{video.title}</h1>
           
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                 <div className="cursor-pointer relative group" onClick={() => onNavigateChannel(uploader?.id)}>
                    <img src={uploader?.avatar} className="w-12 h-12 rounded-full bg-gray-700 object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all" />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg cursor-pointer hover:text-gray-300 transition-colors flex items-center gap-1" onClick={() => onNavigateChannel(uploader?.id)}>
                      {uploader?.displayName}
                      {uploader?.username === 'admin' && <VerifiedBadge size="w-4 h-4" />}
                    </h3>
                    <p className="text-xs text-gray-400">{uploader?.subscribers.length} subscribers</p>
                 </div>
                 <button 
                   onClick={handleSubscribe}
                   className={`ml-4 px-5 py-2.5 rounded-full font-medium text-sm transition-all active:scale-95 ${
                     isSubscribed 
                       ? 'bg-white/10 text-white hover:bg-white/20' 
                       : 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/5'
                   }`}
                 >
                   {isSubscribed ? 'Subscribed' : 'Subscribe'}
                 </button>
              </div>

              <div className="flex items-center gap-2">
                 <div className="flex bg-[#272727] rounded-full overflow-hidden shadow-sm">
                    <button 
                      onClick={() => handleLike(true)}
                      className={`px-5 py-2.5 flex items-center gap-2 border-r border-white/5 hover:bg-white/10 transition-colors ${isLiked ? 'text-blue-400' : 'text-white'}`}
                    >
                       <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                       <span className="font-medium text-sm">{video.likes.length}</span>
                    </button>
                    <button 
                      onClick={() => handleLike(false)}
                      className={`px-4 py-2.5 hover:bg-white/10 transition-colors ${isDisliked ? 'text-white' : 'text-gray-300'}`}
                    >
                       <ThumbsDown className={`w-5 h-5 ${isDisliked ? 'fill-current' : ''}`} />
                    </button>
                 </div>
                 <button className="flex items-center gap-2 bg-[#272727] hover:bg-white/10 transition-colors px-4 py-2.5 rounded-full text-sm font-medium">
                    <Share2 className="w-5 h-5" /> Share
                 </button>
              </div>
           </div>

           <div className="mt-4 bg-[#272727] rounded-xl p-4 text-sm hover:bg-[#303030] transition-colors cursor-pointer ring-1 ring-white/5">
              <div className="font-semibold mb-2">
                 {formatViews(video.views)} views  •  {new Date(video.createdAt).toLocaleDateString()}
              </div>
              <p className="whitespace-pre-wrap text-gray-300">{video.description}</p>
           </div>
        </div>

        <div className="mt-8">
           <h3 className="text-xl font-bold mb-6">{comments.length} Comments</h3>
           
           {currentUser && (
             <form onSubmit={handleComment} className="flex gap-4 mb-8">
                <img src={currentUser.avatar} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                   <input 
                     type="text" 
                     value={newComment}
                     onChange={e => setNewComment(e.target.value)}
                     placeholder="Add a comment..." 
                     className="w-full bg-transparent border-b border-gray-700 pb-2 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500 text-white"
                   />
                   <div className="flex justify-end mt-3 gap-2">
                     <button type="button" onClick={() => setNewComment('')} className="px-4 py-2 rounded-full hover:bg-white/10 text-sm font-medium">Cancel</button>
                     <button 
                       type="submit" 
                       disabled={!newComment.trim()}
                       className="bg-blue-600 text-white font-medium px-5 py-2 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                     >
                       Comment
                     </button>
                   </div>
                </div>
             </form>
           )}

           <div className="flex flex-col gap-6">
              {comments.map(c => {
                 const cUser = db.getUser(c.userId);
                 return (
                   <div key={c.id} className="flex gap-4">
                      <img src={cUser?.avatar} className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm hover:underline cursor-pointer flex items-center gap-1">
                              {cUser?.displayName}
                              {cUser?.username === 'admin' && <VerifiedBadge />}
                            </span>
                            <span className="text-xs text-gray-500">@{cUser?.username} • {timeAgo(c.createdAt)}</span>
                         </div>
                         <p className="text-sm text-gray-200 leading-relaxed">{c.text}</p>
                         <div className="flex items-center gap-4 mt-2">
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white text-xs"><ThumbsUp className="w-3.5 h-3.5" /></button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white text-xs"><ThumbsDown className="w-3.5 h-3.5" /></button>
                            <button className="text-gray-400 hover:text-white text-xs font-medium">Reply</button>
                         </div>
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>
      </div>

      <div className="lg:w-[400px] flex flex-col gap-4">
         {related.map(r => (
           <div key={r.id} className="flex gap-3 cursor-pointer group rounded-lg p-2 hover:bg-white/5 transition-colors" onClick={() => window.location.href = `?v=${r.id}`}>
             <div className="relative w-44 aspect-video rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 shadow-sm">
                <img src={r.thumbnail} className="w-full h-full object-cover" />
                <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 text-[10px] rounded text-white font-medium">4:20</div>
             </div>
             <div className="flex flex-col gap-1 py-1">
               <h4 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">{r.title}</h4>
               <p className="text-xs text-gray-400 mt-1 flex items-center">
                 {db.getUser(r.uploaderId)?.displayName}
                 {db.getUser(r.uploaderId)?.username === 'admin' && <VerifiedBadge size="w-3 h-3" />}
               </p>
               <p className="text-xs text-gray-400">{formatViews(r.views)} views</p>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
};

const AuthModal = ({ onClose, onLoginSuccess }: any) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', displayName: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) return setError('Username required');
    if (!formData.password.trim()) return setError('Password required');

    if (isRegister) {
      if (!formData.displayName.trim()) return setError('Display name required');
      const user = db.register(formData.username, formData.displayName, formData.password);
      if (user) onLoginSuccess(user);
      else setError('Username already taken');
    } else {
      const user = db.login(formData.username, formData.password);
      if (user) onLoginSuccess(user);
      else setError('Invalid username or password');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[#1e1e1e] p-10 rounded-2xl w-full max-w-md relative shadow-2xl border border-white/10 transform transition-all">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-4 rounded-2xl mb-4 shadow-lg shadow-red-900/50">
             <Video className="w-10 h-10 text-white fill-current" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{isRegister ? 'Join ProTube' : 'Welcome Back'}</h2>
          <p className="text-gray-400 text-sm mt-2">{isRegister ? 'Create your channel today' : 'Sign in to continue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Username</label>
            <input 
              className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. video_master"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value.replace(/\s+/g, '').toLowerCase()})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <input 
              type="password"
              className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {isRegister && (
             <div className="space-y-1">
               <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Display Name</label>
               <input 
                 className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                 placeholder="e.g. The Master"
                 value={formData.displayName}
                 onChange={e => setFormData({...formData, displayName: e.target.value})}
               />
             </div>
          )}

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">{error}</div>}

          <button className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 mt-2 active:scale-[0.98] transform">
            {isRegister ? 'Create Channel' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center pt-4 border-t border-white/5">
           <span className="text-gray-400 text-sm">
             {isRegister ? 'Already have an account? ' : 'Don\'t have an account? '}
           </span>
           <button className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors" onClick={() => setIsRegister(!isRegister)}>
             {isRegister ? 'Sign in' : 'Create one'}
           </button>
        </div>
      </div>
    </div>
  );
};

const UploadModal = ({ onClose, currentUser, onSuccess }: any) => {
  const [data, setData] = useState({ title: '', description: '', url: '', thumbnail: '' });
  const [tab, setTab] = useState<'url' | 'file'>('file');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      // Don't set URL here for playback yet, we'll do it after save, or just show filename
      setData(prev => ({ ...prev, url: 'Will be generated after upload' }));
    }
  };

  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setData(prev => ({ ...prev, thumbnail: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title) return;
    if (tab === 'url' && !data.url) return;
    if (tab === 'file' && !videoFile) return;
    
    setIsUploading(true);

    try {
      const videoId = 'v' + Date.now();
      let videoUrl = data.url;

      if (tab === 'file' && videoFile) {
        // Save to IndexedDB
        await saveVideoFile(videoId, videoFile);
        videoUrl = 'local:' + videoId;
      }

      const thumb = data.thumbnail || 'https://via.placeholder.com/640x360.png?text=No+Thumbnail';
      
      db.addVideo({
        id: videoId,
        uploaderId: currentUser.id,
        title: data.title,
        description: data.description,
        url: videoUrl,
        thumbnail: thumb,
        views: 0,
        likes: [],
        dislikes: [],
        createdAt: Date.now(),
        tags: []
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-[#1e1e1e] p-0 rounded-2xl w-full max-w-2xl relative h-[85vh] flex flex-col shadow-2xl border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
           <h2 className="text-xl font-bold">Upload Video</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
           </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-xl w-fit">
             <button 
               onClick={() => setTab('file')}
               className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${tab === 'file' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
             >
               File Upload
             </button>
             <button 
               onClick={() => setTab('url')}
               className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${tab === 'url' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
             >
               External URL
             </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Video Title</label>
              <input 
                required
                className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="My awesome video"
                value={data.title}
                onChange={e => setData({...data, title: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Description</label>
              <textarea 
                className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[120px] transition-all"
                placeholder="Tell viewers about your video..."
                value={data.description}
                onChange={e => setData({...data, description: e.target.value})}
              />
            </div>

            {tab === 'file' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">Video Source</label>
                  <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer bg-black/20">
                    <input type="file" accept="video/*" onChange={handleVideoFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="bg-white/5 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                       <FileVideo className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{videoFile ? videoFile.name : "Select Video File"}</span>
                    <span className="text-xs text-gray-500 mt-1">MP4, WebM</span>
                  </div>
                </div>
                <div className="group">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">Thumbnail</label>
                   <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer bg-black/20">
                    <input type="file" accept="image/*" onChange={handleThumbFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="bg-white/5 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                       <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{thumbFile ? thumbFile.name : "Select Image"}</span>
                    <span className="text-xs text-gray-500 mt-1">JPG, PNG</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Video URL</label>
                   <input 
                     required={tab === 'url'}
                     className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                     placeholder="https://example.com/video.mp4"
                     value={data.url}
                     onChange={e => setData({...data, url: e.target.value})}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Thumbnail URL</label>
                   <input 
                     className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                     placeholder="https://example.com/image.jpg"
                     value={data.thumbnail}
                     onChange={e => setData({...data, thumbnail: e.target.value})}
                   />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
               <button type="button" onClick={onClose} disabled={isUploading} className="px-5 py-2 hover:bg-white/10 rounded-full font-medium transition-colors disabled:opacity-50">Cancel</button>
               <button type="submit" disabled={isUploading} className="bg-blue-600 text-white font-bold px-8 py-2 rounded-full hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 flex items-center gap-2">
                 {isUploading ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Uploading...
                   </>
                 ) : 'Upload'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ChannelPage = ({ userId, currentUser, setView }: any) => {
  const user = db.getUser(userId);
  const videos = useMemo(() => db.videos.filter(v => v.uploaderId === userId), [userId]);

  if (!user) return <div className="p-10 text-center">Channel not found</div>;

  const isMe = currentUser?.id === user.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10 border-b border-white/10 pb-10">
        <div className="relative group">
           <img src={user.avatar} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover ring-4 ring-gray-800 shadow-2xl" />
        </div>
        <div className="flex-1 text-center sm:text-left mt-2">
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center justify-center sm:justify-start gap-2">
            {user.displayName}
            {user.username === 'admin' && <VerifiedBadge size="w-8 h-8" />}
          </h1>
          <p className="text-gray-400 flex items-center justify-center sm:justify-start gap-2">
            <span className="font-medium text-gray-300">@{user.username}</span>
            <span>•</span>
            <span>{user.subscribers.length} subscribers</span>
            <span>•</span>
            <span>{videos.length} videos</span>
          </p>
          <div className="mt-6 flex justify-center sm:justify-start gap-3">
             {isMe ? (
               <button className="bg-white/10 text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-white/20 transition-all">Customize Channel</button>
             ) : (
               <button className="bg-white text-black px-8 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-all shadow-lg shadow-white/5">Subscribe</button>
             )}
             <button className="bg-white/5 text-white p-2.5 rounded-full hover:bg-white/10 transition-all"><Share2 className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Video className="w-5 h-5" /> Videos
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map(v => (
          <VideoCard key={v.id} video={v} onClick={() => setView('video', v.id)} />
        ))}
        {videos.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-[#1e1e1e] rounded-xl border border-dashed border-gray-700">
             <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
             <p>This channel has no videos yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [viewParams, setViewParams] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedId) {
      const u = db.getUser(savedId);
      if (u) setCurrentUser(u);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setCurrentView('home');
  };

  const handleNavigate = (view: string, params: any = null) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo(0, 0);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    handleNavigate('search', q);
  };

  const renderContent = () => {
    if (currentView === 'home') {
      const allVideos = db.videos;
      return (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {allVideos.map(v => (
            <VideoCard key={v.id} video={v} onClick={() => handleNavigate('video', v.id)} />
          ))}
        </div>
      );
    }
    
    if (currentView === 'search') {
      const lowerQuery = searchQuery.toLowerCase();
      
      const filteredVideos = db.videos.filter(v => 
        v.title.toLowerCase().includes(lowerQuery) || 
        v.tags.includes(lowerQuery)
      );

      const filteredUsers = db.users.filter(u => 
        u.displayName.toLowerCase().includes(lowerQuery) || 
        u.username.toLowerCase().includes(lowerQuery)
      );

      const hasResults = filteredVideos.length > 0 || filteredUsers.length > 0;

      return (
         <div className="p-6 max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in">
           {/* Channel Results */}
           {filteredUsers.length > 0 && (
             <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
                {filteredUsers.map(u => {
                  const userVideos = db.videos.filter(v => v.uploaderId === u.id);
                  const isMe = currentUser?.id === u.id;
                  const isSubscribed = currentUser?.subscribedTo.includes(u.id);
                  
                  return (
                    <div key={u.id} className="flex flex-col sm:flex-row items-center sm:items-start gap-6 cursor-pointer p-6 hover:bg-white/5 rounded-2xl transition-colors border border-transparent hover:border-white/5" onClick={() => handleNavigate('channel', u.id)}>
                       <img src={u.avatar} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-2 ring-gray-800" />
                       <div className="flex-1 text-center sm:text-left pt-2">
                          <h4 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            {u.displayName}
                            {u.username === 'admin' && <VerifiedBadge size="w-5 h-5" />}
                          </h4>
                          <p className="text-gray-400 text-sm mb-3">@{u.username} • {u.subscribers.length} subscribers • {userVideos.length} videos</p>
                          <p className="text-gray-500 text-sm line-clamp-2">Check out the latest videos from {u.displayName}.</p>
                       </div>
                       <div className="flex items-center">
                          {isMe ? null : (
                            <button className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${isSubscribed ? 'bg-white/10 text-white' : 'bg-white text-black hover:bg-gray-200'}`}>
                              {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                          )}
                       </div>
                    </div>
                  );
                })}
             </div>
           )}

           {/* Video Results */}
           <div className="flex flex-col gap-6">
             {filteredVideos.length > 0 && filteredUsers.length > 0 && <h3 className="text-lg font-semibold text-gray-300">Latest Videos</h3>}
             
             {filteredVideos.map(v => (
               <div key={v.id} className="flex flex-col sm:flex-row gap-5 cursor-pointer group" onClick={() => handleNavigate('video', v.id)}>
                 <div className="relative sm:w-80 aspect-video rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 shadow-lg">
                    <img src={v.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 </div>
                 <div className="py-2">
                   <h3 className="text-xl font-medium mb-1 group-hover:text-blue-400 transition-colors">{v.title}</h3>
                   <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                     {formatViews(v.views)} views • {timeAgo(v.createdAt)}
                   </p>
                   <div className="flex items-center gap-2 mb-3">
                      <img src={db.getUser(v.uploaderId)?.avatar} className="w-6 h-6 rounded-full" />
                      <span className="text-sm text-gray-400 hover:text-white transition-colors flex items-center">
                        {db.getUser(v.uploaderId)?.displayName}
                        {db.getUser(v.uploaderId)?.username === 'admin' && <VerifiedBadge />}
                      </span>
                   </div>
                   <p className="text-sm text-gray-400 line-clamp-2 pr-4">{v.description}</p>
                 </div>
               </div>
             ))}
           </div>

           {!hasResults && (
             <div className="text-center mt-20 text-gray-500 flex flex-col items-center">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p>No results found for "{searchQuery}"</p>
             </div>
           )}
         </div>
      );
    }

    if (currentView === 'video') {
      return (
        <VideoPlayer 
           videoId={viewParams} 
           currentUser={currentUser} 
           onNavigateChannel={(id: string) => handleNavigate('channel', id)}
        />
      );
    }

    if (currentView === 'channel') {
      return <ChannelPage userId={viewParams} currentUser={currentUser} setView={handleNavigate} />;
    }

    if (currentView === 'subscriptions') {
      if (!currentUser) return (
         <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-white/5 p-8 rounded-full mb-6">
              <User className="w-16 h-16 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Don't miss out</h2>
            <p className="text-gray-400 mb-6">Sign in to see updates from your favorite channels</p>
            <button onClick={() => setShowAuth(true)} className="border border-white/20 text-blue-400 px-6 py-2.5 rounded-full font-medium hover:bg-blue-500/10 transition-colors">
               Sign in
            </button>
         </div>
      );
      const subbedVideos = db.videos.filter(v => currentUser.subscribedTo.includes(v.uploaderId));
      return (
        <div className="p-8 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Subscriptions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {subbedVideos.map(v => (
              <VideoCard key={v.id} video={v} onClick={() => handleNavigate('video', v.id)} />
            ))}
            {subbedVideos.length === 0 && (
               <p className="col-span-full text-gray-500 text-center py-10">No videos from subscribed channels yet.</p>
            )}
          </div>
        </div>
      );
    }

    return <div>Not found</div>;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-blue-500/30">
      <Navbar 
        user={currentUser} 
        onLoginClick={() => setShowAuth(true)}
        onLogout={handleLogout}
        onUploadClick={() => setShowUpload(true)}
        onSearch={handleSearch}
        onHome={() => handleNavigate('home')}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex pt-16">
        <Sidebar 
          isOpen={isSidebarOpen} 
          activeView={currentView}
          setView={(v: string) => handleNavigate(v)}
        />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen && currentView !== 'video' ? 'lg:ml-64' : ''}`}>
          {renderContent()}
        </main>
      </div>

      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onLoginSuccess={handleLogin} 
        />
      )}

      {showUpload && (
        <UploadModal
          currentUser={currentUser}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            handleNavigate('home');
          }}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);