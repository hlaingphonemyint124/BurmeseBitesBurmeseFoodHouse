import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const HERO_SLIDES = [
  {
    bg: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1600&q=80',
    tag: 'Signature Dish',
    title: 'Ohn No Khao Swe',
    sub: "Burma's iconic coconut chicken noodle soup",
  },
  {
    bg: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=1600&q=80',
    tag: 'Fresh Daily',
    title: 'Laphet Thoke',
    sub: 'The legendary Burmese tea leaf salad',
  },
  {
    bg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
    tag: 'Fine Dining',
    title: 'An Authentic Experience',
    sub: 'Warm hospitality & soulful flavours from Yangon',
  },
];

export default function HeroSection() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="hero">
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className={`hero__slide ${i === slide ? 'hero__slide--active' : ''}`}
          style={{ backgroundImage: `url(${s.bg})` }}
        />
      ))}
      <div className="hero__overlay" />
      <div className="hero__content container">
        <span className="hero__tag">{HERO_SLIDES[slide].tag}</span>
        <h1 className="hero__title">{HERO_SLIDES[slide].title}</h1>
        <p className="hero__sub">{HERO_SLIDES[slide].sub}</p>
        <div className="hero__actions">
          <Link to="/menu" className="btn btn-primary">Explore Menu</Link>
          <Link to="/reservation" className="btn hero__btn-ghost">Book a Table</Link>
        </div>
      </div>
      <div className="hero__dots">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero__dot ${i === slide ? 'hero__dot--active' : ''}`}
            onClick={() => setSlide(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
      <a href="#story" className="hero__scroll-hint">
        <ChevronDown size={20} />
      </a>
    </section>
  );
}
