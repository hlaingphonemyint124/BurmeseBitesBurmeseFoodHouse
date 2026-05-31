import React, { useState, useEffect } from 'react';
import { Star, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReviews, createReview } from '../../lib/supabase';
import './Reviews.css';

const FALLBACK_REVIEWS = [
  { id:'r1', name:'Sarah M.', rating:5, comment:'The Ohn No Khao Swe was absolutely incredible — rich coconut broth and so much depth. Feels like a trip to Yangon. Will be back next week!', created_at: new Date().toISOString() },
  { id:'r2', name:'James T.', rating:5, comment:'Laphet Thoke changed my life. I had never tried tea leaf salad before and now I crave it constantly. Truly unique and the service was warm and attentive.', created_at: new Date().toISOString() },
  { id:'r3', name:'Priya K.', rating:4, comment:'Beautiful atmosphere and really authentic flavors. The samusa thoke was outstanding. Loved the attention to detail in every dish.', created_at: new Date().toISOString() },
  { id:'r4', name:'David L.', rating:5, comment:'Best Burmese food outside of Myanmar. The mohinga is soul-warming perfection and the dessert selection is lovely. Highly recommend the shwe yin aye.', created_at: new Date().toISOString() },
  { id:'r5', name:'Emma R.', rating:4, comment:'Such a gem of a restaurant. The lamb curry was melt-in-your-mouth tender and the staff were so knowledgeable about the dishes. Great vegetarian options too.', created_at: new Date().toISOString() },
];

function StarRating({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-picker">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`star-picker__btn ${n <= (hover || value) ? 'star-picker__btn--on' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star size={size} fill={n <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]         = useState({ name:'', rating:0, comment:'' });

  useEffect(() => {
    getReviews().then(({ data }) => {
      setReviews(data && data.length > 0 ? data : FALLBACK_REVIEWS);
      setLoading(false);
    });
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const ratingBreakdown = [5,4,3,2,1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
    pct:   reviews.length ? Math.round(reviews.filter(r => r.rating === n).length / reviews.length * 100) : 0,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) { toast.error('Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      const { error } = await createReview(form);
      if (error) throw error;
      setSubmitted(true);
      toast.success('Thank you for your review!', {
        style: { background: '#FAF6EE', color: '#1E1A14', border: '1px solid #E8A84A' },
      });
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (n, size = 16) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={size}
        fill={i < n ? 'currentColor' : 'none'}
        className={i < n ? 'star-filled' : 'star-empty'}
      />
    ));

  return (
    <div className="reviews-page">
      {/* Hero */}
      <div className="page-hero">
        <div className="page-hero__bg" style={{ backgroundImage:`url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80)` }} />
        <div className="page-hero__overlay" />
        <div className="container page-hero__content">
          <span className="section-label" style={{ color:'#E8A84A' }}>Guest Voices</span>
          <h1 className="page-hero__title">Reviews</h1>
          <p className="page-hero__sub">Hear what our guests say about their BurmeseBites experience</p>
        </div>
      </div>

      <div className="container reviews-page__body">
        {/* Rating summary */}
        <div className="reviews-summary">
          <div className="reviews-summary__score">
            <div className="reviews-summary__big">{avgRating}</div>
            <div className="stars reviews-summary__stars">
              {renderStars(Math.round(parseFloat(avgRating) || 0), 20)}
            </div>
            <p>{reviews.length} reviews</p>
          </div>
          <div className="reviews-summary__bars">
            {ratingBreakdown.map(({ n, count, pct }) => (
              <div key={n} className="reviews-summary__bar-row">
                <span className="reviews-summary__bar-label">{n} ★</span>
                <div className="reviews-summary__bar-track">
                  <div className="reviews-summary__bar-fill" style={{ width:`${pct}%` }} />
                </div>
                <span className="reviews-summary__bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews grid */}
        {loading ? <div className="spinner" /> : (
          <div className="reviews-grid">
            {reviews.map(r => (
              <div key={r.id} className="review-full-card">
                <div className="review-full-card__top">
                  <div className="review-full-card__avatar">{r.name.charAt(0)}</div>
                  <div>
                    <p className="review-full-card__name">{r.name}</p>
                    <p className="review-full-card__date">
                      {new Date(r.created_at).toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' })}
                    </p>
                  </div>
                  <div className="stars review-full-card__stars">{renderStars(r.rating)}</div>
                </div>
                <p className="review-full-card__text">"{r.comment}"</p>
              </div>
            ))}
          </div>
        )}

        {/* Submit review */}
        <div className="reviews-submit-section">
          <div className="reviews-submit-card">
            {submitted ? (
              <div className="reviews-submit-success">
                <CheckCircle size={48} />
                <h3>Thank You!</h3>
                <p>Your review has been submitted and is awaiting approval. We truly appreciate your feedback!</p>
              </div>
            ) : (
              <>
                <div className="reviews-submit-card__header">
                  <h3>Share Your Experience</h3>
                  <p>We'd love to hear about your visit to BurmeseBites</p>
                </div>
                <form className="reviews-submit-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input required className="form-input" placeholder="First name & initial"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Rating *</label>
                    <StarRating value={form.rating} onChange={r => setForm({...form, rating: r})} />
                  </div>
                  <div className="form-group">
                    <label>Your Review *</label>
                    <textarea required className="form-input" placeholder="Tell us about your experience..."
                      style={{ minHeight:'120px' }}
                      value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Send size={15} />
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
