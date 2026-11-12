import radiantSmileImg from '../../asset/images/reasons/radiant-smile.jpeg';
import habitsVideo from '../../asset/images/reasons/habits.mp4';
import peaceVideo from '../../asset/images/reasons/peace.mp4';
import beautifulHeartImg from '../../asset/images/reasons/beautiful-heart.jpeg';
import laughVideo from '../../asset/images/reasons/laugh.mp4';
import simplyBeingYouVideo from '../../asset/images/reasons/simply-being-you.mp4';

export interface StageTheme {
  id: number;
  label: string;
  chapter: string;
  title: string;
  subtitle: string;
  emoji: string;
  /** CSS background for the stage */
  bg: string;
  /** Three accent colors for animated blobs & decorative shapes */
  blobs: [string, string, string];
  /** Chapter title-card colors */
  introBg: string;
  introText: string;
  stars?: boolean;
}

export const STAGE_THEMES: StageTheme[] = [
  {
    id: 0,
    label: 'Welcome',
    chapter: '01',
    title: 'The Grand Opening',
    subtitle: 'where it all begins',
    emoji: '🎂',
    bg: 'radial-gradient(120% 80% at 50% 0%, #6b1d4f 0%, #2a0a26 55%, #140512 100%)',
    blobs: ['#ff4f8b', '#ffb35c', '#b06cff'],
    introBg: '#ff4f8b',
    introText: '#2a0a26',
  },
  {
    id: 1,
    label: 'Secret Key',
    chapter: '02',
    title: 'For Doha’s Eyes Only',
    subtitle: 'enter the secret password',
    emoji: '🔐',
    bg: 'radial-gradient(125% 85% at 50% 0%, #891652 0%, #3d084a 48%, #140321 100%)',
    blobs: ['#ff2e7e', '#ffbe0b', '#9d4edd'],
    introBg: 'linear-gradient(135deg, #ff2e7e 0%, #ffbe0b 100%)',
    introText: '#24041d',
    stars: true,
  },
  {
    id: 2,
    label: 'Love Letter',
    chapter: '03',
    title: 'A Letter From My Heart',
    subtitle: 'sealed across the miles',
    emoji: '💌',
    bg: 'radial-gradient(120% 80% at 50% 0%, #7a1f3d 0%, #3a0d1f 55%, #1a050e 100%)',
    blobs: ['#ff8fab', '#ffc2d1', '#c9184a'],
    introBg: '#ffc2d1',
    introText: '#5c0a2a',
  },
  {
    id: 3,
    label: 'Jackpot',
    chapter: '04',
    title: 'The Love Jackpot',
    subtitle: 'three spins, one lucky girl',
    emoji: '🎰',
    bg: 'radial-gradient(120% 80% at 50% 0%, #4c1180 0%, #22073f 55%, #0f0320 100%)',
    blobs: ['#ffcc4d', '#ff4fa3', '#7b2ff7'],
    introBg: '#ffcc4d',
    introText: '#3b0a57',
  },
  {
    id: 4,
    label: 'Reasons',
    chapter: '05',
    title: 'Reasons I Love You',
    subtitle: 'the short list (it’s endless)',
    emoji: '❤️',
    bg: 'linear-gradient(165deg, #ff5f8f 0%, #ff7a6b 55%, #ffa45c 100%)',
    blobs: ['#ffd6e0', '#ffec99', '#ff3d7f'],
    introBg: '#2a0a26',
    introText: '#ff8fab',
  },
  {
    id: 5,
    label: 'Childhood',
    chapter: '06',
    title: 'Little Doha',
    subtitle: 'the sweetest memories',
    emoji: '🎞️',
    bg: 'radial-gradient(120% 80% at 50% 0%, #61244a 0%, #270c22 55%, #12040f 100%)',
    blobs: ['#ffd166', '#ff8fab', '#c77dff'],
    introBg: '#ffd6e0',
    introText: '#3b0a2a',
  },
  {
    id: 6,
    label: 'Photo Booth',
    chapter: '07',
    title: 'Strike A Pose, Queen',
    subtitle: 'the birthday photo booth',
    emoji: '📸',
    bg: 'radial-gradient(120% 80% at 50% 0%, #2b2a6b 0%, #15123d 55%, #0a0820 100%)',
    blobs: ['#ff5fa2', '#7f7fff', '#ffb3d9'],
    introBg: '#ff5fa2',
    introText: '#15123d',
  },
  {
    id: 7,
    label: 'Soundtrack',
    chapter: '08',
    title: 'Your Top Songs',
    subtitle: 'every love story has a soundtrack',
    emoji: '🎵',
    bg: 'radial-gradient(120% 80% at 50% 0%, #2d1b4e 0%, #120a22 55%, #07040e 100%)',
    blobs: ['#1ed760', '#c084fc', '#ff6b9d'],
    introBg: '#1ed760',
    introText: '#06210f',
  },
  {
    id: 8,
    label: '21 Candles',
    chapter: '09',
    title: 'Make A Wish',
    subtitle: '21 candles, one wish',
    emoji: '🕯️',
    bg: 'radial-gradient(100% 70% at 50% 45%, #2a1210 0%, #120807 60%, #060303 100%)',
    blobs: ['#ff9f1c', '#ff4f8b', '#5c1a1a'],
    introBg: '#ff9f1c',
    introText: '#2a0a05',
    stars: true,
  },
  {
    id: 9,
    label: 'Forever',
    chapter: '10',
    title: 'Forever Yours',
    subtitle: 'the last chapter',
    emoji: '💖',
    bg: 'radial-gradient(130% 90% at 50% 0%, #6b1557 0%, #2d0842 44%, #120324 78%, #070112 100%)',
    blobs: ['#ff3d7f', '#ffd166', '#ff8a5c'],
    introBg: 'linear-gradient(135deg, #ff3d7f 0%, #ffd166 100%)',
    introText: '#24041d',
    stars: true,
  },
];

