import { Plus, Swords, Trash2 } from 'lucide-react';
import { uid } from '../utils/storage';

export type CombatMonsterType = 'minion' | 'vermin' | 'boss' | 'final_boss';

export interface CombatMonster {
  id: string;
  type: CombatMonsterType;
  name: string;
  level: number;
  attacks: number;
  count: number;
  maxCount: number;
  health: number;
  maxHealth: number;
  notes: string;
}

interface CombatPanelProps {
  monsters: CombatMonster[];
  onChange: (monsters: CombatMonster[]) => void;
}

const MONSTER_TYPE_META: Record<
  CombatMonsterType,
  {
    label: string;
    placeholder: string;
    isBoss: boolean;
    defaultLevel: number;
    defaultAttacks: number;
    defaultCount: number;
    defaultHealth: number;
    badgeBg: string;
    badgeColor: string;
  }
> = {
  minion: {
    label: 'Minion',
    placeholder: 'e.g. Goblins, Orcs, Skeletons...',
    isBoss: false,
    defaultLevel: 3,
    defaultAttacks: 1,
    defaultCount: 4,
    defaultHealth: 1,
    badgeBg: 'rgba(124, 45, 32, 0.12)',
    badgeColor: 'var(--ink-crimson)',
  },
  vermin: {
    label: 'Vermin',
    placeholder: 'e.g. Giant Rats, Vampire Bats...',
    isBoss: false,
    defaultLevel: 1,
    defaultAttacks: 1,
    defaultCount: 6,
    defaultHealth: 1,
    badgeBg: 'rgba(90, 58, 43, 0.14)',
    badgeColor: 'var(--ink-secondary)',
  },
  boss: {
    label: 'Boss',
    placeholder: 'e.g. Ogre, Medusa, Chaos Lord...',
    isBoss: true,
    defaultLevel: 5,
    defaultAttacks: 2,
    defaultCount: 1,
    defaultHealth: 5,
    badgeBg: 'rgba(148, 86, 12, 0.16)',
    badgeColor: 'var(--ink-amber)',
  },
  final_boss: {
    label: 'Final Boss',
    placeholder: 'e.g. Young Dragon, Vampire Lord...',
    isBoss: true,
    defaultLevel: 6,
    defaultAttacks: 2,
    defaultCount: 1,
    defaultHealth: 7,
    badgeBg: 'var(--ink-crimson)',
    badgeColor: 'var(--paper-elevated)',
  },
};

const MONSTER_TYPE_ORDER: CombatMonsterType[] = ['minion', 'vermin', 'boss', 'final_boss'];

