import { Character, CharacterClassId } from '../types/campaign';

export interface ClassPreset {
  id: CharacterClassId;
  label: string;
  baseLife: number; // Life = baseLife + Level
  meleeLevelScaling: 'full' | 'half' | 'none';
  rangedLevelScaling: 'full' | 'half' | 'none';
  defenseLevelScaling: 'full' | 'half' | 'none';
  defaultTraits: string;
  startingEquipment: string[];
  startingSpells: string[];
  startingBlessings: number;
  startingHealings: number;
  defaultArmorMod: number;
  defaultShieldMod: number;
  defaultWeaponMod: number;
  defaultGold: number;
}

export const CLASS_PRESETS: Record<CharacterClassId, ClassPreset> = {
  warrior: {
    id: 'warrior',
    label: 'Warrior',
    baseLife: 6,
    meleeLevelScaling: 'full',
    rangedLevelScaling: 'full',
    defenseLevelScaling: 'none',
    defaultTraits: '+L to Attack rolls. May use any weapon, armor, or shield.',
    startingEquipment: ['Light Armor', 'Shield', 'Hand Weapon'],
    startingSpells: [],
    startingBlessings: 0,
    startingHealings: 0,
    defaultArmorMod: 1,
    defaultShieldMod: 1,
    defaultWeaponMod: 0,
    defaultGold: 7,
  },
  cleric: {
    id: 'cleric',
    label: 'Cleric',
    baseLife: 4,
    meleeLevelScaling: 'half',
    rangedLevelScaling: 'none',
    defenseLevelScaling: 'none',
    defaultTraits:
      '+1/2 L to Attack (+L vs Undead). 3 Healings & 3 Blessings per adventure.',
    startingEquipment: ['Light Armor', 'Shield', 'Hand Weapon (Crushing)'],
    startingSpells: [],
    startingBlessings: 3,
    startingHealings: 3,
    defaultArmorMod: 1,
    defaultShieldMod: 1,
    defaultWeaponMod: 0,
    defaultGold: 4,
  },
  rogue: {
    id: 'rogue',
    label: 'Rogue',
    baseLife: 3,
    meleeLevelScaling: 'none',
    rangedLevelScaling: 'none',
    defenseLevelScaling: 'full',
    defaultTraits:
      '+L to Defense & disarm traps. +L to Attack vs outnumbered minions/vermin.',
    startingEquipment: ['Light Armor', 'Light Hand Weapon', 'Rope', 'Lock Picks'],
    startingSpells: [],
    startingBlessings: 0,
    startingHealings: 0,
    defaultArmorMod: 1,
    defaultShieldMod: 0,
    defaultWeaponMod: -1,
    defaultGold: 10,
  },
  wizard: {
    id: 'wizard',
    label: 'Wizard',
    baseLife: 2,
    meleeLevelScaling: 'none',
    rangedLevelScaling: 'none',
    defenseLevelScaling: 'none',
    defaultTraits:
      'Casts spells (+L to spellcasting & puzzle rolls). 2 spells + 1 per Level. No armor/shield.',
    startingEquipment: ['Light Hand Weapon', 'Spell Book', 'Writing Implements'],
    startingSpells: ['Fireball', 'Sleep', 'Lightning Bolt'],
    startingBlessings: 0,
    startingHealings: 0,
    defaultArmorMod: 0,
    defaultShieldMod: 0,
    defaultWeaponMod: -1,
    defaultGold: 14,
  },
  barbarian: {
    id: 'barbarian',
    label: 'Barbarian',
    baseLife: 7,
    meleeLevelScaling: 'full',
    rangedLevelScaling: 'full',
    defenseLevelScaling: 'none',
    defaultTraits:
      '+L to Attack. Rage (once/adventure: roll 3 dice pick best; 2 wounds vs Boss). Illiterate.',
    startingEquipment: ['Light Armor', 'Shield', 'Hand Weapon'],
    startingSpells: [],
    startingBlessings: 0,
    startingHealings: 0,
    defaultArmorMod: 1,
    defaultShieldMod: 1,
    defaultWeaponMod: 0,
    defaultGold: 3,
  },
  elf: {
    id: 'elf',
    label: 'Elf',
    baseLife: 4,
    meleeLevelScaling: 'full',
    rangedLevelScaling: 'full',
    defenseLevelScaling: 'none',
    defaultTraits:
      '+L to Attack & spellcasting (in light/no armor). +1 Attack/Spell vs Orcs. 1 spell per Level.',
    startingEquipment: ['Light Armor', 'Hand Weapon', 'Bow'],
    startingSpells: ['Blessing'],
    startingBlessings: 0,
    startingHealings: 0,
    defaultArmorMod: 1,
    defaultShieldMod: 0,
    defaultWeaponMod: 0,
    defaultGold: 7,
  },
  dwarf: {
    id: 'dwarf',
    label: 'Dwarf',
    baseLife: 5,
    meleeLevelScaling: 'full',
    rangedLevelScaling: 'none',
    defenseLevelScaling: 'none',
    defaultTraits:
      '+L to Melee Attack. +1 Defense vs Trolls/Ogres/Giants. +1 Attack vs Goblins. Smells gold.',
    startingEquipment: ['Light Armor', 'Shield', 'Hand Weapon (Axe)'],
    startingSpells: [],
    startingBlessings: 0,
    startingHealings: 0,
    defaultArmorMod: 1,
    defaultShieldMod: 1,
    defaultWeaponMod: 0,
    defaultGold: 10,
  },
  halfling: {
    id: 'halfling',
    label: 'Halfling',
    baseLife: 3,
    meleeLevelScaling: 'none',
    rangedLevelScaling: 'none',
    defenseLevelScaling: 'full',
    defaultTraits:
      '+L to Defense vs Giants/Trolls/Ogres. Luck points (L+1/adventure to reroll/escape). Sling.',
    startingEquipment: ['Light Hand Weapon', 'Sling', 'Snacks'],
    startingSpells: [],
    startingBlessings: 0,
    startingHealings: 0,
    defaultArmorMod: 0,
    defaultShieldMod: 0,
    defaultWeaponMod: -1,
    defaultGold: 7,
  },
  custom: {
    id: 'custom',
    label: 'Custom Class',
    baseLife: 4,
    meleeLevelScaling: 'full',
    rangedLevelScaling: 'none',
    defenseLevelScaling: 'none',
    defaultTraits: 'Custom class traits and special rules.',
    startingEquipment: ['Hand Weapon'],
    startingSpells: [],
    startingBlessings: 0,
    startingHealings: 0,
    defaultArmorMod: 0,
    defaultShieldMod: 0,
    defaultWeaponMod: 0,
    defaultGold: 5,
  },
};

