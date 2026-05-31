import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User, ShoppingCart, CalendarDays, Settings, LogOut, Save,
  Shield, Bell, Palette, Trash2, Eye, EyeOff, CheckCircle,
  Lock, Mail, Phone, Globe, Camera, AlertTriangle, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/AuthContext';
import { signOut, supabase } from '../../lib/supabase';
import './Profile.css';

/* ─── Sidebar nav ─────────────────────────────────────────────────────────── */
function ProfileNav() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Signed out.');
    navigate('/');
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';

  const links = [
    { to:'/profile',               icon:<User size={16}/>,         label:'My Profile'       },
    { to:'/profile/orders',        icon:<ShoppingCart size={16}/>, label:'My Orders'        },
    { to:'/profile/reservations',  icon:<CalendarDays size={16}/>, label:'My Reservations'  },
    { to:'/profile/settings',      icon:<Settings size={16}/>,     label:'Account Settings' },
  ];

  return (
    <div className="profile-nav">
      <div className="profile-nav__user">
        <div className="profile-nav__avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="profile-nav__name">{displayName}</p>
          <p className="profile-nav__email">{user?.email}</p>
        </div>
      </div>
      <nav className="profile-nav__links">
        {links.map(({ to, icon, label }) => (
          <Link key={to} to={to}
            className={`profile-nav__link ${pathname === to ? 'profile-nav__link--active' : ''}`}>
            {icon} {label}
          </Link>
        ))}
        <button className="profile-nav__link profile-nav__logout" onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </nav>
    </div>
  );
}

/* ─── Profile Home ────────────────────────────────────────────────────────── */
function ProfileHome() {
  const { user } = useAuth();
  const [form, setForm]     = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone:     user?.user_metadata?.phone     || '',
    bio:       user?.user_metadata?.bio       || '',
    website:   user?.user_metadata?.website   || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: form });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile updated!');
  };

  return (
    <div className="profile-card">
      <h2>My Profile</h2>
      <p className="profile-card__sub">Manage your personal information</p>
      <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16, marginTop:24 }}>
        <div className="profile-avatar-section">
          <div className="profile-avatar-big">{(form.full_name || user?.email || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <p style={{ fontWeight:600, fontSize:14, color:'var(--charcoal)' }}>{form.full_name || 'Your Name'}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>Member since {new Date(user?.created_at).toLocaleDateString('en-GB', { month:'long', year:'numeric' })}</p>
          </div>
        </div>
        <div className="profile-form-grid">
          <div className="form-group">
            <label><User size={13} style={{ verticalAlign:'middle', marginRight:5 }} />Full Name</label>
            <input className="form-input" placeholder="Your full name"
              value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label><Mail size={13} style={{ verticalAlign:'middle', marginRight:5 }} />Email Address</label>
            <input className="form-input" value={user?.email} disabled style={{ opacity:0.6, cursor:'not-allowed' }} />
            <span style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, display:'block' }}>Change email in Security settings.</span>
          </div>
          <div className="form-group">
            <label><Phone size={13} style={{ verticalAlign:'middle', marginRight:5 }} />Phone Number</label>
            <input className="form-input" placeholder="+66 ..."
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label><Globe size={13} style={{ verticalAlign:'middle', marginRight:5 }} />Website / Social</label>
            <input className="form-input" placeholder="https://..."
              value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          </div>
          <div className="form-group full">
            <label>Bio</label>
            <textarea className="form-input" placeholder="Tell us a little about yourself..."
              rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf:'flex-start' }} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

