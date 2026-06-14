import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { CartProvider }       from './lib/CartContext';
import { AuthProvider }       from './lib/AuthContext';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import { useAuth }            from './lib/AuthContext';
import Navbar                 from './components/layout/Navbar';
import Footer                 from './components/layout/Footer';
import CartSidebar            from './components/shared/CartSidebar';

import Home        from './pages/public/Home';
import Menu        from './pages/public/Menu';
import Gallery     from './pages/public/Gallery';
import Reservation from './pages/public/Reservation';
import About       from './pages/public/About';
import Reviews     from './pages/public/Reviews';
import Auth        from './pages/public/Auth';
import Profile     from './pages/public/Profile';
import Admin       from './pages/admin/Admin';
import DriverDashboard from './pages/driver/DriverDashboard';
import AnimatedBackground from './components/layout/AnimatedBackground';

/* ── Themed toaster ── */
function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster position="bottom-right" toastOptions={{
      style: {
        background: isDark ? '#1E1A14' : '#FAF6EE',
        color:      isDark ? '#F5F0E8' : '#1E1A14',
        border:     isDark ? '1px solid rgba(232,168,74,0.3)' : '1px solid #E8A84A',
        fontFamily: 'var(--font-body)',
      },
      iconTheme: { primary:'#C27A2A', secondary: isDark ? '#1E1A14' : '#fff' },
    }}/>
  );
}

/* ── Guard: redirect driver away from customer site ── */
function DriverGuard({ children }) {
  const { isDriver, loading } = useAuth();
  if (loading) return null;
  if (isDriver) return <Navigate to="/driver" replace/>;
  return children;
}

/* ── Public pages wrapper (navbar + footer) ── */
function PublicLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)}/>
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)}/>
      <main>
        <Routes>
          <Route path="/"  element={<DriverGuard><Home/></DriverGuard>}/>
          <Route path="/menu"        element={<DriverGuard><Menu/></DriverGuard>}/>
          <Route path="/gallery"     element={<DriverGuard><Gallery/></DriverGuard>}/>
          <Route path="/reservation" element={<DriverGuard><Reservation/></DriverGuard>}/>
          <Route path="/about"       element={<DriverGuard><About/></DriverGuard>}/>
          <Route path="/reviews"     element={<DriverGuard><Reviews/></DriverGuard>}/>
          <Route path="/profile/*"   element={<DriverGuard><Profile/></DriverGuard>}/>
          <Route path="*" element={
            <div style={{minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,textAlign:'center',padding:'40px 24px'}}>
              <div style={{fontSize:52}}>🍜</div>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:28}}>Page Not Found</h2>
              <p style={{color:'var(--text-muted)'}}>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary">Back to Home</a>
            </div>
          }/>
        </Routes>
      </main>
      <Footer/>
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
              <Route path="/auth"    element={<Auth/>}/>
              <Route path="/admin/*" element={<Admin/>}/>
              <Route path="/driver"  element={<DriverDashboard/>}/>
              <Route path="/*"       element={<PublicLayout/>}/>
            </Routes>
            <ThemedToaster/>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
