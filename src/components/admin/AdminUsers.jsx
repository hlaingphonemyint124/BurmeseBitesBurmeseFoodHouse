import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Filter, MoreVertical, UserCheck, UserX,
  Shield, ShieldOff, Trash2, Mail, Phone, Calendar,
  ChevronDown, ChevronUp, Eye, RefreshCw, Download,
  UserPlus, X, CheckCircle, AlertCircle, Clock,
  Edit3, Save, Lock, Unlock, Ban, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

/* ─── helpers ─── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const initials = (name, email) => {
  const n = name || email || '?';
  return n.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase();
};
const roleColor = (role) => ({
  admin:    { bg: 'rgba(194,122,42,0.12)', color: '#C27A2A', label: 'Admin' },
  driver:   { bg: 'rgba(42,107,82,0.12)',  color: '#2A6B52', label: 'Driver' },
  customer: { bg: 'rgba(60,90,160,0.10)',  color: '#3C5AA0', label: 'Customer' },
}[role] || { bg: '#f0f0f0', color: '#666', label: role || 'Customer' });

const statusColor = (confirmed) => confirmed
  ? { bg: 'rgba(34,197,94,0.1)', color: '#16A34A', label: 'Verified' }
  : { bg: 'rgba(234,179,8,0.1)',  color: '#CA8A04', label: 'Unverified' };

/* ─── Sub-components ─── */
function Badge({ bg, color, label, icon }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:bg, color, whiteSpace:'nowrap' }}>
      {icon}{label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div className="au-stat">
      <div className="au-stat__icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div>
        <div className="au-stat__value">{value}</div>
        <div className="au-stat__label">{label}</div>
        {sub && <div className="au-stat__sub">{sub}</div>}
      </div>
    </div>
  );
}