function getLevelBonus(level: number, scaling: 'full' | 'half' | 'none'): number {
  if (scaling === 'full') return level;
  if (scaling === 'half') return Math.floor(level / 2);
  return 0;
}

export function computeCharacterStats(char: Character) {
  const preset = CLASS_PRESETS[char.classId] ?? CLASS_PRESETS.custom;
  const meleeLevel = getLevelBonus(char.level, preset.meleeLevelScaling);
  const rangedLevel = getLevelBonus(char.level, preset.rangedLevelScaling);
  const defLevel = getLevelBonus(char.level, preset.defenseLevelScaling);

  const meleeMain =
    char.meleeOverride !== null
      ? char.meleeOverride
      : char.meleeWeaponMod + char.meleeTraitMod + meleeLevel;

  const meleeOff =
    char.offHandOverride !== null
      ? char.offHandOverride
      : char.offHandWeaponMod + char.offHandTraitMod + meleeLevel;

  const ranged =
    char.rangedOverride !== null
      ? char.rangedOverride
      : char.rangedWeaponMod + char.rangedTraitMod + rangedLevel;

  const defense =
    char.defenseOverride !== null
      ? char.defenseOverride
      : char.armorMod + char.shieldMod + char.defenseTraitMod + defLevel;

  return {
    meleeMain,
    meleeOff,
    ranged,
    defense,
    meleeLevel,
    rangedLevel,
    defLevel,
  };
}

export function createCharacterFromPreset(
  id: string,
  name: string,
  classId: CharacterClassId,
  hasLantern = false
): Character {
  const preset = CLASS_PRESETS[classId];
  const level = 1;
  const maxLife = preset.baseLife + level;
  return {
    id,
    name,
    classId,
    level,
    maxLife,
    currentLife: maxLife,
    status: 'alive',
    meleeWeaponMod: preset.defaultWeaponMod,
    meleeTraitMod: 0,
    meleeOverride: null,
    offHandWeaponMod: 0,
    offHandTraitMod: 0,
    offHandOverride: null,
    rangedWeaponMod: 0,
    rangedTraitMod: 0,
    rangedOverride: null,
    armorMod: preset.defaultArmorMod,
    shieldMod: preset.defaultShieldMod,
    defenseTraitMod: 0,
    defenseOverride: null,
    lantern: hasLantern,
    bandaged: false,
    blessings: preset.startingBlessings,
    healings: preset.startingHealings,
    clues: 0,
    gold: preset.defaultGold,
    gems: 0,
    jewelry: 0,
    spells: preset.startingSpells.map((s, idx) => ({
      id: `${id}-sp-${idx}`,
      name: s,
      used: false,
    })),
    equipment: [...preset.startingEquipment],
    traits: preset.defaultTraits,
    personalQuest: '',
    notes: '',
  };
}
