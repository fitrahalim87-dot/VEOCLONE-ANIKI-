export type TabType = 'clone' | 'design' | 'history' | 'guide';

export interface HistoryItem {
  id: string;
  title: string;
  type: 'clone' | 'design';
  text: string;
  audioUrl: string; // base64 data url or object url
  duration: number; // in seconds
  fileSizeKb: number;
  format: 'wav' | 'mp3';
  timestamp: number;
  isFavorite: boolean;
  statusInfo?: string;
  engineUsed: string;
  parameters: {
    language: string;
    speed: number;
    steps?: number;
    cfg?: number;
    instruct?: string;
    refAudioName?: string;
  };
}

export interface ColabNotebookInfo {
  notebook_id: string;
  code: string;
  engine: string;
  gpu: string;
  url?: string;
  jobs: number;
  last_seen: number;
  last_error?: string;
  note?: string;
}

export interface ColabStatusResponse {
  ok: boolean;
  connected: boolean;
  active_notebook: ColabNotebookInfo | null;
  pairing_secret: string;
  recent_notebooks?: Array<{
    notebook_id: string;
    code: string;
    engine: string;
    gpu: string;
    is_online: boolean;
    last_seen: number;
    jobs: number;
    note?: string;
  }>;
}

export const LANGUAGES = [
  { code: 'Indonesian', label: 'Bahasa Indonesia (ID)', flag: '🇮🇩' },
  { code: 'English', label: 'English (US/UK)', flag: '🇺🇸' },
  { code: 'Malay', label: 'Bahasa Melayu (MY)', flag: '🇲🇾' },
  { code: 'Japanese', label: 'Japanese (日本語)', flag: '🇯🇵' },
  { code: 'Korean', label: 'Korean (한국어)', flag: '🇰🇷' },
  { code: 'Mandarin', label: 'Mandarin (中文)', flag: '🇨🇳' },
  { code: 'Arabic', label: 'Arabic (العربية)', flag: '🇸🇦' },
  { code: 'Spanish', label: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'French', label: 'French (Français)', flag: '🇫🇷' },
  { code: 'German', label: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
  { code: 'Portuguese', label: 'Portuguese (Português)', flag: '🇧🇷' },
  { code: 'Russian', label: 'Russian (Русский)', flag: '🇷🇺' },
  { code: 'Dutch', label: 'Dutch (Nederlands)', flag: '🇳🇱' },
  { code: 'Italian', label: 'Italian (Italiano)', flag: '🇮🇹' },
  { code: 'Turkish', label: 'Turkish (Türkçe)', flag: '🇹🇷' },
  { code: 'Vietnamese', label: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳' },
  { code: 'Thai', label: 'Thai (ไทย)', flag: '🇹🇭' },
];

export const INSTRUCT_MAP: Record<string, string> = {
  Pria: 'male',
  Wanita: 'female',
  'Anak-anak': 'child',
  Remaja: 'teenager',
  Dewasa: 'young adult',
  'Paruh Baya': 'middle-aged',
  Lansia: 'elderly',
  'Sangat Rendah': 'very low pitch',
  Rendah: 'low pitch',
  Sedang: 'moderate pitch',
  Tinggi: 'high pitch',
  'Sangat Tinggi': 'very high pitch',
  Berbisik: 'whisper',
  Ceria: 'cheerful',
  Tenang: 'calm tone',
  Tegas: 'confident tone',
  Narator: 'professional narrator',
  Iklan: 'energetic commercial voice',
  Amerika: 'american accent',
  'Inggris (UK)': 'british accent',
  Australia: 'australian accent',
  India: 'indian accent',
};

export const CATEGORIES = {
  Gender: ['Otomatis', 'Pria', 'Wanita'],
  Usia: ['Otomatis', 'Anak-anak', 'Remaja', 'Dewasa', 'Paruh Baya', 'Lansia'],
  Pitch: ['Otomatis', 'Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'],
  Gaya: ['Otomatis', 'Berbisik', 'Ceria', 'Tenang', 'Tegas', 'Narator', 'Iklan'],
  Aksen: ['Otomatis', 'Amerika', 'Inggris (UK)', 'Australia', 'India'],
};

export interface VoicePreset {
  id: string;
  name: string;
  desc: string;
  tag: string;
  instruct: string;
  categories: {
    Gender: string;
    Usia: string;
    Pitch: string;
    Gaya: string;
    Aksen: string;
  };
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'narator-profesional',
    name: 'Narator Dokumenter',
    desc: 'Suara pria dewasa tenang berwibawa, ideal untuk storytelling & video dokumenter.',
    tag: 'Populer',
    instruct: 'male, professional narrator, calm tone, moderate pitch',
    categories: { Gender: 'Pria', Usia: 'Dewasa', Pitch: 'Sedang', Gaya: 'Narator', Aksen: 'Otomatis' },
  },
  {
    id: 'iklan-energik',
    name: 'Voice Over Iklan',
    desc: 'Suara wanita ceria berenergi tinggi untuk promosi produk TikTok & Reels.',
    tag: 'Marketing',
    instruct: 'female, energetic commercial voice, cheerful, high pitch',
    categories: { Gender: 'Wanita', Usia: 'Dewasa', Pitch: 'Tinggi', Gaya: 'Iklan', Aksen: 'Otomatis' },
  },
  {
    id: 'berbisik-asmr',
    name: 'Bisikan Santai (ASMR)',
    desc: 'Suara lembut berbisik menenangkan untuk relaksasi atau intro dramatis.',
    tag: 'Santai',
    instruct: 'female, whisper, calm tone, low pitch',
    categories: { Gender: 'Wanita', Usia: 'Dewasa', Pitch: 'Rendah', Gaya: 'Berbisik', Aksen: 'Otomatis' },
  },
  {
    id: 'pria-tegas',
    name: 'Motivator Tegas',
    desc: 'Karakter pria percaya diri dengan artikulasi tegas dan intonasi meyakinkan.',
    tag: 'Podcast',
    instruct: 'male, confident tone, low pitch, young adult',
    categories: { Gender: 'Pria', Usia: 'Dewasa', Pitch: 'Rendah', Gaya: 'Tegas', Aksen: 'Otomatis' },
  },
  {
    id: 'remaja-ceria',
    name: 'Karakter Anime / Ceria',
    desc: 'Gaya remaja ceria dan ekspresif untuk konten gaming atau animasi.',
    tag: 'Kreatif',
    instruct: 'female, cheerful, teenager, high pitch',
    categories: { Gender: 'Wanita', Usia: 'Remaja', Pitch: 'Tinggi', Gaya: 'Ceria', Aksen: 'Otomatis' },
  },
];
