import React, { useState, useEffect, useRef } from 'react';
import {
  Bike, RefreshCw, MapPin, Clock, Package, Star,
  DollarSign, CheckCircle, AlertCircle, Wifi, WifiOff,
  ChevronDown, ChevronUp, Phone, Navigation, Truck,
  TrendingUp, Activity, User, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

/* ══════════════════════════════════════════════════
   DRIVER LOCATION MINI-MAP
══════════════════════════════════════════════════ */
function DriverMiniMap({ lat, lng, name }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng || !ref.current) return;
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key) return;

    const init = () => {
      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng });
        return;
      }
      mapRef.current = new window.google.maps.Map(ref.current, {
        center: { lat, lng }, zoom: 15,
        disableDefaultUI: true, zoomControl: false,
      });
      new window.google.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="#C27A2A" stroke="white" stroke-width="2.5"/>
              <text x="16" y="21" font-size="13" text-anchor="middle" fill="white">🏍</text>
            </svg>`
          ),
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });
    };

    if (window.google?.maps) { init(); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    s.async = true; s.onload = init;
    document.head.appendChild(s);
  }, [lat, lng]);

  if (!lat || !lng) return (
    <div className="drvm-no-map">
      <WifiOff size={18}/><p>No location yet</p>
    </div>
  );

  return <div ref={ref} className="drvm-mini-map"/>;
}

/* ══════════════════════════════════════════════════
   DRIVER CARD
══════════════════════════════════════════════════ */
function DriverCard({ driver, orders }) {
  const [open, setOpen] = useState(false);

  const mine      = orders.filter(o => o.driver_email === driver.email);
  const delivered = mine.filter(o => o.status === 'delivered');
  const active    = mine.filter(o => o.status !== 'delivered');
  const today     = mine.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayDone = today.filter(o => o.status === 'delivered');
  const earnings  = delivered.reduce((s, o) => s + parseFloat(o.total_amount || 0) * 0.1, 0);

  const lastSeen = driver.last_seen
    ? (() => {
        const diff = Math.floor((Date.now() - new Date(driver.last_seen)) / 60000);
        if (diff < 1)  return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        return new Date(driver.last_seen).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
      })()
    : 'Never connected';

  const isOnline = driver.last_seen && (Date.now() - new Date(driver.last_seen)) < 5 * 60 * 1000;

  const currentOrder = active.find(o => o.status === 'on_the_way' || o.status === 'picked_up');

  const STATUS_META = {
    received:   { label: 'Received',   color: '#1a4fa0', bg: '#dbeafe' },
    picked_up:  { label: 'Picked Up',  color: '#b07800', bg: '#fef3c7' },
    on_the_way: { label: 'On Route',   color: '#7c3aed', bg: '#ede9fe' },
    delivered:  { label: 'Delivered',  color: '#16a34a', bg: '#dcfce7' },
  };

  return (
    <div className={`drvm-card ${isOnline ? 'drvm-card--online' : ''} ${open ? 'drvm-card--open' : ''}`}>

      {/* ── Header ── */}
      <div className="drvm-card__head" onClick={() => setOpen(v => !v)}>
        {/* Avatar + status */}
        <div className="drvm-card__avatar-wrap">
          <div className="drvm-card__avatar">
            {(driver.full_name || driver.email || 'D')[0].toUpperCase()}
          </div>
          <span className={`drvm-card__online-dot ${isOnline ? 'drvm-card__online-dot--on' : ''}`}/>
        </div>

        {/* Info */}
        <div className="drvm-card__info">
          <div className="drvm-card__name-row">
            <p className="drvm-card__name">{driver.full_name || '—'}</p>
            <span className={`drvm-card__status-badge ${isOnline ? 'drvm-card__status-badge--on' : ''}`}>
              {isOnline ? <><Wifi size={10}/> Online</> : <><WifiOff size={10}/> Offline</>}
            </span>
            {driver.active === false && (
              <span className="drvm-card__inactive-badge">Inactive</span>
            )}
          </div>
          <p className="drvm-card__email">{driver.email}</p>
          {driver.phone && <p className="drvm-card__phone">{driver.phone}</p>}
          <div className="drvm-card__last-seen">
            <Clock size={10}/> {lastSeen}
          </div>
        </div>

        {/* Stats quick row */}
        <div className="drvm-card__quick-stats">
          <div className="drvm-qs">
            <span className="drvm-qs__val drvm-qs__val--blue">{active.length}</span>
            <span className="drvm-qs__lbl">Active</span>
          </div>
          <div className="drvm-qs">
            <span className="drvm-qs__val drvm-qs__val--green">{todayDone.length}</span>
            <span className="drvm-qs__lbl">Today</span>
          </div>
          <div className="drvm-qs">
            <span className="drvm-qs__val">{delivered.length}</span>
            <span className="drvm-qs__lbl">Total</span>
          </div>
          <div className="drvm-qs">
            <span className="drvm-qs__val drvm-qs__val--amber">฿{earnings.toFixed(0)}</span>
            <span className="drvm-qs__lbl">Earned</span>
          </div>
        </div>

        {/* Chevron */}
        <div className="drvm-card__chevron">
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div className="drvm-card__body">
          <div className="drvm-card__body-grid">

            {/* Left: Map + current order */}
            <div className="drvm-card__left">
              <p className="drvm-label">Live Location</p>
              <DriverMiniMap lat={driver.last_lat} lng={driver.last_lng} name={driver.full_name}/>
              {driver.last_lat && (
                <a
                  href={`https://maps.google.com/?q=${driver.last_lat},${driver.last_lng}`}
                  target="_blank" rel="noreferrer"
                  className="drvm-open-map-btn">
                  <Navigation size={12}/> Open in Google Maps
                </a>
              )}
            </div>

            {/* Right: Current delivery + stats */}
            <div className="drvm-card__right">

              {/* Current delivery */}
              {currentOrder ? (
                <div className="drvm-current-order">
                  <p className="drvm-label"><Activity size={12}/> Current Delivery</p>
                  <div className="drvm-current-order__inner">
                    <div className="drvm-co-row">
                      <span className="drvm-co-id">#{currentOrder.id.slice(-6).toUpperCase()}</span>
                      <span className="drvm-co-status"
                        style={{ background: STATUS_META[currentOrder.status]?.bg, color: STATUS_META[currentOrder.status]?.color }}>
                        {STATUS_META[currentOrder.status]?.label}
                      </span>
                    </div>
                    {currentOrder.customer_name && (
                      <div className="drvm-co-detail">
                        <User size={12}/> {currentOrder.customer_name}
                      </div>
                    )}
                    {currentOrder.delivery_address && (
                      <div className="drvm-co-detail">
                        <MapPin size={12}/> {currentOrder.delivery_address}
                      </div>
                    )}
                    <div className="drvm-co-amount">
                      ฿{parseFloat(currentOrder.total_amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="drvm-no-active">
                  <CheckCircle size={16}/>
                  <p>{active.length > 0 ? `${active.length} order(s) queued` : 'No active delivery'}</p>
                </div>
              )}

              {/* Stats breakdown */}
              <div className="drvm-stats-grid">
                {[
                  { icon:<Package size={14}/>,     label:'Total Assigned',  val:mine.length,           color:'#1a4fa0' },
                  { icon:<Truck size={14}/>,        label:'Active Now',      val:active.length,         color:'#7c3aed' },
                  { icon:<CheckCircle size={14}/>,  label:'Delivered Today', val:todayDone.length,      color:'#16a34a' },
                  { icon:<Star size={14}/>,         label:'All-time Done',   val:delivered.length,      color:'#b07800' },
                  { icon:<DollarSign size={14}/>,   label:'Total Earnings',  val:`฿${earnings.toFixed(0)}`, color:'#c27a2a' },
                  { icon:<TrendingUp size={14}/>,   label:'Completion Rate', val:mine.length > 0 ? Math.round(delivered.length/mine.length*100)+'%' : '—', color:'#16a34a' },
                ].map(({ icon, label, val, color }) => (
                  <div key={label} className="drvm-stat-cell">
                    <div className="drvm-stat-cell__icon" style={{ color, background: color + '18' }}>{icon}</div>
                    <span className="drvm-stat-cell__val">{val}</span>
                    <span className="drvm-stat-cell__lbl">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent orders table */}
          {mine.length > 0 && (
            <div className="drvm-recent">
              <p className="drvm-label"><Calendar size={12}/> Recent Orders</p>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Earnings</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.slice(0, 10).map(o => {
                    const m = STATUS_META[o.status] || { label: o.status, color: '#555', bg: '#f0f0f0' };
                    return (
                      <tr key={o.id}>
                        <td style={{ fontFamily:'monospace', fontWeight:700, color:'var(--amber-dark)' }}>
                          #{o.id.slice(-6).toUpperCase()}
                        </td>
                        <td>{o.customer_name || o.email || '—'}</td>
                        <td style={{ fontWeight:600 }}>฿{parseFloat(o.total_amount||0).toFixed(2)}</td>
                        <td style={{ fontWeight:700, color:'var(--jade-dark)' }}>
                          ฿{(parseFloat(o.total_amount||0)*0.1).toFixed(2)}
                        </td>
                        <td>
                          <span className="status-badge" style={{ background:m.bg, color:m.color }}>
                            {m.label}
                          </span>
                        </td>
                        <td style={{ color:'var(--text-muted)', fontSize:12 }}>
                          {new Date(o.created_at).toLocaleDateString('en-GB',{ day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN — DRIVER MANAGEMENT
══════════════════════════════════════════════════ */
export default function AdminDrivers() {
  const [drivers,  setDrivers]  = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const pollRef = useRef(null);

  const load = async () => {
    // Fetch drivers from user_roles
    const { data: roles, error: roleErr } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'driver')
      .order('created_at', { ascending: false });

    if (roleErr) {
      setError(roleErr.code === '42P01'
        ? 'Table not found. Run the SQL setup from Admin Settings → System.'
        : roleErr.message);
      setDrivers([]);
    } else {
      setError(null);
      setDrivers(roles || []);
    }

    // Fetch all delivery orders
    const { data: od } = await supabase
      .from('orders')
      .select('id,driver_email,status,total_amount,created_at,customer_name,email,delivery_address,special_notes,order_items(*)')
      .not('driver_email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    setOrders(od || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 20000); // live refresh every 20s
    return () => clearInterval(pollRef.current);
  }, []);

  // Summary stats
  const totalDelivered   = orders.filter(o => o.status === 'delivered').length;
  const totalActive      = orders.filter(o => o.status !== 'delivered').length;
  const totalEarnings    = orders.filter(o => o.status === 'delivered')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0) * 0.1, 0);
  const onlineCount      = drivers.filter(d => d.last_seen && (Date.now() - new Date(d.last_seen)) < 5 * 60 * 1000).length;

  return (
    <div>
      {/* Header */}
      <div className="admin-section-head" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <h2>Driver Management</h2>
          <p style={{ marginTop:3, color:'var(--text-muted)', fontSize:13 }}>
            Monitor your 2 delivery drivers — live location, active orders and earnings
          </p>
        </div>
        <button className="admin-action-btn admin-action-btn--edit" onClick={load}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#92400e', display:'flex', gap:10, alignItems:'flex-start' }}>
          <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/>
          <div><strong>Setup required:</strong> {error}<br/>
          Go to <strong>Supabase → SQL Editor</strong> and run the driver table SQL to enable this feature.</div>
        </div>
      )}

      {/* Summary stats */}
      <div className="admin-stats" style={{ marginBottom:24 }}>
        {[
          { label:'Total Drivers',   val:drivers.length,  icon:<Bike size={20}/>,        cls:'admin-stat-card__icon--amber' },
          { label:'Online Now',      val:onlineCount,     icon:<Wifi size={20}/>,        cls:'admin-stat-card__icon--jade'  },
          { label:'Active Orders',   val:totalActive,     icon:<Truck size={20}/>,       cls:'admin-stat-card__icon--blue'  },
          { label:'Total Delivered', val:totalDelivered,  icon:<CheckCircle size={20}/>, cls:'admin-stat-card__icon--jade'  },
          { label:'Driver Earnings', val:`฿${totalEarnings.toFixed(0)}`, icon:<DollarSign size={20}/>, cls:'admin-stat-card__icon--amber' },
        ].map(({ label, val, icon, cls }) => (
          <div key={label} className="admin-stat-card">
            <div className={`admin-stat-card__icon ${cls}`}>{icon}</div>
            <div>
              <p className="admin-stat-card__value">{val}</p>
              <p className="admin-stat-card__label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Driver cards */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div className="p-spinner"/>
        </div>
      ) : drivers.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid rgba(194,122,42,0.12)', borderRadius:16, padding:'60px 24px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(194,122,42,0.1)', color:'var(--amber)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Bike size={32}/>
          </div>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, color:'var(--charcoal)', marginBottom:8 }}>No Drivers Registered</h3>
          <p style={{ fontSize:13, color:'var(--text-muted)', maxWidth:360, margin:'0 auto 20px', lineHeight:1.6 }}>
            Driver accounts are created directly in Supabase. See the setup guide below to add your 2 delivery drivers.
          </p>
          <div style={{ background:'#f8f4ee', border:'1px solid rgba(194,122,42,0.18)', borderRadius:12, padding:'16px 20px', maxWidth:480, margin:'0 auto', textAlign:'left' }}>
            <p style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'var(--charcoal)' }}>How to add drivers:</p>
            <ol style={{ fontSize:12.5, color:'var(--brown)', lineHeight:1.8, paddingLeft:18 }}>
              <li>Go to <strong>Supabase Dashboard → Authentication → Users</strong></li>
              <li>Click <strong>"Invite user"</strong> and enter the driver's email</li>
              <li>After they confirm, go to <strong>SQL Editor</strong> and run:</li>
            </ol>
            <pre style={{ background:'#1a1612', color:'#e6edf3', borderRadius:8, padding:'10px 12px', fontSize:11, marginTop:10, overflowX:'auto', whiteSpace:'pre-wrap' }}>{`INSERT INTO user_roles (user_id, role, email, full_name, phone, active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'driver1@email.com'),
  'driver', 'driver1@email.com', 'Driver Name', '+66 8x xxx xxxx', true
);`}</pre>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {drivers.map(d => (
            <DriverCard key={d.user_id || d.id} driver={d} orders={orders}/>
          ))}
        </div>
      )}
    </div>
  );
}
