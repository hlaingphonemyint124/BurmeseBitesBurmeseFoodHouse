import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Package, CheckCircle, Clock, Phone, Navigation,
  LogOut, Sun, Moon, Bike, Star, AlertCircle, RefreshCw,
  User, DollarSign, TrendingUp, ChevronRight, ChevronUp,
  ChevronDown, Wifi, WifiOff, ArrowRight, Package2, Truck,
  List, Calendar, Award, Zap, Settings, Save, Key, Mail,
  Eye, EyeOff, Camera, Bell, Shield, X, Activity, Globe,
  Lock, Edit3, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { signOut, supabase } from '../../lib/supabase';
import './DriverDashboard.css';

/* ── Google Maps loader ── */
const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
let gmapLoaded = false;
function loadGMaps(cb) {
  if (window.google?.maps) { cb(); return; }
  if (gmapLoaded) { const t = setInterval(() => { if (window.google?.maps) { clearInterval(t); cb(); } }, 120); return; }
  gmapLoaded = true;
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}`;
  s.async = true; s.onload = cb;
  document.head.appendChild(s);
}

/* ── Status config ── */
const STATUS = {
  received:   { label:'New',       color:'#1a4fa0', bg:'#dbeafe', icon:<Package  size={13}/>, next:'picked_up',  btn:'Accept & Pick Up'  },
  picked_up:  { label:'Picked Up', color:'#b07800', bg:'#fef3c7', icon:<Truck    size={13}/>, next:'on_the_way', btn:'Start Delivery'     },
  on_the_way: { label:'On Route',  color:'#7c3aed', bg:'#ede9fe', icon:<Bike     size={13}/>, next:'delivered',  btn:'Mark Delivered'     },
  delivered:  { label:'Delivered', color:'#16a34a', bg:'#dcfce7', icon:<CheckCircle size={13}/>, next:null,      btn:null                 },
};

/* ════════════════════════════════════════════════════════
   LIVE MAP
════════════════════════════════════════════════════════ */
function LiveMap({ driverPos, order, isDark }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!GMAP_KEY) return;
    loadGMaps(() => {
      if (!divRef.current || mapRef.current) return;
      const center = driverPos || { lat:13.7563, lng:100.5018 };
      mapRef.current = new window.google.maps.Map(divRef.current, {
        center, zoom:14, disableDefaultUI:true, zoomControl:true,
        styles: isDark ? DARK_STYLE : [],
      });
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !driverPos) return;
    mapRef.current.setCenter(driverPos);
    if (!mapRef.current._drv) {
      mapRef.current._drv = new window.google.maps.Marker({
        position:driverPos, map:mapRef.current,
        icon:{ url:'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38"><circle cx="19" cy="19" r="17" fill="#C27A2A" stroke="white" stroke-width="2.5"/><text x="19" y="24" font-size="14" text-anchor="middle" fill="white">🏍</text></svg>'), scaledSize:new window.google.maps.Size(38,38) },
        zIndex:10,
      });
    } else { mapRef.current._drv.setPosition(driverPos); }
  }, [driverPos]);

  useEffect(() => {
    if (!mapRef.current || !order?.delivery_address) return;
    new window.google.maps.Geocoder().geocode({ address:order.delivery_address }, (res,st) => {
      if (st!=='OK'||!res[0]) return;
      const pos = res[0].geometry.location;
      if (!mapRef.current._dest) {
        mapRef.current._dest = new window.google.maps.Marker({
          position:pos, map:mapRef.current,
          icon:{ url:'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><circle cx="17" cy="17" r="15" fill="#16a34a" stroke="white" stroke-width="2.5"/><text x="17" y="22" font-size="13" text-anchor="middle" fill="white">📍</text></svg>'), scaledSize:new window.google.maps.Size(34,34) },
        });
      }
    });
  }, [order]);

  if (!GMAP_KEY) return (
    <div className="drv-map-placeholder">
      <MapPin size={28}/>
      <p>Google Maps not configured</p>
      <span>Add VITE_GOOGLE_MAPS_KEY to .env.local</span>
      {order?.delivery_address && (
        <a href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`}
          target="_blank" rel="noreferrer" className="drv-map-open-btn">
          Open in Maps <ArrowRight size={12}/>
        </a>
      )}
    </div>
  );
  return <div ref={divRef} className="drv-map-canvas"/>;
}

const DARK_STYLE = [
  {elementType:'geometry',stylers:[{color:'#1a1612'}]},
  {elementType:'labels.text.fill',stylers:[{color:'#9a9080'}]},
  {featureType:'road',elementType:'geometry',stylers:[{color:'#2e2820'}]},
  {featureType:'poi',stylers:[{visibility:'off'}]},
  {featureType:'water',elementType:'geometry',stylers:[{color:'#0d0c0a'}]},
];

