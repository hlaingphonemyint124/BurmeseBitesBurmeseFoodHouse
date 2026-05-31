import React, { useState, useEffect } from 'react';
import { Search, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllReservations, updateReservationStatus, deleteReservation } from '../../lib/supabase';

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled'];

export default function AdminReservations() {
  const [reservations, setRes] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [statusF, setStatusF]  = useState('all');

  const load = () => {
    setLoading(true);
    getAllReservations().then(({ data }) => {
      setRes(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    const { error } = await updateReservationStatus(id, status);
    if (error) { toast.error(error.message); return; }
    toast.success(`Reservation marked as ${status}.`);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reservation?')) return;
    const { error } = await deleteReservation(id);
    if (error) { toast.error(error.message); return; }
    toast.success('Reservation deleted.');
    load();
  };

  const filtered = reservations.filter(r => {
    const matchStatus = statusF === 'all' || r.status === statusF;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                        r.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusClass = (s) => ({ pending:'status-pending', confirmed:'status-confirmed', cancelled:'status-cancelled' }[s] || 'status-pending');

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2>Reservations</h2>
          <p>{reservations.length} total · {reservations.filter(r => r.status === 'pending').length} pending</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search">
          <Search size={14} className="admin-search__icon" />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width:'auto' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Contact</th>
                <th>Date & Time</th>
                <th>Party</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', fontStyle:'italic' }}>No reservations found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight:500 }}>{r.name}</td>
                  <td>
                    <div style={{ fontSize:12 }}>{r.email}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.phone || '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight:500 }}>{r.date}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.time}</div>
                  </td>
                  <td>{r.party_size} guests</td>
                  <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:160 }}>
                    {r.special_notes || '—'}
                  </td>
                  <td><span className={`status-badge ${statusClass(r.status)}`}>{r.status}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {r.status !== 'confirmed' && (
                        <button className="admin-action-btn admin-action-btn--approve" onClick={() => handleStatus(r.id, 'confirmed')}>
                          <CheckCircle size={11} /> Confirm
                        </button>
                      )}
                      {r.status !== 'cancelled' && (
                        <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleStatus(r.id, 'cancelled')}>
                          <XCircle size={11} /> Cancel
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button className="admin-action-btn" style={{ background:'var(--ivory)', color:'var(--text-muted)', border:'1px solid var(--border)' }}
                          onClick={() => handleStatus(r.id, 'pending')}>
                          <Clock size={11} /> Keep Pending
                        </button>
                      )}
                      <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleDelete(r.id)}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
