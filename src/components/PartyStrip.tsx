import { ChevronLeft, ChevronRight, Flame, Heart, Shield, Skull, Sword } from 'lucide-react';
import { CLASS_PRESETS, computeCharacterStats } from '../data/classes4ad';
import { Character } from '../types/campaign';

interface PartyStripProps {
  characters: Character[];
  selectedCharId: string | null;
  onSelectChar: (id: string) => void;
  onUpdateChar: (updated: Character) => void;
  onMoveOrder: (index: number, dir: -1 | 1) => void;
}

export function PartyStrip({
  characters,
  selectedCharId,
  onSelectChar,
  onUpdateChar,
  onMoveOrder,
}: PartyStripProps) {
  const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  return (
    <section className="party-strip" aria-label="Party Marching Order">
      {characters.map((char, idx) => {
        const stats = computeCharacterStats(char);
        const classLabel =
          char.classId === 'custom' && char.customClassName
            ? char.customClassName
            : CLASS_PRESETS[char.classId].label;
        const isSelected = selectedCharId === char.id;
        const lifePct =
          char.maxLife > 0 ? Math.max(0, Math.min(100, (char.currentLife / char.maxLife) * 100)) : 0;

        return (
          <div
            key={char.id}
            onClick={() => onSelectChar(char.id)}
            style={{
              background: isSelected ? '#fffaf0' : 'var(--paper-surface)',
              border: isSelected
                ? '2px solid var(--ink-crimson)'
                : '1.5px solid rgba(124, 45, 32, 0.55)',
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              opacity: char.status === 'alive' ? 1 : 0.72,
              boxShadow: isSelected ? '0 0 0 2px rgba(124, 45, 32, 0.16)' : 'none',
            }}
          >
            {/* Top row: Rank, Name, Order buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                <span
                  className="mono"
                  title={idx < 2 ? 'Front Rank' : 'Back Rank'}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: idx < 2 ? 'var(--ink-crimson)' : 'var(--paper-recessed)',
                    color: idx < 2 ? '#fffaf0' : 'var(--ink-crimson)',
                    border: '1px solid var(--ink-crimson)',
                  }}
                >
                  #{idx + 1}
                </span>
                <strong
                  style={{
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textDecoration: char.status !== 'alive' ? 'line-through' : 'none',
                  }}
                >
                  {char.name || 'Unnamed'}
                </strong>
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="ink-btn ink-btn-sm"
                  style={{ padding: '1px 3px' }}
                  disabled={idx === 0}
                  title="Move forward in marching order"
                  onClick={() => onMoveOrder(idx, -1)}
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  className="ink-btn ink-btn-sm"
                  style={{ padding: '1px 3px' }}
                  disabled={idx === characters.length - 1}
                  title="Move back in marching order"
                  onClick={() => onMoveOrder(idx, 1)}
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Middle row: Class + Level + Badges */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: 'var(--ink-secondary)',
              }}
            >
              <span>
                L{char.level} {classLabel}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {char.lantern && (
                  <span title="Carrying Lantern" style={{ color: 'var(--ink-amber)', display: 'inline-flex' }}>
                    <Flame size={13} />
                  </span>
                )}
                {char.status !== 'alive' && (
                  <span title={char.status.toUpperCase()} style={{ color: 'var(--ink-dead)', display: 'inline-flex' }}>
                    <Skull size={13} />
                  </span>
                )}
                <span className="mono" title="Main Melee / Defense" style={{ display: 'inline-flex', gap: '5px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <Sword size={11} />
                    {fmt(stats.meleeMain)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <Shield size={11} />
                    {fmt(stats.defense)}
                  </span>
                </span>
              </span>
            </div>

            {/* Bottom row: Life bar & +/- */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Heart size={13} style={{ color: 'var(--ink-crimson)', flexShrink: 0 }} />
              <div
                style={{
                  flex: 1,
                  height: '7px',
                  background: 'var(--paper-recessed)',
                  border: '1px solid rgba(124, 45, 32, 0.5)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${lifePct}%`,
                    height: '100%',
                    background:
                      lifePct > 40 ? 'var(--ink-crimson)' : lifePct > 0 ? 'var(--ink-amber)' : 'var(--ink-dead)',
                    transition: 'width 0.15s',
                  }}
                />
              </div>
              <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: '34px', textAlign: 'center' }}>
                {char.currentLife}/{char.maxLife}
              </span>
              <button
                type="button"
                className="ink-btn ink-btn-sm"
                style={{ padding: '0 5px', lineHeight: 1.2 }}
                onClick={() =>
                  onUpdateChar({
                    ...char,
                    currentLife: Math.max(0, char.currentLife - 1),
                    status: char.currentLife - 1 <= 0 ? 'dead' : char.status,
                  })
                }
              >
                -
              </button>
              <button
                type="button"
                className="ink-btn ink-btn-sm"
                style={{ padding: '0 5px', lineHeight: 1.2 }}
                onClick={() =>
                  onUpdateChar({
                    ...char,
                    currentLife: Math.min(char.maxLife, char.currentLife + 1),
                    status: char.currentLife + 1 > 0 && char.status === 'dead' ? 'alive' : char.status,
                  })
                }
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
