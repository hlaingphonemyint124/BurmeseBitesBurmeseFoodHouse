import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { getGalleryImages } from '../../lib/supabase';
import './Gallery.css';

const FALLBACK_IMAGES = [
  { id:'f1', image_url:'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80', caption:'Ohn No Khao Swe', category:'food' },
  { id:'f2', image_url:'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80', caption:'Burmese Curry', category:'food' },
  { id:'f3', image_url:'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800&q=80', caption:'Tea Leaf Salad', category:'food' },
  { id:'f4', image_url:'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80', caption:'Our Dining Room', category:'ambiance' },
  { id:'f5', image_url:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', caption:'Warm Atmosphere', category:'ambiance' },
  { id:'f6', image_url:'https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800&q=80', caption:'Fresh Ingredients', category:'food' },
  { id:'f7', image_url:'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80', caption:'Sweet Desserts', category:'food' },
  { id:'f8', image_url:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', caption:'Fine Dining', category:'ambiance' },
  { id:'f9', image_url:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', caption:'Spice Selection', category:'food' },
];

const CATS = ['all', 'food', 'ambiance', 'events'];

export default function Gallery() {
  const [images, setImages]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    getGalleryImages().then(({ data }) => {
      setImages(data && data.length > 0 ? data : FALLBACK_IMAGES);
      setLoading(false);
    });
  }, []);

  // Compute filtered BEFORE using it in useEffect
  const filtered = images.filter(img => filter === 'all' || img.category === filter);

  const prev = useCallback(() => {
    setLightbox(l => (l - 1 + filtered.length) % filtered.length);
  }, [filtered.length]);

  const next = useCallback(() => {
    setLightbox(l => (l + 1) % filtered.length);
  }, [filtered.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, next, prev]);

  return (
    <div className="gallery-page">
      <div className="page-hero">
        <div className="page-hero__bg" style={{ backgroundImage:`url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80)` }} />
        <div className="page-hero__overlay" />
        <div className="container page-hero__content">
          <span className="section-label" style={{ color:'#E8A84A' }}>Visual Journey</span>
          <h1 className="page-hero__title">Our Gallery</h1>
          <p className="page-hero__sub">A feast for the eyes — food, ambiance & moments</p>
        </div>
      </div>

      <div className="container gallery-page__body">
        <div className="gallery-filters">
          {CATS.map(c => (
            <button
              key={c}
              className={`gallery-filter-btn ${filter === c ? 'gallery-filter-btn--active' : ''}`}
              onClick={() => { setFilter(c); setLightbox(null); }}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)', fontFamily:'var(--font-serif)', fontStyle:'italic' }}>
            No images in this category yet.
          </div>
        ) : (
          <div className="gallery-masonry">
            {filtered.map((img, idx) => (
              <div
                key={img.id}
                className="gallery-item"
                onClick={() => setLightbox(idx)}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setLightbox(idx)}
                role="button"
                aria-label={`View ${img.caption || 'image'}`}
              >
                <img src={img.image_url} alt={img.caption || 'Gallery'} loading="lazy" />
                <div className="gallery-item__overlay">
                  <ZoomIn size={28} />
                  {img.caption && <p>{img.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && filtered[lightbox] && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox__inner" onClick={e => e.stopPropagation()}>
            <button className="lightbox__close" onClick={() => setLightbox(null)}><X size={22} /></button>
            <button className="lightbox__prev" onClick={prev}><ChevronLeft size={28} /></button>
            <img src={filtered[lightbox].image_url} alt={filtered[lightbox].caption} className="lightbox__img" />
            <button className="lightbox__next" onClick={next}><ChevronRight size={28} /></button>
            {filtered[lightbox].caption && (
              <div className="lightbox__caption">{filtered[lightbox].caption}</div>
            )}
            <div className="lightbox__counter">{lightbox + 1} / {filtered.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
