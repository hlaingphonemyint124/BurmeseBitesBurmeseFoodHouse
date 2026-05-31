import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, LogIn } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../../lib/CartContext';
import { useAuth } from '../../lib/AuthContext';
import { createOrder, createOrderItems } from '../../lib/supabase';
import './CartSidebar.css';

export default function CartSidebar({ open, onClose }) {
  const { cart, dispatch, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [step, setStep]       = useState('cart');
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    customer_name: '', email: '', phone: '',
    order_type: 'delivery', address: '', notes: ''
  });

  const handleQty = (id, delta) => {
    const item = cart.items.find(i => i.id === id);
    dispatch({ type: 'UPDATE_QTY', id, qty: item.quantity + delta });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: order, error } = await createOrder({ ...form, total_amount: totalPrice + 2.50 });
      if (error) throw error;
      await createOrderItems(
        cart.items.map(i => ({
          order_id: order[0].id,
          menu_item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        }))
      );
      dispatch({ type: 'CLEAR' });
      setStep('success');
    } catch {
      toast.error('Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('cart');
      setForm({ customer_name:'', email:'', phone:'', order_type:'delivery', address:'', notes:'' });
    }, 400);
  };

  // Pre-fill from user if logged in, gate behind auth
  const handleProceedToCheckout = () => {
    if (!user) {
      onClose();
      navigate('/auth');
      toast.error('Please sign in to place an order.');
      return;
    }
    setForm(f => ({
      ...f,
      email: f.email || user.email || '',
      customer_name: f.customer_name || user.user_metadata?.full_name || '',
    }));
    setStep('checkout');
  };

  return (
    <>
      <div className={`cart-overlay ${open ? 'cart-overlay--open' : ''}`} onClick={handleClose} />
      <aside className={`cart-sidebar ${open ? 'cart-sidebar--open' : ''}`}>

        {/* Header */}
        <div className="cart-sidebar__header">
          <div className="cart-sidebar__title">
            <ShoppingBag size={18} />
            {step === 'cart'     && <span>Your Order ({totalItems})</span>}
            {step === 'login'    && <span>Sign In Required</span>}
            {step === 'checkout' && <span>Checkout</span>}
            {step === 'success'  && <span>Order Placed!</span>}
          </div>
          <button className="cart-sidebar__close" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* ── Cart step ── */}
        {step === 'cart' && (
          <>
            {cart.items.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty__icon">🍽️</div>
                <p>Your cart is empty</p>
                <p className="cart-empty__sub">Browse our menu to add dishes</p>
              </div>
            ) : (
              <div className="cart-items">
                {cart.items.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item__info">
                      <p className="cart-item__name">{item.name}</p>
                      <p className="cart-item__price">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="cart-item__controls">
                      <button onClick={() => handleQty(item.id, -1)} aria-label="Decrease"><Minus size={13} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQty(item.id, 1)}  aria-label="Increase"><Plus size={13} /></button>
                      <button className="cart-item__remove" onClick={() => dispatch({ type:'REMOVE_ITEM', id:item.id })} aria-label="Remove">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.items.length > 0 && (
              <div className="cart-footer">
                <div className="cart-summary">
                  <div className="cart-summary__row"><span>Subtotal</span><span>${totalPrice.toFixed(2)}</span></div>
                  <div className="cart-summary__row"><span>Delivery Fee</span><span>$2.50</span></div>
                  <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>${(totalPrice + 2.50).toFixed(2)}</span></div>
                </div>

                <button className="btn btn-primary cart-checkout-btn" onClick={handleProceedToCheckout}>
                    Proceed to Checkout
                  </button>
              </div>
            )}
          </>
        )}

        {/* ── Checkout step ── */}
        {step === 'checkout' && (
          <form className="checkout-form" onSubmit={handleCheckout}>
            <div className="checkout-form__scroll">
              <div className="form-group">
                <label>Full Name *</label>
                <input required className="form-input" placeholder="Your name"
                  value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input required type="email" className="form-input" placeholder="your@email.com"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" className="form-input" placeholder="+66..."
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Order Type</label>
                <select className="form-input" value={form.order_type} onChange={e => setForm({...form, order_type: e.target.value})}>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
              {form.order_type === 'delivery' && (
                <div className="form-group">
                  <label>Delivery Address *</label>
                  <textarea required className="form-input" placeholder="Full address..."
                    value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              )}
              <div className="form-group">
                <label>Special Notes</label>
                <textarea className="form-input" placeholder="Allergies, preferences..."
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="checkout-order-summary">
                <p className="checkout-order-summary__title">Order Summary</p>
                {cart.items.map(i => (
                  <div key={i.id} className="checkout-order-summary__row">
                    <span>{i.quantity}× {i.name}</span>
                    <span>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="checkout-order-summary__row checkout-order-summary__row--total">
                  <span>Total</span><span>${(totalPrice + 2.50).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="checkout-form__footer">
              <button type="button" className="btn btn-outline" onClick={() => setStep('cart')}>← Back</button>
              <button type="submit" className="btn btn-jade" disabled={loading}>
                {loading ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </form>
        )}

        {/* ── Success step ── */}
        {step === 'success' && (
          <div className="cart-success">
            <div className="cart-success__icon">🎉</div>
            <h3>Order Confirmed!</h3>
            <p>Thank you for your order. We'll start preparing your food right away.</p>
            <p className="cart-success__sub">Estimated time: 30–45 minutes</p>
            <button className="btn btn-primary" onClick={handleClose}>Continue Browsing</button>
          </div>
        )}
      </aside>
    </>
  );
}
