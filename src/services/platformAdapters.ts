import { PlatformApiStatus, SocialPlatformKey, PlatformPolicyVersion } from '../types';

export interface PlatformConfig {
  key: SocialPlatformKey;
  name: string;
  color: string;
  iconName: string;
  baseUrl: string;
  apiStatus: PlatformApiStatus;
  allowedActions: string[];
  blockedActions: string[];
  urlPattern: RegExp;
  extractUsername: (url: string) => string | null;
}

export const PLATFORM_REGISTRY: Record<SocialPlatformKey, PlatformConfig> = {
  tiktok: {
    key: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    iconName: 'Video',
    baseUrl: 'https://www.tiktok.com/@',
    apiStatus: PlatformApiStatus.MANUAL_VERIFICATION,
    allowedActions: ['DESCUBRIR_PERFIL', 'VISITAR_PERFIL', 'VER_VIDEO', 'COMPARTIR_VOLUNTARIO'],
    blockedActions: ['AUTO_FOLLOW', 'AUTO_LIKE', 'SCRAPING_MASIVO', 'BOT_VIEWS'],
    urlPattern: /^(https?:\/\/)?(www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)/i);
      return match ? match[1].toLowerCase().replace(/^@/, '') : null;
    }
  },
  instagram: {
    key: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    iconName: 'Instagram',
    baseUrl: 'https://www.instagram.com/',
    apiStatus: PlatformApiStatus.MANUAL_VERIFICATION,
    allowedActions: ['DESCUBRIR_PERFIL', 'VISITAR_FEED', 'VER_REELS', 'INTERACCION_VOLUNTARIA'],
    blockedActions: ['AUTO_FOLLOW', 'MASS_DM', 'AUTO_LIKE_BOT'],
    urlPattern: /^(https?:\/\/)?(www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/instagram\.com\/([a-zA-Z0-9_.-]+)/i);
      return match ? match[1].toLowerCase().replace(/^@/, '') : null;
    }
  },
  youtube: {
    key: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    iconName: 'Youtube',
    baseUrl: 'https://www.youtube.com/@',
    apiStatus: PlatformApiStatus.LIMITED_API,
    allowedActions: ['DESCUBRIR_CANAL', 'VER_VIDEO', 'CONOCER_CONTENIDO'],
    blockedActions: ['SUB4SUB_MECANICO', 'BOT_REPRODUCCIONES', 'CLICK_FARM'],
    urlPattern: /^(https?:\/\/)?(www\.)?youtube\.com\/(c\/|user\/|channel\/|@)?([a-zA-Z0-9_.-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/youtube\.com\/(?:@|c\/|user\/|channel\/)?([a-zA-Z0-9_.-]+)/i);
      return match ? match[1].toLowerCase().replace(/^@/, '') : null;
    }
  },
  x: {
    key: 'x',
    name: 'X (Twitter)',
    color: '#0f1419',
    iconName: 'Twitter',
    baseUrl: 'https://x.com/',
    apiStatus: PlatformApiStatus.MANUAL_VERIFICATION,
    allowedActions: ['DESCUBRIR_PERFIL', 'LEER_HILOS', 'SEGUIMIENTO_VOLUNTARIO'],
    blockedActions: ['AUTO_RETWEET', 'AUTO_FOLLOW', 'SPAM_REPLIES'],
    urlPattern: /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i,
    extractUsername: (url) => {
      const match = url.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
      return match ? match[1].toLowerCase().replace(/^@/, '') : null;
    }
  },
  facebook: {
    key: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    iconName: 'Facebook',
    baseUrl: 'https://www.facebook.com/',
    apiStatus: PlatformApiStatus.PUBLIC_PROFILE_ONLY,
    allowedActions: ['CONOCER_PAGINA', 'DESCUBRIR_CREADOR'],
    blockedActions: ['AUTO_INVITE', 'BOT_COMMENTS', 'SPAM_GROUPS'],
    urlPattern: /^(https?:\/\/)?(www\.)?facebook\.com\/([a-zA-Z0-9_.-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/facebook\.com\/([a-zA-Z0-9_.-]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  twitch: {
    key: 'twitch',
    name: 'Twitch',
    color: '#9146FF',
    iconName: 'Tv',
    baseUrl: 'https://www.twitch.tv/',
    apiStatus: PlatformApiStatus.LIMITED_API,
    allowedActions: ['CONOCER_STREAM', 'VISITAR_CANAL', 'APOYO_VOLUNTARIO'],
    blockedActions: ['VIEWBOT', 'CHAT_SPAM', 'FAKE_RAID'],
    urlPattern: /^(https?:\/\/)?(www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/i,
    extractUsername: (url) => {
      const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  kick: {
    key: 'kick',
    name: 'Kick',
    color: '#53FC18',
    iconName: 'PlayCircle',
    baseUrl: 'https://kick.com/',
    apiStatus: PlatformApiStatus.PUBLIC_PROFILE_ONLY,
    allowedActions: ['DESCUBRIR_STREAMER', 'VER_TRANSMISION'],
    blockedActions: ['VIEW_BOT', 'CHAT_INJECTION'],
    urlPattern: /^(https?:\/\/)?(www\.)?kick\.com\/([a-zA-Z0-9_]+)/i,
    extractUsername: (url) => {
      const match = url.match(/kick\.com\/([a-zA-Z0-9_]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  threads: {
    key: 'threads',
    name: 'Threads',
    color: '#101010',
    iconName: 'AtSign',
    baseUrl: 'https://www.threads.net/@',
    apiStatus: PlatformApiStatus.MANUAL_VERIFICATION,
    allowedActions: ['LEER_PUBLICACIONES', 'DESCUBRIR_PERFIL'],
    blockedActions: ['SPAM_REPLIES', 'AUTO_FOLLOW'],
    urlPattern: /^(https?:\/\/)?(www\.)?threads\.net\/@([a-zA-Z0-9_.-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/threads\.net\/@([a-zA-Z0-9_.-]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  snapchat: {
    key: 'snapchat',
    name: 'Snapchat',
    color: '#FFFC00',
    iconName: 'Camera',
    baseUrl: 'https://www.snapchat.com/add/',
    apiStatus: PlatformApiStatus.MANUAL_VERIFICATION,
    allowedActions: ['CONOCER_CREADOR'],
    blockedActions: ['AUTO_ADD', 'MASS_SNAP'],
    urlPattern: /^(https?:\/\/)?(www\.)?snapchat\.com\/add\/([a-zA-Z0-9_.-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/snapchat\.com\/add\/([a-zA-Z0-9_.-]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  discord: {
    key: 'discord',
    name: 'Discord',
    color: '#5865F2',
    iconName: 'MessageSquare',
    baseUrl: 'https://discord.gg/',
    apiStatus: PlatformApiStatus.PUBLIC_PROFILE_ONLY,
    allowedActions: ['DESCUBRIR_COMUNIDAD', 'UNIRSE_VOLUNTARIAMENTE'],
    blockedActions: ['RAID_BOTS', 'MASS_DM'],
    urlPattern: /^(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9_-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : null;
    }
  },
  telegram: {
    key: 'telegram',
    name: 'Telegram',
    color: '#24A1DE',
    iconName: 'Send',
    baseUrl: 'https://t.me/',
    apiStatus: PlatformApiStatus.PUBLIC_PROFILE_ONLY,
    allowedActions: ['DESCUBRIR_CANAL', 'CONOCER_GRUPO'],
    blockedActions: ['SPAM_BROADCAST', 'SCRAPER_MEMBERS'],
    urlPattern: /^(https?:\/\/)?(www\.)?t\.me\/([a-zA-Z0-9_]+)/i,
    extractUsername: (url) => {
      const match = url.match(/t\.me\/([a-zA-Z0-9_]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  linkedin: {
    key: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    iconName: 'Briefcase',
    baseUrl: 'https://www.linkedin.com/in/',
    apiStatus: PlatformApiStatus.PUBLIC_PROFILE_ONLY,
    allowedActions: ['CONECTAR_PROFESIONALMENTE', 'DESCUBRIR_PERFIL'],
    blockedActions: ['AUTO_CONNECT_BOT', 'LEAD_SCRAPING'],
    urlPattern: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/([a-zA-Z0-9_-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/linkedin\.com\/(?:in|company)\/([a-zA-Z0-9_-]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  pinterest: {
    key: 'pinterest',
    name: 'Pinterest',
    color: '#E60023',
    iconName: 'Image',
    baseUrl: 'https://www.pinterest.com/',
    apiStatus: PlatformApiStatus.PUBLIC_PROFILE_ONLY,
    allowedActions: ['DESCUBRIR_TABLERO', 'CONOCER_IDEAS'],
    blockedActions: ['MASS_PIN_BOT'],
    urlPattern: /^(https?:\/\/)?(www\.)?pinterest\.com\/([a-zA-Z0-9_.-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/pinterest\.com\/([a-zA-Z0-9_.-]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  reddit: {
    key: 'reddit',
    name: 'Reddit',
    color: '#FF4500',
    iconName: 'Smile',
    baseUrl: 'https://www.reddit.com/user/',
    apiStatus: PlatformApiStatus.LIMITED_API,
    allowedActions: ['CONOCER_CONTENIDO', 'LEER_COMUNIDAD'],
    blockedActions: ['VOTE_MANIPULATION', 'BRIGADING', 'SPAM_BOT'],
    urlPattern: /^(https?:\/\/)?(www\.)?reddit\.com\/(user|u)\/([a-zA-Z0-9_-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/reddit\.com\/(?:user|u)\/([a-zA-Z0-9_-]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  },
  bluesky: {
    key: 'bluesky',
    name: 'Bluesky',
    color: '#0085FF',
    iconName: 'Cloud',
    baseUrl: 'https://bsky.app/profile/',
    apiStatus: PlatformApiStatus.LIMITED_API,
    allowedActions: ['DESCUBRIR_PERFIL', 'LEER_POSTS', 'SEGUIR_VOLUNTARIO'],
    blockedActions: ['AUTO_FEED_SPAM', 'BOT_FOLLOW'],
    urlPattern: /^(https?:\/\/)?(www\.)?bsky\.app\/profile\/([a-zA-Z0-9_.-]+)/i,
    extractUsername: (url) => {
      const match = url.match(/bsky\.app\/profile\/([a-zA-Z0-9_.-]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  }
};

export class SocialPlatformAdapter {
  static detectPlatform(input: string): SocialPlatformKey | null {
    const trimmed = input.trim();
    for (const [key, config] of Object.entries(PLATFORM_REGISTRY)) {
      if (config.urlPattern.test(trimmed)) {
        return key as SocialPlatformKey;
      }
    }
    return null;
  }

  static parseProfile(platform: SocialPlatformKey, inputUrlOrUser: string) {
    const config = PLATFORM_REGISTRY[platform];
    if (!config) throw new Error('Plataforma no soportada');

    let username = config.extractUsername(inputUrlOrUser);
    if (!username) {
      // If user typed raw handle like "@miusuario" or "miusuario"
      username = inputUrlOrUser.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_.-]/g, '');
    }

    if (!username || username.length < 2) {
      return null;
    }

    const normalizedIdentifier = `${platform}::${username.toLowerCase()}`;
    const cleanUrl = `${config.baseUrl}${username}`;

    return {
      platform,
      username,
      displayName: username,
      profileUrl: cleanUrl,
      normalizedIdentifier,
      apiStatus: config.apiStatus,
      apiNotice:
        config.apiStatus === PlatformApiStatus.MANUAL_VERIFICATION ||
        config.apiStatus === PlatformApiStatus.PUBLIC_PROFILE_ONLY
          ? 'Información no disponible mediante API oficial. Verificación manual humana requerida.'
          : 'Datos públicos de creador compatibles con términos oficiales.',
      allowedActions: config.allowedActions,
      blockedActions: config.blockedActions
    };
  }

  static getOfficialPolicy(platform: SocialPlatformKey): PlatformPolicyVersion {
    const config = PLATFORM_REGISTRY[platform];
    return {
      platform,
      display_name: config.name,
      logo_url: `/assets/platforms/${platform}.svg`,
      enabled: true,
      api_status: config.apiStatus,
      allowed_actions: config.allowedActions,
      blocked_actions: config.blockedActions,
      last_reviewed_at: '2026-09-01T00:00:00Z',
      policy_source_url: `https://www.${platform}.com/legal/terms`,
      notes: 'Monitoreo activo para garantizar interacciones 100% auténticas y voluntarias.'
    };
  }
}
