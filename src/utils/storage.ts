import { CLASS_PRESETS, computeCharacterStats, createCharacterFromPreset } from '../data/classes4ad';
import { Campaign, DungeonMap } from '../types/campaign';

const STORAGE_KEY = 'four_against_darkness_campaigns_v1';
const ACTIVE_ID_KEY = 'four_against_darkness_active_id_v1';

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createBlankDungeon(name = 'Level 1 — The Sunken Crypt', depth = 1): DungeonMap {
  return {
    id: uid('map'),
    name,
    depth,
    cleared: false,
    mode: 'grid',
    cols: 20,
    rows: 28,
    cells: {
      '26,9': 'corridor',
      '26,10': 'corridor',
      '25,9': 'room',
      '25,10': 'room',
      '24,9': 'room',
      '24,10': 'room',
    },
    stamps: {
      '26,9': 'stairs_up',
    },
    edges: {
      'h:26:9': 'door',
      'h:27:9': 'open',
      'h:27:10': 'open',
    },
    pins: [
      {
        id: uid('pin'),
        label: '1',
        title: 'Entrance Hall',
        notes: 'Damp stone steps descend into darkness. Lantern lit.',
        x: 9,
        y: 25,
      },
    ],
    partyPos: { x: 9, y: 25 },
    imageDataUrl: null,
    notes: '',
  };
}

export function createStarterCampaign(name = 'Expedition of the Crimson Lantern'): Campaign {
  const now = new Date().toISOString();
  const starterMap = createBlankDungeon('Level 1 — The Sunken Crypt', 1);
  const threadId = uid('thread');

  return {
    id: uid('camp'),
    name,
    createdAt: now,
    updatedAt: now,
    sessionNumber: 1,
    characters: [
      createCharacterFromPreset(uid('char'), 'Aldric', 'warrior', true),
      createCharacterFromPreset(uid('char'), 'Seraphina', 'cleric', false),
      createCharacterFromPreset(uid('char'), 'Vex', 'rogue', false),
      createCharacterFromPreset(uid('char'), 'Mordecai', 'wizard', false),
    ],
    currentDungeonId: starterMap.id,
    dungeons: [starterMap],
    threads: [
      {
        id: threadId,
        type: 'quest',
        name: 'Recover the Abbot’s Brass Astrolabe',
        status: 'active',
        notes: 'Rumor says it lies beyond the flooded ossuary on Level 1.',
      },
    ],
    journal: [
      {
        id: uid('log'),
        createdAt: now,
        sessionNumber: 1,
        entryType: 'narrative',
        title: 'Descent into the Sunken Crypt',
        content:
          'Aldric raises the lantern at the bottom of the slick entrance stairs. The air smells of iron and wet mortar. Vex checks the heavy oak door ahead while Seraphina murmurs a prayer.',
        linkedMapId: starterMap.id,
        linkedPinId: starterMap.pins[0].id,
        threadIds: [threadId],
      },
    ],
  };
}

export function loadCampaigns(): { campaigns: Campaign[]; activeId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeRaw = localStorage.getItem(ACTIVE_ID_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Campaign[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeId =
          activeRaw && parsed.some((c) => c.id === activeRaw) ? activeRaw : parsed[0].id;
        return { campaigns: parsed, activeId };
      }
    }
  } catch {
    // Fallback to starter campaign
  }
  const starter = createStarterCampaign();
  return { campaigns: [starter], activeId: starter.id };
}

export function saveCampaigns(campaigns: Campaign[], activeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    localStorage.setItem(ACTIVE_ID_KEY, activeId);
  } catch (err) {
    console.error('Failed to save campaigns to localStorage:', err);
  }
}

export function exportCampaignToMarkdown(campaign: Campaign): string {
  const lines: string[] = [];
  lines.push(`# ${campaign.name}`);
  lines.push(`*Session ${campaign.sessionNumber} · Last updated ${new Date(campaign.updatedAt).toLocaleString()}*\n`);

  lines.push(`## Party (Marching Order)`);
  campaign.characters.forEach((c, i) => {
    const stats = computeCharacterStats(c);
    const className =
      c.classId === 'custom' && c.customClassName
        ? c.customClassName
        : CLASS_PRESETS[c.classId].label;
    const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
    lines.push(
      `### ${i + 1}. ${c.name} — Lvl ${c.level} ${className} (${c.status.toUpperCase()})`
    );
    lines.push(
      `- **Life:** ${c.currentLife}/${c.maxLife} | **Melee:** ${fmt(stats.meleeMain)} | **Ranged:** ${fmt(stats.ranged)} | **Defense:** ${fmt(stats.defense)}`
    );
    lines.push(
      `- **Resources:** ${c.gold}gp, ${c.gems} gems, ${c.jewelry} jewelry | Clues: ${c.clues} | Blessings: ${c.blessings} | Healings: ${c.healings}`
    );
    if (c.lantern) lines.push(`- *Carrying Lantern*`);
    if (c.traits) lines.push(`- **Traits:** ${c.traits}`);
    if (c.equipment.length) lines.push(`- **Equipment:** ${c.equipment.join(', ')}`);
    if (c.spells.length) {
      lines.push(
        `- **Spells:** ${c.spells.map((s) => (s.used ? `~~${s.name}~~` : s.name)).join(', ')}`
      );
    }
    if (c.personalQuest) lines.push(`- **Quest:** ${c.personalQuest}`);
    lines.push('');
  });

  if (campaign.threads.length) {
    lines.push(`## Story Threads, NPCs & Quests`);
    campaign.threads.forEach((t) => {
      lines.push(`- **[${t.type.toUpperCase()} · ${t.status}] ${t.name}**${t.notes ? ` — ${t.notes}` : ''}`);
    });
    lines.push('');
  }

  lines.push(`## Dungeon Maps`);
  campaign.dungeons.forEach((d) => {
    lines.push(`### ${d.name} (Depth ${d.depth}${d.cleared ? ' · CLEARED' : ''})`);
    if (d.notes) lines.push(`${d.notes}\n`);
    if (d.pins.length) {
      d.pins.forEach((p) => {
        lines.push(`- **Room ${p.label}${p.title ? `: ${p.title}` : ''}** — ${p.notes || 'No notes'}`);
      });
    }
    lines.push('');
  });

  lines.push(`## Campaign Journal`);
  const sorted = [...campaign.journal].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
  sorted.forEach((entry) => {
    const mapName = entry.linkedMapId
      ? campaign.dungeons.find((d) => d.id === entry.linkedMapId)?.name
      : null;
    lines.push(
      `### [Session ${entry.sessionNumber} · ${entry.entryType.toUpperCase()}] ${entry.title || 'Untitled Entry'}`
    );
    if (mapName) lines.push(`*Location: ${mapName}*`);
    if (entry.oracleData) {
      lines.push(
        `> **Oracle (${entry.oracleData.likelihood}):** "${entry.oracleData.question}" → **${entry.oracleData.answer}** (Roll: ${entry.oracleData.roll})`
      );
    }
    if (entry.diceRollSummary) {
      lines.push(`> **Dice:** ${entry.diceRollSummary}`);
    }
    if (entry.content) lines.push(`\n${entry.content}`);
    lines.push('');
  });

  return lines.join('\n');
}

export function resizeImageToDataUrl(file: File, maxDim = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
