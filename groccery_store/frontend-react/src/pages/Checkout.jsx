import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../api/apiService.js';
import { DELIVERY_CHARGE, TAX_RATE } from '../constants/pricing.js';

export default function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, showAlert } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    deliveryAddress: '',
    city: '',
    postalCode: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const subtotal = getCartTotal();
  const tax = subtotal * TAX_RATE;
  const total = subtotal + DELIVERY_CHARGE + tax;

  const canSubmit = useMemo(() => {
    return (
      form.deliveryAddress &&
      form.city &&
      form.postalCode &&
      form.phone &&
      cart.length > 0
    );
  }, [form, cart]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const placeOrder = async () => {
    if (!canSubmit) {
      showAlert('Please complete the delivery form before placing your order.', 'error', 'Missing checkout details');
      return;
    }
    setLoading(true);

    try {
      const finalAddress = `${form.deliveryAddress}, ${form.city} - ${form.postalCode}`;
      const payload = {
        delivery_address: finalAddress,
        address: finalAddress,
        phone: form.phone,
        payment_method: 'cash',
        items: cart,
        total
      };

      const response = await apiService.createOrder(payload);
      if (response.status !== 'success' || !response.order) {
        throw new Error(response.message || 'Failed to place order');
      }

      await clearCart();
      showAlert('Order placed successfully.', 'success', 'Order complete');
      navigate('/my-orders');
    } catch (error) {
      showAlert(error.message || 'Failed to place order', 'error', 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5 customer-checkout-page">
        <div className="orders-header mb-4">
          <h1 className="mb-2">Checkout</h1>
          <p className="mb-0">Confirm your order details and place your grocery delivery request.</p>
        </div>
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Order Summary</h5>
              </div>
              <div className="card-body">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="d-flex justify-content-between align-items-center pb-3 border-bottom"
                  >
                    <div>
                      <div className="fw-bold">{item.name}</div>
                      <small className="text-muted">Qty: {item.quantity}</small>
                    </div>
                    <div className="fw-bold">Rs. {item.price * item.quantity}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Delivery Address</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Full Address</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    name="deliveryAddress"
                    value={form.deliveryAddress}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">City</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Payment Method</h5>
              </div>
              <div className="card-body">
                <div className="form-check mb-3">
                  <input className="form-check-input" type="radio" name="paymentMethod" defaultChecked />
                  <label className="form-check-label">
                    <i className="fas fa-money-bill"></i> Cash on Delivery
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input className="form-check-input" type="radio" name="paymentMethod" />
                  <label className="form-check-label">
                    <i className="fas fa-credit-card"></i> Credit or Debit Card
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="paymentMethod" />
                  <label className="form-check-label">
                    <i className="fas fa-mobile-alt"></i> EasyPaisa or JazzCash
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: '80px' }}>
              <div className="card-header bg-light">
                <h5 className="mb-0">Total</h5>
              </div>
              <div className="card-body">
                <div className="row mb-2">
                  <div className="col-6">Subtotal:</div>
                  <div className="col-6 text-end">Rs. {subtotal.toFixed(2)}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-6">Delivery:</div>
                  <div className="col-6 text-end">Rs. {DELIVERY_CHARGE}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-6">Tax (15%):</div>
                  <div className="col-6 text-end">Rs. {tax.toFixed(2)}</div>
                </div>
                <hr />
                <div className="row fw-bold text-primary mb-4">
                  <div className="col-6">Total:</div>
                  <div className="col-6 text-end fs-5">Rs. {total.toFixed(2)}</div>
                </div>
                <button
                  className="btn btn-primary w-100 btn-lg"
                  onClick={placeOrder}
                  disabled={!canSubmit || loading}
                >
                  <i className="fas fa-check-circle"></i> {loading ? 'Placing...' : 'Place Order'}
                </button>
                <Link to="/cart" className="btn btn-secondary w-100 mt-2">
                  <i className="fas fa-arrow-left"></i> Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
