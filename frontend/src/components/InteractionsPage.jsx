import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInteractions, deleteInteraction, setSelected } from '../store';
import LogInteractionForm from './LogInteractionForm';
import { Plus, Trash2, Edit3, Calendar, MapPin, Tag, RefreshCw } from 'lucide-react';

const sentimentClass = s => `badge badge-${s || 'neutral'}`;

export default function InteractionsPage() {
  const dispatch = useDispatch();
  const { items, loading, selected } = useSelector(s => s.interactions);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { dispatch(fetchInteractions()); }, []);

  // Show the newest interaction straight away instead of an empty detail panel
  useEffect(() => {
    if (!selected && items.length) dispatch(setSelected(items[0]));
  }, [items, selected, dispatch]);

  const handleSelect = (item) => {
    dispatch(setSelected(item));
    setEditMode(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this interaction?')) {
      dispatch(deleteInteraction(id));
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const initials = (name = '') => name.replace(/^dr\.?\s*/i, '').trim().charAt(0).toUpperCase() || '?';

  const positive = items.filter(i => i.sentiment === 'positive').length;
  const followUps = items.filter(i => i.follow_up_required === 'Yes').length;

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">Total Interactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{positive}</div>
          <div className="stat-label">Positive Sentiment</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{followUps}</div>
          <div className="stat-label">Pending Follow-ups</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{new Set(items.map(i => i.hcp_name)).size}</div>
          <div className="stat-label">Unique HCPs</div>
        </div>
      </div>

      {/* Log Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header">
              <h3>Log New Interaction</h3>
            </div>
            <div className="card-body">
              <LogInteractionForm onClose={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="three-col">
        {/* List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>All Interactions</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => dispatch(fetchInteractions())}>
                <RefreshCw size={12} />
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                <Plus size={12} /> New
              </button>
            </div>
          </div>

          {loading && <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>Loading...</div>}

          <div className="interaction-list">
            {items.map(item => (
              <div key={item.id} className={`interaction-card ${selected?.id === item.id ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}>
                <div className="interaction-card-header">
                  <span className="interaction-card-name"><span className="avatar" aria-hidden="true">{initials(item.hcp_name)}</span>{item.hcp_name}</span>
                  <span className={sentimentClass(item.sentiment)}>{item.sentiment || 'neutral'}</span>
                </div>
                <div className="interaction-card-meta">
                  <span style={{ textTransform: 'capitalize' }}>{item.interaction_type}</span>
                  <span>{fmtDate(item.interaction_date)}</span>
                  {item.follow_up_required === 'Yes' && <span style={{ color: 'var(--warning)' }}>⚑ Follow-up</span>}
                </div>
                {item.summary && <div className="interaction-card-summary">{item.summary}</div>}
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="empty-state">
                <div>No interactions yet.</div>
                <div style={{ marginTop: 8, fontSize: 12 }}>Click "New" to log your first one.</div>
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div>
          {!selected ? (
            <div className="card" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <div>Select an interaction to view details</div>
              </div>
            </div>
          ) : editMode ? (
            <div className="card">
              <div className="card-header">
                <h3>Edit Interaction #{selected.id}</h3>
              </div>
              <div className="card-body">
                <LogInteractionForm existing={selected} onClose={() => setEditMode(false)} onSuccess={() => setEditMode(false)} />
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>{selected.hcp_name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selected.hcp_specialty}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>
                    <Edit3 size={12} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span className={sentimentClass(selected.sentiment)}>{selected.sentiment || 'neutral'}</span>
                  <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{selected.interaction_type}</span>
                  {selected.follow_up_required === 'Yes' && <span className="badge" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>Follow-up Required</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <InfoRow icon={<Calendar size={13} />} label="Date" value={fmtDate(selected.interaction_date)} />
                  <InfoRow icon={<MapPin size={13} />} label="Location" value={selected.hcp_location || '—'} />
                  <InfoRow icon={<Tag size={13} />} label="Products" value={selected.products_discussed || '—'} />
                  <InfoRow icon={null} label="Rep" value={selected.rep_name || '—'} />
                </div>

                {selected.summary && (
                  <Section title="AI Summary" content={selected.summary} />
                )}
                <Section title="Notes" content={selected.notes} />
                {selected.follow_up_notes && (
                  <Section title="Follow-up Notes" content={selected.follow_up_notes} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
        {value}
      </div>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, background: 'var(--neutral-light)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>{content}</div>
    </div>
  );
}
