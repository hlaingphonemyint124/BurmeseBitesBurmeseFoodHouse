import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMenuItems } from '../../lib/supabase';
import { useCart } from '../../lib/CartContext';
import { useAuth } from '../../lib/AuthContext';
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

export default function Menu() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch]     = useState('');
  const [vegOnly, setVegOnly]   = useState(false);
  const { dispatch }            = useCart();
  const { user }                = useAuth();
  const navigate                = useNavigate();

  useEffect(() => {
    getMenuItems().then(({ data }) => {
      if (data) setItems(data);
      setLoading(false);
    });
  }, []);

  const filtered = items.filter(item => {
    const matchCat = category === 'all' || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        (item.description || '').toLowerCase().includes(search.toLowerCase());
    const matchVeg = !vegOnly || item.is_vegetarian;
    return matchCat && matchSearch && matchVeg;
  });

  const addToCart = (item) => {
    if (!user) {
      toast.error('Please sign in to add items to your order.');
      navigate('/auth');
      return;
    }
    dispatch({ type: 'ADD_ITEM', item });
    toast.success(`${item.name} added!`, {
      style: { background: '#FAF6EE', color: '#1E1A14', border: '1px solid #E8A84A' },
      iconTheme: { primary: '#C27A2A', secondary: '#fff' },
    });
  };

  const imgSrc = (idx) =>
    `https://images.unsplash.com/photo-${DISH_IMAGES[idx % DISH_IMAGES.length]}?w=500&q=75`;

  return (
    <div className="menu-page">
      {/* Page header */}
      <div className="page-hero">
        <div className="page-hero__bg" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1547592180-85f173990554?w=1400&q=80)` }} />
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
            />
          </div>
          <label className="menu-filters__veg">
            <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)} />
            <span>Vegetarian only</span>
          </label>
        </div>

        {/* Category tabs */}
        <div className="menu-cats">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
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
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="menu-empty">
            <p>🍽️ No dishes found. Try a different filter.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filtered.map((item, idx) => (
              <div key={item.id} className="menu-item-card">
                <div className="menu-item-card__img">
                  <img src={imgSrc(idx)} alt={item.name} loading="lazy" />
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
                      onClick={() => addToCart(item)}
                    >
                      Add to Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
