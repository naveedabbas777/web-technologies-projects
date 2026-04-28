import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { DELIVERY_CHARGE, TAX_RATE } from '../constants/pricing.js';

export default function Cart() {
  const { user } = useAuth();
  const { cart, removeFromCart, updateQuantity, getCartTotal, getProductIconClass } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const subtotal = getCartTotal();
  const tax = subtotal * TAX_RATE;
  const total = subtotal + DELIVERY_CHARGE + tax;

  return (
    <>
      <Navbar />
      <div className="container py-5 customer-cart-page">
        <div className="orders-header mb-4">
          <h1 className="mb-2">Shopping Cart</h1>
          <p className="mb-0">Review items, adjust quantities, and continue to secure checkout.</p>
        </div>
        <div className="row">
          <div className="col-lg-8">
            {cart.length === 0 ? (
              <div id="emptyCart" className="text-center py-5">
                <i className="fas fa-shopping-cart fa-5x text-muted mb-3"></i>
                <p className="text-muted mb-4">Your cart is empty</p>
                <Link to="/products" className="btn btn-primary">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div id="cartItems">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-image">
                      <i className={item.iconClass || getProductIconClass(item.category)}></i>
                    </div>
                    <div className="cart-item-details">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">Rs. {item.price}</div>
                      <div className="quantity-control">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          readOnly
                          style={{
                            width: '50px',
                            textAlign: 'center',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold mb-3">Rs. {item.price * item.quantity}</div>
                      <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.id)}>
                        <i className="fas fa-trash"></i> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-lg-4">
            <div className="cart-summary">
              <h3 className="mb-4">Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Charges</span>
                <span>Rs. {DELIVERY_CHARGE}</span>
              </div>
              <div className="summary-row">
                <span>Tax (15%)</span>
                <span>Rs. {tax.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
              <button
                className="btn btn-primary w-100 mt-4"
                disabled={cart.length === 0}
                onClick={() => navigate('/checkout')}
              >
                <i className="fas fa-credit-card"></i> Proceed to Checkout
              </button>
              <Link to="/products" className="btn btn-secondary w-100 mt-2">
                <i className="fas fa-arrow-left"></i> Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
