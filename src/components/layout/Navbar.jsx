import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Menu, X, LogIn, LogOut, LayoutDashboard,
  User, Settings, ChevronDown, Home, UtensilsCrossed,
  Images, CalendarDays, BookOpen, Star, Shield, Sun, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../lib/CartContext';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { signOut } from '../../lib/supabase';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',            label: 'Home'      },
  { to: '/menu',        label: 'Menu'      },
  { to: '/gallery',     label: 'Gallery'   },
  { to: '/reservation', label: 'Reserve'   },
  { to: '/about',       label: 'Our Story' },
  { to: '/reviews',     label: 'Reviews'   },
];

const MOBILE_NAV = [
  { to: '/',            icon: <Home size={18}/>,            label: 'Home'           },
  { to: '/menu',        icon: <UtensilsCrossed size={18}/>, label: 'Menu'           },
  { to: '/gallery',     icon: <Images size={18}/>,          label: 'Gallery'        },
  { to: '/reservation', icon: <CalendarDays size={18}/>,    label: 'Reserve a Table'},
  { to: '/about',       icon: <BookOpen size={18}/>,        label: 'Our Story'      },
  { to: '/reviews',     icon: <Star size={18}/>,            label: 'Reviews'        },
];

const ADMIN_NAV = [
  { to: '/admin',              icon: <LayoutDashboard size={18}/>, label: 'Dashboard Overview' },
  { to: '/admin/menu',         icon: <UtensilsCrossed size={18}/>, label: 'Manage Menu'        },
  { to: '/admin/reservations', icon: <CalendarDays size={18}/>,    label: 'Reservations'       },
  { to: '/admin/reviews',      icon: <Star size={18}/>,            label: 'Reviews'            },
  { to: '/admin/gallery',      icon: <Images size={18}/>,          label: 'Gallery'            },
];

