import React from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../../../lib/useReveal';

export default function StorySection() {
  const { ref, revealed } = useReveal();
  return (
    <section id="story" className={`page-section reveal-section ${revealed ? 'is-revealed' : ''}`} ref={ref}>
      <div className="container home__story">
        <div className="home__story-img reveal-left">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&q=80"
            alt="Our restaurant interior"
          />
          <div className="home__story-badge">
            <span className="home__story-badge-year">Est.</span>
            <span className="home__story-badge-num">2009</span>
          </div>
        </div>
        <div className="home__story-text reveal-right">
          <span className="section-label">Our Heritage</span>
          <h2 className="section-title">A Taste of Yangon<br /><em>in the Heart of Bangkok</em></h2>
          <p className="section-subtitle">
            BurmeseBites was born from a deep love of Myanmar's vibrant food culture.
            Our recipes have been passed down through generations — each curry, each salad,
            each bowl of noodles carries the warmth of a Burmese grandmother's kitchen.
          </p>
          <div className="home__story-quote">
            <span className="home__story-quote-mark">"</span>
            <p>Food is the memory that travels furthest. Every dish we serve is a bridge between two worlds.</p>
            <cite>— Daw Mya, Founder</cite>
          </div>
          <Link to="/about" className="btn btn-outline">Read Our Full Story →</Link>
        </div>
      </div>
    </section>
  );
}