/* ─── Orders ──────────────────────────────────────────────────────────────── */
function ProfileOrders() {
  const { user }   = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('*, order_items(*)')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user]);

  const statusClass = s => ({ received:'status-received', preparing:'status-preparing', ready:'status-ready', delivered:'status-delivered' }[s] || 'status-received');

  return (
    <div className="profile-card">
      <h2>My Orders</h2>
      <p className="profile-card__sub">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      {loading ? <div className="spinner" /> : orders.length === 0 ? (
        <div className="profile-empty">
          <ShoppingCart size={36} />
          <p>No orders yet. Browse our menu and place your first order!</p>
          <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
        </div>
      ) : (
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:12 }}>
          {orders.map(o => (
            <div key={o.id} className="profile-order-card">
              <div className="profile-order-card__head">
                <div>
                  <p style={{ fontWeight:600, fontSize:14 }}>Order #{o.id.slice(-8).toUpperCase()}</p>
                  <p style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span className={`status-badge ${statusClass(o.status)}`}>{o.status}</span>
                  <p style={{ fontSize:14, fontWeight:700, color:'var(--amber-dark)', marginTop:4 }}>${parseFloat(o.total_amount).toFixed(2)}</p>
                </div>
              </div>
              <div className="profile-order-card__items">
                {(o.order_items||[]).map(i => (
                  <span key={i.id} className="profile-order-card__item">{i.quantity}× {i.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Reservations ────────────────────────────────────────────────────────── */
function ProfileReservations() {
  const { user } = useAuth();
  const [res, setRes]         = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('reservations').select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRes(data || []); setLoading(false); });
  }, [user]);

  const statusClass = s => ({ pending:'status-pending', confirmed:'status-confirmed', cancelled:'status-cancelled' }[s] || 'status-pending');

  return (
    <div className="profile-card">
      <h2>My Reservations</h2>
      <p className="profile-card__sub">{res.length} reservation{res.length !== 1 ? 's' : ''} made</p>
      {loading ? <div className="spinner" /> : res.length === 0 ? (
        <div className="profile-empty">
          <CalendarDays size={36} />
          <p>No reservations yet. Book a table for your next visit!</p>
          <Link to="/reservation" className="btn btn-primary">Book a Table</Link>
        </div>
      ) : (
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:12 }}>
          {res.map(r => (
            <div key={r.id} className="profile-order-card">
              <div className="profile-order-card__head">
                <div>
                  <p style={{ fontWeight:600, fontSize:14 }}>{r.date} at {r.time}</p>
                  <p style={{ fontSize:12, color:'var(--text-muted)' }}>{r.party_size} guest{r.party_size !== 1 ? 's' : ''}{r.special_notes ? ` · ${r.special_notes}` : ''}</p>
                </div>
                <span className={`status-badge ${statusClass(r.status)}`}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Account Settings — Full Pro ─────────────────────────────────────────── */
function ProfileSettings() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [tab, setTab] = useState('security');

  // Password state
  const [pwd, setPwd]         = useState({ next:'', confirm:'' });
  const [showPwd, setShowPwd] = useState({ next:false, confirm:false });
  const [savingPwd, setSavingPwd] = useState(false);

  // Email state
  const [newEmail, setNewEmail]     = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState({
    order_updates:    user?.user_metadata?.notif_order   ?? true,
    reservation_reminders: user?.user_metadata?.notif_reservation ?? true,
    promotions:       user?.user_metadata?.notif_promo   ?? false,
    newsletter:       user?.user_metadata?.notif_news    ?? false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteZone, setShowDeleteZone] = useState(false);

  const handlePwd = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { toast.error('Passwords do not match.'); return; }
    if (pwd.next.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully!');
    setPwd({ next:'', confirm:'' });
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) { toast.error('Enter a valid email.'); return; }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSavingEmail(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Confirmation sent to ' + newEmail + '. Check your inbox!');
    setNewEmail('');
  };

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        notif_order:        notifs.order_updates,
        notif_reservation:  notifs.reservation_reminders,
        notif_promo:        notifs.promotions,
        notif_news:         notifs.newsletter,
      }
    });
    setSavingNotifs(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Notification preferences saved!');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { toast.error('Type DELETE to confirm.'); return; }
    toast.error('Account deletion requires admin action. Please contact support@burmesebites.com');
    setShowDeleteZone(false);
    setDeleteConfirm('');
  };

  const TABS = [
    { key:'security',      icon:<Lock size={15}/>,  label:'Security'       },
    { key:'notifications', icon:<Bell size={15}/>,  label:'Notifications'  },
    { key:'account',       icon:<User size={15}/>,  label:'Account Info'   },
    { key:'danger',        icon:<AlertTriangle size={15}/>, label:'Danger Zone' },
  ];

  return (
    <div className="profile-card settings-card">
      <h2>Account Settings</h2>
      <p className="profile-card__sub">Manage your security, notifications, and account preferences</p>

      {/* Tab navigation */}
      <div className="settings-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`settings-tab ${tab === t.key ? 'settings-tab--active' : ''} ${t.key === 'danger' ? 'settings-tab--danger' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Security ── */}
      {tab === 'security' && (
        <div className="settings-section">
          <div className="settings-section__header">
            <Lock size={18} />
            <div>
              <h3>Change Password</h3>
              <p>Use a strong password with at least 8 characters</p>
            </div>
          </div>
          <form onSubmit={handlePwd} className="settings-form">
            <div className="form-group">
              <label>New Password</label>
              <div className="input-icon-wrap">
                <input
                  required type={showPwd.next ? 'text' : 'password'}
                  className="form-input" placeholder="Min 8 characters"
                  value={pwd.next} onChange={e => setPwd(p => ({...p, next:e.target.value}))}
                />
                <button type="button" className="input-eye-btn" onClick={() => setShowPwd(s => ({...s, next:!s.next}))}>
                  {showPwd.next ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwd.next.length > 0 && (
                <div className="pwd-strength">
                  <div className={`pwd-strength__bar ${pwd.next.length >= 8 ? (pwd.next.length >= 12 ? 'strong' : 'medium') : 'weak'}`} />
                  <span>{pwd.next.length < 8 ? 'Too short' : pwd.next.length < 12 ? 'Good' : 'Strong'}</span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="input-icon-wrap">
                <input
                  required type={showPwd.confirm ? 'text' : 'password'}
                  className="form-input" placeholder="Repeat new password"
                  value={pwd.confirm} onChange={e => setPwd(p => ({...p, confirm:e.target.value}))}
                />
                <button type="button" className="input-eye-btn" onClick={() => setShowPwd(s => ({...s, confirm:!s.confirm}))}>
                  {showPwd.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwd.confirm.length > 0 && pwd.next === pwd.confirm && (
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--jade-dark)', marginTop:5 }}>
                  <CheckCircle size={13} /> Passwords match
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPwd}>
              <Key size={14} /> {savingPwd ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          <div className="settings-divider" />

          <div className="settings-section__header">
            <Mail size={18} />
            <div>
              <h3>Change Email Address</h3>
              <p>Current: <strong>{user?.email}</strong></p>
            </div>
          </div>
          <form onSubmit={handleEmailChange} className="settings-form">
            <div className="form-group">
              <label>New Email Address</label>
              <input
                required type="email" className="form-input"
                placeholder="new@email.com"
                value={newEmail} onChange={e => setNewEmail(e.target.value)}
              />
              <span style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, display:'block' }}>
                A confirmation link will be sent to your new email.
              </span>
            </div>
            <button type="submit" className="btn btn-outline" disabled={savingEmail}>
              <Mail size={14} /> {savingEmail ? 'Sending…' : 'Send Confirmation'}
            </button>
          </form>
        </div>
      )}

      {/* ── Notifications ── */}
      {tab === 'notifications' && (
        <div className="settings-section">
          <div className="settings-section__header">
            <Bell size={18} />
            <div>
              <h3>Notification Preferences</h3>
              <p>Control which emails you receive from us</p>
            </div>
          </div>
          <div className="notif-list">
            {[
              { key:'order_updates',         icon:'🛒', title:'Order Updates',          desc:'Status changes for your orders (preparing, ready, delivered)' },
              { key:'reservation_reminders', icon:'📅', title:'Reservation Reminders',   desc:'Reminder emails before your table booking' },
              { key:'promotions',            icon:'🎁', title:'Promotions & Offers',     desc:'Special discounts, seasonal menus, and exclusive deals' },
              { key:'newsletter',            icon:'📰', title:'Monthly Newsletter',      desc:'Stories, recipes, and updates from our kitchen' },
            ].map(({ key, icon, title, desc }) => (
              <div key={key} className="notif-item">
                <div className="notif-item__left">
                  <span className="notif-item__icon">{icon}</span>
                  <div>
                    <p className="notif-item__title">{title}</p>
                    <p className="notif-item__desc">{desc}</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={!!notifs[key]}
                    onChange={e => setNotifs(n => ({ ...n, [key]: e.target.checked }))}
                  />
                  <span className="toggle-switch__slider" />
                </label>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop:20 }} onClick={handleSaveNotifs} disabled={savingNotifs}>
            <Save size={14} /> {savingNotifs ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* ── Account Info ── */}
      {tab === 'account' && (
        <div className="settings-section">
          <div className="settings-section__header">
            <User size={18} />
            <div>
              <h3>Account Information</h3>
              <p>Your account details and membership info</p>
            </div>
          </div>
          <div className="account-info-grid">
            <div className="account-info-item">
              <span className="account-info-item__label">Email</span>
              <span className="account-info-item__value">{user?.email}</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">Full Name</span>
              <span className="account-info-item__value">{user?.user_metadata?.full_name || '—'}</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">Phone</span>
              <span className="account-info-item__value">{user?.user_metadata?.phone || '—'}</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">Account ID</span>
              <span className="account-info-item__value" style={{ fontFamily:'monospace', fontSize:11 }}>{user?.id?.slice(0,18)}…</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">Member Since</span>
              <span className="account-info-item__value">{new Date(user?.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">Last Sign In</span>
              <span className="account-info-item__value">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">Auth Provider</span>
              <span className="account-info-item__value" style={{ textTransform:'capitalize' }}>
                {user?.app_metadata?.provider || 'email'}
              </span>
            </div>
            <div className="account-info-item">
              <span className="account-info-item__label">Email Verified</span>
              <span className="account-info-item__value">
                {user?.email_confirmed_at
                  ? <span style={{ color:'var(--jade-dark)', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={13} /> Verified</span>
                  : <span style={{ color:'#b07800' }}>Pending verification</span>}
              </span>
            </div>
          </div>
          <div style={{ marginTop:20 }}>
            <Link to="/profile" className="btn btn-outline" style={{ fontSize:13 }}>
              <User size={13} /> Edit Profile Info
            </Link>
          </div>
        </div>
      )}

      {/* ── Danger Zone ── */}
      {tab === 'danger' && (
        <div className="settings-section">
          <div className="settings-section__header danger">
            <AlertTriangle size={18} />
            <div>
              <h3>Danger Zone</h3>
              <p>These actions are permanent and cannot be undone</p>
            </div>
          </div>

          <div className="danger-item">
            <div>
              <p className="danger-item__title">Sign Out All Devices</p>
              <p className="danger-item__desc">This will end all active sessions across all devices</p>
            </div>
            <button className="btn btn-outline danger-btn" onClick={async () => {
              await signOut();
              toast.success('Signed out from all devices.');
              navigate('/');
            }}>
              <LogOut size={14} /> Sign Out All
            </button>
          </div>

          <div className="danger-item danger-item--red">
            <div>
              <p className="danger-item__title">Delete Account</p>
              <p className="danger-item__desc">Permanently delete your account and all associated data. This cannot be undone.</p>
            </div>
            <button className="btn danger-btn--red" onClick={() => setShowDeleteZone(v => !v)}>
              <Trash2 size={14} /> Delete Account
            </button>
          </div>

          {showDeleteZone && (
            <div className="delete-confirm-box">
              <p><strong>Type DELETE to confirm account deletion:</strong></p>
              <input
                className="form-input" placeholder="Type DELETE"
                value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              />
              <div style={{ display:'flex', gap:10, marginTop:12 }}>
                <button className="btn btn-outline" onClick={() => { setShowDeleteZone(false); setDeleteConfirm(''); }}>Cancel</button>
                <button className="btn danger-btn--red" onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE'}>
                  <Trash2 size={14} /> Permanently Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page wrapper ────────────────────────────────────────────────────────── */
export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) { toast.error('Please sign in first.'); navigate('/auth'); }
  }, [user, loading, navigate]);

  if (loading || !user) return <div className="spinner" style={{ marginTop:120 }} />;

  return (
    <div className="profile-page">
      <div className="container profile-page__inner">
        <ProfileNav />
        <main className="profile-main">
          <Routes>
            <Route index               element={<ProfileHome />}         />
            <Route path="orders"       element={<ProfileOrders />}       />
            <Route path="reservations" element={<ProfileReservations />} />
            <Route path="settings"     element={<ProfileSettings />}     />
          </Routes>
        </main>
      </div>
    </div>
  );
}
