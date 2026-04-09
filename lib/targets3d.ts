// Delta McKenzie 3D Target Database
// All targets used in ASA Pro/Am competition
// Ring placement: 8 ring = vital area (heart/lung/liver zone)
// 10 ring = centered inside 8 ring
// Inside 10: upper 12, center 10, lower 12 (3 small circles vertically)
// 14 ring = small circle off to one side of the 8 ring

export interface Target3D {
  id: string;
  name: string;
  category: 'deer' | 'bear' | 'predator' | 'turkey' | 'exotic' | 'hog' | 'other';
  // Vital zone position relative to body (0-1 normalized)
  // These define where the scoring rings sit on the animal silhouette
  vitalCenter: { x: number; y: number };  // center of 8-ring on body
  vitalWidth: number;   // 8-ring width relative to body width (0-1)
  vitalHeight: number;  // 8-ring height relative to body height (0-1)
  ring14Side: 'left' | 'right' | 'below';  // which side the 14 is on
  bodyShape: 'standard' | 'tall' | 'wide' | 'low';  // general body profile
  asaYear?: string[];   // years used in ASA Pro/Am
}

export const DELTA_MCKENZIE_TARGETS: Target3D[] = [
  // ===== DEER =====
  { id: 'hill-country-doe', name: 'Hill Country Grazing Doe', category: 'deer', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.35, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'xl-deer', name: 'XL Deer', category: 'deer', vitalCenter: { x: 0.40, y: 0.45 }, vitalWidth: 0.26, vitalHeight: 0.33, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'hill-country-whitetail', name: 'Hill Country Whitetail', category: 'deer', vitalCenter: { x: 0.42, y: 0.47 }, vitalWidth: 0.27, vitalHeight: 0.34, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'mule-deer', name: 'Mule Deer', category: 'deer', vitalCenter: { x: 0.41, y: 0.46 }, vitalWidth: 0.27, vitalHeight: 0.34, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'medium-deer', name: 'Medium Deer', category: 'deer', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.35, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'large-alert-deer', name: 'Large Alert Deer', category: 'deer', vitalCenter: { x: 0.38, y: 0.45 }, vitalWidth: 0.25, vitalHeight: 0.32, ring14Side: 'right', bodyShape: 'tall' },
  { id: 'bedded-buck', name: 'Bedded Buck', category: 'deer', vitalCenter: { x: 0.45, y: 0.50 }, vitalWidth: 0.30, vitalHeight: 0.40, ring14Side: 'right', bodyShape: 'low' },
  { id: 'pronghorn', name: 'Pronghorn Antelope', category: 'deer', vitalCenter: { x: 0.42, y: 0.47 }, vitalWidth: 0.26, vitalHeight: 0.33, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'caribou', name: 'Caribou', category: 'deer', vitalCenter: { x: 0.40, y: 0.46 }, vitalWidth: 0.25, vitalHeight: 0.32, ring14Side: 'right', bodyShape: 'tall' },

  // ===== BEAR =====
  { id: 'medium-black-bear', name: 'Medium Black Bear', category: 'bear', vitalCenter: { x: 0.45, y: 0.48 }, vitalWidth: 0.30, vitalHeight: 0.35, ring14Side: 'below', bodyShape: 'wide', asaYear: ['2026'] },
  { id: 'standing-bear', name: 'Standing Bear', category: 'bear', vitalCenter: { x: 0.50, y: 0.50 }, vitalWidth: 0.35, vitalHeight: 0.30, ring14Side: 'below', bodyShape: 'tall' },
  { id: 'brown-bear', name: 'Brown Bear', category: 'bear', vitalCenter: { x: 0.44, y: 0.48 }, vitalWidth: 0.30, vitalHeight: 0.35, ring14Side: 'below', bodyShape: 'wide' },

  // ===== PREDATOR =====
  { id: 'mountain-lion', name: 'Mountain Lion', category: 'predator', vitalCenter: { x: 0.42, y: 0.45 }, vitalWidth: 0.28, vitalHeight: 0.38, ring14Side: 'right', bodyShape: 'standard', asaYear: ['2026'] },
  { id: 'howling-wolf', name: 'Howling Wolf', category: 'predator', vitalCenter: { x: 0.40, y: 0.50 }, vitalWidth: 0.30, vitalHeight: 0.38, ring14Side: 'right', bodyShape: 'tall' },
  { id: 'wolf', name: 'Wolf', category: 'predator', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.36, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'coyote', name: 'Coyote', category: 'predator', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.38, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'lynx', name: 'Lynx', category: 'predator', vitalCenter: { x: 0.44, y: 0.48 }, vitalWidth: 0.30, vitalHeight: 0.40, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'wolverine', name: 'Wolverine', category: 'predator', vitalCenter: { x: 0.44, y: 0.50 }, vitalWidth: 0.32, vitalHeight: 0.40, ring14Side: 'right', bodyShape: 'low' },
  { id: 'african-lion', name: 'African Lion', category: 'predator', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.34, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'leopard', name: 'Leopard', category: 'predator', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.36, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'black-panther', name: 'Black Panther', category: 'predator', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.36, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'african-hyena', name: 'African Hyena', category: 'predator', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.36, ring14Side: 'right', bodyShape: 'standard' },

  // ===== HOG =====
  { id: 'wild-boar', name: 'Wild Boar', category: 'hog', vitalCenter: { x: 0.40, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.35, ring14Side: 'below', bodyShape: 'wide' },
  { id: 'javelina', name: 'Javelina', category: 'hog', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.30, vitalHeight: 0.38, ring14Side: 'below', bodyShape: 'wide' },
  { id: 'russian-boar', name: 'Russian Boar', category: 'hog', vitalCenter: { x: 0.40, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.35, ring14Side: 'below', bodyShape: 'wide' },
  { id: 'african-warthog', name: 'African Warthog', category: 'hog', vitalCenter: { x: 0.42, y: 0.48 }, vitalWidth: 0.28, vitalHeight: 0.36, ring14Side: 'below', bodyShape: 'low' },

  // ===== TURKEY =====
  { id: 'strutting-turkey', name: 'Strutting Turkey', category: 'turkey', vitalCenter: { x: 0.48, y: 0.55 }, vitalWidth: 0.35, vitalHeight: 0.28, ring14Side: 'right', bodyShape: 'tall' },

  // ===== EXOTIC =====
  { id: 'aoudad', name: 'Aoudad', category: 'exotic', vitalCenter: { x: 0.42, y: 0.46 }, vitalWidth: 0.26, vitalHeight: 0.33, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'african-impala', name: 'African Impala', category: 'exotic', vitalCenter: { x: 0.42, y: 0.47 }, vitalWidth: 0.25, vitalHeight: 0.32, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'chamois', name: 'Chamois', category: 'exotic', vitalCenter: { x: 0.42, y: 0.47 }, vitalWidth: 0.26, vitalHeight: 0.33, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'african-blesbok', name: 'African Blesbok', category: 'exotic', vitalCenter: { x: 0.42, y: 0.47 }, vitalWidth: 0.25, vitalHeight: 0.32, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'black-buck', name: 'Black Buck', category: 'exotic', vitalCenter: { x: 0.42, y: 0.47 }, vitalWidth: 0.25, vitalHeight: 0.32, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'bighorn-sheep', name: 'Bighorn Sheep', category: 'exotic', vitalCenter: { x: 0.42, y: 0.47 }, vitalWidth: 0.26, vitalHeight: 0.34, ring14Side: 'right', bodyShape: 'standard' },
  { id: 'bison', name: 'Bison', category: 'exotic', vitalCenter: { x: 0.40, y: 0.48 }, vitalWidth: 0.25, vitalHeight: 0.30, ring14Side: 'right', bodyShape: 'wide' },

  // ===== OTHER =====
  { id: 'alligator', name: 'Alligator', category: 'other', vitalCenter: { x: 0.45, y: 0.50 }, vitalWidth: 0.25, vitalHeight: 0.50, ring14Side: 'right', bodyShape: 'low' },
  { id: 'pro-killzone', name: 'Pro Killzone', category: 'other', vitalCenter: { x: 0.50, y: 0.50 }, vitalWidth: 0.40, vitalHeight: 0.40, ring14Side: 'right', bodyShape: 'standard' },
];

export const TARGET_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'deer', label: 'Deer' },
  { key: 'bear', label: 'Bear' },
  { key: 'predator', label: 'Predator' },
  { key: 'hog', label: 'Hog' },
  { key: 'turkey', label: 'Turkey' },
  { key: 'exotic', label: 'Exotic' },
  { key: 'other', label: 'Other' },
] as const;

