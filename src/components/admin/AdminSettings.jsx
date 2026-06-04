import React, { useState } from 'react';
import {
  Save, Bell, Shield, User, Globe,
  Mail, Phone, MapPin, Clock, AlertTriangle, CheckCircle,
  Eye, EyeOff, Key, Trash2, RefreshCw,
  Lock, Activity, Settings, Users, Zap, X,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/AuthContext';
import { supabase, signOut } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

/* ── Reusable toggle ── */
function Toggle({ checked, onChange }) {
  return (
    <label className="as-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>
      <span className="as-toggle__slider"/>
    </label>
  );
}

/* ── Section block wrapper ── */
function Block({ icon, title, desc, iconBg, iconColor, children }) {
  return (
    <div className="as-block">
      <div className="as-block__header">
        <div className="as-block__icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        <div>
          <h3 className="as-block__title">{title}</h3>
          {desc && <p className="as-block__desc">{desc}</p>}
        </div>
      </div>
      <div className="as-block__body">{children}</div>
    </div>
  );
}

/* ── Setting row (label + control) ── */
function SettingRow({ label, desc, children }) {
  return (
    <div className="as-row">
      <div className="as-row__text">
        <p className="as-row__label">{label}</p>
        {desc && <p className="as-row__desc">{desc}</p>}
      </div>
      <div className="as-row__control">{children}</div>
    </div>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('profile');

  /* ── Admin profile ── */
  const [profile, setProfile] = useState({
    full_name:   user?.user_metadata?.full_name  || '',
    phone:       user?.user_metadata?.phone      || '',
    bio:         user?.user_metadata?.bio        || '',
    location:    user?.user_metadata?.location   || '',
    admin_title: user?.user_metadata?.admin_title || 'Restaurant Administrator',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Password ── */
  const [pwd, setPwd]         = useState({ next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ next: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);

  /* ── Restaurant info ── */
  const [restaurant, setRestaurant] = useState({
    name:     user?.user_metadata?.rest_name    || 'Burmese Bites',
    tagline:  user?.user_metadata?.rest_tagline || 'Authentic Myanmar Cuisine',
    address:  user?.user_metadata?.rest_address || '',
    phone:    user?.user_metadata?.rest_phone   || '',
    email:    user?.user_metadata?.rest_email   || '',
    website:  user?.user_metadata?.rest_website || '',
    hours:    user?.user_metadata?.rest_hours   || 'Mon–Sun: 11:00 – 22:00',
    capacity: user?.user_metadata?.rest_capacity || '80',
    currency: user?.user_metadata?.rest_currency || 'THB',
    timezone: user?.user_metadata?.rest_timezone || 'Asia/Bangkok',
  });
  const [savingRest, setSavingRest] = useState(false);

  /* ── Notifications ── */
  const [notifs, setNotifs] = useState({
    new_orders:      user?.user_metadata?.adm_notif_orders     ?? true,
    new_reservations: user?.user_metadata?.adm_notif_res       ?? true,
    payment_alerts:  user?.user_metadata?.adm_notif_pay        ?? true,
    new_reviews:     user?.user_metadata?.adm_notif_reviews    ?? true,
    low_stock:       user?.user_metadata?.adm_notif_stock      ?? false,
    daily_summary:   user?.user_metadata?.adm_notif_summary    ?? true,
    sound_alerts:    user?.user_metadata?.adm_notif_sound      ?? true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  /* ── System features ── */
  const [system, setSystem] = useState({
    online_orders:    user?.user_metadata?.feat_orders    ?? true,
    reservations:     user?.user_metadata?.feat_res       ?? true,
    reviews:          user?.user_metadata?.feat_reviews   ?? true,
    gallery:          user?.user_metadata?.feat_gallery   ?? true,
    promotions:       user?.user_metadata?.feat_promo     ?? false,
    maintenance_mode: user?.user_metadata?.feat_maint     ?? false,
    max_party_size:   user?.user_metadata?.max_party      || '10',
    advance_days:     user?.user_metadata?.adv_days       || '30',
    min_notice_hours: user?.user_metadata?.min_notice     || '2',
  });
  const [savingSystem, setSavingSystem] = useState(false);

  /* ── Danger ── */
  const [deleteInput, setDeleteInput]     = useState('');
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  /* Password strength */
  const strength = (p) => {
    if (!p) return null;
    const s = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    return s <= 1 ? { label: 'Weak', cls: 'weak', pct: 25 } :
           s === 2 ? { label: 'Fair', cls: 'fair', pct: 50 } :
           s === 3 ? { label: 'Good', cls: 'good', pct: 75 } :
                     { label: 'Strong', cls: 'strong', pct: 100 };
  };
  const pwdStr = strength(pwd.next);

  /* Handlers */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({ data: profile });
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Admin profile saved!');
  };

  const handlePwd = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { toast.error('Passwords do not match.'); return; }
    if (pwd.next.length < 8) { toast.error('Minimum 8 characters.'); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated!');
    setPwd({ next: '', confirm: '' });
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    setSavingRest(true);
    const { error } = await supabase.auth.updateUser({ data: {
      rest_name: restaurant.name, rest_tagline: restaurant.tagline,
      rest_address: restaurant.address, rest_phone: restaurant.phone,
      rest_email: restaurant.email, rest_website: restaurant.website,
      rest_hours: restaurant.hours, rest_capacity: restaurant.capacity,
      rest_currency: restaurant.currency, rest_timezone: restaurant.timezone,
    }});
    setSavingRest(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Restaurant info saved!');
  };

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    const { error } = await supabase.auth.updateUser({ data: {
      adm_notif_orders: notifs.new_orders,   adm_notif_res: notifs.new_reservations,
      adm_notif_pay: notifs.payment_alerts,  adm_notif_reviews: notifs.new_reviews,
      adm_notif_stock: notifs.low_stock,     adm_notif_summary: notifs.daily_summary,
      adm_notif_sound: notifs.sound_alerts,
    }});
    setSavingNotifs(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Notification preferences saved!');
  };

  const handleSaveSystem = async () => {
    setSavingSystem(true);
    const { error } = await supabase.auth.updateUser({ data: {
      feat_orders: system.online_orders,  feat_res: system.reservations,
      feat_reviews: system.reviews,       feat_gallery: system.gallery,
      feat_promo: system.promotions,      feat_maint: system.maintenance_mode,
      max_party: system.max_party_size,   adv_days: system.advance_days,
      min_notice: system.min_notice_hours,
    }});
    setSavingSystem(false);
    if (error) { toast.error(error.message); return; }
    toast.success('System settings saved!');
  };

  const TABS = [
    { key: 'profile',     icon: <User size={15}/>,        label: 'My Profile'    },
    { key: 'security',    icon: <Lock size={15}/>,        label: 'Security'      },
    { key: 'restaurant',  icon: <Settings size={15}/>,    label: 'Restaurant'    },
    { key: 'notifications', icon: <Bell size={15}/>,      label: 'Notifications' },
    { key: 'system',      icon: <Zap size={15}/>,         label: 'System'        },
    { key: 'danger',      icon: <AlertTriangle size={15}/>, label: 'Danger Zone' },
  ];

  const displayName = profile.full_name || user?.email?.split('@')[0] || 'Admin';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="as-page">
      {/* Page header */}
      <div className="as-page-header">
        <div className="as-page-header__left">
          <div className="as-page-header__avatar">{initials}</div>
          <div>
            <h2>{displayName}</h2>
            <p>{profile.admin_title}</p>
          </div>
        </div>
        <div className="as-page-header__badge">
          <Shield size={13}/> Admin Access
        </div>
      </div>

      {/* Tabs */}
      <div className="as-tabs">
        {TABS.map(t => (
          <button key={t.key}
            className={`as-tab ${tab === t.key ? 'as-tab--active' : ''} ${t.key === 'danger' ? 'as-tab--danger' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.icon} <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── ADMIN PROFILE ── */}
      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="as-content">
          <Block icon={<User size={18}/>} title="Admin Profile"
            desc="Your personal info visible within the admin panel"
            iconBg="rgba(194,122,42,0.1)" iconColor="var(--amber-dark)">
            <div className="as-form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" placeholder="Admin name"
                  value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input className="form-input" value={user?.email} disabled/>
                <span className="form-hint">Change email in Security tab</span>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input className="form-input" placeholder="+66 …"
                  value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Admin Title / Role</label>
                <input className="form-input" placeholder="Restaurant Administrator"
                  value={profile.admin_title} onChange={e => setProfile(p => ({ ...p, admin_title: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input className="form-input" placeholder="City, Country"
                  value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}/>
              </div>
              <div className="form-group form-group--full">
                <label>Bio / Notes</label>
                <textarea className="form-input form-textarea" placeholder="Admin notes…" rows={3}
                  value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}/>
              </div>
            </div>
          </Block>

          <div className="as-form-actions">
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              <Save size={14}/> {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* ── SECURITY ── */}
      {tab === 'security' && (
        <div className="as-content">
          <Block icon={<Key size={18}/>} title="Change Password"
            desc="Use a strong unique password for your admin account"
            iconBg="rgba(194,122,42,0.1)" iconColor="var(--amber-dark)">
            <form onSubmit={handlePwd} className="sform">
              <div className="form-group">
                <label>New Password</label>
                <div className="input-pw-wrap">
                  <input required type={showPwd.next ? 'text' : 'password'} className="form-input"
                    placeholder="Minimum 8 characters"
                    value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}/>
                  <button type="button" className="input-eye"
                    onClick={() => setShowPwd(s => ({ ...s, next: !s.next }))}>
                    {showPwd.next ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {pwdStr && (
                  <div className="pwd-strength-wrap">
                    <div className="pwd-strength-bar">
                      <div className={`pwd-strength-fill pwd-strength-fill--${pwdStr.cls}`} style={{ width: `${pwdStr.pct}%` }}/>
                    </div>
                    <span className={`pwd-strength-label pwd-strength-label--${pwdStr.cls}`}>{pwdStr.label}</span>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-pw-wrap">
                  <input required type={showPwd.confirm ? 'text' : 'password'} className="form-input"
                    placeholder="Repeat your password"
                    value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}/>
                  <button type="button" className="input-eye"
                    onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}>
                    {showPwd.confirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {pwd.confirm && pwd.next === pwd.confirm && (
                  <div className="form-match"><CheckCircle size={12}/> Passwords match</div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPwd}>
                <Key size={14}/> {savingPwd ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </Block>

          <div className="as-divider"/>

          <Block icon={<Activity size={18}/>} title="Account Activity"
            desc="Recent access to this admin account"
            iconBg="#e6f0ff" iconColor="#1a4fa0">
            <div className="activity-list">
              {[
                ['Last sign in', user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-GB') : '—', 'green'],
                ['Account created', user?.created_at ? new Date(user.created_at).toLocaleString('en-GB') : '—', ''],
                ['Auth provider', user?.app_metadata?.provider || 'email', ''],
                ['Email verified', user?.email_confirmed_at ? 'Yes — ' + new Date(user.email_confirmed_at).toLocaleDateString('en-GB') : 'Pending', ''],
              ].map(([label, value, dot]) => (
                <div key={label} className="activity-item">
                  <div className={`activity-item__dot ${dot === 'green' ? 'activity-item__dot--green' : ''}`}/>
                  <div><p>{label}</p><span style={{ textTransform: 'capitalize' }}>{value}</span></div>
                </div>
              ))}
            </div>
          </Block>
        </div>
      )}

      {/* ── RESTAURANT INFO ── */}
      {tab === 'restaurant' && (
        <form onSubmit={handleSaveRestaurant} className="as-content">
          <Block icon={<Globe size={18}/>} title="Restaurant Information"
            desc="Business details shown to customers"
            iconBg="rgba(42,107,82,0.1)" iconColor="var(--jade-dark)">
            <div className="as-form-grid">
              <div className="form-group">
                <label>Restaurant Name</label>
                <input className="form-input"
                  value={restaurant.name} onChange={e => setRestaurant(r => ({ ...r, name: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Tagline</label>
                <input className="form-input" placeholder="Your slogan"
                  value={restaurant.tagline} onChange={e => setRestaurant(r => ({ ...r, tagline: e.target.value }))}/>
              </div>
              <div className="form-group form-group--full">
                <label><MapPin size={12}/> Address</label>
                <textarea className="form-input form-textarea" rows={2} placeholder="Full address"
                  value={restaurant.address} onChange={e => setRestaurant(r => ({ ...r, address: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label><Phone size={12}/> Phone</label>
                <input className="form-input" placeholder="+66 …"
                  value={restaurant.phone} onChange={e => setRestaurant(r => ({ ...r, phone: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label><Mail size={12}/> Email</label>
                <input type="email" className="form-input" placeholder="info@restaurant.com"
                  value={restaurant.email} onChange={e => setRestaurant(r => ({ ...r, email: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label><Globe size={12}/> Website</label>
                <input className="form-input" placeholder="https://…"
                  value={restaurant.website} onChange={e => setRestaurant(r => ({ ...r, website: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label><Clock size={12}/> Opening Hours</label>
                <input className="form-input" placeholder="Mon–Sun: 11:00 – 22:00"
                  value={restaurant.hours} onChange={e => setRestaurant(r => ({ ...r, hours: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label><Users size={12}/> Seating Capacity</label>
                <input type="number" className="form-input" min="1"
                  value={restaurant.capacity} onChange={e => setRestaurant(r => ({ ...r, capacity: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select className="form-input form-select"
                  value={restaurant.currency} onChange={e => setRestaurant(r => ({ ...r, currency: e.target.value }))}>
                  <option value="THB">฿ Thai Baht (THB)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="MMK">K Myanmar Kyat (MMK)</option>
                  <option value="SGD">S$ Singapore Dollar</option>
                </select>
              </div>
              <div className="form-group">
                <label>Timezone</label>
                <select className="form-input form-select"
                  value={restaurant.timezone} onChange={e => setRestaurant(r => ({ ...r, timezone: e.target.value }))}>
                  <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                  <option value="Asia/Yangon">Asia/Yangon (UTC+6:30)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </Block>
          <div className="as-form-actions">
            <button type="submit" className="btn btn-primary" disabled={savingRest}>
              <Save size={14}/> {savingRest ? 'Saving…' : 'Save Restaurant Info'}
            </button>
          </div>
        </form>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <div className="as-content">
          <Block icon={<Bell size={18}/>} title="Admin Notifications"
            desc="Stay informed about important events"
            iconBg="rgba(194,122,42,0.1)" iconColor="var(--amber-dark)">
            {[
              { key: 'new_orders',         emoji: '🛒', title: 'New Orders',           desc: 'Get notified when a new order is placed' },
              { key: 'new_reservations',   emoji: '📅', title: 'New Reservations',      desc: 'Alert when customers book a table' },
              { key: 'payment_alerts',     emoji: '💳', title: 'Payment Alerts',        desc: 'Pending payment slips requiring review' },
              { key: 'new_reviews',        emoji: '⭐', title: 'New Reviews',           desc: 'Customer reviews awaiting approval' },
              { key: 'low_stock',          emoji: '⚠️', title: 'Low Stock Warnings',   desc: 'Menu items running low (future feature)' },
              { key: 'daily_summary',      emoji: '📊', title: 'Daily Summary',         desc: 'End-of-day summary email of all activity' },
              { key: 'sound_alerts',       emoji: '🔔', title: 'Browser Sound Alerts',  desc: 'Play a sound for urgent notifications' },
            ].map(({ key, emoji, title, desc }) => (
              <SettingRow key={key} label={title} desc={desc}>
                <Toggle checked={!!notifs[key]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))}/>
              </SettingRow>
            ))}
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handleSaveNotifs} disabled={savingNotifs}>
                <Save size={14}/> {savingNotifs ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </Block>
        </div>
      )}

      {/* ── SYSTEM ── */}
      {tab === 'system' && (
        <div className="as-content">
          <Block icon={<Zap size={18}/>} title="Feature Toggles"
            desc="Enable or disable features site-wide"
            iconBg="#e6f0ff" iconColor="#1a4fa0">
            {[
              { key: 'online_orders',   title: 'Online Ordering',     desc: 'Allow customers to place online orders' },
              { key: 'reservations',    title: 'Table Reservations',  desc: 'Allow customers to book tables' },
              { key: 'reviews',         title: 'Customer Reviews',    desc: 'Allow customers to leave reviews' },
              { key: 'gallery',         title: 'Photo Gallery',       desc: 'Show the gallery section to visitors' },
              { key: 'promotions',      title: 'Promotions Banner',   desc: 'Show promotional banners (coming soon)' },
              { key: 'maintenance_mode', title: '🚧 Maintenance Mode', desc: 'Put the site into maintenance mode for all visitors' },
            ].map(({ key, title, desc }) => (
              <SettingRow key={key} label={title} desc={desc}>
                <Toggle checked={!!system[key]} onChange={v => setSystem(s => ({ ...s, [key]: v }))}/>
              </SettingRow>
            ))}
          </Block>

          <div className="as-divider"/>

          <Block icon={<CalendarDays size={18}/>} title="Reservation Settings"
            desc="Configure booking rules and limits"
            iconBg="rgba(42,107,82,0.1)" iconColor="var(--jade-dark)">
            <div className="as-form-grid-3">
              <div className="form-group">
                <label>Max Party Size</label>
                <input type="number" className="form-input" min="1" max="50"
                  value={system.max_party_size} onChange={e => setSystem(s => ({ ...s, max_party_size: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Advance Booking (days)</label>
                <input type="number" className="form-input" min="1"
                  value={system.advance_days} onChange={e => setSystem(s => ({ ...s, advance_days: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label>Min Notice (hours)</label>
                <input type="number" className="form-input" min="0"
                  value={system.min_notice_hours} onChange={e => setSystem(s => ({ ...s, min_notice_hours: e.target.value }))}/>
              </div>
            </div>
          </Block>

          <div className="as-form-actions" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={handleSaveSystem} disabled={savingSystem}>
              <Save size={14}/> {savingSystem ? 'Saving…' : 'Save System Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ── DANGER ZONE ── */}
      {tab === 'danger' && (
        <div className="as-content">
          <div className="as-danger-zone">
            <div className="as-danger-zone__header">
              <AlertTriangle size={20}/>
              <div><h3>Danger Zone</h3><p>Irreversible admin actions — proceed with caution</p></div>
            </div>

            <SettingRow label="Sign Out All Sessions"
              desc="Immediately end all active admin sessions across all devices">
              <button className="btn btn-outline as-danger-btn" onClick={async () => {
                await signOut(); toast.success('Signed out from all devices.'); navigate('/auth');
              }}>
                Sign Out All
              </button>
            </SettingRow>

            <SettingRow label="Reset All Notifications"
              desc="Reset all notification preferences to defaults">
              <button className="btn btn-outline as-danger-btn" onClick={() => {
                setNotifs({ new_orders: true, new_reservations: true, payment_alerts: true,
                  new_reviews: true, low_stock: false, daily_summary: true, sound_alerts: true });
                setTab('notifications');
                toast.success('Notifications reset to defaults.');
              }}>
                <RefreshCw size={13}/> Reset
              </button>
            </SettingRow>

            <div className="as-danger-delete">
              <div>
                <p className="danger-action__title">Delete Admin Account</p>
                <p className="danger-action__desc">
                  Permanently remove this admin account. The restaurant data will not be affected, but admin access will be lost.
                </p>
              </div>
              <button className="btn danger-delete-btn" onClick={() => setShowDeleteForm(v => !v)}>
                <Trash2 size={14}/> Delete Account
              </button>
            </div>

            {showDeleteForm && (
              <div className="danger-confirm-box">
                <p><strong>⚠️ Type <code>DELETE</code> to confirm admin account deletion:</strong></p>
                <input className="form-input" placeholder="Type DELETE"
                  value={deleteInput} onChange={e => setDeleteInput(e.target.value)}/>
                <div className="danger-confirm-box__actions">
                  <button className="btn btn-outline" onClick={() => { setShowDeleteForm(false); setDeleteInput(''); }}>Cancel</button>
                  <button className="btn danger-delete-btn" disabled={deleteInput !== 'DELETE'}
                    onClick={() => toast.error('Contact super-admin for account deletion.')}>
                    <Trash2 size={14}/> Permanently Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



