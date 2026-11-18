export type CharacterClassId =
  | 'warrior'
  | 'cleric'
  | 'rogue'
  | 'wizard'
  | 'barbarian'
  | 'elf'
  | 'dwarf'
  | 'halfling'
  | 'custom';

export type CharacterStatus = 'alive' | 'dead' | 'stone';

export interface SpellItem {
  id: string;
  name: string;
  used: boolean;
}

export interface Character {
  id: string;
  name: string;
  classId: CharacterClassId;
  customClassName?: string;
  level: number;
  maxLife: number;
  currentLife: number;
  status: CharacterStatus;

  // Attack modifiers (Level is added automatically when class grants +L or +1/2L)
  meleeWeaponMod: number;
  meleeTraitMod: number;
  meleeOverride: number | null;

  offHandWeaponMod: number;
  offHandTraitMod: number;
  offHandOverride: number | null;

  rangedWeaponMod: number;
  rangedTraitMod: number;
  rangedOverride: number | null;

  // Defense modifiers
  armorMod: number;
  shieldMod: number;
  defenseTraitMod: number;
  defenseOverride: number | null;

  // Resources & Conditions
  lantern: boolean;
  bandaged: boolean;
  blessings: number;
  healings: number;
  clues: number;
  gold: number;
  gems: number;
  jewelry: number;

  spells: SpellItem[];
  equipment: string[];
  traits: string;
  personalQuest: string;
  notes: string;
}

export type GridCellType = 'empty' | 'room' | 'corridor' | 'water' | 'hatch';

export type GridStampType =
  | 'none'
  | 'trap'
  | 'stairs_up'
  | 'stairs_down'
  | 'boss'
  | 'treasure'
  | 'fountain'
  | 'altar';

export type DoorType = 'door' | 'secret' | 'locked' | 'open';

export type PinIconType =
  | 'number'
  | 'minion'
  | 'boss'
  | 'trap'
  | 'treasure'
  | 'stairs_up'
  | 'stairs_down'
  | 'fountain'
  | 'altar'
  | 'quest'
  | 'npc';

export interface MapPin {
  id: string;
  label: string;
  title: string;
  notes: string;
  icon?: PinIconType;
  minionType?: string;
  /** Grid column (grid mode) or 0..100 percentage X (image mode) */
  x: number;
  /** Grid row (grid mode) or 0..100 percentage Y (image mode) */
  y: number;
}

export interface DungeonMap {
  id: string;
  name: string;
  depth: number;
  cleared: boolean;
  mode: 'grid' | 'image';
  cols: number;
  rows: number;
  /** Key: "row,col" */
  cells: Record<string, GridCellType>;
  /** Legacy stamps (optional, kept for backwards compatibility) */
  stamps: Record<string, GridStampType>;
  /** Key: "h:row:col" (top edge of cell) or "v:row:col" (left edge of cell) */
  edges: Record<string, DoorType>;
  pins: MapPin[];
  partyPos: { x: number; y: number } | null;
  imageDataUrl: string | null;
  notes: string;
}

export type JournalEntryType =
  | 'narrative'
  | 'oracle'
  | 'discovery'
  | 'combat'
  | 'settlement';

export interface OracleLogData {
  likelihood: string;
  question: string;
  roll: number;
  answer: string;
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  sessionNumber: number;
  entryType: JournalEntryType;
  title: string;
  content: string;
  oracleData?: OracleLogData;
  diceRollSummary?: string;
  linkedMapId?: string;
  linkedPinId?: string;
  threadIds: string[];
}

export type StoryThreadType = 'quest' | 'npc' | 'location' | 'thread';
export type StoryThreadStatus = 'active' | 'resolved' | 'abandoned';

export interface StoryThread {
  id: string;
  type: StoryThreadType;
  name: string;
  status: StoryThreadStatus;
  notes: string;
  linkedMapId?: string;
  linkedPinId?: string;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sessionNumber: number;
  minionsDefeated?: number;
  characters: Character[];
  currentDungeonId: string;
  dungeons: DungeonMap[];
  journal: JournalEntry[];
  threads: StoryThread[];
}

export type ViewMode = 'split' | 'party' | 'map' | 'journal';
