import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { CartProvider }  from './lib/CartContext';
import { AuthProvider }  from './lib/AuthContext';
import Navbar            from './components/layout/Navbar';
import Footer            from './components/layout/Footer';
import CartSidebar       from './components/shared/CartSidebar';

import Home        from './pages/public/Home';
import Menu        from './pages/public/Menu';
import Gallery     from './pages/public/Gallery';
import Reservation from './pages/public/Reservation';
import About       from './pages/public/About';
import Reviews     from './pages/public/Reviews';
import Auth        from './pages/public/Auth';
import Profile     from './pages/public/Profile';
import Admin       from './pages/admin/Admin';


function PublicLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <Routes>
          <Route path="/"            element={<Home />}        />
          <Route path="/menu"        element={<Menu />}        />
          <Route path="/gallery"     element={<Gallery />}     />
          <Route path="/reservation" element={<Reservation />} />
          <Route path="/about"       element={<About />}       />
          <Route path="/reviews"     element={<Reviews />}     />
          <Route path="/profile/*"   element={<Profile />}     />
          <Route path="*" element={
            <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, textAlign:'center', padding:'40px 24px' }}>
              <div style={{ fontSize:56 }}>🍜</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:28 }}>Page Not Found</h2>
              <p style={{ color:'var(--text-muted)' }}>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary">Back to Home</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Auth — no navbar/footer */}
            <Route path="/auth" element={<Auth />} />
            {/* Admin — its own full-screen layout */}
            <Route path="/admin/*" element={<Admin />} />
            {/* Public site */}
            <Route path="/*" element={<PublicLayout />} />
          </Routes>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background:'#FAF6EE', color:'#1E1A14', border:'1px solid #E8A84A', fontFamily:'var(--font-body)' },
              iconTheme: { primary:'#C27A2A', secondary:'#fff' },
            }}
          />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
