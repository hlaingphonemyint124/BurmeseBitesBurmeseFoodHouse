import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCart } from '../../../lib/CartContext';
import { useAuth } from '../../../lib/AuthContext';
import { useReveal } from '../../../lib/useReveal';
import { ShoppingCart, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const FALLBACK = [
  '1547592180-85f173990554','1569050467447-ce54b3bbc37d','1514190051997-0f6f39ca5cde',
  '1579684947550-22e945225d9a','1585032226651-759b368d7246','1559339352-11d035aa65de',
];

export default function FeaturedDishesSection() {
  const [dishes,  setDishes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const { dispatch }      = useCart();
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const { ref, revealed } = useReveal();

  const load = useCallback(async () => {
    setLoading(true);

    const { data: featured, error } = await supabase
      .from('featured_dishes')
      .select('id, menu_item_id, image_url, sort_order, active, menu_items(id,name,category,price,description,image_url,is_vegetarian,spicy_level)')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .limit(6);

    if (!error && featured && featured.length > 0) {
      setDishes(featured.map(row => ({
        ...row.menu_items,
        id:          row.menu_items?.id,
        _feat_id:    row.id,
        _feat_image: row.image_url,
      })));
    } else {
      // Fallback: first 6 menu items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category')
        .limit(6);
      setDishes(menuData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('featured_public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_dishes' }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const getImage = (dish, idx) => {
    if (dish._feat_image) return dish._feat_image;
    if (dish.image_url)   return dish.image_url;
    return `https://images.unsplash.com/photo-${FALLBACK[idx % FALLBACK.length]}?w=600&q=80`;
  };

  /* ── Auth-gated add to cart ── */
  const handleAdd = (dish) => {
    if (!user) {
      // Show prominent toast with action button
      toast(
        (t) => (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Lock size={16} style={{ color:'#C27A2A', flexShrink:0 }}/>
            <div>
              <p style={{ margin:'0 0 4px', fontWeight:600, fontSize:13, color:'#1E1A14' }}>Sign in required</p>
              <p style={{ margin:0, fontSize:12, color:'#7A6E60' }}>Please sign in to add items to your order</p>
            </div>
            <button
              onClick={() => { toast.dismiss(t.id); navigate('/auth'); }}
              style={{ padding:'6px 14px', background:'#C27A2A', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
            >
              Sign In
            </button>
          </div>
        ),
        {
          duration: 4000,
          style: { background:'#FFFDF8', border:'1px solid #E8D8B0', borderRadius:12, padding:'14px 16px', maxWidth:380, boxShadow:'0 8px 24px rgba(0,0,0,0.12)' },
          icon: null,
        }
      );
      return;
    }
    dispatch({ type: 'ADD_ITEM', item: dish });
    toast.success(`${dish.name} added to cart!`, {
      style: { background:'#FFFDF8', color:'#1E1A14', border:'1px solid #E8A84A', borderRadius:10 },
      iconTheme: { primary:'#C27A2A', secondary:'#fff' },
    });
  };

  const skeletons = Array.from({ length: 6 });

  return (
    <section
      id="featured"
      className={`page-section-alt reveal-section ${revealed ? 'is-revealed' : ''}`}
      ref={ref}
    >
      <div className="container">
        {/* Header */}
        <div className="home__section-head reveal-up">
          <div>
            <span className="section-label">Taste the Tradition</span>
            <h2 className="section-title">Chef's Selections</h2>
          </div>
          <Link to="/menu" className="btn btn-outline">View Full Menu</Link>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="home__dishes">
            {skeletons.map((_, i) => (
              <div key={i} className="dish-card">
                <div className="skeleton" style={{ height:220, borderRadius:'12px 12px 0 0' }}/>
                <div className="dish-card__body">
                  <div className="skeleton" style={{ height:11, width:'38%', marginBottom:10, borderRadius:4 }}/>
                  <div className="skeleton" style={{ height:17, width:'65%', marginBottom:8,  borderRadius:4 }}/>
                  <div className="skeleton" style={{ height:11, width:'88%', marginBottom:20, borderRadius:4 }}/>
                  <div className="skeleton" style={{ height:36, borderRadius:8 }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {!loading && dishes.length > 0 && (
          <div className="home__dishes">
            {dishes.map((dish, idx) => (
              <div
                key={dish._feat_id || dish.id}
                className="dish-card reveal-item"
                style={{ animationDelay:`${idx * 80}ms` }}
              >
                {/* Image */}
                <div className="dish-card__img-wrap">
                  <img src={getImage(dish, idx)} alt={dish.name} loading="lazy"/>
                  {/* Hover overlay */}
                  <div className="dish-card__overlay">
                    <button
                      className="btn btn-primary dish-card__add"
                      onClick={() => handleAdd(dish)}
                    >
                      {user
                        ? <><ShoppingCart size={14} style={{ marginRight:6 }}/>Add to Order</>
                        : <><Lock size={14} style={{ marginRight:6 }}/>Sign In to Order</>
                      }
                    </button>
                  </div>
                  {/* Badges */}
                  <div className="dish-card__badges">
                    {dish.is_vegetarian && <span className="badge badge-veg">Veg</span>}
                    {dish.spicy_level > 0 && <span className="badge badge-spicy">{'🌶'.repeat(Math.min(dish.spicy_level, 3))}</span>}
                  </div>
                </div>

                {/* Body */}
                <div className="dish-card__body">
                  <span className="dish-card__category">{dish.category}</span>
                  <h3 className="dish-card__name">{dish.name}</h3>
                  <p className="dish-card__desc">{dish.description}</p>
                  <div className="dish-card__footer">
                    <span className="dish-card__price">
                      ${parseFloat(dish.price || 0).toFixed(2)}
                    </span>
                    <button
                      className="dish-card__order-btn"
                      onClick={() => handleAdd(dish)}
                    >
                      {user
                        ? <><ShoppingCart size={12} style={{ marginRight:4 }}/>Add to Order</>
                        : <><Lock size={12} style={{ marginRight:4 }}/>Sign In</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && dishes.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#888' }}>
            <p>No featured dishes available right now.</p>
            <Link to="/menu" className="btn btn-primary" style={{ marginTop:16, display:'inline-flex' }}>
              Browse Full Menu
            </Link>
          </div>
        )}

        {/* Guest nudge — shown below grid when not signed in */}
        {!loading && !user && dishes.length > 0 && (
          <div className="featured-signin-nudge reveal-up">
            <Lock size={15}/>
            <span>Sign in to add dishes to your order</span>
            <Link to="/auth" className="btn btn-primary" style={{ padding:'7px 18px', fontSize:13 }}>
              Sign In
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
