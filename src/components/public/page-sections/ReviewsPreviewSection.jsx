import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReviews } from '../../../lib/supabase';
import { useReveal } from '../../../lib/useReveal';

const renderStars = (n) =>
  Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < n ? 'star-filled' : 'star-empty'}>★</span>
  ));

export default function ReviewsPreviewSection() {
  const [reviews, setReviews] = useState([]);
  const { ref, revealed } = useReveal();

  useEffect(() => {
    getReviews().then(({ data }) => {
      if (data) setReviews(data.slice(0, 3));
    });
  }, []);

  if (!reviews.length) return null;

  return (
    <section className={`page-section reveal-section ${revealed ? 'is-revealed' : ''}`} ref={ref}>
      <div className="container">
        <div className="home__section-head reveal-up">
          <div>
            <span className="section-label">What Guests Say</span>
            <h2 className="section-title">Heartfelt Reviews</h2>
          </div>
          <Link to="/reviews" className="btn btn-outline">All Reviews</Link>
        </div>
        <div className="home__reviews">
          {reviews.map((r, idx) => (
            <div key={r.id} className="review-card reveal-item" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="stars">{renderStars(r.rating)}</div>
              <p className="review-card__text">"{r.comment}"</p>
              <div className="review-card__author">
                <div className="review-card__avatar">{r.name.charAt(0)}</div>
                <span>{r.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