/* ════════════════════════════════════════════════════════
   ACTIVE DELIVERY OVERLAY (full screen)
════════════════════════════════════════════════════════ */
function ActiveDelivery({ order, driverPos, onUpdateStatus, onClose, isDark }) {
  const [updating, setUpdating] = useState(false);
  const st = STATUS[order.status] || STATUS.received;
  const steps = ['received','picked_up','on_the_way','delivered'];
  const step  = steps.indexOf(order.status);

  const handleNext = async () => {
    if (!st.next) return;
    setUpdating(true);
    const { error } = await supabase.from('orders').update({ status:st.next }).eq('id', order.id);
    setUpdating(false);
    if (error) { toast.error('Update failed'); return; }
    toast.success(st.next==='delivered' ? '🎉 Delivery complete!' : `Updated to ${STATUS[st.next]?.label}`);
    onUpdateStatus(order.id, st.next);
  };

  return (
    <div className="drv-overlay">
      <div className="drv-overlay__map">
        <LiveMap driverPos={driverPos} order={order} isDark={isDark}/>
        <button className="drv-overlay__close" onClick={onClose}><X size={17}/></button>
        <div className="drv-overlay__badge">
          <span style={{background:st.bg,color:st.color}}>{st.icon}{st.label}</span>
        </div>
      </div>
      <div className="drv-overlay__drawer">
        {/* Progress */}
        <div className="drv-progress">
          <div className="drv-progress__bar"><div className="drv-progress__fill" style={{width:`${(step+1)/4*100}%`}}/></div>
          <div className="drv-progress__steps">
            {steps.map((s,i) => (
              <div key={s} className={`drv-pstep ${i<=step?'drv-pstep--done':''}`}>
                <div className="drv-pstep__dot">{STATUS[s].icon}</div>
                <span>{STATUS[s].label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Info */}
        <div className="drv-overlay__info">
          <div className="drv-info-row">
            <User size={14}/><div className="drv-info-row__text"><p>{order.customer_name||order.email}</p>{order.phone&&<span>{order.phone}</span>}</div>
            {order.phone&&<a href={`tel:${order.phone}`} className="drv-chip drv-chip--green"><Phone size={12}/> Call</a>}
          </div>
          <div className="drv-info-row">
            <MapPin size={14}/><div className="drv-info-row__text"><p>{order.delivery_address||'Address not provided'}</p></div>
            {order.delivery_address&&<a href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`} target="_blank" rel="noreferrer" className="drv-chip drv-chip--blue"><Navigation size={12}/> Nav</a>}
          </div>
          <div className="drv-overlay__items">
            {(order.order_items||[]).map((it,i) => <span key={i} className="drv-item-tag">{it.quantity}× {it.name}</span>)}
          </div>
          <div className="drv-overlay__total"><span>Order Total</span><span className="drv-overlay__total-val">฿{parseFloat(order.total_amount||0).toFixed(2)}</span></div>
        </div>
        {st.next
          ? <button className="drv-cta" onClick={handleNext} disabled={updating}>
              {updating?<RefreshCw size={15} className="drv-spin"/>:st.icon}
              {updating?'Updating…':st.btn}
            </button>
          : <div className="drv-done-banner"><CheckCircle size={18}/> Delivery Complete! 🎉</div>
        }
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ORDER CARD
════════════════════════════════════════════════════════ */
function OrderCard({ order, onUpdateStatus, onOpenMap }) {
  const [open, setOpen]     = useState(false);
  const [updating, setUpd]  = useState(false);
  const st = STATUS[order.status] || STATUS.received;

  const ago = (ts) => {
    const d = Math.floor((Date.now()-new Date(ts))/60000);
    return d<1?'Just now':d<60?`${d}m ago`:`${Math.floor(d/60)}h ago`;
  };

  const handleNext = async (e) => {
    e.stopPropagation();
    if (!st.next) return;
    setUpd(true);
    const { error } = await supabase.from('orders').update({ status:st.next }).eq('id', order.id);
    setUpd(false);
    if (error) { toast.error('Failed'); return; }
    toast.success(`Marked: ${STATUS[st.next]?.label}`);
    onUpdateStatus(order.id, st.next);
  };

  return (
    <div className={`drv-order ${open?'drv-order--open':''} drv-order--${order.status}`}
      onClick={() => setOpen(v=>!v)}>
      <div className="drv-order__head">
        <span className="drv-order__id"><span className="drv-order__hash">#</span>{order.id.slice(-6).toUpperCase()}</span>
        <span className="drv-order__pill" style={{background:st.bg,color:st.color}}>{st.icon}{st.label}</span>
        <span className="drv-order__time"><Clock size={10}/>{ago(order.created_at)}</span>
        <span className="drv-order__amt">฿{parseFloat(order.total_amount||0).toFixed(2)}</span>
        {open?<ChevronUp size={14} className="drv-order__chev"/>:<ChevronDown size={14} className="drv-order__chev"/>}
      </div>
      {open && (
        <div className="drv-order__body" onClick={e=>e.stopPropagation()}>
          <div className="drv-order__detail"><User size={12}/><span>{order.customer_name||order.email}</span>{order.phone&&<a href={`tel:${order.phone}`} className="drv-chip-sm drv-chip-sm--green"><Phone size={10}/></a>}</div>
          <div className="drv-order__detail"><MapPin size={12}/><span>{order.delivery_address||'No address'}</span>{order.delivery_address&&<a href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`} target="_blank" rel="noreferrer" className="drv-chip-sm drv-chip-sm--blue"><Navigation size={10}/></a>}</div>
          <div className="drv-order__items">{(order.order_items||[]).map((it,i)=><span key={i} className="drv-item-tag">{it.quantity}× {it.name}</span>)}</div>
          {order.special_notes&&<div className="drv-order__notes"><AlertCircle size={11}/>{order.special_notes}</div>}
          <div className="drv-order__actions">
            {order.status!=='delivered'&&<button className="drv-map-btn" onClick={e=>{e.stopPropagation();onOpenMap(order)}}><MapPin size={13}/> Map View</button>}
            {st.next&&<button className="drv-next-btn" onClick={handleNext} disabled={updating}>{updating?<RefreshCw size={13} className="drv-spin"/>:st.icon}{updating?'…':st.btn}</button>}
            {!st.next&&<div className="drv-done-chip"><CheckCircle size={12}/> Complete</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PROFILE TAB
════════════════════════════════════════════════════════ */
function DriverProfile({ user }) {
  const fileRef = useRef();
  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone:     user?.user_metadata?.phone     || '',
    bio:       user?.user_metadata?.bio       || '',
    vehicle:   user?.user_metadata?.vehicle   || '',
    license:   user?.user_metadata?.license   || '',
  });
  const [saving, setSaving]   = useState(false);
  const [changed, setChanged] = useState(false);
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setChanged(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: form });
    // Also update user_roles table
    await supabase.from('user_roles').update({ full_name:form.full_name, phone:form.phone })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile saved!');
    setChanged(false);
  };

  const displayName = form.full_name || user?.email?.split('@')[0] || 'Driver';
  const initials    = displayName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="drv-tab-content">
      <div className="drv-content-head"><h2>My Profile</h2><p>Your personal information and driver details</p></div>

      {/* Hero card */}
      <div className="drv-profile-hero">
        <div className="drv-profile-hero__avatar-wrap">
          <div className="drv-profile-hero__avatar">{initials}</div>
          <button className="drv-profile-hero__cam" onClick={()=>fileRef.current?.click()}><Camera size={12}/></button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={()=>toast('Photo upload coming soon!')}/>
        </div>
        <div className="drv-profile-hero__info">
          <h3>{displayName}</h3>
          <p>{user?.email}</p>
          <span className="drv-profile-hero__badge"><Bike size={11}/> Delivery Driver</span>
        </div>
        {changed && <span className="drv-unsaved-badge">Unsaved changes</span>}
      </div>

      <form onSubmit={handleSave} className="drv-form-card">
        <p className="drv-form-section-title"><User size={13}/> Personal Information</p>
        <div className="drv-form-grid">
          <div className="drv-field">
            <label>Full Name</label>
            <input className="drv-input" placeholder="Your full name"
              value={form.full_name} onChange={e=>set('full_name',e.target.value)}/>
          </div>
          <div className="drv-field">
            <label>Email Address</label>
            <input className="drv-input drv-input--disabled" value={user?.email} disabled/>
            <span className="drv-hint">Email cannot be changed here</span>
          </div>
          <div className="drv-field">
            <label>Phone Number</label>
            <input className="drv-input" placeholder="+66 8x xxx xxxx"
              value={form.phone} onChange={e=>set('phone',e.target.value)}/>
          </div>
          <div className="drv-field drv-field--full">
            <label>Bio / Notes</label>
            <textarea className="drv-input drv-textarea" placeholder="A short note about yourself…" rows={2}
              value={form.bio} onChange={e=>set('bio',e.target.value)} maxLength={200}/>
            <span className="drv-hint drv-hint--right">{(form.bio||'').length}/200</span>
          </div>
        </div>

        <p className="drv-form-section-title" style={{marginTop:18}}><Truck size={13}/> Vehicle Details</p>
        <div className="drv-form-grid">
          <div className="drv-field">
            <label>Vehicle Type / Model</label>
            <input className="drv-input" placeholder="e.g. Honda Wave 110i"
              value={form.vehicle} onChange={e=>set('vehicle',e.target.value)}/>
          </div>
          <div className="drv-field">
            <label>License Plate</label>
            <input className="drv-input" placeholder="e.g. กข 1234 Bangkok"
              value={form.license} onChange={e=>set('license',e.target.value)}/>
          </div>
        </div>

        <div className="drv-form-actions">
          <button type="submit" className="drv-btn drv-btn--primary" disabled={saving||!changed}>
            <Save size={14}/> {saving?'Saving…':'Save Profile'}
          </button>
          {changed&&<button type="button" className="drv-btn drv-btn--ghost" onClick={()=>{
            setForm({full_name:user?.user_metadata?.full_name||'',phone:user?.user_metadata?.phone||'',bio:user?.user_metadata?.bio||'',vehicle:user?.user_metadata?.vehicle||'',license:user?.user_metadata?.license||''});
            setChanged(false);
          }}>Discard</button>}
        </div>
      </form>

      {/* Account info */}
      <div className="drv-form-card" style={{marginTop:16}}>
        <p className="drv-form-section-title"><Activity size={13}/> Account Information</p>
        <div className="drv-info-grid">
          {[
            ['Email',        user?.email],
            ['Account ID',   user?.id?.slice(0,18)+'…'],
            ['Role',         'Delivery Driver'],
            ['Member Since', user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—'],
            ['Last Sign In', user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-GB') : '—'],
            ['Email Status', user?.email_confirmed_at ? '✓ Verified' : 'Pending'],
          ].map(([l,v]) => (
            <div key={l} className="drv-info-cell">
              <span className="drv-info-cell__label">{l}</span>
              <span className="drv-info-cell__value" style={l==='Email Status'&&user?.email_confirmed_at?{color:'#16a34a'}:{}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ACCOUNT SETTINGS TAB
════════════════════════════════════════════════════════ */
function DriverSettings({ user }) {
  const navigate = useNavigate();
  const [settab, setSettab] = useState('security');

  /* Password */
  const [pwd, setPwd]         = useState({ next:'', confirm:'' });
  const [showPwd, setShowPwd] = useState({ next:false, confirm:false });
  const [savingPwd, setSavingPwd] = useState(false);

  /* Notifications */
  const [notifs, setNotifs] = useState({
    new_order:    user?.user_metadata?.drv_notif_order ?? true,
    status_update:user?.user_metadata?.drv_notif_status?? true,
    daily_summary:user?.user_metadata?.drv_notif_daily ?? false,
  });
  const [savingN, setSavingN] = useState(false);

  /* Delete */
  const [delInput, setDelInput]   = useState('');
  const [showDel, setShowDel]     = useState(false);

  const pwdStr = (p) => {
    if (!p) return null;
    const s = [p.length>=8,/[A-Z]/.test(p),/[0-9]/.test(p),/[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    return s<=1?{l:'Weak',c:'weak',pct:25}:s===2?{l:'Fair',c:'fair',pct:50}:s===3?{l:'Good',c:'good',pct:75}:{l:'Strong',c:'strong',pct:100};
  };
  const str = pwdStr(pwd.next);

  const handlePwd = async (e) => {
    e.preventDefault();
    if (pwd.next!==pwd.confirm) { toast.error('Passwords do not match.'); return; }
    if (pwd.next.length<8)      { toast.error('Minimum 8 characters.'); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password:pwd.next });
    setSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated!');
    setPwd({ next:'', confirm:'' });
  };

  const handleSaveNotifs = async () => {
    setSavingN(true);
    const { error } = await supabase.auth.updateUser({ data:{ drv_notif_order:notifs.new_order, drv_notif_status:notifs.status_update, drv_notif_daily:notifs.daily_summary } });
    setSavingN(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Notification preferences saved!');
  };

  const TABS = [
    { key:'security',      label:'Security',      icon:<Lock size={14}/> },
    { key:'notifications', label:'Notifications', icon:<Bell size={14}/> },
    { key:'danger',        label:'Danger Zone',   icon:<AlertCircle size={14}/> },
  ];

  return (
    <div className="drv-tab-content">
      <div className="drv-content-head"><h2>Account Settings</h2><p>Manage your security and preferences</p></div>

      <div className="drv-settings-tabs">
        {TABS.map(t => (
          <button key={t.key}
            className={`drv-stab ${settab===t.key?'drv-stab--active':''} ${t.key==='danger'?'drv-stab--danger':''}`}
            onClick={()=>setSettab(t.key)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Security ── */}
      {settab==='security' && (
        <div className="drv-form-card">
          <p className="drv-form-section-title"><Key size={13}/> Change Password</p>
          <form onSubmit={handlePwd} style={{maxWidth:440,display:'flex',flexDirection:'column',gap:14}}>
            <div className="drv-field">
              <label>New Password</label>
              <div className="drv-pw-wrap">
                <input required type={showPwd.next?'text':'password'} className="drv-input"
                  placeholder="Minimum 8 characters"
                  value={pwd.next} onChange={e=>setPwd(p=>({...p,next:e.target.value}))}/>
                <button type="button" className="drv-eye" onClick={()=>setShowPwd(s=>({...s,next:!s.next}))}>
                  {showPwd.next?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
              {str&&<div className="drv-strength"><div className="drv-strength__bar"><div className={`drv-strength__fill drv-strength__fill--${str.c}`} style={{width:`${str.pct}%`}}/></div><span className={`drv-strength__lbl drv-strength__lbl--${str.c}`}>{str.l}</span></div>}
            </div>
            <div className="drv-field">
              <label>Confirm Password</label>
              <div className="drv-pw-wrap">
                <input required type={showPwd.confirm?'text':'password'} className="drv-input"
                  placeholder="Repeat your password"
                  value={pwd.confirm} onChange={e=>setPwd(p=>({...p,confirm:e.target.value}))}/>
                <button type="button" className="drv-eye" onClick={()=>setShowPwd(s=>({...s,confirm:!s.confirm}))}>
                  {showPwd.confirm?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
              {pwd.confirm&&pwd.next===pwd.confirm&&<div className="drv-match-ok"><CheckCircle size={12}/> Passwords match</div>}
              {pwd.confirm&&pwd.next!==pwd.confirm&&<div className="drv-match-no"><X size={12}/> Don't match</div>}
            </div>
            <div className="drv-pwd-tips">
              {[[pwd.next.length>=8,'8+ characters'],[/[A-Z]/.test(pwd.next),'Uppercase'],[/[0-9]/.test(pwd.next),'Number'],[/[^A-Za-z0-9]/.test(pwd.next),'Special char']].map(([ok,label])=>(
                <div key={label} className={`drv-pwd-tip ${ok?'drv-pwd-tip--ok':''}`}><CheckCircle size={10}/>{label}</div>
              ))}
            </div>
            <button type="submit" className="drv-btn drv-btn--primary" disabled={savingPwd||!pwd.next}>
              <Key size={13}/> {savingPwd?'Updating…':'Update Password'}
            </button>
          </form>

          <div style={{height:1,background:'rgba(194,122,42,0.1)',margin:'20px 0'}}/>

          <p className="drv-form-section-title"><Activity size={13}/> Account Activity</p>
          <div className="drv-activity-list">
            {[
              ['Last sign in', user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-GB') : '—', true],
              ['Account created', user?.created_at ? new Date(user.created_at).toLocaleString('en-GB') : '—', false],
              ['Auth provider', user?.app_metadata?.provider || 'email', false],
            ].map(([label,value,green]) => (
              <div key={label} className="drv-activity-row">
                <div className={`drv-activity-dot ${green?'drv-activity-dot--green':''}`}/>
                <div><p>{label}</p><span>{value}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {settab==='notifications' && (
        <div className="drv-form-card">
          <p className="drv-form-section-title"><Bell size={13}/> Notification Preferences</p>
          <div className="drv-notif-list">
            {[
              { key:'new_order',     emoji:'🛵', title:'New Order Assigned',  desc:'Alert when a new delivery is assigned to you' },
              { key:'status_update', emoji:'📍', title:'Status Updates',      desc:'Notify when order status needs updating' },
              { key:'daily_summary', emoji:'📊', title:'Daily Summary',       desc:'End-of-day summary of your deliveries' },
            ].map(({ key, emoji, title, desc }) => (
              <div key={key} className="drv-notif-row">
                <span className="drv-notif-emoji">{emoji}</span>
                <div className="drv-notif-text"><p>{title}</p><span>{desc}</span></div>
                <label className="drv-toggle">
                  <input type="checkbox" checked={!!notifs[key]} onChange={e=>setNotifs(n=>({...n,[key]:e.target.checked}))}/>
                  <span className="drv-toggle__track"><span className="drv-toggle__thumb"/></span>
                </label>
              </div>
            ))}
          </div>
          <button className="drv-btn drv-btn--primary" style={{marginTop:16}} onClick={handleSaveNotifs} disabled={savingN}>
            <Save size={13}/> {savingN?'Saving…':'Save Preferences'}
          </button>
        </div>
      )}

      {/* ── Danger Zone ── */}
      {settab==='danger' && (
        <div className="drv-danger-zone">
          <div className="drv-danger-zone__header"><AlertCircle size={18}/><div><h3>Danger Zone</h3><p>Permanent actions</p></div></div>
          <div className="drv-danger-row">
            <div><p className="drv-danger-row__title">Sign Out All Devices</p><p className="drv-danger-row__desc">End all active sessions immediately</p></div>
            <button className="drv-btn drv-btn--outline-danger" onClick={async()=>{ await signOut(); navigate('/auth'); }}>
              <LogOut size={13}/> Sign Out All
            </button>
          </div>
          <div className="drv-danger-row drv-danger-row--red">
            <div><p className="drv-danger-row__title">Delete Account</p><p className="drv-danger-row__desc">Permanently delete your driver account. Cannot be undone.</p></div>
            <button className="drv-btn drv-btn--delete" onClick={()=>setShowDel(v=>!v)}><X size={13}/> Delete</button>
          </div>
          {showDel&&(
            <div className="drv-delete-confirm">
              <p>Type <code>DELETE</code> to confirm:</p>
              <input className="drv-input" placeholder="DELETE" value={delInput} onChange={e=>setDelInput(e.target.value)}/>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button className="drv-btn drv-btn--ghost" onClick={()=>{setShowDel(false);setDelInput('');}}>Cancel</button>
                <button className="drv-btn drv-btn--delete" disabled={delInput!=='DELETE'}
                  onClick={()=>toast.error('Contact admin to delete your account.')}>
                  Permanently Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════════ */
export default function DriverDashboard() {
  const { user, loading } = useAuth();
  const { toggle: toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [orders,  setOrders]  = useState([]);
  const [fetching,setFetching]= useState(true);
  const [online,  setOnline]  = useState(true);
  const [tab,     setTab]     = useState('deliveries');
  const [filter,  setFilter]  = useState('active');
  const [active,  setActive]  = useState(null); // full-screen delivery
  const [driverPos, setDriverPos] = useState(null);
  const [locStatus, setLocStatus] = useState('acquiring');
  const pollRef  = useRef(null);
  const watchRef = useRef(null);

  /* Auth guard */
  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading]);

  /* GPS tracking */
  useEffect(() => {
    if (!navigator.geolocation) { setLocStatus('denied'); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat:pos.coords.latitude, lng:pos.coords.longitude };
        setDriverPos(p); setLocStatus('ok');
        if (user) supabase.from('user_roles').update({ last_lat:p.lat, last_lng:p.lng, last_seen:new Date().toISOString() }).eq('user_id',user.id).then(()=>{});
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy:true, maximumAge:10000, timeout:15000 }
    );
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, [user]);

  /* Fetch orders */
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('orders').select('*, order_items(*)')
      .eq('driver_email', user.email).order('created_at',{ascending:false});
    setOrders(data||[]); setFetching(false);
  }, [user]);

  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, 12000);
    return () => clearInterval(pollRef.current);
  }, [fetchOrders]);

  const handleUpdateStatus = (id, s) => {
    setOrders(prev => prev.map(o => o.id===id?{...o,status:s}:o));
    if (active?.id===id) setActive(prev=>({...prev,status:s}));
  };

  const handleLogout = async () => { await signOut(); toast.success('Signed out.'); navigate('/auth'); };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Driver';
  const initials    = displayName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  const activeOrders    = orders.filter(o => o.status!=='delivered');
  const delivered       = orders.filter(o => o.status==='delivered');
  const todayDone       = delivered.filter(o => new Date(o.created_at).toDateString()===new Date().toDateString());
  const earnings        = todayDone.reduce((s,o)=>s+parseFloat(o.total_amount||0)*0.1,0);
  const allEarnings     = delivered.reduce((s,o)=>s+parseFloat(o.total_amount||0)*0.1,0);
  const filteredOrders  = filter==='active'?activeOrders:filter==='delivered'?delivered:orders;

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0806'}}>
      <div className="drv-spinner" style={{width:40,height:40,borderWidth:4}}/>
    </div>
  );

  const NAV = [
    { key:'deliveries', icon:<List size={16}/>,       label:'Deliveries',    badge:activeOrders.length },
    { key:'history',    icon:<Calendar size={16}/>,   label:'History'       },
    { key:'earnings',   icon:<DollarSign size={16}/>, label:'Earnings'      },
    { key:'profile',    icon:<User size={16}/>,       label:'My Profile'    },
    { key:'settings',   icon:<Settings size={16}/>,   label:'Settings'      },
  ];

  return (
    <div className={`drv-shell${isDark?' drv-dark':''}`}>

      {/* Full-screen delivery overlay */}
      {active && (
        <ActiveDelivery order={active} driverPos={driverPos}
          onUpdateStatus={handleUpdateStatus} onClose={()=>setActive(null)} isDark={isDark}/>
      )}

      {/* Topbar */}
      <header className="drv-topbar">
        <div className="drv-topbar__brand">
          <img src="/logo.png" alt="BB" className="drv-topbar__logo"/>
          <div><p className="drv-topbar__name">Burmese Bites</p><p className="drv-topbar__role">Driver Portal</p></div>
        </div>
        <div className="drv-topbar__center">
          <div className={`drv-loc-status drv-loc-status--${locStatus}`}>
            {locStatus==='ok'&&<><Wifi size={11}/> GPS Live</>}
            {locStatus==='denied'&&<><WifiOff size={11}/> GPS Off</>}
            {locStatus==='acquiring'&&<><RefreshCw size={11} className="drv-spin"/> Locating…</>}
          </div>
        </div>
        <div className="drv-topbar__right">
          <button className={`drv-online${online?' drv-online--on':''}`}
            onClick={()=>{setOnline(v=>!v);toast(online?'You are offline':'You are online!');}}>
            <span className="drv-online__dot"/>{online?'Online':'Offline'}
          </button>
          <button className="drv-icon-btn" onClick={toggleTheme}>{isDark?<Sun size={16}/>:<Moon size={16}/>}</button>
          <button className="drv-icon-btn drv-icon-btn--logout" onClick={handleLogout}><LogOut size={16}/></button>
        </div>
      </header>

      <div className="drv-layout">
        {/* Sidebar */}
        <aside className="drv-sidebar">
          <div className="drv-sidebar__profile">
            <div className="drv-sidebar__avatar">
              {initials}
              <span className={`drv-sidebar__dot${online?' drv-sidebar__dot--on':''}`}/>
            </div>
            <div>
              <p className="drv-sidebar__name">{displayName}</p>
              <p className="drv-sidebar__email">{user?.email}</p>
              <div className="drv-sidebar__stars">{[1,2,3,4,5].map(i=><Star key={i} size={10} fill="currentColor"/>)}<span>4.9</span></div>
            </div>
          </div>

          <div className="drv-sidebar__stats">
            <div className="drv-sidebar__stat"><span className="drv-sidebar__stat-val">{activeOrders.length}</span><span>Active</span></div>
            <div className="drv-sidebar__stat-div"/>
            <div className="drv-sidebar__stat"><span className="drv-sidebar__stat-val">{todayDone.length}</span><span>Today</span></div>
            <div className="drv-sidebar__stat-div"/>
            <div className="drv-sidebar__stat"><span className="drv-sidebar__stat-val drv-sidebar__stat-val--amber">฿{earnings.toFixed(0)}</span><span>Earned</span></div>
          </div>

          <nav className="drv-sidebar__nav">
            {NAV.map(({key,icon,label,badge})=>(
              <button key={key}
                className={`drv-sidebar__link${tab===key?' drv-sidebar__link--active':''}`}
                onClick={()=>setTab(key)}>
                <span className="drv-sidebar__link-icon">{icon}</span>
                <span>{label}</span>
                {badge>0&&<span className="drv-sidebar__badge">{badge}</span>}
                <ChevronRight size={12} className="drv-sidebar__arrow"/>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="drv-main">

          {/* ── DELIVERIES ── */}
          {tab==='deliveries' && (
            <>
              <div className="drv-stats">
                {[
                  { label:'Active',        val:activeOrders.length, icon:<Bike size={19}/>,       color:'#1a4fa0' },
                  { label:'Done Today',    val:todayDone.length,    icon:<CheckCircle size={19}/>, color:'#16a34a' },
                  { label:"Today's Earn",  val:`฿${earnings.toFixed(0)}`, icon:<DollarSign size={19}/>, color:'#b07800' },
                  { label:'All Delivered', val:delivered.length,    icon:<Award size={19}/>,       color:'#7c3aed' },
                ].map(({label,val,icon,color})=>(
                  <div key={label} className="drv-stat">
                    <div className="drv-stat__icon" style={{background:color+'1a',color}}>{icon}</div>
                    <div><span className="drv-stat__val">{val}</span><span className="drv-stat__lbl">{label}</span></div>
                  </div>
                ))}
              </div>

              {!online&&<div className="drv-offline-banner"><AlertCircle size={15}/> You are offline — toggle Online to receive deliveries.</div>}

              <div className="drv-filter-row">
                {[{k:'active',l:'Active',c:activeOrders.length},{k:'delivered',l:'Delivered',c:delivered.length},{k:'all',l:'All',c:orders.length}].map(({k,l,c})=>(
                  <button key={k} className={`drv-filter-chip${filter===k?' drv-filter-chip--on':''}`} onClick={()=>setFilter(k)}>
                    {l}{c>0&&<span className="drv-filter-chip__count">{c}</span>}
                  </button>
                ))}
                <button className="drv-refresh" onClick={fetchOrders}><RefreshCw size={13}/></button>
              </div>

              {fetching?<div className="drv-loading"><div className="drv-spinner"/></div>
              :filteredOrders.length===0?(
                <div className="drv-empty">
                  <div className="drv-empty__icon"><Package2 size={30}/></div>
                  <h3>No {filter==='active'?'active ':''}orders</h3>
                  <p>{online?'Orders will appear here automatically.':'Go online to receive deliveries.'}</p>
                </div>
              ):(
                <div className="drv-order-list">
                  {filteredOrders.map(o=>(
                    <OrderCard key={o.id} order={o}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenMap={setActive}/>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── HISTORY ── */}
          {tab==='history'&&(
            <>
              <div className="drv-content-head"><h2>Delivery History</h2><p>All orders assigned to you</p></div>
              <div className="drv-table-wrap">
                <table className="drv-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Earnings</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.length===0?<tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No history yet</td></tr>
                    :orders.map(o=>{
                      const s=STATUS[o.status]||STATUS.received;
                      return <tr key={o.id}>
                        <td><span className="drv-id">#{o.id.slice(-6).toUpperCase()}</span></td>
                        <td>{o.customer_name||o.email||'—'}</td>
                        <td style={{fontWeight:600,color:'var(--charcoal)'}}>฿{parseFloat(o.total_amount||0).toFixed(2)}</td>
                        <td style={{fontWeight:700,color:'var(--amber-dark)'}}>฿{(parseFloat(o.total_amount||0)*0.1).toFixed(2)}</td>
                        <td style={{color:'var(--text-muted)',fontSize:12}}>{new Date(o.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</td>
                        <td><span className="drv-status-pill" style={{background:s.bg,color:s.color}}>{s.label}</span></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── EARNINGS ── */}
          {tab==='earnings'&&(
            <>
              <div className="drv-content-head"><h2>Earnings Overview</h2><p>Track your income from deliveries (10% per order)</p></div>
              <div className="drv-earnings-grid">
                {[
                  { label:"Today's Earnings",  val:`฿${earnings.toFixed(2)}`,    sub:`${todayDone.length} deliveries today`, icon:<Zap size={19}/>,        color:'#b07800' },
                  { label:'All-Time Earnings', val:`฿${allEarnings.toFixed(2)}`, sub:`${delivered.length} total deliveries`, icon:<Award size={19}/>,       color:'#7c3aed' },
                  { label:'Total Assigned',    val:orders.length,                sub:'Orders assigned to you',               icon:<Package size={19}/>,     color:'#1a4fa0' },
                  { label:'Completion Rate',   val:orders.length>0?Math.round(delivered.length/orders.length*100)+'%':'—', sub:'Delivered vs assigned', icon:<TrendingUp size={19}/>, color:'#16a34a' },
                ].map(({label,val,sub,icon,color})=>(
                  <div key={label} className="drv-earn-card">
                    <div className="drv-earn-card__icon" style={{background:color+'1a',color}}>{icon}</div>
                    <div><p className="drv-earn-card__lbl">{label}</p><p className="drv-earn-card__val">{val}</p><p className="drv-earn-card__sub">{sub}</p></div>
                  </div>
                ))}
              </div>
              <div className="drv-earn-note">
                <Shield size={15}/>
                <div><p><strong>10% commission per delivery.</strong></p><p>Payments processed weekly every Monday. Contact the restaurant for payment queries.</p></div>
              </div>
            </>
          )}

          {/* ── PROFILE ── */}
          {tab==='profile' && user && <DriverProfile user={user}/>}

          {/* ── SETTINGS ── */}
          {tab==='settings' && user && <DriverSettings user={user}/>}
        </main>
      </div>
    </div>
  );
}
