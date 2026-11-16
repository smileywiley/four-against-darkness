import { useEffect, useState } from 'react';
import {
  BookOpen,
  Columns2,
  Dices,
  Download,
  Map as MapIcon,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { ExportModal, NewCampaignModal } from './components/CampaignModals';
import { JournalPanel } from './components/JournalPanel';
import { MapWorkspace } from './components/MapWorkspace';
import { OracleDrawer } from './components/OracleDrawer';
import { PartyPanel } from './components/PartyPanel';
import { PartyStrip } from './components/PartyStrip';
import {
  Campaign,
  Character,
  DungeonMap,
  JournalEntry,
  MapPin,
  StoryThread,
  ViewMode,
} from './types/campaign';
import { createStarterCampaign, loadCampaigns, saveCampaigns, uid } from './utils/storage';

export function App() {
  const initial = loadCampaigns();
  const [campaigns, setCampaigns] = useState<Campaign[]>(initial.campaigns);
  const [activeId, setActiveId] = useState<string>(initial.activeId);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [oracleOpen, setOracleOpen] = useState(false);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [journalPrefill, setJournalPrefill] = useState<Partial<JournalEntry> | null>(null);

  const activeCampaign = campaigns.find((c) => c.id === activeId) ?? campaigns[0];

  useEffect(() => {
    saveCampaigns(campaigns, activeId);
  }, [campaigns, activeId]);

  const updateActiveCampaign = (updater: (c: Campaign) => Campaign) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === activeCampaign.id
          ? { ...updater(c), updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const handleUpdateChar = (updated: Character) => {
    updateActiveCampaign((c) => ({
      ...c,
      characters: c.characters.map((ch) => (ch.id === updated.id ? updated : ch)),
    }));
  };

  const handleMoveOrder = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= activeCampaign.characters.length) return;
    updateActiveCampaign((c) => {
      const next = [...c.characters];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return { ...c, characters: next };
    });
  };

  const handleUpdateDungeon = (updated: DungeonMap) => {
    updateActiveCampaign((c) => ({
      ...c,
      dungeons: c.dungeons.map((d) => (d.id === updated.id ? updated : d)),
    }));
  };

  const handleAddDungeon = (map: DungeonMap) => {
    updateActiveCampaign((c) => ({
      ...c,
      dungeons: [...c.dungeons, map],
      currentDungeonId: map.id,
    }));
  };

  const handleDeleteDungeon = (id: string) => {
    updateActiveCampaign((c) => {
      const remaining = c.dungeons.filter((d) => d.id !== id);
      if (remaining.length === 0) return c;
      return {
        ...c,
        dungeons: remaining,
        currentDungeonId: c.currentDungeonId === id ? remaining[0].id : c.currentDungeonId,
      };
    });
  };

  const handleAddJournalEntry = (entry: JournalEntry) => {
    updateActiveCampaign((c) => ({
      ...c,
      journal: [...c.journal, entry],
    }));
  };

  const handleLogRoomFromPin = (mapId: string, pin: MapPin) => {
    setJournalPrefill({
      entryType: 'discovery',
      title: `Pin #${pin.label}: ${pin.title}`,
      content: pin.notes,
      linkedMapId: mapId,
      linkedPinId: pin.id,
    });
    if (viewMode === 'map' || viewMode === 'party') {
      setViewMode('split');
    }
  };

  return (
    <div className="app-shell">
      {/* Top Campaign Ledger Bar */}
      <header className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.25rem', letterSpacing: '0.02em' }}>
            Four Against Darkness
          </h1>

          <select
            className="ink-select"
            style={{ fontWeight: 700, maxWidth: '240px' }}
            value={activeCampaign.id}
            onChange={(e) => {
              setActiveId(e.target.value);
              setSelectedCharId(null);
            }}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ink-btn ink-btn-sm"
            onClick={() => setNewCampaignOpen(true)}
            title="Start a new campaign"
          >
            <Plus size={13} /> New
          </button>

          {campaigns.length > 1 && (
            <button
              type="button"
              className="ink-btn ink-btn-sm"
              title="Delete current campaign"
              onClick={() => {
                const remaining = campaigns.filter((c) => c.id !== activeCampaign.id);
                setCampaigns(remaining);
                setActiveId(remaining[0].id);
              }}
            >
              <Trash2 size={13} />
            </button>
          )}

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem' }}>
            Session
            <input
              type="number"
              min={1}
              className="ink-input mono"
              style={{ width: '50px', padding: '2px 4px', textAlign: 'center' }}
              value={activeCampaign.sessionNumber}
              onChange={(e) =>
                updateActiveCampaign((c) => ({
                  ...c,
                  sessionNumber: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>
        </div>

        {/* View Mode Switcher & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', gap: '4px' }}>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${viewMode === 'split' ? 'ink-btn-active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              <Columns2 size={13} /> Play View
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${viewMode === 'party' ? 'ink-btn-active' : ''}`}
              onClick={() => setViewMode('party')}
            >
              <Users size={13} /> Party Sheets
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${viewMode === 'map' ? 'ink-btn-active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <MapIcon size={13} /> Map
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${viewMode === 'journal' ? 'ink-btn-active' : ''}`}
              onClick={() => setViewMode('journal')}
            >
              <BookOpen size={13} /> Journal
            </button>
          </div>

          <button
            type="button"
            className={`ink-btn ink-btn-sm ${oracleOpen ? 'ink-btn-active' : ''}`}
            onClick={() => setOracleOpen((o) => !o)}
          >
            <Dices size={13} /> Dice & Oracle
          </button>

          <button
            type="button"
            className="ink-btn ink-btn-sm"
            onClick={() => setExportOpen(true)}
          >
            <Download size={13} /> Export
          </button>
        </div>
      </header>

      {/* Persistent Compact Party Strip */}
      <PartyStrip
        characters={activeCampaign.characters}
        selectedCharId={selectedCharId}
        onSelectChar={(id) => {
          setSelectedCharId(id);
          setViewMode('party');
        }}
        onUpdateChar={handleUpdateChar}
        onMoveOrder={handleMoveOrder}
      />

      {/* Main Workspace */}
      <main className="main-workspace">
        {viewMode === 'party' && (
          <PartyPanel
            characters={activeCampaign.characters}
            selectedCharId={selectedCharId}
            onUpdateChar={handleUpdateChar}
          />
        )}

        {(viewMode === 'split' || viewMode === 'map') && (
          <div className="split-pane">
            <MapWorkspace
              dungeons={activeCampaign.dungeons}
              currentDungeonId={activeCampaign.currentDungeonId}
              onSelectDungeon={(id) =>
                updateActiveCampaign((c) => ({ ...c, currentDungeonId: id }))
              }
              onUpdateDungeon={handleUpdateDungeon}
              onAddDungeon={handleAddDungeon}
              onDeleteDungeon={handleDeleteDungeon}
              onLogRoom={handleLogRoomFromPin}
            />
          </div>
        )}

        {(viewMode === 'split' || viewMode === 'journal') && (
          <div className="split-pane">
            <JournalPanel
              journal={activeCampaign.journal}
              threads={activeCampaign.threads}
              dungeons={activeCampaign.dungeons}
              sessionNumber={activeCampaign.sessionNumber}
              prefillEntry={journalPrefill}
              onClearPrefill={() => setJournalPrefill(null)}
              onAddEntry={handleAddJournalEntry}
              onDeleteEntry={(id) =>
                updateActiveCampaign((c) => ({
                  ...c,
                  journal: c.journal.filter((j) => j.id !== id),
                }))
              }
              onAddThread={(thread: StoryThread) =>
                updateActiveCampaign((c) => ({
                  ...c,
                  threads: [...c.threads, thread],
                }))
              }
              onUpdateThread={(thread: StoryThread) =>
                updateActiveCampaign((c) => ({
                  ...c,
                  threads: c.threads.map((t) => (t.id === thread.id ? thread : t)),
                }))
              }
              onDeleteThread={(id: string) =>
                updateActiveCampaign((c) => ({
                  ...c,
                  threads: c.threads.filter((t) => t.id !== id),
                }))
              }
            />
          </div>
        )}
      </main>

      {/* Slide-over Dice & Solo GMG Oracle Drawer */}
      <OracleDrawer
        open={oracleOpen}
        sessionNumber={activeCampaign.sessionNumber}
        currentDungeonId={activeCampaign.currentDungeonId}
        onClose={() => setOracleOpen(false)}
        onLogToJournal={handleAddJournalEntry}
      />

      {/* Modals */}
      <NewCampaignModal
        open={newCampaignOpen}
        onClose={() => setNewCampaignOpen(false)}
        onCreate={(name) => {
          const created = createStarterCampaign(name);
          setCampaigns((prev) => [...prev, created]);
          setActiveId(created.id);
          setSelectedCharId(null);
        }}
      />

      <ExportModal
        open={exportOpen}
        campaign={activeCampaign}
        onClose={() => setExportOpen(false)}
        onImportCampaign={(imported) => {
          const copy: Campaign = { ...imported, id: uid('camp') };
          setCampaigns((prev) => [...prev, copy]);
          setActiveId(copy.id);
        }}
      />
    </div>
  );
}

export default App;
