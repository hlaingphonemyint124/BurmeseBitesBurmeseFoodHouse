import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const FALLBACK_SLIDES = [
  {
    bg:    'https://images.unsplash.com/photo-1547592180-85f173990554?w=1600&q=80',
    tag:   'Signature Dish',
    title: 'Ohn No Khao Swe',
    sub:   "Burma's iconic coconut chicken noodle soup",
  },
  {
    bg:    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=1600&q=80',
    tag:   'Fresh Daily',
    title: 'Laphet Thoke',
    sub:   'The legendary Burmese tea leaf salad',
  },
  {
    bg:    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
    tag:   'Fine Dining',
    title: 'An Authentic Experience',
    sub:   'Warm hospitality & soulful flavours from Yangon',
  },
];

const SLIDE_DURATION = 6000;
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function HeroSection() {
  // Start EMPTY, not pre-filled with fallback stock photos. Previously this
  // rendered FALLBACK_SLIDES immediately on every mount (i.e. every time you
  // navigated back to Home) and only swapped to your real photos once the
  // Supabase fetch resolved a moment later — a visible flash of old/wrong
  // photos on every navigation. Now we wait for the DB answer first.
  const [slides,   setSlides]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [slide,    setSlide]    = useState(0);
  const [animKey,  setAnimKey]  = useState(0);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(performance.now());
  const rafRef   = useRef(null);

  // Load hero slides from site_photos table
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('site_photos')
      .select('*')
      .eq('logical_section', 'hero')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setSlides(data && data.length > 0
          ? data.map(row => ({
              bg:    row.image_url,
              tag:   row.tag    || '',
              title: row.title  || '',
              sub:   row.subtitle || row.caption || '',
            }))
          // Only fall back to the stock photos once we've genuinely
          // confirmed there's nothing configured in the database yet.
          : FALLBACK_SLIDES);
        setSlide(0);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const goTo = (idx) => {
    setSlide(idx);
    setAnimKey(k => k + 1);
    setProgress(0);
    startRef.current = performance.now();
  };
  const next = () => goTo((slide + 1) % slides.length);
  const prev = () => goTo((slide - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length === 0) return; // nothing to auto-advance yet while loading
    startRef.current = performance.now();
    const tick = (now) => {
      const p = Math.min(((now - startRef.current) / SLIDE_DURATION) * 100, 100);
      setProgress(p);
      if (p < 100) { rafRef.current = requestAnimationFrame(tick); }
      else { goTo((slide + 1) % slides.length); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [slide, slides.length]);

  // Branded skeleton instead of a flash of stock/placeholder photos while
  // we wait to hear back from the database.
  if (loading || slides.length === 0) {
    return (
      <section className="hero hero--skeleton" aria-busy="true" aria-label="Loading">
        <div className="hero__skeleton-shimmer" />
      </section>
    );
  }

  return (
    <section className="hero">
      {slides.map((s, i) => (
        <div
          key={i}
          className={`hero__slide ${i === slide ? 'hero__slide--active' : ''} ${prefersReducedMotion ? 'hero__slide--no-motion' : ''}`}
          style={{ backgroundImage: `url(${s.bg})` }}
        />
      ))}

      <div className="hero__overlay" />

      <div className="hero__progress-bar">
        <div className="hero__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="hero__content container" key={animKey}>
        {slides[slide].tag   && <span className="hero__tag   hero__anim-1">{slides[slide].tag}</span>}
        {slides[slide].title && <h1   className="hero__title hero__anim-2">{slides[slide].title}</h1>}
        {slides[slide].sub   && <p    className="hero__sub   hero__anim-3">{slides[slide].sub}</p>}
        <div className="hero__actions hero__anim-4">
          <Link to="/menu"        className="btn btn-primary">Explore Menu</Link>
          <Link to="/reservation" className="btn hero__btn-ghost">Book a Table</Link>
        </div>
      </div>

      <button className="hero__arrow hero__arrow--prev" onClick={prev} aria-label="Previous slide">
        <ChevronLeft size={22} />
      </button>
      <button className="hero__arrow hero__arrow--next" onClick={next} aria-label="Next slide">
        <ChevronRight size={22} />
      </button>

      <div className="hero__dots">
        {slides.map((_, i) => (
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
