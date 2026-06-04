import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, Upload, CheckCircle, Clock, XCircle, ChevronLeft, Image, AlertCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../../lib/CartContext';
import { useAuth } from '../../lib/AuthContext';
import { createOrder, createOrderItems, uploadPaymentSlip, updateOrderPayment, getOrderByIdPoll } from '../../lib/supabase';
import './CartSidebar.css';

// ── QR Code placeholder images ───────────────────────────────────────────────
const AYA_QR = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AYAPay:BurmeseBites:account123&color=1a3a6c&bgcolor=ffffff";
const KBZ_QR = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=KBZPay:BurmeseBites:account456&color=e10000&bgcolor=ffffff";

const STEPS = ['cart', 'checkout', 'payment', 'waiting', 'success'];

export default function CartSidebar({ open, onClose }) {
  const { cart, dispatch, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]         = useState('cart');
  const [loading, setLoading]   = useState(false);
  const [orderId, setOrderId]   = useState(null);
  const [payMethod, setPayMethod] = useState('aya');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [payStatus, setPayStatus] = useState(null);
  // Approval notification popup state
  const [approvalNotif, setApprovalNotif] = useState(null); // null | 'approved' | 'rejected'
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    customer_name: '', email: '', phone: '',
    order_type: 'delivery', address: '', notes: ''
  });

  const totalWithFee = totalPrice + 2.50;

  // ── Poll payment status while waiting ──────────────────────────────────────
  const startPolling = useCallback((id) => {
    pollRef.current = setInterval(async () => {
      const { data, error } = await getOrderByIdPoll(id);
      if (!error && data) {
        setPayStatus(data.payment_status);
        if (data.payment_status === 'confirmed') {
          clearInterval(pollRef.current);
          // Show beautiful approval popup FIRST, then transition
          setApprovalNotif('approved');
          setTimeout(() => {
            setApprovalNotif(null);
            setStep('success');
          }, 3000);
        } else if (data.payment_status === 'rejected') {
          clearInterval(pollRef.current);
          // Show rejection popup
          setApprovalNotif('rejected');
          setTimeout(() => {
            setApprovalNotif(null);
            setStep('payment');
            setSlipFile(null);
            setSlipPreview(null);
          }, 3500);
        }
      }
    }, 4000);
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleQty = (id, delta) => {
    const item = cart.items.find(i => i.id === id);
    dispatch({ type: 'UPDATE_QTY', id, qty: item.quantity + delta });
  };

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

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: order, error } = await createOrder({
        ...form,
        total_amount: totalWithFee,
        payment_status: 'unpaid',
        status: 'received',
      });
      if (error) throw error;
      const oid = order[0].id;
      setOrderId(oid);
      await createOrderItems(
        cart.items.map(i => ({
          order_id: oid,
          menu_item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        }))
      );
      dispatch({ type: 'CLEAR' });
      setStep('payment');
    } catch {
      toast.error('Could not create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSlipPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async () => {
    if (!slipFile) { toast.error('Please upload your payment slip.'); return; }
    setUploadProgress(true);
    try {
      const { data: upload, error: upErr } = await uploadPaymentSlip(orderId, slipFile);
      let slipUrl = upload?.publicUrl || slipPreview;
      if (upErr) { slipUrl = slipPreview; }
      const { error: updateErr } = await updateOrderPayment(orderId, slipUrl, payMethod);
      if (updateErr) throw updateErr;
      setPayStatus('pending_review');
      setStep('waiting');
      startPolling(orderId);
      toast.success('Payment slip submitted!');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploadProgress(false);
    }
  };

  // EXIT from waiting - user can leave but order is tracked
  const handleExitWaiting = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    onClose();
    toast('Your order is being processed. Check My Orders in your profile for updates.', {
      icon: '🔔',
      duration: 5000,
    });
    setTimeout(() => {
      setStep('cart');
      setForm({ customer_name:'', email:'', phone:'', order_type:'delivery', address:'', notes:'' });
      setSlipFile(null);
      setSlipPreview(null);
      setOrderId(null);
      setPayStatus(null);
    }, 400);
  };

  const handleClose = () => {
    // Prevent close during waiting (but show exit button instead)
    if (step === 'waiting') return;
    onClose();
    setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setStep('cart');
      setForm({ customer_name:'', email:'', phone:'', order_type:'delivery', address:'', notes:'' });
      setSlipFile(null);
      setSlipPreview(null);
      setOrderId(null);
      setPayStatus(null);
      setApprovalNotif(null);
    }, 400);
  };

  const stepTitle = {
    cart: `Your Order (${totalItems})`,
    checkout: 'Checkout',
    payment: 'Payment',
    waiting: 'Awaiting Confirmation',
    success: 'Order Confirmed!',
  }[step];

  return (
    <>
      <div className={`cart-overlay ${open ? 'cart-overlay--open' : ''}`} onClick={step !== 'waiting' ? handleClose : undefined} />
      <aside className={`cart-sidebar ${open ? 'cart-sidebar--open' : ''}`}>

        {/* ── Header ── */}
        <div className="cart-sidebar__header">
          <div className="cart-sidebar__title">
            <ShoppingBag size={18} />
            <span>{stepTitle}</span>
          </div>
          {/* Always show close button, but in waiting show special exit */}
          {step !== 'waiting' ? (
            <button className="cart-sidebar__close" onClick={handleClose} aria-label="Close">
              <X size={20} />
            </button>
          ) : (
            <button
              className="cart-sidebar__close cart-sidebar__close--exit"
              onClick={handleExitWaiting}
              title="Exit and track order in My Profile"
              aria-label="Exit"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* ── Step indicator ── */}
        {['checkout','payment','waiting','success'].includes(step) && (
          <div className="cart-steps">
            {['checkout','payment','waiting'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`cart-step ${step === s ? 'cart-step--active' : (STEPS.indexOf(step) > STEPS.indexOf(s) ? 'cart-step--done' : '')}`}>
                  <div className="cart-step__dot">{STEPS.indexOf(step) > STEPS.indexOf(s) ? '✓' : i+1}</div>
                  <span>{s === 'checkout' ? 'Info' : s === 'payment' ? 'Pay' : 'Review'}</span>
                </div>
                {i < 2 && <div className={`cart-step__line ${STEPS.indexOf(step) > STEPS.indexOf(s) ? 'cart-step__line--done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ══ APPROVAL / REJECTION NOTIFICATION OVERLAY ════════════════════ */}
        {approvalNotif && (
          <div className={`approval-notif approval-notif--${approvalNotif}`}>
            <div className="approval-notif__icon">
              {approvalNotif === 'approved' ? (
                <CheckCircle size={52} />
              ) : (
                <XCircle size={52} />
              )}
            </div>
            <h3 className="approval-notif__title">
              {approvalNotif === 'approved' ? 'Payment Approved! 🎉' : 'Payment Rejected'}
            </h3>
            <p className="approval-notif__desc">
              {approvalNotif === 'approved'
                ? "Your payment has been verified. We're preparing your order now!"
                : 'Your payment slip was not accepted. Please upload a valid slip.'}
            </p>
            {approvalNotif === 'approved' && (
              <div className="approval-notif__confetti">
                {Array.from({length: 12}).map((_, i) => (
                  <span key={i} className={`confetti-dot confetti-dot--${i % 4}`} style={{ '--i': i }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ CART STEP ════════════════════════════════════════════════════ */}
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
                      <button onClick={() => handleQty(item.id, 1)} aria-label="Increase"><Plus size={13} /></button>
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
                  <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>${totalWithFee.toFixed(2)}</span></div>
                </div>
                <button className="btn btn-primary cart-checkout-btn" onClick={handleProceedToCheckout}>
                  Proceed to Checkout
                </button>
              </div>
            )}
          </>
        )}

        {/* ══ CHECKOUT STEP ════════════════════════════════════════════════ */}
        {step === 'checkout' && (
          <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
            <div className="checkout-form__scroll">
              <div className="form-group">
                <label>Full Name *</label>
                <input required className="form-input" placeholder="Your name"
                  value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input required type="email" className="form-input" placeholder="your@email.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input required className="form-input" placeholder="+95 9..."
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Order Type</label>
                <select className="form-input" value={form.order_type} onChange={e => setForm(f => ({ ...f, order_type: e.target.value }))}>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                  <option value="dine-in">Dine In</option>
                </select>
              </div>
              {form.order_type === 'delivery' && (
                <div className="form-group">
                  <label>Delivery Address *</label>
                  <textarea required className="form-input" rows={2} placeholder="Your full address"
                    value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label>Special Notes</label>
                <textarea className="form-input" rows={2} placeholder="Allergies, special requests..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="checkout-form__footer">
              <button type="button" className="btn btn-outline" onClick={() => setStep('cart')}>
                <ChevronLeft size={16} /> Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating Order...' : 'Continue to Payment →'}
              </button>
            </div>
          </form>
        )}

        {/* ══ PAYMENT STEP ═════════════════════════════════════════════════ */}
        {step === 'payment' && (
          <div className="payment-step">
            <div className="payment-step__scroll">
              {/* Amount Banner */}
              <div className="payment-amount-banner">
                <p className="payment-amount-banner__label">Amount to Pay</p>
                <p className="payment-amount-banner__amount">${totalWithFee.toFixed(2)}</p>
                <p className="payment-amount-banner__note">Order #{orderId?.slice(-8).toUpperCase()}</p>
              </div>

              {/* Payment Method Selector */}
              <div className="payment-method-label">Select Payment Method</div>
              <div className="payment-methods">
                <button
                  className={`payment-method-card ${payMethod === 'aya' ? 'payment-method-card--active' : ''}`}
                  onClick={() => setPayMethod('aya')} type="button"
                >
                  <div className="payment-method-card__logo aya-logo">
                    <span className="aya-logo__text">AYA</span>
                    <span className="aya-logo__sub">Pay</span>
                  </div>
                  <span className="payment-method-card__name">AYA Pay</span>
                  {payMethod === 'aya' && <div className="payment-method-card__check">✓</div>}
                </button>
                <button
                  className={`payment-method-card ${payMethod === 'kbz' ? 'payment-method-card--active' : ''}`}
                  onClick={() => setPayMethod('kbz')} type="button"
                >
                  <div className="payment-method-card__logo kbz-logo">
                    <span className="kbz-logo__text">KBZ</span>
                    <span className="kbz-logo__sub">Pay</span>
                  </div>
                  <span className="payment-method-card__name">KBZ Pay</span>
                  {payMethod === 'kbz' && <div className="payment-method-card__check">✓</div>}
                </button>
              </div>

              {/* QR Code Section */}
              <div className="qr-section">
                <div className={`qr-card ${payMethod === 'aya' ? 'qr-card--aya' : 'qr-card--kbz'}`}>
                  <div className="qr-card__header">
                    {payMethod === 'aya' ? (
                      <div className="qr-badge qr-badge--aya">AYA Pay</div>
                    ) : (
                      <div className="qr-badge qr-badge--kbz">KBZ Pay</div>
                    )}
                    <p className="qr-card__instruction">Scan QR code with your {payMethod === 'aya' ? 'AYA Pay' : 'KBZ Pay'} app</p>
                  </div>
                  <div className="qr-code-wrap">
                    <img src={payMethod === 'aya' ? AYA_QR : KBZ_QR}
                      alt={`${payMethod === 'aya' ? 'AYA Pay' : 'KBZ Pay'} QR Code`}
                      className="qr-code-img" />
                    <div className="qr-code-amount">${totalWithFee.toFixed(2)}</div>
                  </div>
                  <div className="qr-card__steps">
                    <div className="qr-step"><span className="qr-step__num">1</span>Open {payMethod === 'aya' ? 'AYA Pay' : 'KBZ Pay'} app</div>
                    <div className="qr-step"><span className="qr-step__num">2</span>Tap "Scan QR" or "Pay"</div>
                    <div className="qr-step"><span className="qr-step__num">3</span>Enter amount: <strong>${totalWithFee.toFixed(2)}</strong></div>
                    <div className="qr-step"><span className="qr-step__num">4</span>Complete payment & screenshot slip</div>
                  </div>
                </div>
              </div>

              {/* Slip Upload */}
              <div className="slip-upload-section">
                <p className="slip-upload-section__title">
                  <Upload size={15} style={{display:'inline', marginRight:6}} />
                  Upload Payment Slip
                </p>
                <p className="slip-upload-section__sub">Take a screenshot or photo of your payment confirmation and upload it below.</p>

                <input ref={fileInputRef} type="file" accept="image/*"
                  style={{ display:'none' }} onChange={handleFileSelect} />

                {!slipPreview ? (
                  <button className="slip-upload-dropzone" onClick={() => fileInputRef.current?.click()} type="button">
                    <Image size={32} className="slip-upload-dropzone__icon" />
                    <span className="slip-upload-dropzone__text">Tap to upload slip</span>
                    <span className="slip-upload-dropzone__hint">JPG, PNG up to 10MB</span>
                  </button>
                ) : (
                  <div className="slip-preview">
                    <img src={slipPreview} alt="Payment slip" className="slip-preview__img" />
                    <div className="slip-preview__overlay">
                      <button className="slip-preview__change" onClick={() => fileInputRef.current?.click()} type="button">
                        Change
                      </button>
                    </div>
                    <div className="slip-preview__ok">
                      <CheckCircle size={16} /> Slip ready
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="checkout-form__footer">
              <button type="button" className="btn btn-outline" onClick={() => setStep('checkout')} disabled={uploadProgress}>
                <ChevronLeft size={16} /> Back
              </button>
              <button className="btn btn-jade" onClick={handleSubmitPayment}
                disabled={!slipFile || uploadProgress} type="button">
                {uploadProgress ? (
                  <><span className="spinner-sm" /> Uploading...</>
                ) : (
                  'Submit Payment →'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ WAITING STEP ═════════════════════════════════════════════════ */}
        {step === 'waiting' && (
          <div className="waiting-step">
            <div className="waiting-pulse-ring" />
            <div className="waiting-icon-wrap">
              <Clock size={36} className="waiting-icon" />
            </div>
            <h3 className="waiting-title">Verifying Your Payment</h3>
            <p className="waiting-desc">
              Our team is reviewing your payment slip. This usually takes <strong>2–5 minutes</strong>.
            </p>

            <div className="waiting-order-card">
              <div className="waiting-order-card__row">
                <span>Order ID</span>
                <strong>#{orderId?.slice(-8).toUpperCase()}</strong>
              </div>
              <div className="waiting-order-card__row">
                <span>Payment via</span>
                <strong>{payMethod === 'aya' ? 'AYA Pay' : 'KBZ Pay'}</strong>
              </div>
              <div className="waiting-order-card__row">
                <span>Status</span>
                <span className="waiting-status-badge">
                  <span className="waiting-status-dot" />
                  Pending Review
                </span>
              </div>
            </div>

            {slipPreview && (
              <div className="waiting-slip-thumb">
                <img src={slipPreview} alt="Your payment slip" />
                <p>Your uploaded slip</p>
              </div>
            )}

            <div className="waiting-dots">
              <span /><span /><span />
            </div>

            {/* EXIT BUTTON — so user is never trapped */}
            <div className="waiting-exit-zone">
              <p className="waiting-exit-label">Need to leave? Your order is saved.</p>
              <button className="waiting-exit-btn" onClick={handleExitWaiting}>
                <X size={14} /> Exit & Track in My Orders
              </button>
            </div>
          </div>
        )}

        {/* ══ SUCCESS STEP ═════════════════════════════════════════════════ */}
        {step === 'success' && (
          <div className="cart-success">
            <div className="cart-success__check">
              <CheckCircle size={48} />
            </div>
            <h3>Payment Confirmed!</h3>
            <p>Your order has been verified and we're now preparing your food with love.</p>
            <p className="cart-success__sub">Estimated time: 30–45 minutes</p>
            <div className="cart-success__order">
              Order <strong>#{orderId?.slice(-8).toUpperCase()}</strong>
            </div>
            <button className="btn btn-primary" onClick={handleClose}>Continue Browsing</button>
          </div>
        )}
      </aside>
    </>
  );
}
