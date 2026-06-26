import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, EyeOff, LogIn, UserPlus, Phone, MapPin,
  CheckCircle, Gift, CalendarDays, UtensilsCrossed, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { signIn, signUp } from '../../lib/supabase';
import { useCart } from '../../lib/CartContext';
import './Auth.css';

const BENEFITS = [
  { icon: <CalendarDays size={16} />, text: 'Easy table reservations' },
  { icon: <UtensilsCrossed size={16} />, text: 'Track your order history' },
  { icon: <Star size={16} />, text: 'Leave reviews & earn rewards' },
  { icon: <Gift size={16} />, text: 'Exclusive member offers & discounts' },
];

export default function Auth() {
  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [form, setForm]       = useState({
    fullName: '', email: '', phone: '', password: '', confirm: '', agreeTerms: false
  });
  const navigate = useNavigate();
  const { dispatch: cartDispatch, cart } = useCart();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Password strength ────────────────────────────────────────────────────
  const pwdStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { level: 1, label: 'Weak',   color: '#e74c3c' },
      { level: 2, label: 'Fair',   color: '#f39c12' },
      { level: 3, label: 'Good',   color: '#2ecc71' },
      { level: 4, label: 'Strong', color: '#27ae60' },
    ];
    return levels[Math.min(score, 4) - 1] || { level: 0, label: '', color: '' };
  };
  const strength = pwdStrength(form.password);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) { toast.error(error.message); return; }

    const u = data.user;
    const role = u?.user_metadata?.role;
    const adminEmails = [
      'hlaingphonemyint20@gmail.com',
      ...(import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
    ];

    if (adminEmails.includes(u.email)) {
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } else if (role === 'driver') {
      toast.success(`Welcome, ${u.user_metadata?.full_name || 'Driver'}!`);
      navigate('/driver');
    } else {
      // Merge any guest cart items
      if (cart.items.length > 0) {
        cartDispatch({ type: 'MERGE_ITEMS', items: cart.items });
      }
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error('Please enter your full name.'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (!form.agreeTerms) { toast.error('Please agree to the Terms & Privacy Policy.'); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, { phone: form.phone });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Account created! Please check your email to confirm.');
    setMode('login');
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg" />
      <div className="auth-page__overlay" />

      <div className="auth-container">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <img src="/logo.png" alt="BurmeseBites" className="auth-logo__img" />
        </Link>

        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
              onClick={() => setMode('login')}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
              onClick={() => setMode('signup')}
            >
              <UserPlus size={15} /> Create Account
            </button>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-form__header">
                <h2>Welcome Back</h2>
                <p>Sign in to your BurmeseBites account</p>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" className="form-input"
                  placeholder="your@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="auth-form__pwd">
                  <input required className="form-input"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Your password"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" className="auth-form__pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Signing in…' : <><LogIn size={16} /> Sign In</>}
              </button>
              <p className="auth-form__switch">
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')}>Create one →</button>
              </p>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === 'signup' && (
            <form className="auth-form auth-form--signup" onSubmit={handleSignup}>
              <div className="auth-form__header">
                <h2>Create Your Account</h2>
                <p>Join BurmeseBites and enjoy exclusive member benefits</p>
              </div>

              {/* Benefits strip */}
              <div className="auth-benefits">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="auth-benefit">
                    <span className="auth-benefit__icon">{b.icon}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label>Full Name <span className="auth-required">*</span></label>
                <input required className="form-input" placeholder="e.g. Hlaing Phone Myint"
                  value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>Email Address <span className="auth-required">*</span></label>
                <input required type="email" className="form-input" placeholder="your@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
                <span className="auth-field-hint">We'll send your reservation confirmations here</span>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label>
                  <Phone size={13} style={{ verticalAlign:'middle', marginRight:4 }} />
                  Phone Number <span className="auth-optional">(optional)</span>
                </label>
                <input className="form-input" type="tel" placeholder="e.g. +66 81 234 5678"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
                <span className="auth-field-hint">For reservation reminders via SMS</span>
              </div>

              {/* Password */}
              <div className="form-group">
                <label>Password <span className="auth-required">*</span></label>
                <div className="auth-form__pwd">
                  <input required className="form-input"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" className="auth-form__pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div className="auth-pwd-strength">
                    <div className="auth-pwd-strength__bar">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="auth-pwd-strength__segment"
                          style={{ background: n <= strength.level ? strength.color : 'var(--border)' }} />
                      ))}
                    </div>
                    <span style={{ color: strength.color, fontSize:11, fontWeight:600 }}>{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label>Confirm Password <span className="auth-required">*</span></label>
                <div className="auth-form__pwd">
                  <input required className="form-input"
                    type={showCfm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirm} onChange={e => set('confirm', e.target.value)} />
                  <button type="button" className="auth-form__pwd-toggle" onClick={() => setShowCfm(v => !v)}>
                    {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirm.length > 0 && (
                  <span style={{ fontSize:11, color: form.password === form.confirm ? '#27ae60' : '#e74c3c', display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                    {form.password === form.confirm
                      ? <><CheckCircle size={11} /> Passwords match</>
                      : '✗ Passwords do not match'}
                  </span>
                )}
              </div>

              {/* Terms */}
              <label className="auth-terms">
                <input type="checkbox" checked={form.agreeTerms}
                  onChange={e => set('agreeTerms', e.target.checked)} />
                <span>
                  I agree to the{' '}
                  <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
                </span>
              </label>

              <button type="submit" className="btn btn-jade auth-submit" disabled={loading}>
                {loading ? 'Creating account…' : <><UserPlus size={16} /> Create Account</>}
              </button>

              <p className="auth-form__switch">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')}>Sign in →</button>
              </p>
            </form>
          )}
        </div>

        <Link to="/" className="auth-back">← Back to restaurant</Link>
      </div>
    </div>
  );
}