export const LOVE_LETTER_PARAGRAPHS = [
  'My Dearest Doha,',
  'Happy 21st Birthday, my love! Even though we are miles apart and haven’t met in person yet, nobody in this world means more to me than you do.',
  'Everything about you makes me fall harder every single day — how cute you are, the way your singing melts my heart, your creative soul lost in painting and the ocean, and the gentle nurse’s heart you carry in everything you do.',
  'Thank you for every late-night call, every laugh across the distance, and every moment you turn ordinary days into my favorite ones just by being in my life.',
  'As you step into 21, I wish you calm ocean waves, endless swims, canvases full of color, and songs that make you smile. Until the day I finally hold you for real, I’ll always be right here loving you endlessly.',
  'Forever & always yours,\nAbhi ❤️',
];

export interface WheelSegment {
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
  textColor: string;
  isJackpot?: boolean;
  description: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: 'Unlimited Hugs', shortLabel: 'HUGS', emoji: '🤗', color: '#ff4f8b', textColor: '#ffffff', description: 'Infinite virtual hugs now, plus real ones saved up for the day we finally meet!' },
  { label: '1000 Kisses', shortLabel: '1000 KISSES', emoji: '💋', color: '#7b2ff7', textColor: '#ffffff', description: 'Sent across the miles with extra love — and owed in person the moment I see you.' },
  { label: 'A Romantic Date', shortLabel: 'DATE NIGHT', emoji: '🕯️', color: '#ff8a3d', textColor: '#ffffff', description: 'A cozy call date tonight, plus a dreamy ocean-side date waiting for us one day.' },
  { label: 'A Surprise Gift', shortLabel: 'SURPRISE', emoji: '🎁', color: '#c2185b', textColor: '#ffffff', description: 'Something special picked out just for my cute birthday queen.' },
  { label: 'ALL MY LOVE, FOREVER!', shortLabel: 'JACKPOT', emoji: '👑', color: '#ffcc4d', textColor: '#3b0a57', isJackpot: true, description: 'You’ve won the biggest prize of all – ALL MY LOVE, FOREVER!' },
  { label: 'A Full Day Together', shortLabel: 'FULL DAY', emoji: '🌸', color: '#9d4edd', textColor: '#ffffff', description: 'Zero distractions today — just you, me, and counting down to our first real day together.' },
  { label: 'A Special Birthday Wish', shortLabel: 'A WISH', emoji: '✨', color: '#ff6fa8', textColor: '#ffffff', description: 'Name your wish and consider it my mission.' },
  { label: 'Princess Treatment', shortLabel: 'PRINCESS', emoji: '👸', color: '#5b21b6', textColor: '#ffffff', description: 'Even from miles away, today (and always) you get spoiled like royalty.' },
];

export interface LoveReason {
  id: number;
  title: string;
  message: string;
  emoji: string;
  gradient: string;
  mediaType: 'image' | 'video';
  mediaSrc: string;
}