// Body silhouette shapes per category for rendering
export const BODY_SHAPES: Record<string, { points: string; viewBox: string }> = {
  // SVG path data for animal silhouettes (simplified)
  deer: {
    points: 'M20,85 Q15,80 18,70 L22,55 Q25,45 30,40 L35,30 Q38,25 42,22 L48,20 Q52,18 55,20 L58,25 Q60,30 58,35 L55,40 Q58,42 62,40 L70,35 Q75,33 80,35 L85,40 Q88,45 87,55 L85,65 Q83,75 80,80 L75,85 Q72,88 68,85 L65,78 Q63,82 60,85 L55,88 Q50,85 48,80 L45,85 Q42,88 38,85 L35,78 Q33,82 30,85 Z',
    viewBox: '0 0 100 100',
  },
  bear: {
    points: 'M15,80 Q12,75 15,65 L20,55 Q22,48 25,42 L28,35 Q30,30 35,28 L40,25 Q45,22 50,25 L55,28 Q58,30 60,28 L65,25 Q70,22 75,28 L78,35 Q80,42 82,50 L85,60 Q87,70 85,80 L80,85 Q75,88 70,85 L68,80 Q65,83 62,85 L58,88 Q52,85 48,80 L45,85 Q40,88 35,85 L32,80 Q28,83 25,85 L20,82 Z',
    viewBox: '0 0 100 100',
  },
  predator: {
    points: 'M10,75 Q8,70 12,60 L18,50 Q22,42 28,38 L35,32 Q38,28 42,25 L48,22 Q52,20 56,22 L60,25 Q64,22 68,20 L72,22 Q75,25 73,30 L70,35 Q74,38 80,40 L85,45 Q90,50 88,60 L85,70 Q82,78 78,80 L72,82 Q68,78 65,75 L60,80 Q55,78 50,80 L45,82 Q40,78 38,82 L35,85 Q30,82 28,78 L25,80 Q20,82 18,78 Z',
    viewBox: '0 0 100 100',
  },
  hog: {
    points: 'M10,78 Q8,72 12,62 L18,52 Q22,45 28,40 L35,35 Q40,30 45,28 L55,25 Q60,24 65,26 L70,30 Q72,28 75,25 L78,28 Q80,32 78,38 L82,42 Q88,48 87,58 L85,68 Q82,76 78,80 L72,82 Q68,78 65,82 L58,85 Q52,82 48,78 L42,82 Q36,85 32,82 L26,78 Q22,82 18,80 Z',
    viewBox: '0 0 100 100',
  },
  turkey: {
    points: 'M35,85 Q30,82 32,72 L35,60 Q38,50 42,42 L45,35 Q48,28 52,22 L55,18 Q58,15 60,18 L58,25 Q55,22 52,28 L55,30 Q60,28 65,30 L68,35 Q70,40 68,48 L65,55 Q68,52 72,55 L75,60 Q78,65 75,72 L70,78 Q65,82 60,85 L55,88 Q48,85 45,82 L40,85 Z',
    viewBox: '0 0 100 100',
  },
  exotic: {
    points: 'M20,85 Q15,80 18,70 L22,55 Q25,45 30,40 L35,30 Q38,25 42,22 L48,18 Q52,15 55,18 L58,22 Q60,28 58,32 L55,38 Q58,40 62,38 L70,33 Q75,30 80,33 L85,38 Q88,45 87,55 L85,65 Q83,75 80,80 L75,85 Q72,88 68,85 L65,78 Q63,82 60,85 L55,88 Q50,85 48,80 L45,85 Q42,88 38,85 L35,78 Q33,82 30,85 Z',
    viewBox: '0 0 100 100',
  },
  other: {
    points: 'M15,70 Q10,65 15,55 L25,45 Q35,38 45,35 L55,33 Q65,32 75,35 L82,40 Q88,48 85,58 L80,68 Q75,75 65,78 L55,80 Q45,78 35,75 L25,72 Z',
    viewBox: '0 0 100 100',
  },
};
