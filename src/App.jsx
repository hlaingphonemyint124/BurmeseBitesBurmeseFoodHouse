import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { CartProvider }             from './lib/CartContext';
import { AuthProvider }             from './lib/AuthContext';
import { ThemeProvider, useTheme }  from './lib/ThemeContext';
import { useAuth }                  from './lib/AuthContext';
import { usePageTransition }        from './lib/usePageTransition';
import Navbar                       from './components/layout/Navbar';
import Footer                       from './components/layout/Footer';
import CartSidebar                  from './components/shared/CartSidebar';
import PageLoader                   from './components/shared/PageLoader';

// Home loads eagerly — it's the most common landing page, so there's no
// benefit to a lazy chunk + loading flash for the first thing most visitors see.
import Home from './pages/public/Home';

// Everything else is code-split: each page only downloads its own JS when
// the visitor actually navigates there, instead of every visitor paying for
// the full Admin panel + Driver dashboard + Auth + Profile bundle up front.
const Menu            = React.lazy(() => import('./pages/public/Menu'));
const Gallery         = React.lazy(() => import('./pages/public/Gallery'));
const Reservation     = React.lazy(() => import('./pages/public/Reservation'));
const Reviews         = React.lazy(() => import('./pages/public/Reviews'));
const Auth            = React.lazy(() => import('./pages/public/Auth'));
const Profile         = React.lazy(() => import('./pages/public/Profile'));
const Admin           = React.lazy(() => import('./pages/admin/Admin'));
const DriverDashboard = React.lazy(() => import('./pages/driver/DriverDashboard'));

import AnimatedBackground from './components/layout/AnimatedBackground';

/* ── Themed toaster ── */
function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: isDark ? '#1E1A14' : '#FAF6EE',
          color:      isDark ? '#F5F0E8' : '#1E1A14',
          border:     isDark ? '1px solid rgba(232,168,74,0.3)' : '1px solid #E8A84A',
          fontFamily: 'var(--font-body)',
          zIndex:     9999,
        },
        iconTheme: { primary: '#C27A2A', secondary: isDark ? '#1E1A14' : '#fff' },
      }}
    />
  );
}

/* ── Guard: redirect driver away from customer site ── */
function DriverGuard({ children }) {
  const { isDriver, loading } = useAuth();
  if (loading) return null;
  if (isDriver) return <Navigate to="/driver" replace />;
  return children;
}

/* ── Page transition wrapper ── */
function AnimatedRoutes() {
  const { displayLocation, transitionStage, onAnimationEnd } = usePageTransition();

  return (
    <div
      className={`page-transition page-transition--${transitionStage}`}
      onAnimationEnd={onAnimationEnd}
    >
      <Routes location={displayLocation}>
        <Route path="/"           element={<DriverGuard><Home /></DriverGuard>} />
        <Route path="/menu"       element={<DriverGuard><Suspense fallback={<PageLoader />}><Menu /></Suspense></DriverGuard>} />
        <Route path="/gallery"    element={<DriverGuard><Suspense fallback={<PageLoader />}><Gallery /></Suspense></DriverGuard>} />
        <Route path="/reservation" element={<DriverGuard><Suspense fallback={<PageLoader />}><Reservation /></Suspense></DriverGuard>} />
        <Route path="/reviews"    element={<DriverGuard><Suspense fallback={<PageLoader />}><Reviews /></Suspense></DriverGuard>} />
        <Route path="/profile/*"  element={<DriverGuard><Suspense fallback={<PageLoader />}><Profile /></Suspense></DriverGuard>} />
        <Route path="*" element={
          <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 52 }}>🍜</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Page Not Found</h2>
            <p style={{ color: 'var(--text-muted)' }}>The page you're looking for doesn't exist.</p>
            <a href="/" className="btn btn-primary">Back to Home</a>
          </div>
        } />
      </Routes>
    </div>
  );
}

/* ── Public layout (navbar + footer + cart) ── */
function PublicLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      {/* Cart sits at highest z-index, above canvas and navbar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      <main id="main-content">
        <AnimatedRoutes />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AnimatedBackground />
            <Routes>
              <Route path="/auth"    element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
              <Route path="/admin/*" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
              <Route path="/driver"  element={<Suspense fallback={<PageLoader />}><DriverDashboard /></Suspense>} />
              <Route path="/*"       element={<PublicLayout />} />
            </Routes>
            <ThemedToaster />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
