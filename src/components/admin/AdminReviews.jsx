import "./AdminComponents.css";
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, Star, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllReviews, updateReviewApproval, deleteReview } from '../../lib/supabase';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all'); // all | pending | approved

  const load = () => {
    setLoading(true);
    getAllReviews().then(({ data }) => {
      setReviews(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleApproval = async (id, approved) => {
    const { error } = await updateReviewApproval(id, approved);
    if (error) { toast.error(error.message); return; }
    toast.success(approved ? 'Review approved and published!' : 'Review unpublished.');
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    const { error } = await deleteReview(id);
    if (error) { toast.error(error.message); return; }
    toast.success('Review deleted.');
    load();
  };

  const filtered = reviews.filter(r => {
    const matchFilter = filter === 'all' || (filter === 'pending' ? !r.approved : r.approved);
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                        r.comment.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const renderStars = (n) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={13} fill={i < n ? 'currentColor' : 'none'}
        style={{ color: i < n ? 'var(--amber)' : '#d8cfc2' }} />
    ));

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2>Reviews</h2>
          <p>{reviews.filter(r => !r.approved).length} pending approval · {reviews.filter(r => r.approved).length} published</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search">
          <Search size={14} className="admin-search__icon" />
          <input placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['all','pending','approved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="admin-action-btn"
              style={{
                background: filter === f ? 'var(--amber)' : '#fff',
                color: filter === f ? '#fff' : 'var(--brown-light)',
                border: `1px solid ${filter === f ? 'var(--amber)' : 'var(--border)'}`,
              }}
            >
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', color:'var(--text-muted)', fontStyle:'italic', background:'#fff', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
              No reviews found.
            </div>
          ) : filtered.map(r => (
            <div key={r.id} className="review-admin-card">
              <div className="review-admin-card__left">
                <div className="review-admin-card__avatar">{r.name.charAt(0)}</div>
                <div>
                  <p style={{ fontWeight:600, fontSize:14, color:'var(--charcoal)' }}>{r.name}</p>
                  <div style={{ display:'flex', gap:1, marginTop:3 }}>{renderStars(r.rating)}</div>
                  <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' })}
                  </p>
                </div>
              </div>
              <div className="review-admin-card__body">
                <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:14, color:'var(--brown)', lineHeight:1.7 }}>
                  "{r.comment}"
                </p>
              </div>
              <div className="review-admin-card__actions">
                <span className={`status-badge ${r.approved ? 'status-confirmed' : 'status-pending'}`}>
                  {r.approved ? 'Published' : 'Pending'}
                </span>
                {!r.approved ? (
                  <button className="admin-action-btn admin-action-btn--approve" onClick={() => handleApproval(r.id, true)}>
                    <CheckCircle size={12} /> Approve
                  </button>
                ) : (
                  <button className="admin-action-btn" style={{ background:'var(--ivory)', color:'var(--text-muted)', border:'1px solid var(--border)' }}
                    onClick={() => handleApproval(r.id, false)}>
                    <XCircle size={12} /> Unpublish
                  </button>
                )}
                <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleDelete(r.id)}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
