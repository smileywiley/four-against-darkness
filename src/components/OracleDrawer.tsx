import { useState } from 'react';
import { Dices, X } from 'lucide-react';
import {
  LIKELIHOOD_LABELS,
  OracleLikelihood,
  rollSoloOracle,
} from '../data/soloOracle';
import { JournalEntry } from '../types/campaign';
import { uid } from '../utils/storage';

interface OracleDrawerProps {
  open: boolean;
  sessionNumber: number;
  currentDungeonId: string;
  onClose: () => void;
  onLogToJournal: (entry: JournalEntry) => void;
}

interface DiceHistoryItem {
  id: string;
  label: string;
  detail: string;
  total: number;
}

export function OracleDrawer({
  open,
  sessionNumber,
  currentDungeonId,
  onClose,
  onLogToJournal,
}: OracleDrawerProps) {
  const [diceHistory, setDiceHistory] = useState<DiceHistoryItem[]>([]);

  // Solo GMG Oracle state
  const [question, setQuestion] = useState('');
  const [likelihood, setLikelihood] = useState<OracleLikelihood>('even');
  const [oracleResult, setOracleResult] = useState<{
    question: string;
    likelihood: string;
    roll: number;
    answer: string;
  } | null>(null);

  if (!open) return null;

  const rollD6 = (count: number) => {
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    setDiceHistory((prev) => [
      { id: uid('roll'), label: `${count}d6`, detail: `[${rolls.join(', ')}]`, total },
      ...prev.slice(0, 11),
    ]);
  };

  const rollExplodingD6 = () => {
    const rolls: number[] = [];
    let current = Math.floor(Math.random() * 6) + 1;
    rolls.push(current);
    while (current === 6 && rolls.length < 10) {
      current = Math.floor(Math.random() * 6) + 1;
      rolls.push(current);
    }
    const total = rolls.reduce((a, b) => a + b, 0);
    setDiceHistory((prev) => [
      { id: uid('roll'), label: 'Exploding d6', detail: `[${rolls.join(' + ')}]`, total },
      ...prev.slice(0, 11),
    ]);
  };

  const rollD66 = () => {
    const tens = Math.floor(Math.random() * 6) + 1;
    const ones = Math.floor(Math.random() * 6) + 1;
    const total = tens * 10 + ones;
    setDiceHistory((prev) => [
      { id: uid('roll'), label: 'd66', detail: `${tens}${ones}`, total },
      ...prev.slice(0, 11),
    ]);
  };

  const handleAskOracle = () => {
    const res = rollSoloOracle(likelihood);
    setOracleResult({
      question: question.trim() || 'What happens / Is this true?',
      likelihood: LIKELIHOOD_LABELS[likelihood],
      roll: res.total,
      answer: res.answer,
    });
  };

  return (
    <aside
      className="ledger-panel"
      style={{
        position: 'fixed',
        top: '56px',
        right: '14px',
        bottom: '14px',
        width: '360px',
        maxWidth: 'calc(100vw - 28px)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 28px rgba(45, 24, 16, 0.32)',
      }}
    >
      <div
        className="ledger-rule-double"
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--paper-recessed)',
        }}
      >
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.05rem' }}>
          <Dices size={18} /> 4AD Dice & Solo Oracle
        </h3>
        <button type="button" className="ink-btn ink-btn-sm" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* 4AD Dice Roller */}
        <div
          style={{
            border: '1px solid var(--ink-crimson-soft)',
            borderRadius: '4px',
            padding: '10px',
            background: 'rgba(255,250,238,0.55)',
          }}
        >
          <strong style={{ color: 'var(--ink-crimson)', display: 'block', marginBottom: '8px' }}>
            4AD Dice Roller
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
            <button type="button" className="ink-btn ink-btn-sm" onClick={() => rollD6(1)}>
              d6
            </button>
            <button type="button" className="ink-btn ink-btn-sm" onClick={() => rollD6(2)}>
              2d6
            </button>
            <button type="button" className="ink-btn ink-btn-sm" onClick={rollD66}>
              d66
            </button>
            <button type="button" className="ink-btn ink-btn-sm" onClick={rollExplodingD6} title="Rerolls on 6">
              d6!
            </button>
          </div>

          {diceHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '130px', overflowY: 'auto' }}>
              {diceHistory.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.84rem',
                    padding: '3px 6px',
                    borderRadius: '3px',
                    background: idx === 0 ? 'rgba(124, 45, 32, 0.12)' : 'transparent',
                  }}
                >
                  <span>
                    <strong className="mono">{item.label}</strong>{' '}
                    <span className="mono" style={{ color: 'var(--ink-secondary)' }}>
                      {item.detail}
                    </span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong className="mono" style={{ color: 'var(--ink-crimson)', fontSize: '0.95rem' }}>
                      {item.total}
                    </strong>
                    <button
                      type="button"
                      className="ink-btn ink-btn-sm"
                      style={{ padding: '1px 5px', fontSize: '0.72rem' }}
                      onClick={() =>
                        onLogToJournal({
                          id: uid('log'),
                          createdAt: new Date().toISOString(),
                          sessionNumber,
                          entryType: 'narrative',
                          title: `Dice Roll (${item.label} → ${item.total})`,
                          content: '',
                          diceRollSummary: `${item.label} ${item.detail} = ${item.total}`,
                          linkedMapId: currentDungeonId,
                          threadIds: [],
                        })
                      }
                    >
                      Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Solo GMG Oracle */}
        <div
          style={{
            border: '1px solid var(--ink-crimson-soft)',
            borderRadius: '4px',
            padding: '10px',
            background: 'rgba(255,250,238,0.55)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <strong style={{ color: 'var(--ink-crimson)' }}>Solo GM Guide Oracle</strong>
          <input
            className="ink-input"
            placeholder="Ask an open or Yes/No question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskOracle();
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <select
              className="ink-select"
              style={{ flex: 1 }}
              value={likelihood}
              onChange={(e) => setLikelihood(e.target.value as OracleLikelihood)}
            >
              {Object.entries(LIKELIHOOD_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
            <button type="button" className="ink-btn ink-btn-primary ink-btn-sm" onClick={handleAskOracle}>
              Ask Oracle
            </button>
          </div>

          {oracleResult && (
            <div
              style={{
                background: 'var(--paper-recessed)',
                border: '1px solid var(--ink-crimson)',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
            >
              <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
                <em>{oracleResult.question}</em>
              </div>
              <div className="mono" style={{ fontWeight: 700, color: 'var(--ink-crimson)', fontSize: '0.94rem' }}>
                {oracleResult.answer} (Roll: {oracleResult.roll})
              </div>
              <button
                type="button"
                className="ink-btn ink-btn-sm"
                onClick={() => {
                  onLogToJournal({
                    id: uid('log'),
                    createdAt: new Date().toISOString(),
                    sessionNumber,
                    entryType: 'oracle',
                    title: oracleResult.question,
                    content: '',
                    oracleData: oracleResult,
                    linkedMapId: currentDungeonId,
                    threadIds: [],
                  });
                  setQuestion('');
                }}
              >
                Log Oracle to Journal
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
