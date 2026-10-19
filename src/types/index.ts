export type Language = 'sv' | 'en';

export type WaterZone = 'top' | 'middle' | 'bottom' | 'all';

export type FishCategory =
  | 'tetras_schooling'
  | 'livebearers'
  | 'centerpiece'
  | 'bottom_algae'
  | 'shrimp_snails'
  | 'cichlids_special';

export type Temperament = 'peaceful' | 'semi_aggressive' | 'territorial';

export type CareLevel = 'easy' | 'medium' | 'advanced';

export type BodyShape =
  | 'tetra'
  | 'guppy'
  | 'betta'
  | 'gourami'
  | 'angelfish'
  | 'corydoras'
  | 'pleco'
  | 'loach'
  | 'shrimp'
  | 'snail'
  | 'cichlid'
  | 'rasbora';

export interface FishVisual {
  shape: BodyShape;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  stripeType?: 'neon_horizontal' | 'vertical_bars' | 'harlequin_wedge' | 'rummy_nose' | 'spots' | 'panda' | 'none';
  finStyle?: 'veil' | 'standard' | 'high_dorsal' | 'swordtail';
}

export interface FishSpecies {
  id: string;
  nameSv: string;
  nameEn: string;
  scientificName: string;
  category: FishCategory;
  zone: WaterZone;
  temperament: Temperament;
  careLevel: CareLevel;
  sizeCm: number;
  minTankLiters: number;
  tempMinC: number;
  tempMaxC: number;
  phMin: number;
  phMax: number;
  minGroupSize: number;
  recommendedGroupSize: number;
  solitaryOrPairOnly?: boolean;
  finNipper?: boolean;
  longFins?: boolean;
  eatsShrimp?: boolean;
  needsSandSubstrate?: boolean;
  needsDriftwood?: boolean;
  bioloadScore: number; // relative bioload per individual
  originSv: string;
  originEn: string;
  dietSv: string;
  dietEn: string;
  summarySv: string;
  summaryEn: string;
  funFactSv: string;
  funFactEn: string;
  careTipsSv: string[];
  careTipsEn: string[];
  incompatibleWithIds: string[];
  greatTankmatesIds: string[];
  visual: FishVisual;
}

export interface TankFishEntry {
  speciesId: string;
  count: number;
}

export type AquascapeTheme = 'amazonas' | 'nature_planted' | 'treasure_reef' | 'blackwater';

export interface SavedTankPlan {
  id: string;
  name: string;
  creator: string;
  liters: number;
  aquascape: AquascapeTheme;
  fish: TankFishEntry[];
  checkedEquipment?: string[];
  updatedAt: string;
}

export interface CompatibilityAlert {
  id: string;
  severity: 'error' | 'warning' | 'tip' | 'success';
  titleSv: string;
  titleEn: string;
  detailSv: string;
  detailEn: string;
  speciesIds?: string[];
}

export interface StarterTankPreset {
  id: string;
  nameSv: string;
  nameEn: string;
  subtitleSv: string;
  subtitleEn: string;
  liters: number;
  aquascape: AquascapeTheme;
  badgeSv: string;
  badgeEn: string;
  fish: TankFishEntry[];
}