export default function Navbar({ onCartOpen }) {
  const { totalItems }            = useCart();
  const { user, isAdmin, isDriver } = useAuth();
  const { toggle: toggleTheme, isDark } = useTheme();
  const [scrolled, setScrolled]   = useState(false);
  const [shrunk,  setShrunk]    = useState(false);
  const [sideNav, setSideNav]     = useState(false);
  const [profileOpen, setProfile] = useState(false);
  const { pathname }              = useLocation();
  const navigate                  = useNavigate();
  const profileRef                = useRef(null);

  /* Scroll listener */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setShrunk(window.scrollY > 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Lock body scroll when side nav is open */
  useEffect(() => {
    if (sideNav) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [sideNav]);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Close everything on route change */
  useEffect(() => {
    setSideNav(false);
    setProfile(false);
  }, [pathname]);

  /* Keyboard: close sidenav on Escape */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setSideNav(false); setProfile(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    setProfile(false);
    setSideNav(false);
    navigate('/');
  };

  const openSideNav = () => setSideNav(true);
  const closeSideNav = () => setSideNav(false);

  const isHome = pathname === '/';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';

  return (
    <>
      <nav className={`navbar ${scrolled || !isHome ? 'navbar--solid' : ''} ${shrunk ? 'navbar--shrunk' : ''}`}>
        <div className="navbar__inner">

          {/* Logo */}
          <Link to="/" className="navbar__logo" aria-label="Burmese Bites — Home">
            <img src="/logo.png" alt="" className="navbar__logo-img" />
            <div className="navbar__logo-text">
              <span className="navbar__logo-main">Burmese Bites</span>
              <span className="navbar__logo-sub">Authentic Myanmar Cuisine</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <ul className="navbar__links" role="list">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`navbar__link ${pathname === to ? 'navbar__link--active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="navbar__actions">

            {/* Cart */}
            {user && !isAdmin && (
              <button
                className="navbar__cart"
                onClick={onCartOpen}
                aria-label={`Open cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}
              >
                <ShoppingCart size={19} />
                {totalItems > 0 && (
                  <span className="navbar__cart-badge" aria-hidden="true">{totalItems}</span>
                )}
              </button>
            )}

            {/* Auth / Profile */}
            {!user ? (
              <Link to="/auth" className="navbar__login">
                <LogIn size={15} /> Sign In
              </Link>
            ) : (
              <div className="navbar__profile" ref={profileRef}>
                <button
                  className="navbar__profile-btn"
                  onClick={() => setProfile(v => !v)}
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                >
                  <div className="navbar__avatar" aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="navbar__profile-name">{displayName}</span>
                  <ChevronDown
                    size={13}
                    className={`navbar__chevron ${profileOpen ? 'navbar__chevron--up' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {profileOpen && (
                  <div className="navbar__dropdown" role="menu">
                    <div className="navbar__dropdown-header">
                      <div className="navbar__dropdown-avatar" aria-hidden="true">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="navbar__dropdown-name">{displayName}</p>
                        <p className="navbar__dropdown-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    <Link to="/profile" className="navbar__dropdown-item" role="menuitem">
                      <User size={15} /> My Profile
                    </Link>
                    <Link to="/profile/reservations" className="navbar__dropdown-item" role="menuitem">
                      <CalendarDays size={15} /> My Reservations
                    </Link>
                    <Link to="/profile/settings" className="navbar__dropdown-item" role="menuitem">
                      <Settings size={15} /> Account Settings
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="navbar__dropdown-divider" />
                        <Link to="/admin" className="navbar__dropdown-item navbar__dropdown-item--admin" role="menuitem">
                          <Shield size={15} /> Admin Dashboard
                        </Link>
                      </>
                    )}
                    {isDriver && !isAdmin && (
                      <>
                        <div className="navbar__dropdown-divider" />
                        <Link to="/driver" className="navbar__dropdown-item navbar__dropdown-item--admin" role="menuitem">
                          <Shield size={15} /> Driver Dashboard
                        </Link>
                      </>
                    )}
                    <div className="navbar__dropdown-divider" />
                    <button
                      className="navbar__dropdown-item navbar__dropdown-item--logout"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="theme-toggle__icon theme-toggle__icon--sun"><Sun size={17}/></span>
              <span className="theme-toggle__icon theme-toggle__icon--moon"><Moon size={17}/></span>
            </button>

            {/* Hamburger — mobile/tablet only (CSS: display:none on desktop) */}
            <button
              className="navbar__hamburger"
              onClick={openSideNav}
              aria-label="Open navigation menu"
              aria-expanded={sideNav}
            >
              <Menu size={20} />
            </button>

          </div>
        </div>
      </nav>

      {/* ── Overlay ── */}
      {sideNav && (
        <div
          className="sidenav-overlay"
          onClick={closeSideNav}
          aria-hidden="true"
        />
      )}

      {/* ── Side Navigation (right drawer) ── */}
      <aside
        className={`sidenav ${sideNav ? 'sidenav--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="sidenav__header">
          <Link to="/" className="sidenav__logo" onClick={closeSideNav}>
            <img src="/logo.png" alt="" className="sidenav__logo-img" />
            <div>
              <p className="sidenav__logo-main">Burmese Bites</p>
              <p className="sidenav__logo-sub">Authentic Myanmar Cuisine</p>
            </div>
          </Link>
          <button className="sidenav__close" onClick={closeSideNav} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <div className="sidenav__body">
          <p className="sidenav__section-label">Navigation</p>
          <nav className="sidenav__nav">
            {MOBILE_NAV.map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`sidenav__link ${pathname === to ? 'sidenav__link--active' : ''}`}
                onClick={closeSideNav}
              >
                {icon} <span>{label}</span>
              </Link>
            ))}
          </nav>

          {isAdmin && (
            <>
              <p className="sidenav__section-label" style={{ marginTop: 24 }}>Admin</p>
              <nav className="sidenav__nav">
                {ADMIN_NAV.map(({ to, icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`sidenav__link sidenav__link--admin ${
                      pathname === to || pathname.startsWith(to + '/') ? 'sidenav__link--active' : ''
                    }`}
                    onClick={closeSideNav}
                  >
                    {icon} <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sidenav__footer">
          {user ? (
            <div className="sidenav__user">
              <div className="sidenav__user-avatar" aria-hidden="true">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="sidenav__user-info">
                <p>{displayName}</p>
                <span>{user.email}</span>
              </div>
              <button className="sidenav__logout" onClick={handleLogout} aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="btn btn-primary sidenav__signin"
              onClick={closeSideNav}
            >
              <LogIn size={15} /> Sign In / Register
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
