import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSitePhotos } from '../../lib/useSitePhotos';
import { getGalleryImages } from '../../lib/supabase';
import './Gallery.css';

const FALLBACK_IMAGES = [
  { id:'f1', image_url:'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80', caption:'Ohn No Khao Swe',   category:'food' },
  { id:'f2', image_url:'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80', caption:'Burmese Curry',     category:'food' },
  { id:'f3', image_url:'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800&q=80', caption:'Tea Leaf Salad',    category:'food' },
  { id:'f4', image_url:'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80', caption:'Our Dining Room',   category:'ambiance' },
  { id:'f5', image_url:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', caption:'Warm Atmosphere',   category:'ambiance' },
  { id:'f6', image_url:'https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800&q=80', caption:'Fresh Ingredients', category:'food' },
  { id:'f7', image_url:'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80', caption:'Sweet Desserts',    category:'food' },
  { id:'f8', image_url:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', caption:'Fine Dining',       category:'ambiance' },
];

const CATS = ['all', 'food', 'ambiance', 'events'];

function SkeletonGallery() {
  return (
    <div className="gallery-masonry">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="gallery-item gallery-item--skeleton">
          <div className="skeleton-img" style={{ height: [200,280,220,260,180,300][i]+'px', borderRadius:12 }} />
        </div>
      ))}
    </div>
  );
}

export default function Gallery() {
  const { photos: headerPhotos, loading: headerLoading } = useSitePhotos('gallery_header');
  const { photos: foodPhotos,     loading: lFood }     = useSitePhotos('gallery_food');
  const { photos: ambiancePhotos, loading: lAmbiance } = useSitePhotos('gallery_ambiance');
  const { photos: eventPhotos,    loading: lEvents }   = useSitePhotos('gallery_events');

  const [legacyImages, setLegacyImages] = useState([]);
  const [legacyLoading, setLegacyLoading] = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const touchStartX = useRef(null);
  const lightboxRef = useRef(null);

  // Also load legacy gallery table as fallback
  useEffect(() => {
    getGalleryImages().then(({ data }) => {
      setLegacyImages(data || []);
      setLegacyLoading(false);
    });
  }, []);

  const loading = lFood || lAmbiance || lEvents || legacyLoading;

  // Merge site_photos + legacy gallery, deduplicate by image_url
  const allImages = React.useMemo(() => {
    const sitePhotos = [
      ...foodPhotos.map(p => ({ id: p.id, image_url: p.image_url, caption: p.caption||'', category: 'food' })),
      ...ambiancePhotos.map(p => ({ id: p.id, image_url: p.image_url, caption: p.caption||'', category: 'ambiance' })),
      ...eventPhotos.map(p => ({ id: p.id, image_url: p.image_url, caption: p.caption||'', category: 'events' })),
    ];
    if (sitePhotos.length > 0) return sitePhotos;
    // Fall back to legacy gallery table
    if (legacyImages.length > 0) return legacyImages;
    return FALLBACK_IMAGES;
  }, [foodPhotos, ambiancePhotos, eventPhotos, legacyImages]);

  const filtered = allImages.filter(img => filter === 'all' || img.category === filter);

  const prev = useCallback(() => setLightbox(l => (l - 1 + filtered.length) % filtered.length), [filtered.length]);
  const next = useCallback(() => setLightbox(l => (l + 1) % filtered.length), [filtered.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
      if (e.key === 'Escape')      setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    lightboxRef.current?.focus();
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, next, prev]);

  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const headerBg = headerPhotos[0]?.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80';

  return (
    <div className="gallery-page">
      <div className="page-hero">
        <div
          className={`page-hero__bg ${headerLoading ? 'page-hero__bg--loading' : ''}`}
          style={headerLoading ? undefined : { backgroundImage: `url(${headerBg})` }}
        />
        <div className="page-hero__overlay" />
        <div className="container page-hero__content">
          <span className="section-label" style={{ color:'#E8A84A' }}>Visual Journey</span>
          <h1 className="page-hero__title">Our Gallery</h1>
          <p className="page-hero__sub">A feast for the eyes — food, ambiance & moments</p>
        </div>
      </div>

      <div className="container gallery-page__body">
        <div className="gallery-filters" role="tablist">
          {CATS.map(c => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              className={`gallery-filter-btn ${filter === c ? 'gallery-filter-btn--active' : ''}`}
              onClick={() => { setFilter(c); setLightbox(null); }}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <SkeletonGallery /> : filtered.length === 0 ? (
          <div className="menu-empty">
            <div className="menu-empty__icon">📷</div>
            <h3>No images yet</h3>
            <p>No photos in this category yet — check back soon!</p>
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
                <img src={img.image_url} alt={img.caption || 'Gallery image'} loading="lazy" />
                <div className="gallery-item__overlay">
                  <ZoomIn size={28} />
                  {img.caption && <p>{img.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (
        <div
          className="lightbox"
          onClick={() => setLightbox(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-modal="true"
          ref={lightboxRef}
          tabIndex={-1}
          style={{ zIndex: 9500 }}
        >
          <button className="lightbox__close" onClick={e => { e.stopPropagation(); setLightbox(null); }} aria-label="Close"><X size={22}/></button>
          <button className="lightbox__prev"  onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous"><ChevronLeft size={28}/></button>
          <button className="lightbox__next"  onClick={e => { e.stopPropagation(); next(); }} aria-label="Next"><ChevronRight size={28}/></button>
          <div className="lightbox__inner" onClick={e => e.stopPropagation()}>
            <img key={lightbox} src={filtered[lightbox].image_url} alt={filtered[lightbox].caption || 'Gallery image'} className="lightbox__img" />
            {filtered[lightbox].caption && <div className="lightbox__caption">{filtered[lightbox].caption}</div>}
            <div className="lightbox__counter">{lightbox + 1} / {filtered.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
