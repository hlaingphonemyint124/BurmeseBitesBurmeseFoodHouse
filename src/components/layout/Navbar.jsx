import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Menu, X, LogIn, LogOut, LayoutDashboard,
  User, Settings, ChevronDown, Home, UtensilsCrossed,
  Images, CalendarDays, BookOpen, Star, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../lib/CartContext';
import { useAuth } from '../../lib/AuthContext';
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

export default function Navbar({ onCartOpen }) {
  const { totalItems }            = useCart();
  const { user, isAdmin }         = useAuth();
  const [scrolled, setScrolled]   = useState(false);
  const [sideNav, setSideNav]     = useState(false);
  const [profileOpen, setProfile] = useState(false);
  const { pathname }              = useLocation();
  const navigate                  = useNavigate();
  const profileRef                = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close side nav on route change
  useEffect(() => { setSideNav(false); setProfile(false); }, [pathname]);

  const handleLogout = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    setProfile(false);
    setSideNav(false);
    navigate('/');
  };

  const isHome = pathname === '/';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';

  return (
    <>
      <nav className={`navbar ${scrolled || !isHome ? 'navbar--solid' : ''}`}>
        <div className="navbar__inner">

          {/* Hamburger — opens side nav */}
          <button
            className="navbar__hamburger"
            onClick={() => setSideNav(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo — always goes home */}
          <Link to="/" className="navbar__logo">
            <img src="/logo.png" alt="BurmeseBites" className="navbar__logo-img" />
            <div className="navbar__logo-text">
              <span className="navbar__logo-main">Burmese Bites</span>
              <span className="navbar__logo-sub">Authentic Myanmar Cuisine</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <ul className="navbar__links">
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
            <button className="navbar__cart" onClick={onCartOpen} aria-label="Open cart">
              <ShoppingCart size={20} />
              {totalItems > 0 && <span className="navbar__cart-badge">{totalItems}</span>}
            </button>

            {/* Auth */}
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
                >
                  <div className="navbar__avatar">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="navbar__profile-name">{displayName}</span>
                  <ChevronDown size={14} className={`navbar__chevron ${profileOpen ? 'navbar__chevron--up' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="navbar__dropdown">
                    <div className="navbar__dropdown-header">
                      <div className="navbar__dropdown-avatar">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="navbar__dropdown-name">{displayName}</p>
                        <p className="navbar__dropdown-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    <Link to="/profile" className="navbar__dropdown-item">
                      <User size={15} /> My Profile
                    </Link>
                    <Link to="/profile/orders" className="navbar__dropdown-item">
                      <ShoppingCart size={15} /> My Orders
                    </Link>
                    <Link to="/profile/reservations" className="navbar__dropdown-item">
                      <CalendarDays size={15} /> My Reservations
                    </Link>
                    <Link to="/profile/settings" className="navbar__dropdown-item">
                      <Settings size={15} /> Account Settings
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="navbar__dropdown-divider" />
                        <Link to="/admin" className="navbar__dropdown-item navbar__dropdown-item--admin">
                          <Shield size={15} /> Admin Dashboard
                        </Link>
                      </>
                    )}
                    <div className="navbar__dropdown-divider" />
                    <button className="navbar__dropdown-item navbar__dropdown-item--logout" onClick={handleLogout}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Side Navigation Drawer ── */}
      {sideNav && <div className="sidenav-overlay" onClick={() => setSideNav(false)} />}
      <aside className={`sidenav ${sideNav ? 'sidenav--open' : ''}`}>
        <div className="sidenav__header">
          <Link to="/" className="sidenav__logo" onClick={() => setSideNav(false)}>
            <img src="/logo.png" alt="BurmeseBites" className="sidenav__logo-img" />
          </Link>
          <button className="sidenav__close" onClick={() => setSideNav(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sidenav__body">
          <p className="sidenav__section-label">Navigation</p>
          <nav className="sidenav__nav">
            {[
              { to:'/',            icon:<Home size={17}/>,           label:'Home'      },
              { to:'/menu',        icon:<UtensilsCrossed size={17}/>, label:'Menu'      },
              { to:'/gallery',     icon:<Images size={17}/>,          label:'Gallery'   },
              { to:'/reservation', icon:<CalendarDays size={17}/>,    label:'Reserve a Table' },
              { to:'/about',       icon:<BookOpen size={17}/>,        label:'Our Story' },
              { to:'/reviews',     icon:<Star size={17}/>,            label:'Reviews'   },
            ].map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`sidenav__link ${pathname === to ? 'sidenav__link--active' : ''}`}
                onClick={() => setSideNav(false)}
              >
                {icon} <span>{label}</span>
              </Link>
            ))}
          </nav>

          {isAdmin && (
            <>
              <p className="sidenav__section-label" style={{ marginTop: 24 }}>Admin</p>
              <nav className="sidenav__nav">
                {[
                  { to:'/admin',              icon:<LayoutDashboard size={17}/>, label:'Dashboard Overview' },
                  { to:'/admin/menu',         icon:<UtensilsCrossed size={17}/>, label:'Manage Menu'        },
                  { to:'/admin/reservations', icon:<CalendarDays size={17}/>,    label:'Reservations'       },
                  { to:'/admin/orders',       icon:<ShoppingCart size={17}/>,    label:'Orders'             },
                  { to:'/admin/reviews',      icon:<Star size={17}/>,            label:'Reviews'            },
                  { to:'/admin/gallery',      icon:<Images size={17}/>,          label:'Gallery'            },
                ].map(({ to, icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`sidenav__link sidenav__link--admin ${pathname === to || pathname.startsWith(to+'/') ? 'sidenav__link--active' : ''}`}
                    onClick={() => setSideNav(false)}
                  >
                    {icon} <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </>
          )}
        </div>

        <div className="sidenav__footer">
          {user ? (
            <div className="sidenav__user">
              <div className="sidenav__user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="sidenav__user-info">
                <p>{displayName}</p>
                <span>{user.email}</span>
              </div>
              <button className="sidenav__logout" onClick={handleLogout} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary sidenav__signin" onClick={() => setSideNav(false)}>
              <LogIn size={15} /> Sign In / Register
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
