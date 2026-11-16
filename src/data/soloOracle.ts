export type OracleLikelihood =
  | 'very_likely'
  | 'likely'
  | 'even'
  | 'unlikely'
  | 'very_unlikely';

export const LIKELIHOOD_LABELS: Record<OracleLikelihood, string> = {
  very_likely: 'Very Likely (+2)',
  likely: 'Likely (+1)',
  even: '50 / 50 (0)',
  unlikely: 'Unlikely (-1)',
  very_unlikely: 'Very Unlikely (-2)',
};

const LIKELIHOOD_MOD: Record<OracleLikelihood, number> = {
  very_likely: 2,
  likely: 1,
  even: 0,
  unlikely: -1,
  very_unlikely: -2,
};

/**
 * Solo Game Master's Guide style 2d6 Oracle avoiding plain dead-end Yes/No.
 */
export function rollSoloOracle(likelihood: OracleLikelihood): {
  rawDice: [number, number];
  total: number;
  answer: string;
} {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const total = d1 + d2 + LIKELIHOOD_MOD[likelihood];

  let answer: string;
  if (total >= 11) answer = 'Yes, and... (amplified / extra boon)';
  else if (total >= 9) answer = 'Yes';
  else if (total >= 7) answer = 'Yes, but... (with a complication)';
  else if (total >= 5) answer = 'No, but... (a silver lining or clue)';
  else if (total >= 3) answer = 'No';
  else answer = 'No, and... (worsened / unexpected hazard)';

  return { rawDice: [d1, d2], total, answer };
}

const ACTION_VERBS = [
  'Uncover',
  'Betray',
  'Guard',
  'Shatter',
  'Follow',
  'Seal',
  'Awaken',
  'Barter',
  'Flee',
  'Sacrifice',
  'Decode',
  'Whisper',
  'Conceal',
  'Purify',
  'Claim',
  'Ambush',
  'Restore',
  'Dread',
  'Forge',
  'Abandon',
  'Summon',
  'Track',
  'Inspect',
  'Defy',
];

const THEME_NOUNS = [
  'Oath',
  'Relic',
  'Shadow',
  'Passage',
  'Heirloom',
  'Blight',
  'Key',
  'Cult',
  'Debt',
  'Beacon',
  'Idol',
  'Prisoner',
  'Map',
  'Ashes',
  'Pact',
  'Crypt',
  'Crown',
  'Rumor',
  'Poison',
  'Echo',
  'Sanctuary',
  'Toll',
  'Sigil',
  'Rival',
];

const TWIST_SPARKS = [
  'An old ally or faction appears with conflicting motives.',
  'The environment shifts: water rises, ceiling groans, or lantern flickers.',
  'What seemed dead or empty is actually watching.',
  'A hidden cost or moral dilemma attaches to the reward.',
  'A distant sound signals patrols or rival delvers nearby.',
  'An item or clue points back to an earlier room or thread.',
  'The true danger is not the monster, but what it was guarding.',
  'Time pressure: something will happen in 2 turns unless stopped.',
];

export function rollSparkPair(): { verb: string; noun: string; twist: string } {
  const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
  const noun = THEME_NOUNS[Math.floor(Math.random() * THEME_NOUNS.length)];
  const twist = TWIST_SPARKS[Math.floor(Math.random() * TWIST_SPARKS.length)];
  return { verb, noun, twist };
}
