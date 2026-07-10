import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Leaf, ShoppingBag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMenuItems } from '../../lib/supabase';
import { useCart } from '../../lib/CartContext';
import { useAuth } from '../../lib/AuthContext';
import { useSitePhotos } from '../../lib/useSitePhotos';
import './Menu.css';

const CATEGORIES = [
  { key: 'all',      label: 'All Dishes',  emoji: '🍽️' },
  { key: 'starters', label: 'Starters',    emoji: '🥗' },
  { key: 'mains',    label: 'Mains',       emoji: '🍛' },
  { key: 'noodles',  label: 'Noodles',     emoji: '🍜' },
  { key: 'salads',   label: 'Salads',      emoji: '🥙' },
  { key: 'desserts', label: 'Desserts',    emoji: '🍮' },
  { key: 'drinks',   label: 'Drinks',      emoji: '🥤' },
];

const DISH_IMAGES = [
  '1547592180-85f173990554','1569050467447-ce54b3bbc37d','1514190051997-0f6f39ca5cde',
  '1579684947550-22e945225d9a','1585032226651-759b368d7246','1559339352-11d035aa65de',
  '1414235077428-338989a2e8c0','1555396273-367ea4eb4db5',
];

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-line--short" />
        <div className="skeleton-line skeleton-line--tall" />
        <div className="skeleton-line skeleton-line--med" />
        <div className="skeleton-line" />
        <div className="skeleton-btn" />
      </div>
    </div>
  );
}

/* ── Fly-to-cart animation ── */
function flyToCart(e, cartIconEl) {
  const rect = e.currentTarget.getBoundingClientRect();
  const cartRect = cartIconEl ? cartIconEl.getBoundingClientRect() : null;

  const el = document.createElement('div');
  el.className = 'fly-item';
  el.textContent = '🍽️';
  el.style.left = rect.left + rect.width / 2 - 20 + 'px';
  el.style.top  = rect.top  + rect.height / 2 - 20 + 'px';

  if (cartRect) {
    el.style.setProperty('--fly-x', (cartRect.left - rect.left - 20) + 'px');
    el.style.setProperty('--fly-y', (cartRect.top  - rect.top  - 20) + 'px');
  }
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

export default function Menu() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch]     = useState('');
  const [vegOnly, setVegOnly]   = useState(false);
  const { dispatch }            = useCart();
  const { photos: headerPhotos, loading: headerLoading } = useSitePhotos('menu_header');
  const { user }                = useAuth();
  const navigate                = useNavigate();
  const cartIconRef             = useRef(null);

  useEffect(() => {
    // Locate cart icon for fly animation
    cartIconRef.current = document.querySelector('.navbar__cart');
  }, []);

  useEffect(() => {
    getMenuItems().then(({ data }) => {
      if (data) setItems(data);
      setLoading(false);
    });
  }, []);

  const filtered = items.filter(item => {
    const matchCat    = category === 'all' || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        (item.description || '').toLowerCase().includes(search.toLowerCase());
    const matchVeg    = !vegOnly || item.is_vegetarian;
    return matchCat && matchSearch && matchVeg;
  });

  const addToCart = (item, e) => {
    if (!user) {
      toast.error('Please sign in to add items to your order.');
      navigate('/auth');
      return;
    }
    dispatch({ type: 'ADD_ITEM', item });
    flyToCart(e, cartIconRef.current);
    toast.success(`${item.name} added!`, {
      icon: '🍽️',
      style: { background: '#FAF6EE', color: '#1E1A14', border: '1px solid #E8A84A' },
      iconTheme: { primary: '#C27A2A', secondary: '#fff' },
    });
  };

  const imgSrc = (idx) =>
    `https://images.unsplash.com/photo-${DISH_IMAGES[idx % DISH_IMAGES.length]}?w=500&q=75`;

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setVegOnly(false);
  };

  const hasActiveFilter = search || category !== 'all' || vegOnly;

  return (
    <div className="menu-page">
      {/* Page header */}
      <div className="page-hero">
        <div
          className={`page-hero__bg ${headerLoading ? 'page-hero__bg--loading' : ''}`}
          style={headerLoading ? undefined : { backgroundImage: `url(${headerPhotos[0]?.image_url || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1400&q=80'})` }}
        />
        <div className="page-hero__overlay" />
        <div className="container page-hero__content">
          <span className="section-label" style={{ color: '#E8A84A' }}>Explore</span>
          <h1 className="page-hero__title">Our Menu</h1>
          <p className="page-hero__sub">Authentic Burmese flavours, crafted with love and heritage</p>
        </div>
      </div>

      <div className="container menu-page__body">
        {/* Filter bar */}
        <div className="menu-filters">
          <div className="menu-filters__search">
            <Search size={16} className="menu-filters__search-icon" />
            <input
              className="menu-filters__search-input"
              placeholder="Search dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search dishes"
            />
            {search && (
              <button
                className="menu-filters__search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <label className="menu-filters__veg">
            <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)} />
            <Leaf size={13} />
            <span>Vegetarian</span>
          </label>
        </div>

        {/* Category tabs */}
        <div className="menu-cats" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              role="tab"
              aria-selected={category === c.key}
              className={`menu-cats__btn ${category === c.key ? 'menu-cats__btn--active' : ''}`}
              onClick={() => setCategory(c.key)}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="menu-grid">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="menu-empty">
            <div className="menu-empty__icon">🍽️</div>
            <h3>No dishes found</h3>
            <p>
              {hasActiveFilter
                ? 'Try adjusting your filters or search term.'
                : 'No dishes are available right now. Check back soon!'}
            </p>
            {hasActiveFilter && (
              <button className="btn btn-outline menu-empty__reset" onClick={clearFilters}>
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="menu-results-count" aria-live="polite">
              {filtered.length} dish{filtered.length !== 1 ? 'es' : ''}
              {category !== 'all' ? ` in ${CATEGORIES.find(c => c.key === category)?.label}` : ''}
              {search ? ` matching "${search}"` : ''}
            </p>
            <div className="menu-grid">
              {filtered.map((item, idx) => (
                <article key={item.id} className="menu-item-card">
                  <div className="menu-item-card__img">
                    <img
                      src={imgSrc(idx)}
                      alt={item.name}
                      loading="lazy"
                      width={500}
                      height={210}
                    />
                    <div className="menu-item-card__badges">
                      {item.is_vegetarian && <span className="badge badge-veg">🌿 Veg</span>}
                      {item.spicy_level > 0 && (
                        <span className="badge badge-spicy">{'🌶'.repeat(item.spicy_level)}</span>
                      )}
                    </div>
                  </div>
                  <div className="menu-item-card__body">
                    <span className="menu-item-card__cat">{item.category}</span>
                    <h3 className="menu-item-card__name">{item.name}</h3>
                    <p className="menu-item-card__desc">{item.description}</p>
                    <div className="menu-item-card__footer">
                      <span className="menu-item-card__price">${item.price.toFixed(2)}</span>
                      <button
                        className="btn btn-primary menu-item-card__add"
                        onClick={(e) => addToCart(item, e)}
                        aria-label={`Add ${item.name} to order`}
                      >
                        <ShoppingBag size={14} />
                        Add to Order
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
