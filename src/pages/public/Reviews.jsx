import React, { useState, useEffect } from 'react';
import { Star, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReviews, createReview } from '../../lib/supabase';
import { useSitePhotos } from '../../lib/useSitePhotos';
import './Reviews.css';

const FALLBACK_REVIEWS = [
  { id:'r1',  name:'မောင်အောင်',   rating:5, comment:'ဒီဆိုင်ရဲ့ မုန့်ဟင်းခါးက အရမ်းအရသာရှိပါတယ်။ ဟင်းရည်ကလည်း မွှေးပြီး ဝန်ဆောင်မှုလည်း အရမ်းကောင်းပါတယ်။ နောက်တစ်ခေါက်လည်း သေချာလာစားဦးမှာပါ။', created_at: new Date().toISOString() },
  { id:'r2',  name:'မခင်သန္တာ',    rating:5, comment:'မိသားစုနဲ့လာစားခဲ့တာ အရမ်းကျေနပ်ပါတယ်။ စားစရာတွေက လတ်ဆတ်ပြီး ဈေးနှုန်းလည်း သင့်တင့်ပါတယ်။', created_at: new Date().toISOString() },
  { id:'r3',  name:'ကိုမင်းသူ',    rating:5, comment:'ရှမ်းခေါက်ဆွဲနဲ့ လက်ဖက်သုပ်ကို အရမ်းကြိုက်ပါတယ်။ အရသာက မူရင်းမြန်မာအရသာကို အပြည့်အဝခံစားရပါတယ်။', created_at: new Date().toISOString() },
  { id:'r4',  name:'မအေးမြတ်',    rating:4, comment:'ဆိုင်အပြင်အဆင် သန့်ရှင်းပြီး အေးဆေးတဲ့ပတ်ဝန်းကျင်ရှိပါတယ်။ ဝန်ထမ်းတွေကလည်း ဖော်ရွေစွာ ဝန်ဆောင်မှုပေးပါတယ်။', created_at: new Date().toISOString() },
  { id:'r5',  name:'ကိုဇော်ဝင်း',  rating:5, comment:'အစားအသောက်တွေက အရမ်းလတ်ဆတ်ပြီး Portion လည်း များပါတယ်။ ဈေးနှုန်းနဲ့ အရည်အသွေးကို နှိုင်းယှဉ်ရင် တန်ပါတယ်။', created_at: new Date().toISOString() },
  { id:'r6',  name:'မစုစု',        rating:5, comment:'မုန့်တီ၊ အုန်းနို့ခေါက်ဆွဲနဲ့ ဖျော်ရည်တွေ အားလုံးအရသာရှိပါတယ်။ သူငယ်ချင်းတွေကိုလည်း အကြံပေးထားပါတယ်။', created_at: new Date().toISOString() },
  { id:'r7',  name:'ကိုထက်အောင်',  rating:5, comment:'Online Order လုပ်ရတာလည်း အဆင်ပြေပြီး အစားအသောက်ရောက်လာချိန်မှာလည်း ပူပူနွေးနွေးရှိနေပါတယ်။', created_at: new Date().toISOString() },
  { id:'r8',  name:'မဝင်းဝင်း',    rating:4, comment:'မြန်မာရိုးရာဟင်းလျာတွေ စုံစုံလင်လင်ရှိပြီး အရသာက အိမ်မှာချက်တဲ့ဟင်းလို ခံစားရပါတယ်။', created_at: new Date().toISOString() },
  { id:'r9',  name:'ကိုရဲမင်း',    rating:5, comment:'Customer Service က အရမ်းကောင်းပါတယ်။ စားစရာတွေ အမြန်ရပြီး သန့်ရှင်းမှုလည်း အထူးကောင်းမွန်ပါတယ်။', created_at: new Date().toISOString() },
  { id:'r10', name:'မသီရိ',        rating:5, comment:'ဒီဆိုင်က ကျွန်မအကြိုက်ဆုံး မြန်မာစားသောက်ဆိုင်ဖြစ်ပါတယ်။ အရသာ၊ ဝန်ဆောင်မှု၊ ပတ်ဝန်းကျင် အားလုံးကို အရမ်းသဘောကျပါတယ်။', created_at: new Date().toISOString() },
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
  const { photos: headerPhotos, loading: headerLoading } = useSitePhotos('reviews_header');
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
    } catch (err) {
      console.error('Review submission failed:', err);
      toast.error(err?.message || 'Submission failed. Please try again.');
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
        <div
          className={`page-hero__bg ${headerLoading ? 'page-hero__bg--loading' : ''}`}
          style={headerLoading ? undefined : { backgroundImage: `url(${headerPhotos[0]?.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80'})` }}
        />
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
