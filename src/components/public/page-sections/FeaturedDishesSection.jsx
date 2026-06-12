import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMenuItems } from '../../../lib/supabase';
import { useCart } from '../../../lib/CartContext';
import { useReveal } from '../../../lib/useReveal';
import toast from 'react-hot-toast';

const DISH_IMAGES = [
  '1547592180-85f173990554','1569050467447-ce54b3bbc37d','1514190051997-0f6f39ca5cde',
  '1579684947550-22e945225d9a','1585032226651-759b368d7246','1559339352-11d035aa65de',
];

export default function FeaturedDishesSection() {
  const [featured, setFeatured] = useState([]);
  const { dispatch } = useCart();
  const { ref, revealed } = useReveal();

  useEffect(() => {
    getMenuItems().then(({ data }) => {
      if (data) setFeatured(data.slice(0, 6));
    });
  }, []);

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', item });
    toast.success(`${item.name} added to cart!`, {
      style: { background: '#FFFFFF', color: '#252220', border: '1px solid #E8A84A' },
      iconTheme: { primary: '#C27A2A', secondary: '#fff' },
    });
  };

  return (
    <section className={`page-section-alt reveal-section ${revealed ? 'is-revealed' : ''}`} ref={ref}>
      <div className="container">
        <div className="home__section-head reveal-up">
          <div>
            <span className="section-label">Taste the Tradition</span>
            <h2 className="section-title">Chef's Selections</h2>
          </div>
          <Link to="/menu" className="btn btn-outline">View Full Menu</Link>
        </div>
        <div className="home__dishes">
          {featured.map((item, idx) => (
            <div key={item.id} className="dish-card reveal-item" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="dish-card__img-wrap">
                <img
                  src={`https://images.unsplash.com/photo-${DISH_IMAGES[idx % DISH_IMAGES.length]}?w=500&q=75`}
                  alt={item.name}
                  loading="lazy"
                />
                <div className="dish-card__overlay">
                  <button className="btn btn-primary dish-card__add" onClick={() => addToCart(item)}>
                    Add to Order
                  </button>
                </div>
                <div className="dish-card__badges">
                  {item.is_vegetarian && <span className="badge badge-veg">Veg</span>}
                  {item.spicy_level > 0 && (
                    <span className="badge badge-spicy">{'🌶'.repeat(item.spicy_level)}</span>
                  )}
                </div>
              </div>
              <div className="dish-card__body">
                <span className="dish-card__category">{item.category}</span>
                <h3 className="dish-card__name">{item.name}</h3>
                <p className="dish-card__desc">{item.description}</p>
                <div className="dish-card__footer">
                  <span className="dish-card__price">${item.price.toFixed(2)}</span>
                  <button onClick={() => addToCart(item)} className="dish-card__add-sm">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
