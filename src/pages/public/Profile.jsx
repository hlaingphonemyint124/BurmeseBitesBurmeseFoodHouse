import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User, Package, CalendarDays, Settings, LogOut, Save,
  Bell, Trash2, Eye, EyeOff, CheckCircle, Lock, Mail,
  Phone, Globe, AlertTriangle, Key, Camera, Shield,
  Activity, ChevronRight, Clock, Star, MapPin, X,
  Plus, Home, Briefcase, Building2, Download, Smartphone,
  Monitor, RefreshCw, UserCheck, Edit3, Check, Fingerprint,
  ToggleLeft, ToggleRight, Info, ExternalLink, ChevronDown,
  Package2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/AuthContext';
import { signOut, supabase } from '../../lib/supabase';
import { uploadAvatarFile } from '../../lib/uploadAvatar';
import './Profile.css';

/* ════════════════════════════════════════════════════════
   SHARED UTILS
════════════════════════════════════════════════════════ */
const pwdStrength = (p) => {
  if (!p) return null;
  const s = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  return s <= 1 ? { label:'Weak',   cls:'weak',   pct:25  }
       : s === 2 ? { label:'Fair',   cls:'fair',   pct:50  }
       : s === 3 ? { label:'Good',   cls:'good',   pct:75  }
       :           { label:'Strong', cls:'strong', pct:100 };
};

function Toggle({ checked, onChange, id }) {
  return (
    <label className="p-toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>
      <span className="p-toggle__track">
        <span className="p-toggle__thumb"/>
      </span>
    </label>
  );
}

