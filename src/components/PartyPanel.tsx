import { useState } from 'react';
import { Flame, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { CLASS_PRESETS, computeCharacterStats } from '../data/classes4ad';
import { Character, CharacterClassId, CharacterStatus } from '../types/campaign';
import { uid } from '../utils/storage';

interface PartyPanelProps {
  characters: Character[];
  selectedCharId: string | null;
  onUpdateChar: (updated: Character) => void;
}

export function PartyPanel({ characters, selectedCharId, onUpdateChar }: PartyPanelProps) {
  const [newSpellByChar, setNewSpellByChar] = useState<Record<string, string>>({});
  const [newEquipByChar, setNewEquipByChar] = useState<Record<string, string>>({});

  const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  const handleClassChange = (char: Character, nextClass: CharacterClassId) => {
    const preset = CLASS_PRESETS[nextClass];
    const nextMax = preset.baseLife + char.level;
    onUpdateChar({
      ...char,
      classId: nextClass,
      maxLife: nextMax,
      currentLife: Math.min(char.currentLife, nextMax),
      traits: preset.defaultTraits,
      armorMod: preset.defaultArmorMod,
      shieldMod: preset.defaultShieldMod,
      meleeWeaponMod: preset.defaultWeaponMod,
    });
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
        gap: '12px',
        paddingRight: '4px',
      }}
    >
      {characters.map((char, idx) => {
        const stats = computeCharacterStats(char);
        const isHighlighted = selectedCharId === char.id;

        return (
          <article
            key={char.id}
            className="ledger-panel"
            style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderWidth: isHighlighted ? '2px' : '1.5px',
              boxShadow: isHighlighted
                ? '0 0 0 2px rgba(124, 45, 32, 0.2), var(--shadow-paper)'
                : 'var(--shadow-paper)',
            }}
          >
            {/* Header: Rank, Name, Class, Level, Status */}
            <div
              className="ledger-rule-double"
              style={{
                paddingBottom: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '170px' }}>
                <span
                  className="mono"
                  style={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    padding: '2px 6px',
                    background: 'var(--ink-crimson)',
                    color: '#fffaf0',
                    borderRadius: '3px',
                  }}
                >
                  #{idx + 1}
                </span>
                <input
                  className="ink-input"
                  value={char.name}
                  placeholder="Character Name"
                  style={{ fontWeight: 700, fontSize: '1.02rem', flex: 1, minWidth: '100px' }}
                  onChange={(e) => onUpdateChar({ ...char, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <select
                  className="ink-select"
                  value={char.classId}
                  onChange={(e) => handleClassChange(char, e.target.value as CharacterClassId)}
                >
                  {Object.values(CLASS_PRESETS).map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>

                {char.classId === 'custom' && (
                  <input
                    className="ink-input"
                    placeholder="Custom Class"
                    value={char.customClassName ?? ''}
                    style={{ width: '110px' }}
                    onChange={(e) => onUpdateChar({ ...char, customClassName: e.target.value })}
                  />
                )}

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                  Lvl
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="ink-input mono"
                    style={{ width: '50px', textAlign: 'center' }}
                    value={char.level}
                    onChange={(e) => {
                      const nextLvl = Math.max(1, Number(e.target.value) || 1);
                      const preset = CLASS_PRESETS[char.classId];
                      const nextMax = preset.baseLife + nextLvl;
                      onUpdateChar({
                        ...char,
                        level: nextLvl,
                        maxLife: nextMax,
                        currentLife: Math.min(char.currentLife + (nextLvl > char.level ? 1 : 0), nextMax),
                      });
                    }}
                  />
                </label>

                <select
                  className="ink-select"
                  value={char.status}
                  onChange={(e) => onUpdateChar({ ...char, status: e.target.value as CharacterStatus })}
                >
                  <option value="alive">Alive</option>
                  <option value="dead">Dead</option>
                  <option value="stone">Stone</option>
                </select>
              </div>
            </div>

            {/* Life & Conditions Row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                background: 'rgba(231, 209, 163, 0.35)',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid var(--ink-crimson-soft)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ color: 'var(--ink-crimson)', fontSize: '0.9rem' }}>Life:</strong>
                <input
                  type="number"
                  min={0}
                  max={char.maxLife}
                  className="ink-input mono"
                  style={{ width: '50px', textAlign: 'center' }}
                  value={char.currentLife}
                  onChange={(e) =>
                    onUpdateChar({ ...char, currentLife: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
                <span>/</span>
                <input
                  type="number"
                  min={1}
                  className="ink-input mono"
                  style={{ width: '50px', textAlign: 'center' }}
                  value={char.maxLife}
                  onChange={(e) =>
                    onUpdateChar({ ...char, maxLife: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={char.lantern}
                    onChange={(e) => onUpdateChar({ ...char, lantern: e.target.checked })}
                  />
                  <Flame size={14} style={{ color: 'var(--ink-amber)' }} />
                  Lantern
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={char.bandaged}
                    onChange={(e) => onUpdateChar({ ...char, bandaged: e.target.checked })}
                  />
                  Bandaged
                </label>
              </div>
            </div>

            {/* Attack & Defense Ledger Table */}
            <div
              style={{
                border: '1px solid var(--ink-crimson-soft)',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '0.84rem',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '78px minmax(0, 1fr) minmax(0, 1fr) 40px 48px',
                  gap: '6px',
                  alignItems: 'center',
                  fontWeight: 700,
                  color: 'var(--ink-crimson)',
                  borderBottom: '1px solid var(--ink-crimson-soft)',
                  paddingBottom: '4px',
                  marginBottom: '4px',
                }}
              >
                <span>Combat</span>
                <span style={{ textAlign: 'center' }}>Wpn / Arm</span>
                <span style={{ textAlign: 'center' }}>Trait / Shd</span>
                <span style={{ textAlign: 'center' }}>+Lvl</span>
                <span style={{ textAlign: 'center' }}>Total</span>
              </div>

              {/* Melee Main */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '78px minmax(0, 1fr) minmax(0, 1fr) 40px 48px',
                  gap: '6px',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span>Melee Main</span>
                <input
                  type="number"
                  className="ink-input mono"
                  style={{ width: '100%', minWidth: 0, maxWidth: '64px', justifySelf: 'center', textAlign: 'center', padding: '2px 4px' }}
                  value={char.meleeWeaponMod}
                  onChange={(e) => onUpdateChar({ ...char, meleeWeaponMod: Number(e.target.value) || 0 })}
                />
                <input
                  type="number"
                  className="ink-input mono"
                  style={{ width: '100%', minWidth: 0, maxWidth: '64px', justifySelf: 'center', textAlign: 'center', padding: '2px 4px' }}
                  value={char.meleeTraitMod}
                  onChange={(e) => onUpdateChar({ ...char, meleeTraitMod: Number(e.target.value) || 0 })}
                />
                <span className="mono" style={{ textAlign: 'center', color: 'var(--ink-secondary)' }}>
                  {fmt(stats.meleeLevel)}
                </span>
                <strong className="mono" style={{ textAlign: 'center', color: 'var(--ink-crimson)' }}>
                  {fmt(stats.meleeMain)}
                </strong>
              </div>

              {/* Ranged */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '78px minmax(0, 1fr) minmax(0, 1fr) 40px 48px',
                  gap: '6px',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span>Ranged</span>
                <input
                  type="number"
                  className="ink-input mono"
                  style={{ width: '100%', minWidth: 0, maxWidth: '64px', justifySelf: 'center', textAlign: 'center', padding: '2px 4px' }}
                  value={char.rangedWeaponMod}
                  onChange={(e) => onUpdateChar({ ...char, rangedWeaponMod: Number(e.target.value) || 0 })}
                />
                <input
                  type="number"
                  className="ink-input mono"
                  style={{ width: '100%', minWidth: 0, maxWidth: '64px', justifySelf: 'center', textAlign: 'center', padding: '2px 4px' }}
                  value={char.rangedTraitMod}
                  onChange={(e) => onUpdateChar({ ...char, rangedTraitMod: Number(e.target.value) || 0 })}
                />
                <span className="mono" style={{ textAlign: 'center', color: 'var(--ink-secondary)' }}>
                  {fmt(stats.rangedLevel)}
                </span>
                <strong className="mono" style={{ textAlign: 'center', color: 'var(--ink-crimson)' }}>
                  {fmt(stats.ranged)}
                </strong>
              </div>

              {/* Defense */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '78px minmax(0, 1fr) minmax(0, 1fr) 40px 48px',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <span>Defense</span>
                <input
                  type="number"
                  className="ink-input mono"
                  style={{ width: '100%', minWidth: 0, maxWidth: '64px', justifySelf: 'center', textAlign: 'center', padding: '2px 4px' }}
                  title="Armor modifier"
                  value={char.armorMod}
                  onChange={(e) => onUpdateChar({ ...char, armorMod: Number(e.target.value) || 0 })}
                />
                <input
                  type="number"
                  className="ink-input mono"
                  style={{ width: '100%', minWidth: 0, maxWidth: '64px', justifySelf: 'center', textAlign: 'center', padding: '2px 4px' }}
                  title="Shield + Trait modifier"
                  value={char.shieldMod + char.defenseTraitMod}
                  onChange={(e) =>
                    onUpdateChar({
                      ...char,
                      shieldMod: Number(e.target.value) || 0,
                      defenseTraitMod: 0,
                    })
                  }
                />
                <span className="mono" style={{ textAlign: 'center', color: 'var(--ink-secondary)' }}>
                  {fmt(stats.defLevel)}
                </span>
                <strong className="mono" style={{ textAlign: 'center', color: 'var(--ink-crimson)' }}>
                  {fmt(stats.defense)}
                </strong>
              </div>
            </div>

            {/* Resources: Blessings, Healings, Clues, Gold, Gems, Jewelry */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                fontSize: '0.82rem',
              }}
            >
              {(
                [
                  ['Blessings', 'blessings'],
                  ['Healings', 'healings'],
                  ['Clues', 'clues'],
                  ['Gold', 'gold'],
                  ['Gems', 'gems'],
                  ['Jewelry', 'jewelry'],
                ] as const
              ).map(([label, key]) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px',
                    background: 'rgba(255,250,238,0.5)',
                    border: '1px solid var(--ink-crimson-soft)',
                    borderRadius: '3px',
                    padding: '3px 6px',
                  }}
                >
                  <span>{label}</span>
                  <input
                    type="number"
                    min={0}
                    className="ink-input mono"
                    style={{ width: '48px', padding: '1px 3px', textAlign: 'center' }}
                    value={char[key]}
                    onChange={(e) =>
                      onUpdateChar({ ...char, [key]: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </label>
              ))}
            </div>

            {/* Spells & Scrolls */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.86rem', color: 'var(--ink-crimson)' }}>
                  Spells, Scrolls & Powers
                </strong>
                {char.spells.length > 0 && (
                  <button
                    type="button"
                    className="ink-btn ink-btn-sm"
                    onClick={() =>
                      onUpdateChar({
                        ...char,
                        spells: char.spells.map((s) => ({ ...s, used: false })),
                      })
                    }
                    title="Refresh all spells for a new adventure"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '5px' }}>
                {char.spells.map((sp) => (
                  <span
                    key={sp.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid var(--ink-crimson-soft)',
                      background: sp.used ? 'rgba(124,45,32,0.08)' : '#fffcf4',
                      fontSize: '0.82rem',
                      textDecoration: sp.used ? 'line-through' : 'none',
                      opacity: sp.used ? 0.65 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sp.used}
                      onChange={(e) =>
                        onUpdateChar({
                          ...char,
                          spells: char.spells.map((item) =>
                            item.id === sp.id ? { ...item, used: e.target.checked } : item
                          ),
                        })
                      }
                    />
                    {sp.name}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateChar({
                          ...char,
                          spells: char.spells.filter((item) => item.id !== sp.id),
                        })
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--ink-muted)',
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  className="ink-input"
                  placeholder="Add spell or scroll..."
                  style={{ flex: 1, padding: '3px 6px', fontSize: '0.82rem' }}
                  value={newSpellByChar[char.id] ?? ''}
                  onChange={(e) => setNewSpellByChar({ ...newSpellByChar, [char.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (newSpellByChar[char.id] ?? '').trim()) {
                      onUpdateChar({
                        ...char,
                        spells: [
                          ...char.spells,
                          { id: uid('sp'), name: newSpellByChar[char.id].trim(), used: false },
                        ],
                      });
                      setNewSpellByChar({ ...newSpellByChar, [char.id]: '' });
                    }
                  }}
                />
                <button
                  type="button"
                  className="ink-btn ink-btn-sm"
                  onClick={() => {
                    const val = (newSpellByChar[char.id] ?? '').trim();
                    if (!val) return;
                    onUpdateChar({
                      ...char,
                      spells: [...char.spells, { id: uid('sp'), name: val, used: false }],
                    });
                    setNewSpellByChar({ ...newSpellByChar, [char.id]: '' });
                  }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <strong style={{ fontSize: '0.86rem', color: 'var(--ink-crimson)', display: 'block', marginBottom: '4px' }}>
                Equipment
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '5px' }}>
                {char.equipment.map((eq, i) => (
                  <span
                    key={`${eq}-${i}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid var(--ink-crimson-soft)',
                      background: '#fffcf4',
                      fontSize: '0.82rem',
                    }}
                  >
                    {eq}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateChar({
                          ...char,
                          equipment: char.equipment.filter((_, idx2) => idx2 !== i),
                        })
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--ink-muted)',
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  className="ink-input"
                  placeholder="Add gear or treasure..."
                  style={{ flex: 1, padding: '3px 6px', fontSize: '0.82rem' }}
                  value={newEquipByChar[char.id] ?? ''}
                  onChange={(e) => setNewEquipByChar({ ...newEquipByChar, [char.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (newEquipByChar[char.id] ?? '').trim()) {
                      onUpdateChar({
                        ...char,
                        equipment: [...char.equipment, newEquipByChar[char.id].trim()],
                      });
                      setNewEquipByChar({ ...newEquipByChar, [char.id]: '' });
                    }
                  }}
                />
                <button
                  type="button"
                  className="ink-btn ink-btn-sm"
                  onClick={() => {
                    const val = (newEquipByChar[char.id] ?? '').trim();
                    if (!val) return;
                    onUpdateChar({ ...char, equipment: [...char.equipment, val] });
                    setNewEquipByChar({ ...newEquipByChar, [char.id]: '' });
                  }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Traits, Quest & Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <textarea
                className="ink-textarea"
                rows={2}
                placeholder="Traits & Abilities..."
                value={char.traits}
                onChange={(e) => onUpdateChar({ ...char, traits: e.target.value })}
              />
              <input
                className="ink-input"
                placeholder="Personal Quest..."
                value={char.personalQuest}
                onChange={(e) => onUpdateChar({ ...char, personalQuest: e.target.value })}
              />
              <textarea
                className="ink-textarea"
                rows={2}
                placeholder="Character notes..."
                value={char.notes}
                onChange={(e) => onUpdateChar({ ...char, notes: e.target.value })}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
