import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, CalendarDays,
  Star, Images, LogOut, Menu, X, ChevronRight, ShoppingCart,
  Settings, Sun, Moon, Bike, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { signOut, getAllOrders } from '../../lib/supabase';
import AdminOverview    from '../../components/admin/AdminOverview';
import AdminMenu        from '../../components/admin/AdminMenu';
import AdminOrders      from '../../components/admin/AdminOrders';
import AdminReservations from '../../components/admin/AdminReservations';
import AdminReviews     from '../../components/admin/AdminReviews';
import AdminGallery     from '../../components/admin/AdminGallery';
import AdminSettings    from '../../components/admin/AdminSettings';
import AdminDrivers     from '../../components/admin/AdminDrivers';
import AdminUsers       from '../../components/admin/AdminUsers';
import '../../components/admin/AdminSettings.css';
import '../../components/admin/AdminDrivers.css';
import './Admin.css';

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { toggle: toggleTheme, isDark } = useTheme();
  const [sidebarOpen, setSidebar]  = useState(false);
  const [pendingPayCount, setPendingPayCount] = useState(0);
  const navigate                   = useNavigate();
  const { pathname }               = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      toast.error('Admin access required.');
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  // Poll pending payment count for sidebar badge
  useEffect(() => {
    if (!user || !isAdmin) return;
    const fetchPending = () => {
      getAllOrders().then(({ data }) => {
        const count = (data || []).filter(o => o.payment_status === 'pending_review').length;
        setPendingPayCount(count);
      });
    };
    fetchPending();
    const interval = setInterval(fetchPending, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const handleLogout = async () => {
    await signOut();
    toast.success('Signed out.');
    navigate('/');
  };

  if (loading) return <div className="admin-loading"><div className="spinner" /></div>;
  if (!user || !isAdmin) return null;

  const NAV = [
    { to: '/admin',              label: 'Overview',       icon: <LayoutDashboard size={18} />, end: true },
    { to: '/admin/orders',       label: 'Orders & Pay',   icon: <ShoppingCart size={18} />, badge: pendingPayCount },
    { to: '/admin/menu',         label: 'Menu Items',     icon: <UtensilsCrossed size={18} /> },
    { to: '/admin/reservations', label: 'Reservations',   icon: <CalendarDays size={18} /> },
    { to: '/admin/reviews',      label: 'Reviews',        icon: <Star size={18} /> },
    { to: '/admin/gallery',      label: 'Gallery',        icon: <Images size={18} /> },
    { to: '/admin/drivers',      label: 'Drivers',        icon: <Bike size={18}/> },
    { to: '/admin/users',        label: 'User Management', icon: <Users size={18}/> },
    { to: '/admin/settings',     label: 'Settings',       icon: <Settings size={18}/> },
  ];

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__logo">
          <Link to="/" style={{ display:'flex', flexDirection:'column', alignItems:'center', textDecoration:'none' }}>
            <img src="/logo.png" alt="BurmeseBites" className="admin-sidebar__logo-img" />
          </Link>
          <div className="admin-sidebar__logo-sub" style={{ textAlign:'center', marginTop:4 }}>Admin Panel</div>
        </div>

        <nav className="admin-nav">
          {NAV.map(({ to, label, icon, end, badge }) => {
            const active = end ? pathname === to : pathname.startsWith(to);
            const isBottomGroup = to === '/admin/users' || to === '/admin/settings';
            return (
              <React.Fragment key={to}>
                {to === '/admin/users' && (
                  <div className="admin-nav__divider" />
                )}
                <Link
                  to={to}
                  className={`admin-nav__item ${active ? 'admin-nav__item--active' : ''}`}
                  onClick={() => setSidebar(false)}
                >
                  {icon}
                  <span>{label}</span>
                  {badge > 0 && (
                    <span className="admin-nav__badge">{badge}</span>
                  )}
                  {active && !badge && <ChevronRight size={14} className="admin-nav__arrow" />}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="admin-sidebar__user-info">
              <p>{user.user_metadata?.full_name || 'Admin'}</p>
              <span>{user.email}</span>
            </div>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebar(false)} />
      )}

      {/* Main content */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button className="admin-topbar__toggle" onClick={() => setSidebar(v => !v)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-topbar__title">
            {NAV.find(n => n.end ? pathname === n.to : pathname.startsWith(n.to))?.label || 'Dashboard'}
          </div>
          <div className="admin-topbar__right">
            {pendingPayCount > 0 && (
              <Link to="/admin/orders" className="admin-topbar__alert" onClick={() => setSidebar(false)}>
                <span className="admin-topbar__alert-dot" />
                {pendingPayCount} payment{pendingPayCount > 1 ? 's' : ''} pending
              </Link>
            )}
            <button className="theme-toggle" onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <span className="theme-toggle__icon theme-toggle__icon--sun"><Sun size={16}/></span>
              <span className="theme-toggle__icon theme-toggle__icon--moon"><Moon size={16}/></span>
            </button>
            <Link to="/" className="admin-topbar__view-site">View Site</Link>
          </div>
        </header>

        {/* Page content */}
        <div className="admin-content">
          <Routes>
            <Route index                    element={<AdminOverview />} />
            <Route path="orders"            element={<AdminOrders />} />
            <Route path="menu"              element={<AdminMenu />} />
            <Route path="reservations"      element={<AdminReservations />} />
            <Route path="reviews"           element={<AdminReviews />} />
            <Route path="gallery"           element={<AdminGallery />} />
            <Route path="settings"          element={<AdminSettings />} />
            <Route path="drivers"           element={<AdminDrivers />} />
            <Route path="users"             element={<AdminUsers />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
