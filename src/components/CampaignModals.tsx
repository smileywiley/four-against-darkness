import React, { useRef, useState } from 'react';
import { Download, FileText, Plus, Upload, X } from 'lucide-react';
import { Campaign } from '../types/campaign';
import { exportCampaignToMarkdown } from '../utils/storage';

interface NewCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewCampaignModal({ open, onClose, onCreate }: NewCampaignModalProps) {
  const [name, setName] = useState('');
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(43, 24, 16, 0.48)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="ledger-panel"
        style={{ width: '400px', maxWidth: '100%', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ledger-rule-double" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px' }}>
          <h3>New Campaign</h3>
          <button type="button" className="ink-btn ink-btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
          <span>Campaign Title</span>
          <input
            className="ink-input"
            placeholder="e.g., Echoes of the Iron Barrow"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onCreate(name.trim());
                setName('');
                onClose();
              }
            }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button type="button" className="ink-btn ink-btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ink-btn ink-btn-primary ink-btn-sm"
            onClick={() => {
              onCreate(name.trim() || 'Untitled Expedition');
              setName('');
              onClose();
            }}
          >
            <Plus size={13} /> Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

interface ExportModalProps {
  open: boolean;
  campaign: Campaign;
  onClose: () => void;
  onImportCampaign: (imported: Campaign) => void;
}

export function ExportModal({ open, campaign, onClose, onImportCampaign }: ExportModalProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!open) return null;

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const safeSlug = campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'campaign';

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Campaign;
      if (!parsed || !Array.isArray(parsed.characters) || !Array.isArray(parsed.dungeons)) {
        setStatusMsg('Invalid campaign JSON format.');
        return;
      }
      onImportCampaign(parsed);
      setStatusMsg('Campaign imported successfully!');
    } catch {
      setStatusMsg('Could not parse JSON file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(43, 24, 16, 0.48)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="ledger-panel"
        style={{ width: '440px', maxWidth: '100%', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ledger-rule-double" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px' }}>
          <h3>Export & Backup</h3>
          <button type="button" className="ink-btn ink-btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="ink-btn ink-btn-primary"
            onClick={() =>
              downloadFile(
                `${safeSlug}.json`,
                JSON.stringify(campaign, null, 2),
                'application/json'
              )
            }
          >
            <Download size={15} /> Download Full Campaign Backup (.json)
          </button>

          <button
            type="button"
            className="ink-btn"
            onClick={() =>
              downloadFile(
                `${safeSlug}-journal.md`,
                exportCampaignToMarkdown(campaign),
                'text/markdown'
              )
            }
          >
            <FileText size={15} /> Export Journal & Party Summary (.md)
          </button>

          <button
            type="button"
            className="ink-btn"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} /> Import Campaign Backup (.json)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleImportJson}
          />
        </div>

        {statusMsg && (
          <p className="mono" style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-crimson)' }}>
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}
