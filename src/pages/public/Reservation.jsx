import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Calendar, Clock, Users, CheckCircle, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { createReservation } from '../../lib/supabase';
import { useSitePhotos } from '../../lib/useSitePhotos';
import './Reservation.css';

const TIME_SLOTS = [
  '11:30','12:00','12:30','13:00','13:30','14:00',
  '18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30',
];

const PARTY_SIZES = [1,2,3,4,5,6,7,8];

export default function Reservation() {
  const { photos: headerPhotos, loading: headerLoading } = useSitePhotos('reservation_header');
  const [form, setForm] = useState({
    name:'', email:'', phone:'',
    date:'', time:'', party_size:2, special_notes:'',
  });
  const { user } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  // Pre-fill form with user data if signed in
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: f.name || user.user_metadata?.full_name || '',
        email: f.email || user.email || '',
      }));
    }
  }, [user]);

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await createReservation(form);
      if (error) throw error;
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error('Reservation failed. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="reservation-page">
      {/* Hero */}
      <div className="page-hero">
        <div
          className={`page-hero__bg ${headerLoading ? 'page-hero__bg--loading' : ''}`}
          style={headerLoading ? undefined : { backgroundImage: `url(${headerPhotos[0]?.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80'})` }}
        />
        <div className="page-hero__overlay" />
        <div className="container page-hero__content">
          <span className="section-label" style={{ color: '#E8A84A' }}>Dining Experience</span>
          <h1 className="page-hero__title">Book a Table</h1>
          <p className="page-hero__sub">Reserve your spot for an unforgettable Burmese dining experience</p>
        </div>
      </div>

      <div className="container reservation-page__body">
        {success ? (
          <div className="reservation-success">
            <div className="reservation-success__icon">
              <CheckCircle size={56} />
            </div>
            <h2>Reservation Confirmed!</h2>
            <p>
              Thank you, <strong>{form.name}</strong>. We've received your reservation for{' '}
              <strong>{form.party_size} guest{form.party_size > 1 ? 's' : ''}</strong> on{' '}
              <strong>{form.date}</strong> at <strong>{form.time}</strong>.
            </p>
            <p className="reservation-success__sub">
              A confirmation will be sent to <strong>{form.email}</strong>. 
              We look forward to welcoming you!
            </p>
            <button className="btn btn-primary" onClick={() => { setSuccess(false); setForm({ name:'',email:'',phone:'',date:'',time:'',party_size:2,special_notes:'' }); }}>
              Make Another Reservation
            </button>
          </div>
        ) : (
          <div className="reservation-layout">
            {/* Left: Info */}
            <div className="reservation-info">
              <span className="section-label">Details</span>
              <h2 className="section-title">Reserve Your<br /><em>Dining Experience</em></h2>
              <p className="section-subtitle">
                Join us for an authentic Burmese feast. Our warm, intimate space welcomes 
                groups of all sizes — from romantic dinners to family celebrations.
              </p>

              <div className="reservation-info__items">
                <div className="reservation-info__item">
                  <Clock size={18} />
                  <div>
                    <strong>Opening Hours</strong>
                    <p>Mon–Fri: 11:30 – 22:00</p>
                    <p>Sat: 11:00 – 23:00</p>
                    <p>Sun: 11:00 – 21:00</p>
                  </div>
                </div>
                <div className="reservation-info__item">
                  <Users size={18} />
                  <div>
                    <strong>Large Groups</strong>
                    <p>For parties of 9+, please call us directly for special arrangements.</p>
                  </div>
                </div>
                <div className="reservation-info__item">
                  <Calendar size={18} />
                  <div>
                    <strong>Cancellation Policy</strong>
                    <p>Cancel up to 2 hours before your reservation at no charge.</p>
                  </div>
                </div>
              </div>

              <div className="reservation-info__img">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&q=80"
                  alt="Restaurant interior"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right: Form */}
            <div className="reservation-form-wrap">
              <div className="reservation-form-card">
                <div className="reservation-form-card__header">
                  <h3>Your Reservation</h3>
                  <p>Fill in the details below and we'll confirm your table</p>
                  {!user && (
                    <div className="reservation-signin-hint">
                      <LogIn size={14} />
                      <span>
                        <Link to="/auth">Sign in</Link> to auto-fill your details
                      </span>
                    </div>
                  )}
                </div>
                <form className="reservation-form" onSubmit={handleSubmit}>
                  <div className="reservation-form__row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input required className="form-input" placeholder="Your full name"
                        value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input type="tel" className="form-input" placeholder="+66..."
                        value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input required type="email" className="form-input" placeholder="your@email.com"
                      value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>

                  <div className="reservation-form__row">
                    <div className="form-group">
                      <label>Date *</label>
                      <input required type="date" className="form-input"
                        min={today}
                        value={form.date} onChange={e => set('date', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Party Size *</label>
                      <select required className="form-input"
                        value={form.party_size} onChange={e => set('party_size', parseInt(e.target.value))}>
                        {PARTY_SIZES.map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="form-group">
                    <label>Preferred Time *</label>
                    <div className="time-slots">
                      {TIME_SLOTS.map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`time-slot ${form.time === t ? 'time-slot--active' : ''}`}
                          onClick={() => set('time', t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {!form.time && <p className="time-slots__hint">Please select a time</p>}
                  </div>

                  <div className="form-group">
                    <label>Special Requests</label>
                    <textarea className="form-input" placeholder="Allergies, dietary needs, special occasions..."
                      value={form.special_notes} onChange={e => set('special_notes', e.target.value)} />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary reservation-submit"
                    disabled={loading || !form.time}
                  >
                    {loading ? 'Confirming...' : 'Confirm Reservation →'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
