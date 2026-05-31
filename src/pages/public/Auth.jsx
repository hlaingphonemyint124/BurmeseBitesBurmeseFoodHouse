import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, UserPlus, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { signIn, signUp } from '../../lib/supabase';
import './Auth.css';

export default function Auth() {
  const [mode, setMode]         = useState('login'); // 'login' | 'signup'
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [form, setForm]         = useState({ fullName:'', email:'', password:'', confirm:'' });
  const navigate                = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Welcome back!`);
    // redirect admins to dashboard
    const adminEmails = ['admin@burmesebitesrestaurant.com', 'hlaingphonemyint@gmail.com'];
    if (adminEmails.includes(data.user.email)) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName);
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
          <span>🍜</span>
          <div>
            <div className="auth-logo__main">BurmeseBites</div>
            <div className="auth-logo__sub">Authentic Myanmar Cuisine</div>
          </div>
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

          {/* Login Form */}
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
                {loading ? 'Signing in...' : <><LogIn size={16} /> Sign In</>}
              </button>
              <p className="auth-form__switch">
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')}>Create one →</button>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form className="auth-form" onSubmit={handleSignup}>
              <div className="auth-form__header">
                <h2>Create Account</h2>
                <p>Join BurmeseBites and enjoy exclusive benefits</p>
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input required className="form-input" placeholder="Your full name"
                  value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" className="form-input" placeholder="your@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="auth-form__pwd">
                  <input required className="form-input"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" className="auth-form__pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input required className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} />
              </div>
              <button type="submit" className="btn btn-jade auth-submit" disabled={loading}>
                {loading ? 'Creating...' : <><UserPlus size={16} /> Create Account</>}
              </button>
              <p className="auth-form__switch">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')}>Sign in →</button>
              </p>
            </form>
          )}
        </div>

        <Link to="/" className="auth-back">
          ← Back to restaurant
        </Link>
      </div>
    </div>
  );
}
