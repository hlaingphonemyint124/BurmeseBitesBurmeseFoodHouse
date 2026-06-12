import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

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

const SLIDE_DURATION = 6000;

export default function HeroSection() {
  const [slide, setSlide]     = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(performance.now());
  const rafRef   = useRef(null);

  const goTo = (idx) => {
    setSlide(idx);
    setAnimKey(k => k + 1);
    setProgress(0);
    startRef.current = performance.now();
  };

  const next = () => goTo((slide + 1) % HERO_SLIDES.length);
  const prev = () => goTo((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  // Auto-advance + progress bar
  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now) => {
      const p = Math.min(((now - startRef.current) / SLIDE_DURATION) * 100, 100);
      setProgress(p);
      if (p < 100) { rafRef.current = requestAnimationFrame(tick); }
      else { goTo((slide + 1) % HERO_SLIDES.length); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [slide]);

  return (
    <section className="hero">
      {/* slides */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className={`hero__slide ${i === slide ? 'hero__slide--active' : ''}`}
          style={{ backgroundImage: `url(${s.bg})` }}
        />
      ))}

      <div className="hero__overlay" />

      {/* progress bar */}
      <div className="hero__progress-bar">
        <div className="hero__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* staggered content */}
      <div className="hero__content container" key={animKey}>
        <span className="hero__tag hero__anim-1">{HERO_SLIDES[slide].tag}</span>
        <h1 className="hero__title hero__anim-2">{HERO_SLIDES[slide].title}</h1>
        <p className="hero__sub hero__anim-3">{HERO_SLIDES[slide].sub}</p>
        <div className="hero__actions hero__anim-4">
          <Link to="/menu" className="btn btn-primary">Explore Menu</Link>
          <Link to="/reservation" className="btn hero__btn-ghost">Book a Table</Link>
        </div>
      </div>

      {/* arrow nav */}
      <button className="hero__arrow hero__arrow--prev" onClick={prev} aria-label="Previous slide">
        <ChevronLeft size={22} />
      </button>
      <button className="hero__arrow hero__arrow--next" onClick={next} aria-label="Next slide">
        <ChevronRight size={22} />
      </button>

      {/* dots */}
      <div className="hero__dots">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero__dot ${i === slide ? 'hero__dot--active' : ''}`}
            onClick={() => goTo(i)}
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