export const LOVE_REASONS: LoveReason[] = [
  {
    id: 1,
    title: 'Your radiant smile',
    message: 'The second you smile on my screen, my entire mood shifts. You are effortlessly the cutest sight in my whole world.',
    emoji: '✨',
    gradient: 'from-[#ff3d7f] to-[#ff7a59]',
    mediaType: 'image',
    mediaSrc: radiantSmileImg,
  },
  {
    id: 2,
    title: 'Your cute little habits',
    message: 'Every tiny expression, how cute you get talking about painting, swimming, and the ocean — I adore every single detail.',
    emoji: '🦋',
    gradient: 'from-[#7b2ff7] to-[#c77dff]',
    mediaType: 'video',
    mediaSrc: habitsVideo,
  },
  {
    id: 3,
    title: 'The peace you bring me',
    message: 'Like calm ocean waves, just talking to you or listening to your gorgeous voice sing makes every heavy day feel lighter.',
    emoji: '🌙',
    gradient: 'from-[#1a0a2e] to-[#4c1d95]',
    mediaType: 'video',
    mediaSrc: peaceVideo,
  },
  {
    id: 4,
    title: 'Your beautiful heart',
    message: 'Even without working as a nurse, you carry that gentle healer’s soul everywhere — loving, praying for us, and caring so deeply.',
    emoji: '💖',
    gradient: 'from-[#f72585] to-[#b5179e]',
    mediaType: 'image',
    mediaSrc: beautifulHeartImg,
  },
  {
    id: 5,
    title: 'Our laughs across the miles',
    message: 'Even from miles away before we’ve ever met, nobody makes me laugh like you do. Every call is a memory I treasure.',
    emoji: '😂',
    gradient: 'from-[#ff5d8f] to-[#c9184a]',
    mediaType: 'video',
    mediaSrc: laughVideo,
  },
  {
    id: 6,
    title: 'Simply being you',
    message: 'Ocean-hearted, artistic, and endlessly cute — Doha Fetouh, just as you are, is the best thing that ever happened to me.',
    emoji: '👑',
    gradient: 'from-[#3a0ca3] to-[#f72585]',
    mediaType: 'video',
    mediaSrc: simplyBeingYouVideo,
  },
];

export interface SongItem {
  id: string;
  title: string;
  artist: string;
  note: string;
  spotifyTrackId: string;
  /** CSS gradient used as fallback album art */
  cover: string;
}

export const DOHA_SONGS: SongItem[] = [
  { id: '1', title: 'Tum Hi Ho', artist: 'Arijit Singh, Mithoon', note: 'Because you are my peace, my joy, and my everything.', spotifyTrackId: '56zZ48jdyY2oDXHVnwg5Di', cover: 'linear-gradient(135deg, #3a0ca3, #f72585)' },
  { id: '2', title: 'Aktablk Tahod', artist: 'Angham', note: 'Every promise I make to you is written from the heart.', spotifyTrackId: '0J3xz45BPlBUYs0LuMddEL', cover: 'linear-gradient(135deg, #ff6b9d, #c9184a)' },
  { id: '3', title: 'Faker - فاكر', artist: 'Elissa', note: 'For every sweet memory we hold close and never forget.', spotifyTrackId: '5rzC4LOnfMaHUe5sFLd22O', cover: 'linear-gradient(135deg, #b5179e, #7209b7)' },
  { id: '4', title: 'Saiyaara', artist: 'Tanishk Bagchi, Faheem Abdullah', note: 'A melody as timeless and magical as the way you light up my world.', spotifyTrackId: '1D35BJlymlh6OLD75WupSF', cover: 'linear-gradient(135deg, #ffb3c6, #7b2ff7)' },
  { id: '5', title: 'Perfect', artist: 'Ed Sheeran', note: 'Still gives me butterflies thinking of you.', spotifyTrackId: '0tgVpDi06FyKpA1z0VMD4v', cover: 'linear-gradient(135deg, #ff8a3d, #ff4f8b)' },
  { id: '6', title: 'Salvatore', artist: 'Lana Del Rey', note: 'Dreamy, cinematic, and effortlessly iconic — just like you.', spotifyTrackId: '21qg0IBZf8R12qHd9A3AA4', cover: 'linear-gradient(135deg, #ffd166, #c9184a)' },
];

export const FINAL_MESSAGE_PARAGRAPHS = [
  'Even though we haven’t met in person yet and miles still stretch between us, loving you has been the sweetest, most effortless thing in my life.',
  'I hope year 21 brings you endless ocean days, peaceful swims, canvases full of your art, and every reason to keep singing with that gorgeous voice of yours.',
  'You have the cutest soul and the kindest, gentlest heart — and I wish more than anything that I could be right beside you to celebrate every second of today.',
  'Until the day our distance finally turns into our first real hug, I’ll always be cheering for you, loving you endlessly, and wishing you the very best.',
];
