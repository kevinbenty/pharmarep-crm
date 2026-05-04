import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createInteraction, updateInteraction } from '../store';
import { Save, X } from 'lucide-react';

const INTERACTION_TYPES = ['in-person', 'phone', 'email', 'virtual'];

export default function LogInteractionForm({ existing, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hcp_name: existing?.hcp_name || '',
    hcp_specialty: existing?.hcp_specialty || '',
    hcp_location: existing?.hcp_location || '',
    interaction_type: existing?.interaction_type || 'in-person',
    products_discussed: existing?.products_discussed || '',
    notes: existing?.notes || '',
    follow_up_required: existing?.follow_up_required || 'No',
    follow_up_notes: existing?.follow_up_notes || '',
    rep_name: existing?.rep_name || 'Field Rep',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (existing) {
        await dispatch(updateInteraction({ id: existing.id, data: form })).unwrap();
      } else {
        await dispatch(createInteraction(form)).unwrap();
      }
      onSuccess?.();
      if (!existing) onClose?.();
    } catch (err) {
      alert('Error saving interaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">HCP Name *</label>
          <input className="form-control" required value={form.hcp_name}
            onChange={e => set('hcp_name', e.target.value)} placeholder="Dr. Jane Smith" />
        </div>
        <div className="form-group">
          <label className="form-label">Specialty</label>
          <input className="form-control" value={form.hcp_specialty}
            onChange={e => set('hcp_specialty', e.target.value)} placeholder="Cardiology" />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-control" value={form.hcp_location}
            onChange={e => set('hcp_location', e.target.value)} placeholder="Mumbai, MH" />
        </div>
        <div className="form-group">
          <label className="form-label">Interaction Type</label>
          <select className="form-control" value={form.interaction_type}
            onChange={e => set('interaction_type', e.target.value)}>
            {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Rep Name</label>
          <input className="form-control" value={form.rep_name}
            onChange={e => set('rep_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Products Discussed</label>
          <input className="form-control" value={form.products_discussed}
            onChange={e => set('products_discussed', e.target.value)} placeholder="CardioMax, NeuroPlus" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Interaction Notes *</label>
        <textarea className="form-control" required rows={4} value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Describe what was discussed during the interaction..." />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Follow-up Required</label>
          <select className="form-control" value={form.follow_up_required}
            onChange={e => set('follow_up_required', e.target.value)}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        {form.follow_up_required === 'Yes' && (
          <div className="form-group">
            <label className="form-label">Follow-up Notes</label>
            <input className="form-control" value={form.follow_up_notes}
              onChange={e => set('follow_up_notes', e.target.value)}
              placeholder="What needs follow-up?" />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        {onClose && (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            <X size={14} /> Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <Save size={14} /> {loading ? 'Saving...' : existing ? 'Update' : 'Log Interaction'}
        </button>
      </div>
    </form>
  );
}
