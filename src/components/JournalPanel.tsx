import { useState } from 'react';
import { BookOpen, Bookmark, Check, Plus, Search, Swords, Trash2 } from 'lucide-react';
import {
  DungeonMap,
  JournalEntry,
  JournalEntryType,
  StoryThread,
  StoryThreadStatus,
  StoryThreadType,
} from '../types/campaign';
import { uid } from '../utils/storage';

interface JournalPanelProps {
  journal: JournalEntry[];
  threads: StoryThread[];
  dungeons: DungeonMap[];
  sessionNumber: number;
  prefillEntry?: Partial<JournalEntry> | null;
  onClearPrefill?: () => void;
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onAddThread: (thread: StoryThread) => void;
  onUpdateThread: (thread: StoryThread) => void;
  onDeleteThread: (id: string) => void;
}

const ENTRY_TYPE_LABELS: Record<JournalEntryType, string> = {
  narrative: 'Narrative',
  oracle: 'Oracle Q&A',
  discovery: 'Room / Discovery',
  combat: 'Combat',
  settlement: 'Settlement',
};

export function JournalPanel({
  journal,
  threads,
  dungeons,
  sessionNumber,
  prefillEntry,
  onClearPrefill,
  onAddEntry,
  onDeleteEntry,
  onAddThread,
  onUpdateThread,
  onDeleteThread,
}: JournalPanelProps) {
  const [activeTab, setActiveTab] = useState<'log' | 'threads'>('log');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<JournalEntryType | 'all'>('all');

  // New Journal Entry Form
  const [entryType, setEntryType] = useState<JournalEntryType>(prefillEntry?.entryType ?? 'narrative');
  const [title, setTitle] = useState(prefillEntry?.title ?? '');
  const [content, setContent] = useState(prefillEntry?.content ?? '');
  const [linkedMapId, setLinkedMapId] = useState(prefillEntry?.linkedMapId ?? '');
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);

  // Sync prefill when triggered from Map Pin
  if (prefillEntry && (prefillEntry.title !== title || prefillEntry.linkedMapId !== linkedMapId)) {
    setEntryType(prefillEntry.entryType ?? 'discovery');
    setTitle(prefillEntry.title ?? '');
    setContent(prefillEntry.content ?? '');
    setLinkedMapId(prefillEntry.linkedMapId ?? '');
    setActiveTab('log');
    onClearPrefill?.();
  }

  // New Thread Form
  const [threadType, setThreadType] = useState<StoryThreadType>('quest');
  const [threadName, setThreadName] = useState('');
  const [threadNotes, setThreadNotes] = useState('');

  const handleSaveEntry = () => {
    if (!title.trim() && !content.trim()) return;
    onAddEntry({
      id: uid('log'),
      createdAt: new Date().toISOString(),
      sessionNumber,
      entryType,
      title: title.trim() || ENTRY_TYPE_LABELS[entryType],
      content: content.trim(),
      linkedMapId: linkedMapId || undefined,
      threadIds: selectedThreadIds,
    });
    setTitle('');
    setContent('');
    setSelectedThreadIds([]);
  };

  const filteredJournal = [...journal]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((entry) => {
      if (filterType !== 'all' && entry.entryType !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          entry.title.toLowerCase().includes(q) ||
          entry.content.toLowerCase().includes(q) ||
          (entry.oracleData?.question.toLowerCase().includes(q) ?? false);
        if (!hit) return false;
      }
      return true;
    });

  return (
    <section
      className="ledger-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header Tabs */}
      <div
        className="ledger-rule-b"
        style={{
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'rgba(231, 209, 163, 0.45)',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`ink-btn ink-btn-sm ${activeTab === 'log' ? 'ink-btn-active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            <BookOpen size={13} /> Solo GM Journal ({journal.length})
          </button>
          <button
            type="button"
            className={`ink-btn ink-btn-sm ${activeTab === 'threads' ? 'ink-btn-active' : ''}`}
            onClick={() => setActiveTab('threads')}
          >
            <Bookmark size={13} /> Threads & NPCs ({threads.filter((t) => t.status === 'active').length})
          </button>
        </div>

        <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
          Session {sessionNumber}
        </span>
      </div>

      {activeTab === 'log' ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Quick Compose Box */}
          <div
            className="ledger-rule-b"
            style={{
              padding: '8px 10px',
              background: 'rgba(250, 241, 220, 0.72)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <select
                className="ink-select"
                style={{ fontSize: '0.84rem' }}
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as JournalEntryType)}
              >
                {Object.entries(ENTRY_TYPE_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>

              <input
                className="ink-input"
                style={{ flex: 1, minWidth: '140px' }}
                placeholder="Entry title (e.g., Room 3: Goblin Ambush)..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <select
                className="ink-select"
                style={{ maxWidth: '150px', fontSize: '0.82rem' }}
                value={linkedMapId}
                onChange={(e) => setLinkedMapId(e.target.value)}
              >
                <option value="">No map link</option>
                {dungeons.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              className="ink-textarea"
              rows={2}
              placeholder="Write your Solo GM narrative, encounter notes, or reflections..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                {threads
                  .filter((t) => t.status === 'active')
                  .map((t) => {
                    const active = selectedThreadIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`ink-btn ink-btn-sm ${active ? 'ink-btn-active' : ''}`}
                        style={{ fontSize: '0.74rem', padding: '1px 6px' }}
                        onClick={() =>
                          setSelectedThreadIds((prev) =>
                            active ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                          )
                        }
                      >
                        #{t.name}
                      </button>
                    );
                  })}
              </div>

              <button type="button" className="ink-btn ink-btn-primary ink-btn-sm" onClick={handleSaveEntry}>
                <Plus size={13} /> Add Entry
              </button>
            </div>
          </div>

          {/* Filter / Search Bar */}
          <div
            className="ledger-rule-b"
            style={{
              padding: '6px 10px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              background: 'rgba(231, 209, 163, 0.28)',
            }}
          >
            <Search size={14} style={{ color: 'var(--ink-crimson)' }} />
            <input
              className="ink-input"
              style={{ flex: 1, padding: '3px 6px', fontSize: '0.84rem' }}
              placeholder="Search journal entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="ink-select"
              style={{ padding: '3px 6px', fontSize: '0.82rem' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as JournalEntryType | 'all')}
            >
              <option value="all">All Types</option>
              {Object.entries(ENTRY_TYPE_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>

          {/* Journal Entries Timeline */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredJournal.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', textAlign: 'center', marginTop: '24px' }}>
                No journal entries match your filter yet.
              </p>
            ) : (
              filteredJournal.map((entry) => {
                const linkedMap = entry.linkedMapId
                  ? dungeons.find((d) => d.id === entry.linkedMapId)
                  : null;
                return (
                  <article
                    key={entry.id}
                    style={{
                      background: '#fffaf0',
                      border: '1px solid rgba(124, 45, 32, 0.4)',
                      borderLeft: '4px solid var(--ink-crimson)',
                      borderRadius: '4px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'var(--paper-recessed)',
                            color: 'var(--ink-crimson)',
                            border: '1px solid var(--ink-crimson-soft)',
                          }}
                        >
                          {entry.entryType === 'combat' && <Swords size={10} style={{ marginRight: 3 }} />}
                          {ENTRY_TYPE_LABELS[entry.entryType]}
                        </span>
                        <strong style={{ fontSize: '0.98rem', color: 'var(--ink-primary)' }}>
                          {entry.title}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                          S{entry.sessionNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          title="Delete entry"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--ink-muted)',
                            padding: 0,
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {entry.oracleData && (
                      <div
                        style={{
                          background: 'rgba(231, 209, 163, 0.4)',
                          border: '1px dashed var(--ink-crimson)',
                          borderRadius: '3px',
                          padding: '5px 8px',
                          fontSize: '0.86rem',
                        }}
                      >
                        <div>
                          <strong>Q ({entry.oracleData.likelihood}):</strong> {entry.oracleData.question}
                        </div>
                        <div className="mono" style={{ color: 'var(--ink-crimson)', fontWeight: 700 }}>
                          → {entry.oracleData.answer} (Roll: {entry.oracleData.roll})
                        </div>
                      </div>
                    )}

                    {entry.diceRollSummary && (
                      <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--ink-crimson)' }}>
                        🎲 {entry.diceRollSummary}
                      </div>
                    )}

                    {entry.content && (
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.93rem' }}>
                        {entry.content}
                      </p>
                    )}

                    {(linkedMap || entry.threadIds.length > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                        {linkedMap && (
                          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)' }}>
                            📍 {linkedMap.name}
                          </span>
                        )}
                        {entry.threadIds.map((tid) => {
                          const t = threads.find((item) => item.id === tid);
                          if (!t) return null;
                          return (
                            <span
                              key={tid}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0 5px',
                                background: 'rgba(124, 45, 32, 0.1)',
                                borderRadius: '3px',
                                color: 'var(--ink-crimson)',
                              }}
                            >
                              #{t.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Story Threads, NPCs & Quests Tab */
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            className="ledger-rule-b"
            style={{
              padding: '8px 10px',
              background: 'rgba(250, 241, 220, 0.72)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                className="ink-select"
                value={threadType}
                onChange={(e) => setThreadType(e.target.value as StoryThreadType)}
              >
                <option value="quest">Quest</option>
                <option value="npc">NPC</option>
                <option value="location">Location</option>
                <option value="thread">Open Thread</option>
              </select>
              <input
                className="ink-input"
                style={{ flex: 1 }}
                placeholder="Name (e.g., Brother Aldous, The Iron Key)..."
                value={threadName}
                onChange={(e) => setThreadName(e.target.value)}
              />
              <button
                type="button"
                className="ink-btn ink-btn-primary ink-btn-sm"
                onClick={() => {
                  if (!threadName.trim()) return;
                  onAddThread({
                    id: uid('thread'),
                    type: threadType,
                    name: threadName.trim(),
                    status: 'active',
                    notes: threadNotes.trim(),
                  });
                  setThreadName('');
                  setThreadNotes('');
                }}
              >
                <Plus size={13} /> Add
              </button>
            </div>
            <input
              className="ink-input"
              placeholder="Notes / rumor / motive..."
              value={threadNotes}
              onChange={(e) => setThreadNotes(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {threads.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', textAlign: 'center', marginTop: '24px' }}>
                No active threads, NPCs, or quests yet.
              </p>
            ) : (
              threads.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: '#fffaf0',
                    border: '1px solid rgba(124, 45, 32, 0.4)',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    opacity: t.status === 'active' ? 1 : 0.65,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          padding: '1px 5px',
                          background: 'var(--paper-recessed)',
                          color: 'var(--ink-crimson)',
                          borderRadius: '3px',
                        }}
                      >
                        {t.type}
                      </span>
                      <strong
                        style={{
                          textDecoration: t.status === 'resolved' ? 'line-through' : 'none',
                        }}
                      >
                        {t.name}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <select
                        className="ink-select"
                        style={{ padding: '1px 4px', fontSize: '0.76rem' }}
                        value={t.status}
                        onChange={(e) =>
                          onUpdateThread({ ...t, status: e.target.value as StoryThreadStatus })
                        }
                      >
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="abandoned">Abandoned</option>
                      </select>
                      {t.status === 'active' && (
                        <button
                          type="button"
                          className="ink-btn ink-btn-sm"
                          title="Mark resolved"
                          onClick={() => onUpdateThread({ ...t, status: 'resolved' })}
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteThread(t.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {t.notes && (
                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
                      {t.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
