export type ResponsiveJourneyAsset = {
  alt: string;
  fallback: string;
  avif: {
    desktop: string;
    mobile: string;
  };
  webp: {
    desktop: string;
    mobile: string;
  };
  sizes?: string;
};

export const MAP_ASSETS = {
  erangel: {
    alt: 'Erangel tactical map',
    fallback: '/assets/maps/erangel.png',
    avif: {
      desktop: '/assets/optimized/maps/erangel-desktop.avif',
      mobile: '/assets/optimized/maps/erangel-mobile.avif',
    },
    webp: {
      desktop: '/assets/optimized/maps/erangel-desktop.webp',
      mobile: '/assets/optimized/maps/erangel-mobile.webp',
    },
    sizes: '(max-width: 767px) 88vw, 46vw',
  },
  miramar: {
    alt: 'Miramar tactical map',
    fallback: '/assets/maps/miramar.png',
    avif: {
      desktop: '/assets/optimized/maps/miramar-desktop.avif',
      mobile: '/assets/optimized/maps/miramar-mobile.avif',
    },
    webp: {
      desktop: '/assets/optimized/maps/miramar-desktop.webp',
      mobile: '/assets/optimized/maps/miramar-mobile.webp',
    },
    sizes: '(max-width: 767px) 88vw, 46vw',
  },
  rondo: {
    alt: 'Rondo tactical map',
    fallback: '/assets/maps/rondo.png',
    avif: {
      desktop: '/assets/optimized/maps/rondo-desktop.avif',
      mobile: '/assets/optimized/maps/rondo-mobile.avif',
    },
    webp: {
      desktop: '/assets/optimized/maps/rondo-desktop.webp',
      mobile: '/assets/optimized/maps/rondo-mobile.webp',
    },
    sizes: '(max-width: 767px) 88vw, 46vw',
  },
} as const satisfies Record<string, ResponsiveJourneyAsset>;

export const CRYSTAL_ASSETS = {
  main: {
    alt: '',
    fallback: '/assets/crystals/crystal-main.png',
    avif: {
      desktop: '/assets/optimized/crystals/crystal-main-desktop.avif',
      mobile: '/assets/optimized/crystals/crystal-main-mobile.avif',
    },
    webp: {
      desktop: '/assets/optimized/crystals/crystal-main-desktop.webp',
      mobile: '/assets/optimized/crystals/crystal-main-mobile.webp',
    },
    sizes: '(max-width: 767px) 28vw, 18vw',
  },
  medium: {
    alt: '',
    fallback: '/assets/crystals/crystal-medium.png',
    avif: {
      desktop: '/assets/optimized/crystals/crystal-medium-desktop.avif',
      mobile: '/assets/optimized/crystals/crystal-medium-mobile.avif',
    },
    webp: {
      desktop: '/assets/optimized/crystals/crystal-medium-desktop.webp',
      mobile: '/assets/optimized/crystals/crystal-medium-mobile.webp',
    },
    sizes: '(max-width: 767px) 18vw, 10vw',
  },
  small: {
    alt: '',
    fallback: '/assets/crystals/crystal-small.png',
    avif: {
      desktop: '/assets/optimized/crystals/crystal-small-desktop.avif',
      mobile: '/assets/optimized/crystals/crystal-small-mobile.avif',
    },
    webp: {
      desktop: '/assets/optimized/crystals/crystal-small-desktop.webp',
      mobile: '/assets/optimized/crystals/crystal-small-mobile.webp',
    },
    sizes: '(max-width: 767px) 12vw, 6vw',
  },
  shards: {
    alt: '',
    fallback: '/assets/crystals/crystal-shards.png',
    avif: {
      desktop: '/assets/optimized/crystals/crystal-shards-desktop.avif',
      mobile: '/assets/optimized/crystals/crystal-shards-mobile.avif',
    },
    webp: {
      desktop: '/assets/optimized/crystals/crystal-shards-desktop.webp',
      mobile: '/assets/optimized/crystals/crystal-shards-mobile.webp',
    },
    sizes: '(max-width: 767px) 16vw, 9vw',
  },
} as const satisfies Record<string, ResponsiveJourneyAsset>;

export const MODEL_ASSETS = {
  erangel: '/assets/models/erangel-optimized.glb',
} as const;

export const VIDEO_ASSETS = {
  pochinki: '/assets/optimized/videos/pochinki.mp4',
  military: '/assets/optimized/videos/military-base.mp4',
  georgopol: '/assets/optimized/videos/georgopol.mp4',
  stalber: '/assets/optimized/videos/stalber.mp4',
} as const;
