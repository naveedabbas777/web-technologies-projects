import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { apiService } from '../api/apiService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function normalizeProduct(p) {
  return {
    id: p._id || p.id,
    name: p.name,
    category: String(p.category || '').toLowerCase(),
    price: p.price,
    description: p.description || '',
    image_url: p.image_url || p.image || null,
    stock: p.stock_quantity ?? p.stock ?? 0,
    rating: p.rating ?? 4.5,
    reviewsCount: p.reviews_count ?? 0
  };
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');
  const { addToCart, getProductIconClass } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const loginNoticeRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [categorySamples, setCategorySamples] = useState([]);

  useEffect(() => {
    let isMounted = true;

    // Fetch featured products from backend (use featured flag)
    apiService
      .get(`/products?limit=8&featured=true`)
      .then((data) => {
        if (!isMounted) return;
        const items = (data.products || data.data || data.data?.products || []).map(normalizeProduct);
        setProducts(items);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load featured products.');
      });

    // Fetch categories and a sample product image for each
    apiService.getCategories().then((resp) => {
      const cats = resp?.data?.categories || resp?.categories || [];
      if (!isMounted) return;
      setCategories(cats);

      // For each category fetch one product to use its image
      Promise.all(cats.slice(0, 6).map((cat) =>
        apiService.get(`/products/category/${encodeURIComponent(cat)}?limit=1`).then((r) => {
          const items = (r.products || r.data || r.data?.products || []);
          return { category: cat, sample: items[0] || null };
        }).catch(() => ({ category: cat, sample: null }))
      )).then((samples) => {
        if (!isMounted) return;
        setCategorySamples(samples);
      }).catch(() => {});
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const featured = products.slice(0, 8);

  useEffect(() => {
    if (loginNotice && loginNoticeRef.current) {
      loginNoticeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loginNotice]);

  return (
    <>
      <Navbar />

      <section className="hero-section grocery-hero">
        <div className="container">
          <span className="hero-kicker">Farm Fresh Picks Every Day</span>
          <h1 className="display-4 fw-bold mb-4">Welcome to Fresh Grocery</h1>
          <p className="lead mb-5">
            Order fresh groceries online and get them delivered to your doorstep within hours.
          </p>
          <div className="search-box mb-5">
            <div className="input-group" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <input
                type="text"
                className="form-control form-control-lg hero-search-input"
                placeholder="Search for products..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = e.currentTarget.value.trim();
                    if (query) {
                      navigate(`/products?search=${encodeURIComponent(query)}`);
                    }
                  }
                }}
              />
              <button
                className="btn btn-lg hero-search-btn"
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement.querySelector('input');
                  const query = input?.value.trim();
                  if (query) {
                    navigate(`/products?search=${encodeURIComponent(query)}`);
                  }
                }}
              >
                <i className="fas fa-search"></i> Search
              </button>
            </div>
          </div>
          <Link to="/products" className="btn btn-lg hero-cta-btn">
            <i className="fas fa-store"></i> Shop Now
          </Link>
        </div>
      </section>

      {loginNotice && (
        <div className="container mt-3" ref={loginNoticeRef} tabIndex="-1">
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <strong>Login Required</strong> {loginNotice} Please
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="alert"
              onClick={() => setLoginNotice('')}
            ></button>
            <span>
              {' '}
              <a
                href="/login"
                className="alert-link fw-bold"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                login to your account
              </a>{' '}
              or{' '}
              <a
                href="/register"
                className="alert-link fw-bold"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
              >
                register here
              </a>
              .
            </span>
          </div>
        </div>
      )}

      <section className="py-5 home-feature-section">
        <div className="container">
          <h2 className="text-center mb-5 fw-bold">Why Choose Fresh Grocery?</h2>
          <div className="row">
            <div className="col-md-3 text-center mb-4">
              <div className="feature-box">
                <i className="fas fa-bolt fa-3x text-primary mb-3"></i>
                <h4>Fast Delivery</h4>
                <p>Get your groceries delivered within 2-3 hours</p>
              </div>
            </div>
            <div className="col-md-3 text-center mb-4">
              <div className="feature-box">
                <i className="fas fa-leaf fa-3x text-success mb-3"></i>
                <h4>Fresh Products</h4>
                <p>Quality assured groceries from trusted suppliers</p>
              </div>
            </div>
            <div className="col-md-3 text-center mb-4">
              <div className="feature-box">
                <i className="fas fa-lock fa-3x text-warning mb-3"></i>
                <h4>Secure Payments</h4>
                <p>Safe and encrypted payment methods</p>
              </div>
            </div>
            <div className="col-md-3 text-center mb-4">
              <div className="feature-box">
                <i className="fas fa-headset fa-3x text-info mb-3"></i>
                <h4>24/7 Support</h4>
                <p>Customer support available round the clock</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 shop-category-section">
        <div className="container">
          <h2 className="text-center mb-5 fw-bold">Shop by Category</h2>
          <div className="row">
            {categorySamples.length === 0 && (
              <>
                <div className="col-md-4 mb-4">
                  <div className="category-card">
                    <i className="fas fa-apple-alt fa-5x mb-3"></i>
                    <h4>Fresh Fruits</h4>
                    <p>Organic and fresh fruits delivered daily</p>
                    <Link to="/products?category=fruits" className="btn btn-sm btn-shop-category">Shop Now</Link>
                  </div>
                </div>
                <div className="col-md-4 mb-4">
                  <div className="category-card">
                    <i className="fas fa-carrot fa-5x mb-3"></i>
                    <h4>Fresh Vegetables</h4>
                    <p>Premium quality vegetables from local farms</p>
                    <Link to="/products?category=vegetables" className="btn btn-sm btn-shop-category">Shop Now</Link>
                  </div>
                </div>
                <div className="col-md-4 mb-4">
                  <div className="category-card">
                    <i className="fas fa-drumstick-bite fa-5x mb-3"></i>
                    <h4>Meat and Dairy</h4>
                    <p>Fresh meat, dairy, and protein products</p>
                    <Link to="/products?category=meat-dairy" className="btn btn-sm btn-shop-category">Shop Now</Link>
                  </div>
                </div>
              </>
            )}

            {categorySamples.map((c) => (
              <div className="col-md-4 mb-4" key={c.category}>
                <div className="category-card category-card-with-image">
                  {c.sample && c.sample.image_url ? (
                    <img src={c.sample.image_url} alt={c.category} className="category-sample-image" />
                  ) : (
                    <i className="fas fa-box-open fa-5x mb-3"></i>
                  )}
                  <h4 style={{ textTransform: 'capitalize' }}>{c.category.replace(/[-]/g, ' ')}</h4>
                  <p>Shop the best items in {c.category.replace(/[-]/g, ' ')}</p>
                  {c.sample ? (
                    <div className="mt-2">
                      <small className="d-block text-muted">Featured sample:</small>
                      <strong className="d-block">{c.sample.name}</strong>
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <Link to={`/products/${c.sample._id || c.sample.id}`} className="btn btn-sm btn-outline-primary">View Product</Link>
                        <Link to={`/products?category=${encodeURIComponent(c.category)}`} className="btn btn-sm btn-shop-category">Shop Category</Link>
                      </div>
                    </div>
                  ) : (
                    <Link to={`/products?category=${encodeURIComponent(c.category)}`} className="btn btn-sm btn-shop-category">Shop Now</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 featured-products-section">
        <div className="container">
          <h2 className="text-center mb-5 fw-bold">Featured Products</h2>
          <div className="row">
            {error && <div className="col-12 text-center text-muted">{error}</div>}
            {!error && featured.map((product) => (
              <div className="col-6 col-md-6 col-lg-3 col-xl-2 mb-3" key={product.id}>
                <div className="product-card product-card-compact product-card-premium">
                  <div className="product-image">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} />
                    ) : (
                      <i className={getProductIconClass(product.category)}></i>
                    )}
                    <span className="product-badge">Featured</span>
                  </div>
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-rating">
                      <i className="fas fa-star"></i>
                      <span>{Number(product.rating).toFixed(1)}</span>
                      <small>({product.reviewsCount})</small>
                    </div>
                    <div className="product-description">{product.description}</div>
                    <div className="product-price">Rs. {product.price}</div>
                    <div className={`product-stock${Number(product.stock) > 0 ? '' : ' out'}`}>
                      {Number(product.stock) > 0 ? `In Stock: ${product.stock}` : 'Out of stock'}
                    </div>
                    <div className="product-actions">
                      <button
                        className="btn-add-cart"
                        disabled={Number(product.stock) <= 0}
                        onClick={() =>
                          (() => {
                            if (!user) {
                              setLoginNotice('You need to login to buy this product.');
                              return;
                            }
                            if (Number(product.stock) <= 0) {
                              return;
                            }
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              iconClass: getProductIconClass(product.category)
                            });
                          })()
                        }
                      >
                        <i className="fas fa-shopping-cart"></i> Add to Cart
                      </button>
                      <button className="btn-wishlist" title="Add to Wishlist">
                        <i className="far fa-heart"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link to="/products" className="btn btn-lg btn-view-all-products">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-5 fw-bold">What Our Customers Say</h2>
          <div className="row">
            {[
              {
                quote: 'Great quality products and super fast delivery. Highly recommended.',
                name: 'Ahmad Khan'
              },
              {
                quote: 'Love the convenience and freshness of the products. Will order again.',
                name: 'Fatima Ali'
              },
              {
                quote: 'Excellent customer service and best deals in the market.',
                name: 'Hassan Ali'
              }
            ].map((item) => (
              <div className="col-md-4 mb-4" key={item.name}>
                <div className="testimonial-card">
                  <div className="stars mb-3">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                  <p className="mb-3">{item.quote}</p>
                  <strong>{item.name}</strong>
                  <small className="text-muted">Verified Customer</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 home-cta-section">
        <div className="container">
          <h2 className="mb-4 fw-bold">Ready to Shop?</h2>
          <p className="lead mb-4">
            Join thousands of satisfied customers and experience convenient grocery shopping.
          </p>
          <Link to="/products" className="btn btn-lg home-cta-main me-3">
            <i className="fas fa-shopping-bag"></i> Start Shopping
          </Link>
          <Link to="/register" className="btn btn-lg home-cta-outline">
            <i className="fas fa-user-plus"></i> Sign Up Today
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
