import React from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../../../lib/useReveal';

export default function CTABannerSection() {
  const { ref, revealed } = useReveal();
  return (
    <section className={`cta-banner reveal-section ${revealed ? 'is-revealed' : ''}`} ref={ref}>
      <div className="cta-banner__bg" />
      <div className="container cta-banner__content reveal-up">
        <span className="section-label" style={{ color: '#E8A84A' }}>Join Us Tonight</span>
        <h2 className="cta-banner__title">Ready for a Burmese Feast?</h2>
        <p className="cta-banner__sub">Book your table or order for delivery — your taste of Myanmar awaits.</p>
        <div className="cta-banner__actions">
          <Link to="/reservation" className="btn btn-primary">Reserve a Table</Link>
          <Link to="/menu" className="btn cta-banner__btn-ghost">Order Online</Link>
        </div>
      </div>
    </section>
  );
}