function UserModal({ user: u, onClose, onUpdate }) {
  const [tab, setTab] = useState('info');
  const [editName, setEditName] = useState(u.user_metadata?.full_name || '');
  const [editPhone, setEditPhone] = useState(u.user_metadata?.phone || '');
  const [editRole, setEditRole] = useState(u.user_metadata?.role || 'customer');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(u.id, {
        user_metadata: { ...u.user_metadata, full_name: editName, phone: editPhone, role: editRole }
      });
      if (error) throw error;
      toast.success('User updated successfully');
      onUpdate();
      onClose();
    } catch (err) {
      // Fallback: update via profiles table if admin API not available
      try {
        await supabase.from('profiles').upsert({ id: u.id, full_name: editName, phone: editPhone, role: editRole });
        toast.success('Profile updated');
        onUpdate();
        onClose();
      } catch {
        toast.error('Update failed: ' + err.message);
      }
    }
    setSaving(false);
  };

  const rc = roleColor(u.user_metadata?.role || 'customer');
  const sc = statusColor(u.email_confirmed_at);
  const displayName = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';

  return (
    <div className="au-modal-overlay" onClick={onClose}>
      <div className="au-modal" onClick={e => e.stopPropagation()}>
        <div className="au-modal__header">
          <div className="au-modal__avatar">{initials(displayName, u.email)}</div>
          <div className="au-modal__header-info">
            <h3>{displayName}</h3>
            <span>{u.email}</span>
            <div style={{ display:'flex', gap:6, marginTop:6 }}>
              <Badge {...rc} />
              <Badge {...sc} />
            </div>
          </div>
          <button className="au-modal__close" onClick={onClose}><X size={18}/></button>
        </div>

        <div className="au-modal__tabs">
          {['info','edit','activity'].map(t => (
            <button key={t} className={`au-modal__tab ${tab===t?'au-modal__tab--active':''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="au-modal__body">
            <div className="au-detail-grid">
              <div className="au-detail-item"><span>User ID</span><code style={{fontSize:11}}>{u.id?.slice(0,18)}…</code></div>
              <div className="au-detail-item"><span>Email</span><strong>{u.email}</strong></div>
              <div className="au-detail-item"><span>Phone</span><strong>{u.user_metadata?.phone || '—'}</strong></div>
              <div className="au-detail-item"><span>Role</span><Badge {...rc}/></div>
              <div className="au-detail-item"><span>Status</span><Badge {...sc}/></div>
              <div className="au-detail-item"><span>Auth Provider</span><strong style={{textTransform:'capitalize'}}>{u.app_metadata?.provider || 'email'}</strong></div>
              <div className="au-detail-item"><span>Registered</span><strong>{fmtDateTime(u.created_at)}</strong></div>
              <div className="au-detail-item"><span>Last Sign In</span><strong>{fmtDateTime(u.last_sign_in_at)}</strong></div>
              <div className="au-detail-item"><span>Email Verified</span><strong>{u.email_confirmed_at ? fmtDate(u.email_confirmed_at) : 'Not verified'}</strong></div>
            </div>
          </div>
        )}

        {tab === 'edit' && (
          <div className="au-modal__body">
            <div className="au-edit-form">
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name"/>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+66 …"/>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-input form-select" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{marginTop:8}}>
                <Save size={14}/> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="au-modal__body">
            <div className="au-activity-timeline">
              {[
                { icon: <CheckCircle size={14}/>, color:'#16A34A', label:'Account created', time: fmtDateTime(u.created_at) },
                u.email_confirmed_at && { icon: <Mail size={14}/>, color:'#2563EB', label:'Email verified', time: fmtDateTime(u.email_confirmed_at) },
                u.last_sign_in_at && { icon: <UserCheck size={14}/>, color:'#7C3AED', label:'Last sign in', time: fmtDateTime(u.last_sign_in_at) },
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="au-timeline-item">
                  <div className="au-timeline-dot" style={{ background: item.color + '20', color: item.color }}>{item.icon}</div>
                  <div><p>{item.label}</p><span>{item.time}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Try admin API first
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      setUsers(data.users || []);
    } catch {
      // Fallback: fetch from profiles table
      try {
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profiles) {
          setUsers(profiles.map(p => ({
            id: p.id, email: p.email || '', created_at: p.created_at,
            last_sign_in_at: p.last_sign_in_at, email_confirmed_at: p.email_confirmed_at,
            user_metadata: { full_name: p.full_name, phone: p.phone, role: p.role },
            app_metadata: { provider: 'email' }
          })));
        }
      } catch {
        toast.error('Could not load users. Admin API access required.');
        setUsers([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Close action menu on outside click
  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleBanUser = async (userId, banned) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: banned ? 'none' : '876600h' });
      if (error) throw error;
      toast.success(banned ? 'User unbanned' : 'User banned');
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
    setActionMenu(null);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
    setActionMenu(null);
  };

  const handleRoleChange = async (userId, meta, newRole) => {
    try {
      await supabase.auth.admin.updateUserById(userId, { user_metadata: { ...meta, role: newRole } });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
    setActionMenu(null);
  };

  const handleExport = () => {
    const rows = [['Name','Email','Role','Status','Registered','Last Sign In']];
    filtered.forEach(u => rows.push([
      u.user_metadata?.full_name || '',
      u.email,
      u.user_metadata?.role || 'customer',
      u.email_confirmed_at ? 'Verified' : 'Unverified',
      fmtDate(u.created_at),
      fmtDate(u.last_sign_in_at),
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users_export.csv'; a.click();
    toast.success('Users exported');
  };

  // Filtering + sorting
  const filtered = users
    .filter(u => {
      const name = u.user_metadata?.full_name || '';
      const q = search.toLowerCase();
      if (q && !name.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
      if (roleFilter !== 'all' && (u.user_metadata?.role || 'customer') !== roleFilter) return false;
      if (statusFilter === 'verified' && !u.email_confirmed_at) return false;
      if (statusFilter === 'unverified' && u.email_confirmed_at) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal = sortBy === 'name' ? (a.user_metadata?.full_name || a.email) : (a[sortBy] || '');
      let bVal = sortBy === 'name' ? (b.user_metadata?.full_name || b.email) : (b[sortBy] || '');
      return sortDir === 'asc' ? aVal > bVal ? 1 : -1 : aVal < bVal ? 1 : -1;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
    setPage(1);
  };

  // Stats
  const totalUsers = users.length;
  const admins = users.filter(u => u.user_metadata?.role === 'admin').length;
  const drivers = users.filter(u => u.user_metadata?.role === 'driver').length;
  const verified = users.filter(u => u.email_confirmed_at).length;
  const thisMonth = users.filter(u => {
    if (!u.created_at) return false;
    const d = new Date(u.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="au-page">
      <style>{`
        .au-page { padding: 0; }
        .au-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:12px; }
        .au-header__left h2 { font-size:22px; font-weight:700; margin:0 0 4px; color:var(--charcoal); }
        .au-header__left p { font-size:13px; color:#888; margin:0; }
        .au-header__actions { display:flex; gap:8px; flex-wrap:wrap; }
        .au-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; margin-bottom:24px; }
        .au-stat { background:var(--surface,#fff); border:1px solid var(--border,#e8e0d4); border-radius:12px; padding:16px; display:flex; align-items:center; gap:14px; }
        .au-stat__icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .au-stat__value { font-size:22px; font-weight:700; color:var(--charcoal); line-height:1; }
        .au-stat__label { font-size:11px; color:#888; margin-top:2px; }
        .au-stat__sub { font-size:11px; color:#16A34A; margin-top:2px; font-weight:500; }

        .au-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .au-search { position:relative; flex:1; min-width:200px; }
        .au-search input { width:100%; padding:9px 12px 9px 36px; border:1px solid var(--border,#e8e0d4); border-radius:8px; font-size:13px; background:var(--surface,#fff); color:var(--charcoal); outline:none; box-sizing:border-box; }
        .au-search input:focus { border-color:var(--amber-light); }
        .au-search__icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#aaa; pointer-events:none; }
        .au-filter select { padding:9px 12px; border:1px solid var(--border,#e8e0d4); border-radius:8px; font-size:13px; background:var(--surface,#fff); color:var(--charcoal); cursor:pointer; outline:none; }

        .au-table-wrap { background:var(--surface,#fff); border:1px solid var(--border,#e8e0d4); border-radius:14px; overflow:hidden; }
        .au-table { width:100%; border-collapse:collapse; }
        .au-table th { padding:11px 16px; text-align:left; font-size:11px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:0.06em; background:var(--bg-subtle,#f9f6f2); border-bottom:1px solid var(--border,#e8e0d4); white-space:nowrap; cursor:pointer; user-select:none; }
        .au-table th:hover { color:var(--charcoal); }
        .au-table td { padding:13px 16px; font-size:13px; color:var(--charcoal); border-bottom:1px solid var(--border,#e8e0d4); vertical-align:middle; }
        .au-table tr:last-child td { border-bottom:none; }
        .au-table tbody tr:hover { background:var(--bg-subtle,#f9f6f2); }

        .au-user-cell { display:flex; align-items:center; gap:10px; }
        .au-avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; background:rgba(194,122,42,0.15); color:#C27A2A; }
        .au-user-cell__info p { margin:0; font-weight:500; font-size:13px; }
        .au-user-cell__info span { font-size:11px; color:#888; }

        .au-action-wrap { position:relative; }
        .au-action-btn { background:none; border:1px solid var(--border,#e8e0d4); border-radius:6px; padding:5px 7px; cursor:pointer; color:#888; display:flex; align-items:center; }
        .au-action-btn:hover { border-color:var(--amber-light); color:var(--amber-light); }
        .au-action-menu { position:absolute; right:0; top:calc(100% + 6px); background:var(--surface,#fff); border:1px solid var(--border,#e8e0d4); border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,0.12); z-index:100; min-width:180px; overflow:hidden; }
        .au-action-menu button { display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px; background:none; border:none; font-size:13px; cursor:pointer; color:var(--charcoal); text-align:left; }
        .au-action-menu button:hover { background:var(--bg-subtle,#f9f6f2); }
        .au-action-menu__divider { border:none; border-top:1px solid var(--border,#e8e0d4); margin:4px 0; }
        .au-action-menu .danger { color:#DC2626; }

        .au-pagination { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-top:1px solid var(--border,#e8e0d4); font-size:13px; color:#888; flex-wrap:wrap; gap:8px; }
        .au-pagination__pages { display:flex; gap:6px; }
        .au-pagination__btn { padding:5px 10px; border:1px solid var(--border,#e8e0d4); border-radius:6px; background:none; cursor:pointer; font-size:13px; color:var(--charcoal); }
        .au-pagination__btn:hover { border-color:var(--amber-light); color:var(--amber-light); }
        .au-pagination__btn--active { background:var(--amber-light); border-color:var(--amber-light); color:#fff; font-weight:600; }
        .au-pagination__btn:disabled { opacity:0.4; cursor:not-allowed; }

        .au-empty { text-align:center; padding:60px 20px; color:#aaa; }
        .au-empty svg { margin-bottom:12px; opacity:0.3; }

        /* Modal */
        .au-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); }
        .au-modal { background:var(--surface,#fff); border-radius:16px; width:100%; max-width:520px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,0.2); }
        .au-modal__header { display:flex; align-items:flex-start; gap:14px; padding:24px 24px 16px; border-bottom:1px solid var(--border,#e8e0d4); }
        .au-modal__avatar { width:52px; height:52px; border-radius:50%; background:rgba(194,122,42,0.15); color:#C27A2A; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .au-modal__header-info { flex:1; }
        .au-modal__header-info h3 { margin:0 0 2px; font-size:16px; font-weight:700; }
        .au-modal__header-info span { font-size:12px; color:#888; }
        .au-modal__close { background:none; border:none; cursor:pointer; color:#aaa; padding:4px; border-radius:6px; }
        .au-modal__close:hover { color:var(--charcoal); background:var(--bg-subtle,#f9f6f2); }
        .au-modal__tabs { display:flex; border-bottom:1px solid var(--border,#e8e0d4); padding:0 24px; }
        .au-modal__tab { padding:12px 16px; border:none; background:none; cursor:pointer; font-size:13px; color:#888; border-bottom:2px solid transparent; margin-bottom:-1px; }
        .au-modal__tab--active { color:var(--amber-light); border-bottom-color:var(--amber-light); font-weight:600; }
        .au-modal__body { padding:20px 24px 24px; }

        .au-detail-grid { display:grid; gap:12px; }
        .au-detail-item { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-subtle,#f9f6f2); border-radius:8px; gap:12px; }
        .au-detail-item span { font-size:12px; color:#888; flex-shrink:0; }
        .au-detail-item strong { font-size:13px; font-weight:500; text-align:right; }

        .au-edit-form { display:flex; flex-direction:column; gap:14px; }
        .au-timeline-item { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid var(--border,#e8e0d4); }
        .au-timeline-item:last-child { border-bottom:none; }
        .au-timeline-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
        .au-timeline-item p { margin:0; font-size:13px; font-weight:500; }
        .au-timeline-item span { font-size:11px; color:#888; }

        .au-loading { display:flex; align-items:center; justify-content:center; padding:60px; }
        .au-count-badge { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:var(--amber-light); color:#fff; font-size:10px; font-weight:700; }

        /* Dark mode overrides */
        [data-theme="dark"] .au-table-wrap,
        [data-theme="dark"] .au-stat { background:var(--surface-1,#1E1A14); border-color:rgba(255,255,255,0.08); }
        [data-theme="dark"] .au-table th { background:var(--surface-2,#2A2218); }
        [data-theme="dark"] .au-table tbody tr:hover { background:var(--surface-2,#2A2218); }
        [data-theme="dark"] .au-search input,
        [data-theme="dark"] .au-filter select { background:var(--surface-1,#1E1A14); border-color:rgba(255,255,255,0.10); color:var(--charcoal,#F5F0E8); }
        [data-theme="dark"] .au-modal { background:var(--surface-1,#1E1A14); }
        [data-theme="dark"] .au-modal__header,
        [data-theme="dark"] .au-modal__tabs,
        [data-theme="dark"] .au-pagination { border-color:rgba(255,255,255,0.08); }
        [data-theme="dark"] .au-detail-item { background:var(--surface-2,#2A2218); }
        [data-theme="dark"] .au-timeline-item { border-color:rgba(255,255,255,0.08); }
        [data-theme="dark"] .au-action-menu { background:var(--surface-1,#1E1A14); border-color:rgba(255,255,255,0.10); }
        [data-theme="dark"] .au-action-menu button:hover { background:var(--surface-2,#2A2218); }
        [data-theme="dark"] .au-action-menu__divider { border-color:rgba(255,255,255,0.08); }
      `}</style>

      <div className="au-header">
        <div className="au-header__left">
          <h2>User Management</h2>
          <p>{totalUsers} total users registered</p>
        </div>
        <div className="au-header__actions">
          <button className="btn btn-outline" onClick={fetchUsers} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button className="btn btn-outline" onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Download size={14}/> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="au-stats">
        <StatCard icon={<Users size={18}/>}     label="Total Users"     value={totalUsers} sub={`+${thisMonth} this month`} iconBg="rgba(60,90,160,0.1)"   iconColor="#3C5AA0"/>
        <StatCard icon={<CheckCircle size={18}/>} label="Verified"      value={verified}   iconBg="rgba(34,197,94,0.1)"    iconColor="#16A34A"/>
        <StatCard icon={<Shield size={18}/>}    label="Admins"          value={admins}     iconBg="rgba(194,122,42,0.12)"  iconColor="#C27A2A"/>
        <StatCard icon={<UserCheck size={18}/>} label="Drivers"         value={drivers}    iconBg="rgba(42,107,82,0.12)"   iconColor="#2A6B52"/>
        <StatCard icon={<AlertCircle size={18}/>} label="Unverified"    value={totalUsers - verified} iconBg="rgba(234,179,8,0.1)" iconColor="#CA8A04"/>
      </div>

      {/* Toolbar */}
      <div className="au-toolbar">
        <div className="au-search">
          <Search size={14} className="au-search__icon"/>
          <input placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <div className="au-filter">
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="au-filter">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="au-table-wrap">
        {loading ? (
          <div className="au-loading"><div className="spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="au-empty">
            <Users size={40}/>
            <p>No users found</p>
          </div>
        ) : (
          <>
            <table className="au-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('name')} style={{ minWidth:200 }}>
                    User {sortBy==='name' && (sortDir==='asc'?<ChevronUp size={12}/>:<ChevronDown size={12}/>)}
                  </th>
                  <th>Role</th>
                  <th>Status</th>
                  <th onClick={() => toggleSort('created_at')} style={{ minWidth:120 }}>
                    Registered {sortBy==='created_at' && (sortDir==='asc'?<ChevronUp size={12}/>:<ChevronDown size={12}/>)}
                  </th>
                  <th onClick={() => toggleSort('last_sign_in_at')} style={{ minWidth:120 }}>
                    Last Sign In {sortBy==='last_sign_in_at' && (sortDir==='asc'?<ChevronUp size={12}/>:<ChevronDown size={12}/>)}
                  </th>
                  <th style={{ width:60, textAlign:'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(u => {
                  const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';
                  const rc = roleColor(u.user_metadata?.role || 'customer');
                  const sc = statusColor(u.email_confirmed_at);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="au-user-cell">
                          <div className="au-avatar">{initials(name, u.email)}</div>
                          <div className="au-user-cell__info">
                            <p>{name}</p>
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><Badge {...rc}/></td>
                      <td><Badge {...sc}/></td>
                      <td style={{ color:'#888', fontSize:12 }}>{fmtDate(u.created_at)}</td>
                      <td style={{ color:'#888', fontSize:12 }}>{fmtDate(u.last_sign_in_at)}</td>
                      <td>
                        <div className="au-action-wrap" onClick={e => e.stopPropagation()}>
                          <button className="au-action-btn" onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}>
                            <MoreVertical size={15}/>
                          </button>
                          {actionMenu === u.id && (
                            <div className="au-action-menu">
                              <button onClick={() => { setSelectedUser(u); setActionMenu(null); }}>
                                <Eye size={14}/> View Details
                              </button>
                              <button onClick={() => { setSelectedUser(u); setActionMenu(null); }}>
                                <Edit3 size={14}/> Edit User
                              </button>
                              <hr className="au-action-menu__divider"/>
                              {(u.user_metadata?.role || 'customer') !== 'driver' && (
                                <button onClick={() => handleRoleChange(u.id, u.user_metadata, 'driver')}>
                                  <UserCheck size={14}/> Make Driver
                                </button>
                              )}
                              {(u.user_metadata?.role || 'customer') !== 'admin' && (
                                <button onClick={() => handleRoleChange(u.id, u.user_metadata, 'admin')}>
                                  <Shield size={14}/> Make Admin
                                </button>
                              )}
                              {(u.user_metadata?.role || 'customer') !== 'customer' && (
                                <button onClick={() => handleRoleChange(u.id, u.user_metadata, 'customer')}>
                                  <ShieldOff size={14}/> Set as Customer
                                </button>
                              )}
                              <hr className="au-action-menu__divider"/>
                              <button onClick={() => handleBanUser(u.id, u.banned_until)} className={u.banned_until ? '' : ''}>
                                {u.banned_until ? <Unlock size={14}/> : <Ban size={14}/>}
                                {u.banned_until ? 'Unban User' : 'Ban User'}
                              </button>
                              <button className="danger" onClick={() => handleDeleteUser(u.id)}>
                                <Trash2 size={14}/> Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="au-pagination">
                <span>Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</span>
                <div className="au-pagination__pages">
                  <button className="au-pagination__btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>←</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return <button key={p} className={`au-pagination__btn ${page===p?'au-pagination__btn--active':''}`} onClick={() => setPage(p)}>{p}</button>;
                  })}
                  <button className="au-pagination__btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdate={fetchUsers}/>
      )}
    </div>
  );
}