function SectionCard({ icon, iconBg, iconColor, title, subtitle, children, action }) {
  return (
    <div className="p-section-card">
      <div className="p-section-card__head">
        <div className="p-section-card__icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        <div className="p-section-card__head-text">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && <div className="p-section-card__action">{action}</div>}
      </div>
      <div className="p-section-card__body">{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   SIDEBAR NAV
════════════════════════════════════════════════════════ */
function ProfileSidebar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const [open, setOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const avatarUrl    = user?.user_metadata?.avatar_url || '';

  const NAV = [
    { to:'/profile',              icon:<User size={16}/>,        label:'My Profile'     },
    { to:'/profile/orders',       icon:<Package size={16}/>,     label:'My Orders'      },
    { to:'/profile/reservations', icon:<CalendarDays size={16}/>,label:'Reservations'   },
    { to:'/profile/settings',     icon:<Settings size={16}/>,    label:'Settings'       },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <div className="psb__profile">
        <div className="psb__avatar-ring">
          <div className="psb__avatar">{avatarUrl ? <img src={avatarUrl} alt=""/> : initials}</div>
          <div className="psb__avatar-status"/>
        </div>
        <div className="psb__profile-text">
          <p className="psb__name">{displayName}</p>
          <p className="psb__email">{user?.email}</p>
          <span className="psb__pill">
            <Shield size={10}/> Member
          </span>
        </div>
      </div>

      <nav className="psb__nav">
        <p className="psb__nav-label">Account</p>
        {NAV.map(({ to, icon, label }) => (
          <Link key={to} to={to} onClick={() => setOpen(false)}
            className={`psb__link ${pathname === to ? 'psb__link--active' : ''}`}>
            <span className="psb__link-icon">{icon}</span>
            <span className="psb__link-label">{label}</span>
            <ChevronRight size={13} className="psb__link-arrow"/>
          </Link>
        ))}
      </nav>

      <div className="psb__footer">
        <button className="psb__logout" onClick={handleLogout}>
          <LogOut size={15}/> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile bar */}
      <button className="psb__mobile-bar" onClick={() => setOpen(v => !v)}>
        <div className="psb__mobile-bar-left">
          <div className="psb__avatar psb__avatar--sm">{avatarUrl ? <img src={avatarUrl} alt=""/> : initials}</div>
          <span>{displayName}</span>
        </div>
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}/>
      </button>

      {/* Desktop sidebar */}
      <aside className="psb psb--desktop"><SidebarContent/></aside>

      {/* Mobile drawer */}
      {open && <>
        <div className="psb-overlay" onClick={() => setOpen(false)}/>
        <aside className="psb psb--mobile"><SidebarContent/></aside>
      </>}
    </>
  );
}

/* ════════════════════════════════════════════════════════
   MY PROFILE — Personal Info + Addresses
════════════════════════════════════════════════════════ */
function ProfileHome() {
  const { user } = useAuth();
  const fileRef  = useRef();

  const [form, setForm] = useState({
    full_name:    user?.user_metadata?.full_name    || '',
    nickname:     user?.user_metadata?.nickname     || '',
    phone:        user?.user_metadata?.phone        || '',
    birthdate:    user?.user_metadata?.birthdate    || '',
    gender:       user?.user_metadata?.gender       || '',
    bio:          user?.user_metadata?.bio          || '',
    website:      user?.user_metadata?.website      || '',
  });
  const [saving, setSaving]     = useState(false);
  const [changed, setChanged]   = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState(
    user?.user_metadata?.addresses || []
  );
  const [addingAddr, setAddingAddr]   = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrForm, setAddrForm] = useState({
    label: 'Home', line1: '', line2: '', city: '', state: '', zip: '', country: 'Thailand', is_default: false
  });

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setChanged(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { ...form, addresses } });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile saved!');
    setChanged(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { url, usedFallback } = await uploadAvatarFile(file);
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (error) throw error;
      toast.success(usedFallback
        ? 'Photo saved. Set up Supabase Storage bucket "restaurant-images" for faster loading.'
        : 'Profile photo updated!');
    } catch (err) {
      toast.error(err.message || 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveAddress = async () => {
    if (!addrForm.line1 || !addrForm.city) { toast.error('Address and city are required.'); return; }
    let updated;
    if (editingAddr !== null) {
      updated = addresses.map((a, i) => i === editingAddr ? addrForm : a);
    } else {
      updated = [...addresses, { ...addrForm, id: Date.now() }];
    }
    if (addrForm.is_default) updated = updated.map((a, i) => ({ ...a, is_default: i === (editingAddr ?? updated.length - 1) }));
    setAddresses(updated);
    await supabase.auth.updateUser({ data: { addresses: updated } });
    toast.success(editingAddr !== null ? 'Address updated!' : 'Address added!');
    setAddingAddr(false); setEditingAddr(null);
    setAddrForm({ label:'Home', line1:'', line2:'', city:'', state:'', zip:'', country:'Thailand', is_default:false });
  };

  const deleteAddress = async (idx) => {
    const updated = addresses.filter((_, i) => i !== idx);
    setAddresses(updated);
    await supabase.auth.updateUser({ data: { addresses: updated } });
    toast.success('Address removed.');
  };

  const setDefault = async (idx) => {
    const updated = addresses.map((a, i) => ({ ...a, is_default: i === idx }));
    setAddresses(updated);
    await supabase.auth.updateUser({ data: { addresses: updated } });
    toast.success('Default address updated.');
  };

  const ADDR_LABELS = [
    { key:'Home', icon:<Home size={14}/> },
    { key:'Work', icon:<Briefcase size={14}/> },
    { key:'Office', icon:<Building2 size={14}/> },
    { key:'Other', icon:<MapPin size={14}/> },
  ];

  const displayName = form.full_name || user?.email?.split('@')[0] || 'U';
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month:'long', year:'numeric' }) : '';

  return (
    <div className="p-main-content">
      <div className="p-page-hero">
        <div className="p-page-hero__avatar-wrap">
          <div className="p-page-hero__avatar">
            {uploadingPhoto ? (
              <span className="p-page-hero__avatar-spinner"/>
            ) : user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt=""/>
            ) : initials}
          </div>
          <button className="p-page-hero__avatar-btn" onClick={() => fileRef.current?.click()} aria-label="Change photo" disabled={uploadingPhoto}>
            <Camera size={13}/>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload}/>
        </div>
        <div className="p-page-hero__info">
          <h2 className="p-page-hero__name">{form.full_name || 'Your Name'}</h2>
          <p className="p-page-hero__email">{user?.email}</p>
          <div className="p-page-hero__meta">
            {memberSince && <span><Clock size={11}/> Since {memberSince}</span>}
            {form.bio && <span>"{form.bio.slice(0, 48)}{form.bio.length > 48 ? '…' : ''}"</span>}
          </div>
        </div>
        <div className="p-page-hero__badges">
          <span className="p-badge p-badge--green"><Shield size={11}/> Verified</span>
          {changed && <span className="p-badge p-badge--amber">Unsaved</span>}
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Personal Information */}
        <SectionCard icon={<User size={17}/>} iconBg="rgba(194,122,42,0.1)" iconColor="var(--amber-dark)"
          title="Personal Information" subtitle="Your basic profile details">
          <div className="p-form-grid">
            <div className="p-field">
              <label className="p-label">Full Name</label>
              <input className="p-input" placeholder="Your full name"
                value={form.full_name} onChange={e => set('full_name', e.target.value)}/>
            </div>
            <div className="p-field">
              <label className="p-label">Nickname / Display Name</label>
              <input className="p-input" placeholder="What should we call you?"
                value={form.nickname} onChange={e => set('nickname', e.target.value)}/>
            </div>
            <div className="p-field">
              <label className="p-label"><Mail size={12}/> Email Address</label>
              <input className="p-input p-input--disabled" value={user?.email} disabled/>
              <span className="p-hint">Change email in Settings → Security</span>
            </div>
            <div className="p-field">
              <label className="p-label"><Phone size={12}/> Phone Number</label>
              <input className="p-input" placeholder="+66 8x xxx xxxx"
                value={form.phone} onChange={e => set('phone', e.target.value)}/>
            </div>
            <div className="p-field">
              <label className="p-label"><Clock size={12}/> Date of Birth</label>
              <input className="p-input" type="date"
                value={form.birthdate} onChange={e => set('birthdate', e.target.value)}/>
            </div>
            <div className="p-field">
              <label className="p-label">Gender <span className="p-label-optional">(Optional)</span></label>
              <select className="p-input p-select"
                value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="p-field p-field--full">
              <label className="p-label">Bio</label>
              <textarea className="p-input p-textarea" placeholder="A short bio about yourself…" rows={3}
                value={form.bio} onChange={e => set('bio', e.target.value)} maxLength={300}/>
              <span className="p-hint p-hint--right">{(form.bio||'').length}/300</span>
            </div>
            <div className="p-field">
              <label className="p-label"><Globe size={12}/> Website / Social</label>
              <input className="p-input" placeholder="https://…"
                value={form.website} onChange={e => set('website', e.target.value)}/>
            </div>
          </div>
        </SectionCard>

        <div className="p-gap"/>

        {/* Address Management */}
        <SectionCard icon={<MapPin size={17}/>} iconBg="rgba(42,107,82,0.1)" iconColor="var(--jade-dark)"
          title="Address Management" subtitle="Manage your saved delivery and billing addresses"
          action={
            <button type="button" className="p-btn-icon-label"
              onClick={() => { setAddingAddr(true); setEditingAddr(null); setAddrForm({ label:'Home', line1:'', line2:'', city:'', state:'', zip:'', country:'Thailand', is_default:false }); }}>
              <Plus size={15}/> Add Address
            </button>
          }>

          {/* Add / Edit form */}
          {(addingAddr || editingAddr !== null) && (
            <div className="p-addr-form">
              <div className="p-addr-form__header">
                <h4>{editingAddr !== null ? 'Edit Address' : 'New Address'}</h4>
                <button type="button" className="p-icon-btn" onClick={() => { setAddingAddr(false); setEditingAddr(null); }}><X size={16}/></button>
              </div>

              {/* Label picker */}
              <div className="p-label-picker">
                {ADDR_LABELS.map(({ key, icon }) => (
                  <button type="button" key={key}
                    className={`p-label-chip ${addrForm.label === key ? 'p-label-chip--active' : ''}`}
                    onClick={() => setAddrForm(f => ({ ...f, label: key }))}>
                    {icon} {key}
                  </button>
                ))}
              </div>

              <div className="p-form-grid">
                <div className="p-field p-field--full">
                  <label className="p-label">Address Line 1 *</label>
                  <input className="p-input" placeholder="Street address"
                    value={addrForm.line1} onChange={e => setAddrForm(f => ({ ...f, line1: e.target.value }))}/>
                </div>
                <div className="p-field p-field--full">
                  <label className="p-label">Address Line 2</label>
                  <input className="p-input" placeholder="Apartment, suite, floor…"
                    value={addrForm.line2} onChange={e => setAddrForm(f => ({ ...f, line2: e.target.value }))}/>
                </div>
                <div className="p-field">
                  <label className="p-label">City *</label>
                  <input className="p-input" placeholder="City"
                    value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))}/>
                </div>
                <div className="p-field">
                  <label className="p-label">State / Province</label>
                  <input className="p-input" placeholder="State"
                    value={addrForm.state} onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))}/>
                </div>
                <div className="p-field">
                  <label className="p-label">Postal Code</label>
                  <input className="p-input" placeholder="00000"
                    value={addrForm.zip} onChange={e => setAddrForm(f => ({ ...f, zip: e.target.value }))}/>
                </div>
                <div className="p-field">
                  <label className="p-label">Country</label>
                  <select className="p-input p-select"
                    value={addrForm.country} onChange={e => setAddrForm(f => ({ ...f, country: e.target.value }))}>
                    {['Thailand','Myanmar','Singapore','Malaysia','Vietnam','Indonesia','Cambodia','Laos','Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="p-field p-field--full">
                  <label className="p-checkbox-row">
                    <input type="checkbox" checked={addrForm.is_default}
                      onChange={e => setAddrForm(f => ({ ...f, is_default: e.target.checked }))}/>
                    <span>Set as default delivery address</span>
                  </label>
                </div>
              </div>

              <div className="p-addr-form__actions">
                <button type="button" className="p-btn p-btn--outline" onClick={() => { setAddingAddr(false); setEditingAddr(null); }}>Cancel</button>
                <button type="button" className="p-btn p-btn--primary" onClick={saveAddress}>
                  <Check size={14}/> {editingAddr !== null ? 'Update' : 'Save'} Address
                </button>
              </div>
            </div>
          )}

          {/* Address list */}
          {addresses.length === 0 && !addingAddr ? (
            <div className="p-empty-state">
              <MapPin size={28}/>
              <p>No addresses saved yet.</p>
              <button type="button" className="p-btn p-btn--outline" onClick={() => setAddingAddr(true)}>
                <Plus size={14}/> Add Your First Address
              </button>
            </div>
          ) : (
            <div className="p-addr-list">
              {addresses.map((addr, i) => {
                const LabelIcon = ADDR_LABELS.find(l => l.key === addr.label)?.icon || <MapPin size={14}/>;
                return (
                  <div key={addr.id || i} className={`p-addr-card ${addr.is_default ? 'p-addr-card--default' : ''}`}>
                    <div className="p-addr-card__top">
                      <span className="p-addr-label-badge">{LabelIcon} {addr.label}</span>
                      {addr.is_default && <span className="p-addr-default-tag"><Check size={10}/> Default</span>}
                    </div>
                    <p className="p-addr-card__line">{addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}</p>
                    <p className="p-addr-card__line">{[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}</p>
                    <p className="p-addr-card__country">{addr.country}</p>
                    <div className="p-addr-card__actions">
                      {!addr.is_default && (
                        <button type="button" className="p-addr-action" onClick={() => setDefault(i)}>
                          <Star size={12}/> Set Default
                        </button>
                      )}
                      <button type="button" className="p-addr-action" onClick={() => { setAddrForm({ ...addr }); setEditingAddr(i); setAddingAddr(false); }}>
                        <Edit3 size={12}/> Edit
                      </button>
                      <button type="button" className="p-addr-action p-addr-action--del" onClick={() => deleteAddress(i)}>
                        <Trash2 size={12}/> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <div className="p-form-actions">
          <button type="submit" className="p-btn p-btn--primary" disabled={saving || !changed}>
            <Save size={14}/> {saving ? 'Saving…' : 'Save Profile'}
          </button>
          {changed && (
            <button type="button" className="p-btn p-btn--ghost" onClick={() => {
              setForm({ full_name: user?.user_metadata?.full_name||'', nickname: user?.user_metadata?.nickname||'', phone: user?.user_metadata?.phone||'', birthdate: user?.user_metadata?.birthdate||'', gender: user?.user_metadata?.gender||'', bio: user?.user_metadata?.bio||'', website: user?.user_metadata?.website||'' });
              setChanged(false);
            }}>Discard Changes</button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MY ORDERS
════════════════════════════════════════════════════════ */
function ProfileOrders() {
  const { user } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('*, order_items(*)')
      .eq('email', user.email).order('created_at', { ascending:false })
      .then(({ data }) => { setOrders(data||[]); setLoading(false); });
  }, [user]);

  const STATUS = {
    received:  { label:'Received',  bg:'#e6f0ff', color:'#1a4fa0' },
    preparing: { label:'Preparing', bg:'#fff8e6', color:'#b07800' },
    ready:     { label:'Ready',     bg:'#e6f4ee', color:'#1a6b3c' },
    delivered: { label:'Delivered', bg:'#f0f0f0', color:'#555'    },
  };

  const filtered  = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const totalSpent = orders.reduce((s,o) => s + parseFloat(o.total_amount||0), 0);

  return (
    <div className="p-main-content">
      <div className="p-content-header">
        <div><h2>My Orders</h2><p>Track and manage your food orders</p></div>
      </div>

      {!loading && orders.length > 0 && (
        <div className="p-stat-row">
          {[['Total Orders',orders.length],['Delivered',orders.filter(o=>o.status==='delivered').length],['Total Spent','฿'+totalSpent.toFixed(0)]].map(([l,v])=>(
            <div key={l} className="p-stat"><span className="p-stat__val">{v}</span><span className="p-stat__lbl">{l}</span></div>
          ))}
        </div>
      )}

      <div className="p-filter-row">
        {['all','received','preparing','ready','delivered'].map(f => (
          <button key={f} className={`p-filter-chip ${filter===f?'p-filter-chip--on':''}`} onClick={() => setFilter(f)}>
            {f==='all'?'All Orders':STATUS[f]?.label}
          </button>
        ))}
      </div>

      {loading ? <div className="p-loading"><div className="p-spinner"/></div>
      : filtered.length === 0 ? (
        <div className="p-empty-state">
          <Package2 size={32}/>
          <p>{filter==='all'?'No orders yet — explore our menu!':'No orders in this status.'}</p>
          {filter==='all' && <Link to="/menu" className="p-btn p-btn--primary">Browse Menu</Link>}
        </div>
      ) : (
        <div className="p-card-list">
          {filtered.map(o => {
            const m = STATUS[o.status]||STATUS.received;
            return (
              <div key={o.id} className="p-order-card">
                <div className="p-order-card__left">
                  <div className="p-order-card__id">#{o.id.slice(-8).toUpperCase()}</div>
                  <div className="p-order-card__date"><Clock size={11}/> {new Date(o.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
                </div>
                <div className="p-order-card__items">
                  {(o.order_items||[]).map(i => <span key={i.id} className="p-item-chip">{i.quantity}× {i.name}</span>)}
                </div>
                <div className="p-order-card__right">
                  <span className="p-status-pill" style={{background:m.bg,color:m.color}}>{m.label}</span>
                  <span className="p-order-card__total">฿{parseFloat(o.total_amount).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   RESERVATIONS
════════════════════════════════════════════════════════ */
function ProfileReservations() {
  const { user } = useAuth();
  const [res, setRes]         = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('reservations').select('*').eq('email', user.email)
      .order('created_at', { ascending:false })
      .then(({ data }) => { setRes(data||[]); setLoading(false); });
  }, [user]);

  const STATUS = {
    pending:   { label:'Pending',   bg:'#fff8e6', color:'#b07800' },
    confirmed: { label:'Confirmed', bg:'#e6f4ee', color:'#1a6b3c' },
    cancelled: { label:'Cancelled', bg:'#fff0ee', color:'#c0392b' },
  };

  const upcoming = res.filter(r => r.status !== 'cancelled' && new Date(`${r.date}T${r.time}`) > new Date());
  const past     = res.filter(r => r.status === 'cancelled' || new Date(`${r.date}T${r.time}`) <= new Date());

  const ResCard = ({ r }) => {
    const m = STATUS[r.status] || STATUS.pending;
    const d = new Date(r.date);
    return (
      <div className="p-res-card">
        <div className="p-res-card__cal">
          <span className="p-res-card__cal-day">{d.getDate()}</span>
          <span className="p-res-card__cal-month">{d.toLocaleDateString('en-GB',{month:'short'})}</span>
        </div>
        <div className="p-res-card__info">
          <div className="p-res-card__row1">
            <span className="p-res-card__time">{r.time}</span>
            <span className="p-status-pill" style={{background:m.bg,color:m.color}}>{m.label}</span>
          </div>
          <div className="p-res-card__row2">
            <span><User size={11}/> {r.party_size} guest{r.party_size!==1?'s':''}</span>
          </div>
          {r.special_notes && <p className="p-res-card__notes">"{r.special_notes}"</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-main-content">
      <div className="p-content-header">
        <div><h2>My Reservations</h2><p>Your table booking history</p></div>
        <Link to="/reservation" className="p-btn p-btn--primary" style={{fontSize:13}}>+ New Booking</Link>
      </div>

      {loading ? <div className="p-loading"><div className="p-spinner"/></div>
      : res.length === 0 ? (
        <div className="p-empty-state">
          <CalendarDays size={32}/>
          <p>No reservations yet. Book your first table!</p>
          <Link to="/reservation" className="p-btn p-btn--primary">Book a Table</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="p-list-group">
              <p className="p-list-group__label"><Star size={12}/> Upcoming</p>
              <div className="p-card-list">{upcoming.map(r => <ResCard key={r.id} r={r}/>)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div className="p-list-group">
              <p className="p-list-group__label"><Clock size={12}/> Past & Cancelled</p>
              <div className="p-card-list">{past.map(r => <ResCard key={r.id} r={r}/>)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ACCOUNT SETTINGS
════════════════════════════════════════════════════════ */
function ProfileSettings() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab] = useState('security');

  /* Password */
  const [pwd, setPwd]         = useState({ next:'', confirm:'' });
  const [showPwd, setShowPwd] = useState({ next:false, confirm:false });
  const [savingPwd, setSavingPwd] = useState(false);

  /* Email */
  const [newEmail, setNewEmail]       = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  /* 2FA */
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.user_metadata?.twofa_enabled ?? false);
  const [twoFACode, setTwoFACode]       = useState('');
  const [show2FA, setShow2FA]           = useState(false);

  /* Sessions (mock) */
  const [sessions] = useState([
    { id:1, device:'Chrome on macOS', location:'Bangkok, Thailand', time:'Now (current)', current:true, icon:<Monitor size={15}/> },
    { id:2, device:'Safari on iPhone',location:'Bangkok, Thailand', time:'2 hours ago',   current:false,icon:<Smartphone size={15}/> },
  ]);

  /* Notifications */
  const [notifs, setNotifs] = useState({
    order_updates:         user?.user_metadata?.notif_order       ?? true,
    reservation_reminders: user?.user_metadata?.notif_reservation ?? true,
    promotions:            user?.user_metadata?.notif_promo       ?? false,
    newsletter:            user?.user_metadata?.notif_news        ?? false,
    sms_alerts:            user?.user_metadata?.notif_sms         ?? false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  /* Privacy */
  const [privacy, setPrivacy] = useState({
    profile_visible:    user?.user_metadata?.priv_profile    ?? true,
    activity_visible:   user?.user_metadata?.priv_activity   ?? false,
    marketing_emails:   user?.user_metadata?.priv_marketing  ?? false,
    data_analytics:     user?.user_metadata?.priv_analytics  ?? true,
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  /* Danger */
  const [deleteInput, setDeleteInput]     = useState('');
  const [showDeleteBox, setShowDeleteBox] = useState(false);
  const [downloading, setDownloading]     = useState(false);

  const str = pwdStrength(pwd.next);

  const handlePwd = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { toast.error('Passwords do not match.'); return; }
    if (pwd.next.length < 8)      { toast.error('Minimum 8 characters.'); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully!');
    setPwd({ next:'', confirm:'' });
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmail.includes('@')) { toast.error('Enter a valid email.'); return; }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSavingEmail(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Confirmation sent to ' + newEmail);
    setNewEmail('');
  };

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    const { error } = await supabase.auth.updateUser({ data: {
      notif_order:notifs.order_updates, notif_reservation:notifs.reservation_reminders,
      notif_promo:notifs.promotions, notif_news:notifs.newsletter, notif_sms:notifs.sms_alerts,
    }});
    setSavingNotifs(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Notification preferences saved!');
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    const { error } = await supabase.auth.updateUser({ data: {
      priv_profile:privacy.profile_visible, priv_activity:privacy.activity_visible,
      priv_marketing:privacy.marketing_emails, priv_analytics:privacy.data_analytics,
    }});
    setSavingPrivacy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Privacy settings saved!');
  };

  const handleDownloadData = () => {
    setDownloading(true);
    const data = {
      profile: { email: user?.email, name: user?.user_metadata?.full_name, created: user?.created_at },
      metadata: user?.user_metadata,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'my-data.json'; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 1000);
    toast.success('Data downloaded!');
  };

  const TABS = [
    { key:'security',      label:'Security',       icon:<Lock size={15}/>          },
    { key:'notifications', label:'Notifications',  icon:<Bell size={15}/>          },
    { key:'privacy',       label:'Privacy',        icon:<Shield size={15}/>        },
    { key:'account',       label:'Account Info',   icon:<UserCheck size={15}/>     },
    { key:'danger',        label:'Danger Zone',    icon:<AlertTriangle size={15}/> },
  ];

  return (
    <div className="p-main-content">
      <div className="p-content-header">
        <div><h2>Account Settings</h2><p>Manage your security, privacy, and preferences</p></div>
      </div>

      {/* Tab bar */}
      <div className="p-tab-bar">
        {TABS.map(t => (
          <button key={t.key}
            className={`p-tab ${tab===t.key?'p-tab--active':''} ${t.key==='danger'?'p-tab--danger':''}`}
            onClick={() => setTab(t.key)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── SECURITY ── */}
      {tab === 'security' && (
        <div className="p-tab-body">
          {/* Change Password */}
          <SectionCard icon={<Key size={17}/>} iconBg="rgba(194,122,42,0.1)" iconColor="var(--amber-dark)"
            title="Change Password" subtitle="Protect your account with a strong password">
            <form onSubmit={handlePwd} className="p-narrow-form">
              <div className="p-field">
                <label className="p-label">New Password</label>
                <div className="p-pw-wrap">
                  <input required type={showPwd.next?'text':'password'} className="p-input"
                    placeholder="Minimum 8 characters"
                    value={pwd.next} onChange={e => setPwd(p => ({...p,next:e.target.value}))}/>
                  <button type="button" className="p-eye" onClick={() => setShowPwd(s=>({...s,next:!s.next}))}>
                    {showPwd.next ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {str && (
                  <div className="p-strength">
                    <div className="p-strength__bar"><div className={`p-strength__fill p-strength__fill--${str.cls}`} style={{width:`${str.pct}%`}}/></div>
                    <span className={`p-strength__label p-strength__label--${str.cls}`}>{str.label}</span>
                  </div>
                )}
              </div>
              <div className="p-field">
                <label className="p-label">Confirm Password</label>
                <div className="p-pw-wrap">
                  <input required type={showPwd.confirm?'text':'password'} className="p-input"
                    placeholder="Repeat your password"
                    value={pwd.confirm} onChange={e => setPwd(p => ({...p,confirm:e.target.value}))}/>
                  <button type="button" className="p-eye" onClick={() => setShowPwd(s=>({...s,confirm:!s.confirm}))}>
                    {showPwd.confirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {pwd.confirm && pwd.next===pwd.confirm && <div className="p-match-ok"><CheckCircle size={12}/> Passwords match</div>}
                {pwd.confirm && pwd.next!==pwd.confirm && <div className="p-match-no"><X size={12}/> Passwords don't match</div>}
              </div>
              <div className="p-pwd-tips">
                {[[pwd.next.length>=8,'8+ characters'],[/[A-Z]/.test(pwd.next),'Uppercase letter'],[/[0-9]/.test(pwd.next),'Number'],[/[^A-Za-z0-9]/.test(pwd.next),'Special character']].map(([ok,label])=>(
                  <div key={label} className={`p-pwd-tip ${ok?'p-pwd-tip--ok':''}`}><CheckCircle size={11}/>{label}</div>
                ))}
              </div>
              <button type="submit" className="p-btn p-btn--primary" disabled={savingPwd||!pwd.next||!pwd.confirm}>
                <Key size={14}/> {savingPwd?'Updating…':'Update Password'}
              </button>
            </form>
          </SectionCard>

          <div className="p-gap"/>

          {/* Change Email */}
          <SectionCard icon={<Mail size={17}/>} iconBg="rgba(42,107,82,0.1)" iconColor="var(--jade-dark)"
            title="Change Email Address" subtitle={`Current: ${user?.email}`}>
            <form onSubmit={handleEmailChange} className="p-narrow-form">
              <div className="p-field">
                <label className="p-label">New Email Address</label>
                <input required type="email" className="p-input" placeholder="new@email.com"
                  value={newEmail} onChange={e => setNewEmail(e.target.value)}/>
                <span className="p-hint">A confirmation will be sent to both addresses.</span>
              </div>
              <button type="submit" className="p-btn p-btn--outline" disabled={savingEmail}>
                <Mail size={14}/> {savingEmail?'Sending…':'Send Confirmation'}
              </button>
            </form>
          </SectionCard>

          <div className="p-gap"/>

          {/* 2FA */}
          <SectionCard icon={<Fingerprint size={17}/>} iconBg="#e6f0ff" iconColor="#1a4fa0"
            title="Two-Factor Authentication"
            subtitle="Add an extra layer of security to your account"
            action={<Toggle checked={twoFAEnabled} onChange={v => { setTwoFAEnabled(v); if(v) setShow2FA(true); }} id="2fa-toggle"/>}>
            {show2FA && twoFAEnabled && (
              <div className="p-2fa-box">
                <div className="p-2fa-box__info">
                  <Shield size={18}/>
                  <div>
                    <p><strong>2FA Setup</strong></p>
                    <p className="p-hint">Scan the QR code with your authenticator app, then enter the 6-digit code to verify.</p>
                  </div>
                </div>
                <div className="p-2fa-qr">
                  <div className="p-2fa-qr__placeholder">
                    <Smartphone size={28}/>
                    <p>QR Code</p>
                    <span>Use Google Auth or Authy</span>
                  </div>
                </div>
                <div className="p-field">
                  <label className="p-label">Verification Code</label>
                  <input className="p-input p-input--code" placeholder="000 000" maxLength={6}
                    value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g,''))}/>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="p-btn p-btn--primary" onClick={() => { toast.success('2FA enabled! (demo)'); setShow2FA(false); }}>
                    <CheckCircle size={14}/> Verify & Enable
                  </button>
                  <button className="p-btn p-btn--ghost" onClick={() => { setTwoFAEnabled(false); setShow2FA(false); }}>Cancel</button>
                </div>
              </div>
            )}
            {!twoFAEnabled && (
              <p className="p-hint" style={{marginTop:4}}>2FA is currently <strong>disabled</strong>. Enable for extra security.</p>
            )}
            {twoFAEnabled && !show2FA && (
              <div className="p-2fa-active">
                <CheckCircle size={15}/> Two-factor authentication is <strong>enabled</strong>
              </div>
            )}
          </SectionCard>

          <div className="p-gap"/>

          {/* Active Sessions */}
          <SectionCard icon={<Activity size={17}/>} iconBg="rgba(42,107,82,0.1)" iconColor="var(--jade-dark)"
            title="Active Sessions" subtitle="Devices currently logged into your account">
            <div className="p-sessions">
              {sessions.map(s => (
                <div key={s.id} className={`p-session ${s.current?'p-session--current':''}`}>
                  <div className="p-session__icon">{s.icon}</div>
                  <div className="p-session__info">
                    <p className="p-session__device">{s.device} {s.current && <span className="p-session__you">You</span>}</p>
                    <p className="p-session__meta"><MapPin size={10}/>{s.location} · <Clock size={10}/>{s.time}</p>
                  </div>
                  {!s.current && (
                    <button className="p-session__revoke" onClick={() => toast.success('Session revoked.')}>
                      <X size={13}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="p-btn p-btn--outline p-btn--sm" style={{marginTop:14}}
              onClick={async () => { await signOut(); toast.success('Signed out from all devices.'); navigate('/'); }}>
              <LogOut size={13}/> Sign Out All Devices
            </button>
          </SectionCard>

          <div className="p-gap"/>

          {/* Login History */}
          <SectionCard icon={<Clock size={17}/>} iconBg="rgba(194,122,42,0.08)" iconColor="var(--amber)"
            title="Login Activity History" subtitle="Recent account access">
            <div className="p-activity-log">
              {[
                { label:'Last sign-in',    value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-GB') : '—', dot:'green' },
                { label:'Account created', value: user?.created_at ? new Date(user.created_at).toLocaleString('en-GB') : '—' },
                { label:'Auth provider',   value: user?.app_metadata?.provider || 'email' },
                { label:'Email verified',  value: user?.email_confirmed_at ? '✓ Verified on ' + new Date(user.email_confirmed_at).toLocaleDateString('en-GB') : 'Pending', ok: !!user?.email_confirmed_at },
              ].map(({ label, value, dot, ok }) => (
                <div key={label} className="p-activity-row">
                  <div className={`p-activity-dot ${dot==='green'?'p-activity-dot--green':''}`}/>
                  <div>
                    <p className="p-activity-row__label">{label}</p>
                    <p className="p-activity-row__value" style={ok?{color:'var(--jade-dark)'}:{}}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <div className="p-tab-body">
          <SectionCard icon={<Bell size={17}/>} iconBg="rgba(194,122,42,0.1)" iconColor="var(--amber-dark)"
            title="Notification Preferences" subtitle="Choose how we contact you">
            <div className="p-notif-list">
              {[
                { key:'order_updates',         emoji:'🛒', title:'Order Updates',         desc:'Real-time status updates for your orders' },
                { key:'reservation_reminders', emoji:'📅', title:'Reservation Reminders', desc:'Reminders before your table booking' },
                { key:'promotions',            emoji:'🎁', title:'Promotions & Offers',   desc:'Special deals, seasonal menus, discounts' },
                { key:'newsletter',            emoji:'📰', title:'Monthly Newsletter',    desc:'Stories and updates from our kitchen' },
                { key:'sms_alerts',            emoji:'📱', title:'SMS Alerts',            desc:'Important alerts via text message' },
              ].map(({ key, emoji, title, desc }) => (
                <div key={key} className="p-notif-row">
                  <span className="p-notif-emoji">{emoji}</span>
                  <div className="p-notif-text">
                    <p className="p-notif-title">{title}</p>
                    <p className="p-notif-desc">{desc}</p>
                  </div>
                  <Toggle checked={!!notifs[key]} onChange={v => setNotifs(n=>({...n,[key]:v}))} id={`notif-${key}`}/>
                </div>
              ))}
            </div>
            <button className="p-btn p-btn--primary" style={{marginTop:20}} onClick={handleSaveNotifs} disabled={savingNotifs}>
              <Save size={14}/> {savingNotifs?'Saving…':'Save Preferences'}
            </button>
          </SectionCard>
        </div>
      )}

      {/* ── PRIVACY ── */}
      {tab === 'privacy' && (
        <div className="p-tab-body">
          <SectionCard icon={<Shield size={17}/>} iconBg="rgba(42,107,82,0.1)" iconColor="var(--jade-dark)"
            title="Data Privacy Settings" subtitle="Control how your data is used">
            <div className="p-notif-list">
              {[
                { key:'profile_visible',  title:'Public Profile',        desc:'Allow others to see your display name and avatar' },
                { key:'activity_visible', title:'Activity Visible',       desc:'Show your recent activity to other users' },
                { key:'marketing_emails', title:'Marketing Emails',       desc:'Receive personalised offers and promotions' },
                { key:'data_analytics',   title:'Analytics & Improvement',desc:'Help us improve by sharing anonymous usage data' },
              ].map(({ key, title, desc }) => (
                <div key={key} className="p-notif-row">
                  <div className="p-notif-text">
                    <p className="p-notif-title">{title}</p>
                    <p className="p-notif-desc">{desc}</p>
                  </div>
                  <Toggle checked={!!privacy[key]} onChange={v => setPrivacy(p=>({...p,[key]:v}))} id={`priv-${key}`}/>
                </div>
              ))}
            </div>
            <button className="p-btn p-btn--primary" style={{marginTop:20}} onClick={handleSavePrivacy} disabled={savingPrivacy}>
              <Save size={14}/> {savingPrivacy?'Saving…':'Save Privacy Settings'}
            </button>
          </SectionCard>

          <div className="p-gap"/>

          <SectionCard icon={<Download size={17}/>} iconBg="#e6f0ff" iconColor="#1a4fa0"
            title="Download My Data" subtitle="Export a copy of your account data in JSON format">
            <div className="p-download-box">
              <div className="p-download-box__info">
                <p>Your data export will include your profile information, notification preferences, and saved addresses. No order or payment data is included.</p>
              </div>
              <button className="p-btn p-btn--outline" onClick={handleDownloadData} disabled={downloading}>
                <Download size={14}/> {downloading?'Preparing…':'Download My Data'}
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── ACCOUNT INFO ── */}
      {tab === 'account' && (
        <div className="p-tab-body">
          <SectionCard icon={<UserCheck size={17}/>} iconBg="rgba(194,122,42,0.1)" iconColor="var(--amber-dark)"
            title="Account Information" subtitle="Your account details and status">
            <div className="p-info-grid">
              {[
                ['Email',         user?.email],
                ['Full Name',     user?.user_metadata?.full_name || '—'],
                ['Phone',         user?.user_metadata?.phone || '—'],
                ['Nickname',      user?.user_metadata?.nickname || '—'],
                ['Member Since',  user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—'],
                ['Last Sign In',  user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-GB') : '—'],
                ['Auth Provider', user?.app_metadata?.provider || 'email'],
                ['Email Status',  user?.email_confirmed_at ? '✓ Verified' : 'Pending'],
                ['Account ID',    user?.id?.slice(0,20)+'…'],
                ['2FA',           twoFAEnabled ? 'Enabled' : 'Disabled'],
              ].map(([label, value]) => (
                <div key={label} className="p-info-cell">
                  <span className="p-info-cell__label">{label}</span>
                  <span className="p-info-cell__value"
                    style={label==='Email Status'&&user?.email_confirmed_at?{color:'var(--jade-dark)'}:
                           label==='2FA'&&twoFAEnabled?{color:'var(--jade-dark)'}:{}}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/profile" className="p-btn p-btn--outline p-btn--sm" style={{marginTop:20}}>
              <Edit3 size={13}/> Edit Profile
            </Link>
          </SectionCard>
        </div>
      )}

      {/* ── DANGER ZONE ── */}
      {tab === 'danger' && (
        <div className="p-tab-body">
          <div className="p-danger-zone">
            <div className="p-danger-zone__header">
              <AlertTriangle size={20}/>
              <div>
                <h3>Danger Zone</h3>
                <p>Permanent actions that cannot be undone</p>
              </div>
            </div>

            <div className="p-danger-row">
              <div>
                <p className="p-danger-row__title">Sign Out All Devices</p>
                <p className="p-danger-row__desc">Immediately end all sessions on all devices</p>
              </div>
              <button className="p-btn p-btn--outline p-btn--danger-outline" onClick={async () => {
                await signOut(); toast.success('Signed out from all devices.'); navigate('/');
              }}><LogOut size={13}/> Sign Out All</button>
            </div>

            <div className="p-danger-row">
              <div>
                <p className="p-danger-row__title">Download My Data</p>
                <p className="p-danger-row__desc">Export all your account data as a JSON file</p>
              </div>
              <button className="p-btn p-btn--outline" onClick={handleDownloadData} disabled={downloading}>
                <Download size={13}/> {downloading?'Preparing…':'Download'}
              </button>
            </div>

            <div className="p-danger-row p-danger-row--red">
              <div>
                <p className="p-danger-row__title">Delete Account</p>
                <p className="p-danger-row__desc">Permanently delete your account, all orders, reservations, and personal data. This cannot be reversed.</p>
              </div>
              <button className="p-btn p-btn--delete" onClick={() => setShowDeleteBox(v=>!v)}>
                <Trash2 size={13}/> Delete Account
              </button>
            </div>

            {showDeleteBox && (
              <div className="p-delete-confirm">
                <p><strong>⚠️ This will permanently delete your account.</strong></p>
                <p className="p-hint" style={{marginTop:4}}>Type <code>DELETE</code> in the box below to confirm.</p>
                <input className="p-input" placeholder="Type DELETE here"
                  value={deleteInput} onChange={e => setDeleteInput(e.target.value)}/>
                <div className="p-delete-confirm__actions">
                  <button className="p-btn p-btn--ghost" onClick={() => { setShowDeleteBox(false); setDeleteInput(''); }}>Cancel</button>
                  <button className="p-btn p-btn--delete" disabled={deleteInput!=='DELETE'}
                    onClick={() => toast.error('Contact support@burmesebites.com to delete your account.')}>
                    <Trash2 size={13}/> Permanently Delete
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

/* ════════════════════════════════════════════════════════
   PAGE WRAPPER
════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) { toast.error('Please sign in first.'); navigate('/auth'); }
  }, [user, loading, navigate]);

  if (loading || !user) return <div style={{display:'flex',justifyContent:'center',marginTop:120}}><div className="p-spinner"/></div>;

  return (
    <div className="p-page">
      <div className="p-page__inner">
        <ProfileSidebar/>
        <main className="p-content-area">
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
