import React, { useRef, useState } from 'react';
import {
  CheckSquare,
  Compass,
  DoorOpen,
  Eraser,
  ImagePlus,
  MapPin as MapPinIcon,
  Plus,
  Square,
  Stamp,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { DoorType, DungeonMap, GridCellType, GridStampType, MapPin } from '../types/campaign';
import { createBlankDungeon, resizeImageToDataUrl, uid } from '../utils/storage';

interface MapWorkspaceProps {
  dungeons: DungeonMap[];
  currentDungeonId: string;
  onSelectDungeon: (id: string) => void;
  onUpdateDungeon: (updated: DungeonMap) => void;
  onAddDungeon: (map: DungeonMap) => void;
  onDeleteDungeon: (id: string) => void;
  onLogRoom?: (mapId: string, pin: MapPin) => void;
}

type ToolMode =
  | 'room'
  | 'corridor'
  | 'erase'
  | 'door'
  | 'secret'
  | 'locked'
  | 'open'
  | 'stamp'
  | 'pin'
  | 'party';

const STAMP_OPTIONS: { id: GridStampType; label: string; symbol: string }[] = [
  { id: 'trap', label: 'Trap', symbol: '▲' },
  { id: 'stairs_up', label: 'Stairs Up', symbol: '↑' },
  { id: 'stairs_down', label: 'Stairs Down', symbol: '↓' },
  { id: 'boss', label: 'Boss', symbol: '☠' },
  { id: 'treasure', label: 'Treasure', symbol: '✦' },
  { id: 'fountain', label: 'Fountain', symbol: '♒' },
  { id: 'altar', label: 'Altar', symbol: '☥' },
  { id: 'none', label: 'Clear Stamp', symbol: '×' },
];

export function MapWorkspace({
  dungeons,
  currentDungeonId,
  onSelectDungeon,
  onUpdateDungeon,
  onAddDungeon,
  onDeleteDungeon,
  onLogRoom,
}: MapWorkspaceProps) {
  const activeMap = dungeons.find((d) => d.id === currentDungeonId) ?? dungeons[0];
  const [tool, setTool] = useState<ToolMode>('room');
  const [activeStamp, setActiveStamp] = useState<GridStampType>('trap');
  const [zoom, setZoom] = useState<number>(1);
  const [isPainting, setIsPainting] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<
    Array<{
      cells: Record<string, GridCellType>;
      edges: Record<string, DoorType>;
      stamps: Record<string, GridStampType>;
    }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!activeMap) return null;

  const selectedPin = activeMap.pins.find((p) => p.id === selectedPinId) ?? null;

  const pushUndo = () => {
    setUndoStack((prev) => [
      ...prev.slice(-24),
      {
        cells: { ...activeMap.cells },
        edges: { ...activeMap.edges },
        stamps: { ...activeMap.stamps },
      },
    ]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    onUpdateDungeon({
      ...activeMap,
      cells: last.cells,
      edges: last.edges,
      stamps: last.stamps,
    });
  };

  const expandGrid = (dir: 'top' | 'bottom' | 'left' | 'right') => {
    if (activeMap.mode !== 'grid') return;
    const dRow = dir === 'top' ? 2 : 0;
    const dCol = dir === 'left' ? 2 : 0;

    const shiftCellRecord = <T,>(rec: Record<string, T>): Record<string, T> => {
      if (dRow === 0 && dCol === 0) return rec;
      const next: Record<string, T> = {};
      for (const [key, val] of Object.entries(rec)) {
        const [rStr, cStr] = key.split(',');
        next[`${Number(rStr) + dRow},${Number(cStr) + dCol}`] = val;
      }
      return next;
    };

    const shiftEdges = (rec: Record<string, DoorType>): Record<string, DoorType> => {
      if (dRow === 0 && dCol === 0) return rec;
      const next: Record<string, DoorType> = {};
      for (const [key, val] of Object.entries(rec)) {
        const [edgeDir, rStr, cStr] = key.split(':');
        next[`${edgeDir}:${Number(rStr) + dRow}:${Number(cStr) + dCol}`] = val;
      }
      return next;
    };

    onUpdateDungeon({
      ...activeMap,
      rows: activeMap.rows + (dir === 'top' || dir === 'bottom' ? 2 : 0),
      cols: activeMap.cols + (dir === 'left' || dir === 'right' ? 2 : 0),
      cells: shiftCellRecord(activeMap.cells),
      stamps: shiftCellRecord(activeMap.stamps),
      edges: shiftEdges(activeMap.edges),
      pins:
        dRow === 0 && dCol === 0
          ? activeMap.pins
          : activeMap.pins.map((p) => ({ ...p, x: p.x + dCol, y: p.y + dRow })),
      partyPos:
        activeMap.partyPos && (dRow !== 0 || dCol !== 0)
          ? { x: activeMap.partyPos.x + dCol, y: activeMap.partyPos.y + dRow }
          : activeMap.partyPos,
    });
  };

  const cellSize = Math.round(24 * zoom);
  const svgW = activeMap.cols * cellSize;
  const svgH = activeMap.rows * cellSize;

  const paintCell = (row: number, col: number, mode: ToolMode) => {
    const key = `${row},${col}`;
    if (mode === 'room' || mode === 'corridor') {
      if (activeMap.cells[key] === mode) return;
      onUpdateDungeon({
        ...activeMap,
        cells: { ...activeMap.cells, [key]: mode },
      });
    } else if (mode === 'erase') {
      if (!activeMap.cells[key] && !activeMap.stamps[key]) return;
      const nextCells = { ...activeMap.cells };
      const nextStamps = { ...activeMap.stamps };
      delete nextCells[key];
      delete nextStamps[key];
      onUpdateDungeon({
        ...activeMap,
        cells: nextCells,
        stamps: nextStamps,
      });
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const col = Math.floor(px / cellSize);
    const row = Math.floor(py / cellSize);
    if (col < 0 || col >= activeMap.cols || row < 0 || row >= activeMap.rows) return;

    if (tool === 'door' || tool === 'secret' || tool === 'locked' || tool === 'open') {
      const fx = (px % cellSize) / cellSize;
      const fy = (py % cellSize) / cellSize;
      const distTop = fy;
      const distBottom = 1 - fy;
      const distLeft = fx;
      const distRight = 1 - fx;
      const minDist = Math.min(distTop, distBottom, distLeft, distRight);

      let edgeKey = '';
      if (minDist === distTop) edgeKey = `h:${row}:${col}`;
      else if (minDist === distBottom) edgeKey = `h:${row + 1}:${col}`;
      else if (minDist === distLeft) edgeKey = `v:${row}:${col}`;
      else edgeKey = `v:${row}:${col + 1}`;

      pushUndo();
      const nextEdges = { ...activeMap.edges };
      if (nextEdges[edgeKey] === tool) {
        delete nextEdges[edgeKey];
      } else {
        nextEdges[edgeKey] = tool;
      }
      onUpdateDungeon({ ...activeMap, edges: nextEdges });
      return;
    }

    if (tool === 'stamp') {
      pushUndo();
      const key = `${row},${col}`;
      const nextStamps = { ...activeMap.stamps };
      if (activeStamp === 'none' || nextStamps[key] === activeStamp) {
        delete nextStamps[key];
      } else {
        nextStamps[key] = activeStamp;
      }
      onUpdateDungeon({ ...activeMap, stamps: nextStamps });
      return;
    }

    if (tool === 'party') {
      onUpdateDungeon({ ...activeMap, partyPos: { x: col, y: row } });
      return;
    }

    if (tool === 'pin') {
      const existing = activeMap.pins.find((p) => p.x === col && p.y === row);
      if (existing) {
        setSelectedPinId(existing.id);
        return;
      }
      const nextLabel = String(activeMap.pins.length + 1);
      const newPin: MapPin = {
        id: uid('pin'),
        label: nextLabel,
        title: `Room ${nextLabel}`,
        notes: '',
        x: col,
        y: row,
      };
      onUpdateDungeon({ ...activeMap, pins: [...activeMap.pins, newPin] });
      setSelectedPinId(newPin.id);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 1400);
      const newMap: DungeonMap = {
        ...createBlankDungeon(file.name.replace(/\.[^.]+$/, ''), dungeons.length + 1),
        mode: 'image',
        cells: {},
        stamps: {},
        edges: {},
        pins: [],
        partyPos: null,
        imageDataUrl: dataUrl,
      };
      onAddDungeon(newMap);
      setSelectedPinId(null);
      setTool('pin');
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = '';
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== 'pin' && tool !== 'party') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (tool === 'party') {
      onUpdateDungeon({ ...activeMap, partyPos: { x: xPct, y: yPct } });
    } else if (tool === 'pin') {
      const nextLabel = String(activeMap.pins.length + 1);
      const newPin: MapPin = {
        id: uid('pin'),
        label: nextLabel,
        title: `Room ${nextLabel}`,
        notes: '',
        x: xPct,
        y: yPct,
      };
      onUpdateDungeon({ ...activeMap, pins: [...activeMap.pins, newPin] });
      setSelectedPinId(newPin.id);
    }
  };

  // Helper for auto-wall rendering in grid mode
  const isFilled = (r: number, c: number) => {
    const val = activeMap.cells[`${r},${c}`];
    return val === 'room' || val === 'corridor';
  };

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
      {/* Top Map Selector Bar */}
      <div
        className="ledger-rule-b"
        style={{
          padding: '8px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          background: 'rgba(231, 209, 163, 0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          <select
            className="ink-select"
            style={{ fontWeight: 700, maxWidth: '220px' }}
            value={activeMap.id}
            onChange={(e) => {
              onSelectDungeon(e.target.value);
              setSelectedPinId(null);
              setUndoStack([]);
            }}
          >
            {dungeons.map((d) => (
              <option key={d.id} value={d.id}>
                {d.cleared ? '✓ ' : ''}
                {d.name} (D{d.depth})
              </option>
            ))}
          </select>

          <input
            className="ink-input"
            style={{ width: '160px', padding: '4px 6px', fontSize: '0.85rem' }}
            value={activeMap.name}
            title="Rename current map"
            onChange={(e) => onUpdateDungeon({ ...activeMap, name: e.target.value })}
          />

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
            <input
              type="checkbox"
              checked={activeMap.cleared}
              onChange={(e) => onUpdateDungeon({ ...activeMap, cleared: e.target.checked })}
            />
            <CheckSquare size={13} /> Cleared
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="ink-btn ink-btn-sm"
            onClick={() => {
              const next = createBlankDungeon(
                `Level ${dungeons.length + 1} — Dungeon`,
                dungeons.length + 1
              );
              onAddDungeon(next);
              setSelectedPinId(null);
              setUndoStack([]);
            }}
          >
            <Plus size={13} /> Grid Map
          </button>

          <button
            type="button"
            className="ink-btn ink-btn-sm"
            onClick={() => fileInputRef.current?.click()}
            title="Upload photo/scan of paper map"
          >
            <ImagePlus size={13} /> Paper Map
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          {dungeons.length > 1 && (
            <button
              type="button"
              className="ink-btn ink-btn-sm"
              title="Delete current map"
              onClick={() => {
                onDeleteDungeon(activeMap.id);
                setSelectedPinId(null);
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Drawing / Pin Toolbar */}
      <div
        className="ledger-rule-b"
        style={{
          padding: '6px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(250, 241, 220, 0.7)',
        }}
      >
        {activeMap.mode === 'grid' && (
          <>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${tool === 'room' ? 'ink-btn-active' : ''}`}
              onClick={() => setTool('room')}
            >
              <Square size={12} /> Room
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${tool === 'corridor' ? 'ink-btn-active' : ''}`}
              onClick={() => setTool('corridor')}
            >
              Corridor
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${tool === 'erase' ? 'ink-btn-active' : ''}`}
              onClick={() => setTool('erase')}
            >
              <Eraser size={12} /> Erase
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${tool === 'door' ? 'ink-btn-active' : ''}`}
              onClick={() => setTool('door')}
              title="Click cell edge to place/remove Door"
            >
              <DoorOpen size={12} /> Door
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${tool === 'secret' ? 'ink-btn-active' : ''}`}
              onClick={() => setTool('secret')}
              title="Click cell edge to place Secret Door"
            >
              Secret
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${tool === 'locked' ? 'ink-btn-active' : ''}`}
              onClick={() => setTool('locked')}
              title="Click cell edge to place Locked Door"
            >
              Locked
            </button>
            <button
              type="button"
              className={`ink-btn ink-btn-sm ${tool === 'open' ? 'ink-btn-active' : ''}`}
              onClick={() => setTool('open')}
              title="Click a wall edge to erase/open it (e.g. dungeon entrance)"
            >
              Entrance
            </button>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <button
                type="button"
                className={`ink-btn ink-btn-sm ${tool === 'stamp' ? 'ink-btn-active' : ''}`}
                onClick={() => setTool('stamp')}
              >
                <Stamp size={12} /> Stamp:
              </button>
              <select
                className="ink-select"
                style={{ padding: '2px 4px', fontSize: '0.8rem' }}
                value={activeStamp}
                onChange={(e) => {
                  setActiveStamp(e.target.value as GridStampType);
                  setTool('stamp');
                }}
              >
                {STAMP_OPTIONS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.symbol} {st.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <button
          type="button"
          className={`ink-btn ink-btn-sm ${tool === 'pin' ? 'ink-btn-active' : ''}`}
          onClick={() => setTool('pin')}
        >
          <MapPinIcon size={12} /> Room Pin
        </button>
        <button
          type="button"
          className={`ink-btn ink-btn-sm ${tool === 'party' ? 'ink-btn-active' : ''}`}
          onClick={() => setTool('party')}
        >
          <Compass size={12} /> Party
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {activeMap.mode === 'grid' && (
            <button
              type="button"
              className="ink-btn ink-btn-sm"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              title="Undo last grid edit"
            >
              <Undo2 size={12} />
            </button>
          )}
          <button
            type="button"
            className="ink-btn ink-btn-sm"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
          >
            <ZoomOut size={12} />
          </button>
          <span className="mono" style={{ fontSize: '0.76rem', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="ink-btn ink-btn-sm"
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))}
          >
            <ZoomIn size={12} />
          </button>
        </div>
      </div>

      {/* Map Canvas Area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: 'rgba(226, 203, 160, 0.35)',
        }}
        onMouseUp={() => setIsPainting(false)}
        onMouseLeave={() => setIsPainting(false)}
      >
        {activeMap.mode === 'grid' ? (
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              className="ink-btn ink-btn-sm"
              onClick={() => expandGrid('top')}
              title="Add 2 rows to the top of this floor"
            >
              +2 Rows
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="ink-btn ink-btn-sm"
                onClick={() => expandGrid('left')}
                title="Add 2 columns to the left of this floor"
                style={{ padding: '8px 4px', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                +2 Cols
              </button>
              <svg
                width={svgW}
                height={svgH}
                viewBox={`0 0 ${svgW} ${svgH}`}
            style={{
              background: '#f7ebd0',
              border: '2px solid var(--ink-crimson)',
              boxShadow: '0 3px 10px rgba(45, 24, 16, 0.16)',
              userSelect: 'none',
              cursor:
                tool === 'room' || tool === 'corridor' || tool === 'erase'
                  ? 'crosshair'
                  : 'pointer',
              flexShrink: 0,
            }}
            onClick={handleSvgClick}
          >
            {/* Base Grid Lines (Red-Brown) */}
            {Array.from({ length: activeMap.cols + 1 }).map((_, c) => (
              <line
                key={`vg-${c}`}
                x1={c * cellSize}
                y1={0}
                x2={c * cellSize}
                y2={svgH}
                stroke="rgba(138, 52, 36, 0.24)"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: activeMap.rows + 1 }).map((_, r) => (
              <line
                key={`hg-${r}`}
                x1={0}
                y1={r * cellSize}
                x2={svgW}
                y2={r * cellSize}
                stroke="rgba(138, 52, 36, 0.24)"
                strokeWidth={1}
              />
            ))}

            {/* Painted Cells */}
            {Array.from({ length: activeMap.rows }).map((_, r) =>
              Array.from({ length: activeMap.cols }).map((__, c) => {
                const key = `${r},${c}`;
                const type = activeMap.cells[key] ?? 'empty';
                const stamp = activeMap.stamps[key];
                const x = c * cellSize;
                const y = r * cellSize;

                return (
                  <g
                    key={key}
                    onMouseDown={() => {
                      if (tool === 'room' || tool === 'corridor' || tool === 'erase') {
                        pushUndo();
                        setIsPainting(true);
                        paintCell(r, c, tool);
                      }
                    }}
                    onMouseEnter={() => {
                      if (isPainting && (tool === 'room' || tool === 'corridor' || tool === 'erase')) {
                        paintCell(r, c, tool);
                      }
                    }}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      fill={
                        type === 'room'
                          ? '#fffaf0'
                          : type === 'corridor'
                          ? 'rgba(216, 188, 132, 0.55)'
                          : 'transparent'
                      }
                    />
                    {type === 'corridor' && (
                      <line
                        x1={x + 3}
                        y1={y + cellSize - 3}
                        x2={x + cellSize - 3}
                        y2={y + 3}
                        stroke="rgba(124, 45, 32, 0.18)"
                        strokeWidth={1}
                      />
                    )}
                    {stamp && stamp !== 'none' && (
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 + 4}
                        textAnchor="middle"
                        fontSize={Math.max(10, Math.round(cellSize * 0.56))}
                        fontWeight="700"
                        fill="#7c2d20"
                        style={{ pointerEvents: 'none' }}
                      >
                        {STAMP_OPTIONS.find((s) => s.id === stamp)?.symbol}
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {/* Auto-Walls around filled cells */}
            {Object.keys(activeMap.cells).map((key) => {
              const [rStr, cStr] = key.split(',');
              const r = Number(rStr);
              const c = Number(cStr);
              if (!isFilled(r, c)) return null;
              const x = c * cellSize;
              const y = r * cellSize;
              const walls: React.ReactNode[] = [];
              if (!isFilled(r - 1, c) && activeMap.edges[`h:${r}:${c}`] !== 'open') {
                walls.push(
                  <line
                    key={`${key}-t`}
                    x1={x}
                    y1={y}
                    x2={x + cellSize}
                    y2={y}
                    stroke="#6b2217"
                    strokeWidth={2.5}
                    strokeLinecap="square"
                  />
                );
              }
              if (!isFilled(r + 1, c) && activeMap.edges[`h:${r + 1}:${c}`] !== 'open') {
                walls.push(
                  <line
                    key={`${key}-b`}
                    x1={x}
                    y1={y + cellSize}
                    x2={x + cellSize}
                    y2={y + cellSize}
                    stroke="#6b2217"
                    strokeWidth={2.5}
                    strokeLinecap="square"
                  />
                );
              }
              if (!isFilled(r, c - 1) && activeMap.edges[`v:${r}:${c}`] !== 'open') {
                walls.push(
                  <line
                    key={`${key}-l`}
                    x1={x}
                    y1={y}
                    x2={x}
                    y2={y + cellSize}
                    stroke="#6b2217"
                    strokeWidth={2.5}
                    strokeLinecap="square"
                  />
                );
              }
              if (!isFilled(r, c + 1) && activeMap.edges[`v:${r}:${c + 1}`] !== 'open') {
                walls.push(
                  <line
                    key={`${key}-r`}
                    x1={x + cellSize}
                    y1={y}
                    x2={x + cellSize}
                    y2={y + cellSize}
                    stroke="#6b2217"
                    strokeWidth={2.5}
                    strokeLinecap="square"
                  />
                );
              }
              return walls;
            })}

            {/* Doors & Open/Entrance Edges */}
            {Object.entries(activeMap.edges).map(([edgeKey, doorType]) => {
              const [dir, rStr, cStr] = edgeKey.split(':');
              const r = Number(rStr);
              const c = Number(cStr);

              if (doorType === 'open') {
                const isOuter =
                  (dir === 'h' && (r === 0 || r === activeMap.rows)) ||
                  (dir === 'v' && (c === 0 || c === activeMap.cols));
                if (!isOuter) return null;
                return (
                  <line
                    key={edgeKey}
                    x1={dir === 'h' ? c * cellSize : c * cellSize}
                    y1={dir === 'h' ? r * cellSize : r * cellSize}
                    x2={dir === 'h' ? (c + 1) * cellSize : c * cellSize}
                    y2={dir === 'h' ? r * cellSize : (r + 1) * cellSize}
                    stroke="#f7ebd0"
                    strokeWidth={4}
                    style={{ pointerEvents: 'none' }}
                  />
                );
              }

              const cx = dir === 'h' ? c * cellSize + cellSize / 2 : c * cellSize;
              const cy = dir === 'h' ? r * cellSize : r * cellSize + cellSize / 2;
              const w = dir === 'h' ? cellSize * 0.48 : 6;
              const h = dir === 'h' ? 6 : cellSize * 0.48;

              return (
                <g key={edgeKey} style={{ pointerEvents: 'none' }}>
                  <line
                    x1={c * cellSize}
                    y1={r * cellSize}
                    x2={dir === 'h' ? (c + 1) * cellSize : c * cellSize}
                    y2={dir === 'h' ? r * cellSize : (r + 1) * cellSize}
                    stroke="#6b2217"
                    strokeWidth={2.5}
                    strokeLinecap="square"
                  />
                  <rect
                    x={cx - w / 2}
                    y={cy - h / 2}
                    width={w}
                    height={h}
                    fill={doorType === 'locked' ? '#7c2d20' : '#fffaf0'}
                    stroke="#7c2d20"
                    strokeWidth={1.6}
                  />
                  {doorType === 'secret' && (
                    <text
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight="700"
                      fill="#7c2d20"
                    >
                      S
                    </text>
                  )}
                </g>
              );
            })}

            {/* Room Pins */}
            {activeMap.pins.map((pin) => {
              const cx = pin.x * cellSize + cellSize / 2;
              const cy = pin.y * cellSize + cellSize / 2;
              const isSel = pin.id === selectedPinId;
              return (
                <g
                  key={pin.id}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPinId(pin.id);
                  }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={Math.max(8, cellSize * 0.36)}
                    fill={isSel ? '#2b1810' : '#7c2d20'}
                    stroke="#fffaf0"
                    strokeWidth={1.5}
                  />
                  <text
                    x={cx}
                    y={cy + 3.5}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="700"
                    fill="#fffaf0"
                  >
                    {pin.label}
                  </text>
                </g>
              );
            })}

            {/* Party Position Token */}
            {activeMap.partyPos && (
              <g style={{ pointerEvents: 'none' }}>
                <circle
                  cx={activeMap.partyPos.x * cellSize + cellSize / 2}
                  cy={activeMap.partyPos.y * cellSize + cellSize / 2}
                  r={Math.max(7, cellSize * 0.34)}
                  fill="#94560c"
                  stroke="#fffaf0"
                  strokeWidth={2}
                />
                <text
                  x={activeMap.partyPos.x * cellSize + cellSize / 2}
                  y={activeMap.partyPos.y * cellSize + cellSize / 2 + 3.5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="700"
                  fill="#fffaf0"
                >
                  P
                </text>
              </g>
            )}
              </svg>
              <button
                type="button"
                className="ink-btn ink-btn-sm"
                onClick={() => expandGrid('right')}
                title="Add 2 columns to the right of this floor"
                style={{ padding: '8px 4px', writingMode: 'vertical-rl' }}
              >
                +2 Cols
              </button>
            </div>
            <button
              type="button"
              className="ink-btn ink-btn-sm"
              onClick={() => expandGrid('bottom')}
              title="Add 2 rows to the bottom of this floor"
            >
              +2 Rows
            </button>
          </div>
        ) : (
          /* Paper Map Image Overlay Mode */
          <div
            onClick={handleImageClick}
            style={{
              position: 'relative',
              display: 'inline-block',
              border: '2px solid var(--ink-crimson)',
              boxShadow: '0 3px 10px rgba(45, 24, 16, 0.16)',
              cursor: tool === 'pin' || tool === 'party' ? 'crosshair' : 'default',
              width: `${Math.round(520 * zoom)}px`,
              maxWidth: 'none',
            }}
          >
            {activeMap.imageDataUrl && (
              <img
                src={activeMap.imageDataUrl}
                alt={activeMap.name}
                style={{ width: '100%', display: 'block', userSelect: 'none' }}
                draggable={false}
              />
            )}

            {activeMap.pins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPinId(pin.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: pin.id === selectedPinId ? '#2b1810' : 'var(--ink-crimson)',
                  color: '#fffaf0',
                  border: '2px solid #fffaf0',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={pin.title}
              >
                {pin.label}
              </button>
            ))}

            {activeMap.partyPos && (
              <div
                style={{
                  position: 'absolute',
                  left: `${activeMap.partyPos.x}%`,
                  top: `${activeMap.partyPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--ink-amber)',
                  color: '#fffaf0',
                  border: '2px solid #fffaf0',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
                title="Party Location"
              >
                P
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Room Pin Inspector Footer */}
      {selectedPin && (
        <div
          style={{
            borderTop: '2px solid var(--ink-crimson)',
            background: 'var(--paper-elevated)',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              className="mono"
              style={{
                background: 'var(--ink-crimson)',
                color: '#fffaf0',
                padding: '2px 7px',
                borderRadius: '3px',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              Pin #{selectedPin.label}
            </span>
            <input
              className="ink-input"
              style={{ flex: 1, minWidth: '140px', padding: '3px 6px' }}
              value={selectedPin.title}
              placeholder="Room title..."
              onChange={(e) =>
                onUpdateDungeon({
                  ...activeMap,
                  pins: activeMap.pins.map((p) =>
                    p.id === selectedPin.id ? { ...p, title: e.target.value } : p
                  ),
                })
              }
            />
            {onLogRoom && (
              <button
                type="button"
                className="ink-btn ink-btn-sm"
                onClick={() => onLogRoom(activeMap.id, selectedPin)}
              >
                Log to Journal
              </button>
            )}
            <button
              type="button"
              className="ink-btn ink-btn-sm"
              onClick={() => {
                onUpdateDungeon({
                  ...activeMap,
                  pins: activeMap.pins.filter((p) => p.id !== selectedPin.id),
                });
                setSelectedPinId(null);
              }}
            >
              <Trash2 size={12} />
            </button>
            <button
              type="button"
              className="ink-btn ink-btn-sm"
              onClick={() => setSelectedPinId(null)}
            >
              Close
            </button>
          </div>
          <textarea
            className="ink-textarea"
            rows={2}
            placeholder="Room description, monsters, treasure, traps..."
            value={selectedPin.notes}
            onChange={(e) =>
              onUpdateDungeon({
                ...activeMap,
                pins: activeMap.pins.map((p) =>
                  p.id === selectedPin.id ? { ...p, notes: e.target.value } : p
                ),
              })
            }
          />
        </div>
      )}
    </section>
  );
}