export function CombatPanel({ monsters, onChange }: CombatPanelProps) {
  const addMonster = (type: CombatMonsterType) => {
    const meta = MONSTER_TYPE_META[type];
    const next: CombatMonster = {
      id: uid('foe'),
      type,
      name: '',
      level: meta.defaultLevel,
      attacks: meta.defaultAttacks,
      count: meta.defaultCount,
      maxCount: meta.defaultCount,
      health: meta.defaultHealth,
      maxHealth: meta.defaultHealth,
      notes: '',
    };
    onChange([...monsters, next]);
  };

  const updateMonster = (id: string, patch: Partial<CombatMonster>) => {
    onChange(monsters.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const removeMonster = (id: string) => {
    onChange(monsters.filter((m) => m.id !== id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <section
      className="ledger-panel"
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Combat Bar */}
      <div
        className="ledger-rule-b"
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'rgba(231, 209, 163, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Swords size={16} /> Combat Tracker
          </h2>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {MONSTER_TYPE_ORDER.map((type) => (
              <button
                key={type}
                type="button"
                className="ink-btn ink-btn-sm"
                onClick={() => addMonster(type)}
              >
                <Plus size={12} /> {MONSTER_TYPE_META[type].label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="ink-btn ink-btn-sm"
          disabled={monsters.length === 0}
          onClick={clearAll}
          title="Clear all monsters from the Combat tab"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {/* Monster Cards Area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px' }}>
        {monsters.length === 0 ? (
          <div
            style={{
              height: '100%',
              minHeight: '180px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--ink-muted)',
              textAlign: 'center',
              border: '1px dashed var(--ink-crimson-soft)',
              borderRadius: '5px',
              padding: '24px',
              background: 'rgba(255, 250, 238, 0.35)',
            }}
          >
            <Swords size={26} style={{ opacity: 0.5, color: 'var(--ink-crimson)' }} />
            <div style={{ fontWeight: 600, color: 'var(--ink-secondary)' }}>
              No active foes in combat
            </div>
            <div style={{ fontSize: '0.88rem' }}>
              Add a Minion, Vermin, Boss, or Final Boss above to track levels, counts, health, attacks, and notes.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '12px',
              alignItems: 'start',
            }}
          >
            {monsters.map((monster) => {
              const meta = MONSTER_TYPE_META[monster.type];
              const currentVal = meta.isBoss ? monster.health : monster.count;
              const maxVal = Math.max(1, meta.isBoss ? monster.maxHealth : monster.maxCount);
              const pct = Math.max(0, Math.min(100, (currentVal / maxVal) * 100));
              const isDefeated = currentVal <= 0;
              const isBelowHalf = !isDefeated && currentVal * 2 < maxVal;

              const setCurrentVal = (nextVal: number) => {
                const clamped = Math.max(0, Math.min(maxVal, nextVal));
                if (meta.isBoss) {
                  updateMonster(monster.id, { health: clamped });
                } else {
                  updateMonster(monster.id, { count: clamped });
                }
              };

              const setMaxVal = (nextMaxRaw: number) => {
                const nextMax = Math.max(1, nextMaxRaw);
                const wasAtMax = currentVal === maxVal;
                const nextCurrent = wasAtMax ? nextMax : Math.min(currentVal, nextMax);
                if (meta.isBoss) {
                  updateMonster(monster.id, { maxHealth: nextMax, health: nextCurrent });
                } else {
                  updateMonster(monster.id, { maxCount: nextMax, count: nextCurrent });
                }
              };

              return (
                <div
                  key={monster.id}
                  style={{
                    border: `1.5px solid ${
                      monster.type === 'final_boss'
                        ? 'var(--ink-crimson)'
                        : 'rgba(124, 45, 32, 0.5)'
                    }`,
                    borderRadius: '5px',
                    padding: '10px 12px',
                    background: isDefeated
                      ? 'rgba(231, 209, 163, 0.45)'
                      : 'rgba(255, 250, 238, 0.72)',
                    opacity: isDefeated ? 0.78 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px',
                  }}
                >
                  {/* Header: Type badge, editable name, remove button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        background: meta.badgeBg,
                        color: meta.badgeColor,
                        border: '1px solid rgba(124, 45, 32, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      {meta.label}
                    </span>

                    <input
                      type="text"
                      className="ink-input"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontWeight: 600,
                        padding: '3px 7px',
                        textDecoration: isDefeated ? 'line-through' : 'none',
                      }}
                      placeholder={meta.placeholder}
                      value={monster.name}
                      onChange={(e) => updateMonster(monster.id, { name: e.target.value })}
                    />

                    <button
                      type="button"
                      className="ink-btn ink-btn-sm"
                      onClick={() => removeMonster(monster.id)}
                      title={`Remove ${meta.label}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Stats Block */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '8px 10px',
                      background: 'rgba(231, 209, 163, 0.42)',
                      border: '1px solid var(--ink-crimson-soft)',
                      borderRadius: '4px',
                    }}
                  >
                    {/* Level (+ Attacks for Boss / Final Boss) */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: meta.isBoss
                          ? 'minmax(0, 1fr) minmax(0, 1fr)'
                          : 'minmax(0, 1fr)',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          Level
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="ink-btn ink-btn-sm"
                            style={{ padding: '2px 7px' }}
                            onClick={() =>
                              updateMonster(monster.id, { level: Math.max(1, monster.level - 1) })
                            }
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            className="ink-input mono"
                            style={{
                              width: '100%',
                              minWidth: 0,
                              maxWidth: '58px',
                              textAlign: 'center',
                              padding: '2px 4px',
                              fontWeight: 700,
                            }}
                            value={monster.level}
                            onChange={(e) =>
                              updateMonster(monster.id, {
                                level: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                          />
                          <button
                            type="button"
                            className="ink-btn ink-btn-sm"
                            style={{ padding: '2px 7px' }}
                            onClick={() => updateMonster(monster.id, { level: monster.level + 1 })}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {meta.isBoss && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--ink-secondary)',
                            }}
                          >
                            Attacks
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="ink-btn ink-btn-sm"
                              style={{ padding: '2px 7px' }}
                              onClick={() =>
                                updateMonster(monster.id, {
                                  attacks: Math.max(1, monster.attacks - 1),
                                })
                              }
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              className="ink-input mono"
                              style={{
                                width: '100%',
                                minWidth: 0,
                                maxWidth: '58px',
                                textAlign: 'center',
                                padding: '2px 4px',
                                fontWeight: 700,
                              }}
                              value={monster.attacks}
                              onChange={(e) =>
                                updateMonster(monster.id, {
                                  attacks: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                            />
                            <button
                              type="button"
                              className="ink-btn ink-btn-sm"
                              style={{ padding: '2px 7px' }}
                              onClick={() =>
                                updateMonster(monster.id, { attacks: monster.attacks + 1 })
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Current / Max Health or Count + Life Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color:
                              isDefeated || isBelowHalf
                                ? '#b91c1c'
                                : 'var(--ink-secondary)',
                          }}
                        >
                          {meta.isBoss ? 'Health' : 'Count'}
                          {isDefeated
                            ? ' · Defeated'
                            : isBelowHalf
                              ? meta.isBoss
                                ? ' · Below Half (Morale / -1 Lvl)'
                                : ' · Below Half (Morale)'
                              : ''}
                        </span>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="ink-btn ink-btn-sm"
                            style={{ padding: '1px 7px' }}
                            onClick={() => setCurrentVal(currentVal - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={maxVal}
                            aria-label={meta.isBoss ? 'Current Health' : 'Current Count'}
                            className="ink-input mono"
                            style={{
                              width: '48px',
                              textAlign: 'center',
                              padding: '1px 4px',
                              fontWeight: 700,
                            }}
                            value={currentVal}
                            onChange={(e) => setCurrentVal(Number(e.target.value) || 0)}
                          />
                          <button
                            type="button"
                            className="ink-btn ink-btn-sm"
                            style={{ padding: '1px 7px' }}
                            onClick={() => setCurrentVal(currentVal + 1)}
                          >
                            +
                          </button>
                          <span
                            className="mono"
                            style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', margin: '0 2px' }}
                          >
                            /
                          </span>
                          <input
                            type="number"
                            min={1}
                            aria-label={meta.isBoss ? 'Max Health' : 'Max Count'}
                            title={meta.isBoss ? 'Max Health' : 'Max Count'}
                            className="ink-input mono"
                            style={{
                              width: '48px',
                              textAlign: 'center',
                              padding: '1px 4px',
                              fontWeight: 700,
                            }}
                            value={maxVal}
                            onChange={(e) => setMaxVal(Number(e.target.value) || 1)}
                          />
                        </div>
                      </div>

                      {/* Life / Count Bar */}
                      <div
                        style={{
                          width: '100%',
                          height: '9px',
                          background: 'var(--paper-recessed)',
                          border: `1px solid ${
                            isBelowHalf || isDefeated ? '#b91c1c' : 'rgba(124, 45, 32, 0.5)'
                          }`,
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: isBelowHalf ? '#c02626' : 'var(--ink-moss)',
                            transition: 'width 0.15s, background-color 0.15s',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes textarea */}
                  <textarea
                    className="ink-textarea"
                    rows={3}
                    style={{ width: '100%', resize: 'vertical', fontSize: '0.88rem' }}
                    placeholder="Notes (morale, reactions, special attacks, treasure...)"
                    value={monster.notes}
                    onChange={(e) => updateMonster(monster.id, { notes: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
