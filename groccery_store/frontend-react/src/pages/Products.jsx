import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/UIStates.jsx';

function normalizeProduct(p) {
  const rawCategory = String(p.category || '').toLowerCase();
  let normalizedCategory = rawCategory;

  if (rawCategory.includes('fruit')) {
    normalizedCategory = 'fruits';
  } else if (rawCategory.includes('vegetable')) {
    normalizedCategory = 'vegetables';
  } else if (rawCategory.includes('meat') || rawCategory.includes('dairy')) {
    normalizedCategory = 'meat-dairy';
  }

  return {
    id: p._id || p.id,
    name: p.name,
    category: normalizedCategory,
    iconCategory: rawCategory,
    price: p.price,
    description: p.description || '',
    stock: p.stock_quantity ?? p.stock ?? 0,
    imageUrl: p.image_url || p.imageUrl || ''
  };
}

export default function Products() {
  const { user, showAlert } = useAuth();
  const { addToCart, getProductIconClass } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [category, setCategory] = useState('all');
  const [priceBand, setPriceBand] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loginNotice, setLoginNotice] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const loginNoticeRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('search') || '';
    const cat = params.get('category') || 'all';
    setSearch(query);
    setCategory(cat);
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingProducts(true);
    setProductsError('');
    apiService
      .getProducts(200, 0)
      .then((data) => {
        if (!isMounted) return;
        const products = (data.products || data.data || []).map(normalizeProduct);
        setAllProducts(products);
        setIsLoadingProducts(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        setAllProducts([]);
        setProductsError(error.message || 'Failed to load products.');
        setIsLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let items = [...allProducts];

    if (inStockOnly) {
      items = items.filter((p) => Number(p.stock) > 0);
    }

    if (category && category !== 'all') {
      items = items.filter((p) => p.category === category);
    }

    if (priceBand !== 'all') {
      if (priceBand === 'budget') {
        items = items.filter((p) => Number(p.price) <= 500);
      } else if (priceBand === 'mid') {
        items = items.filter((p) => Number(p.price) > 500 && Number(p.price) <= 1500);
      } else if (priceBand === 'premium') {
        items = items.filter((p) => Number(p.price) > 1500);
      }
    }

    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }

    if (sort === 'price-low') {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(items);
  }, [allProducts, category, inStockOnly, priceBand, search, sort]);

  useEffect(() => {
    if (loginNotice && loginNoticeRef.current) {
      loginNoticeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loginNotice]);

  const loginRequiredAlert = useMemo(() => {
    if (!loginNotice) return null;
    return (
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
          <a href="/login" className="alert-link fw-bold" onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}>
            login to your account
          </a>{' '}
          or{' '}
          <a href="/register" className="alert-link fw-bold" onClick={(e) => {
            e.preventDefault();
            navigate('/register');
          }}>
            register here
          </a>
          .
        </span>
      </div>
    );
  }, [loginNotice, navigate]);

  return (
    <>
      <Navbar />
      <div className="container mt-3" ref={loginNoticeRef} tabIndex="-1">
        {loginRequiredAlert}
      </div>

      <div className="container-fluid py-4 shop-shell">
        <div className="container">
          <div className="shop-header mb-3 mb-md-4">
            <h2 className="mb-2">Fresh Grocery Shop</h2>
            <p className="mb-0">Browse by category, use quick filters, and add your essentials in one click.</p>
          </div>
          <div className="row">
            <div className="col-12 col-md-3 mb-3 mb-md-0">
              <div className="shop-filter-card">
                <h5 className="mb-2 mb-md-3">Filter by Category</h5>
                <div className="list-group category-filter-list">
                  {[
                    { value: 'all', label: 'All Products' },
                    { value: 'fruits', label: 'Fruits' },
                    { value: 'vegetables', label: 'Vegetables' },
                    { value: 'meat-dairy', label: 'Meat & Dairy' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      className={`list-group-item list-group-item-action category-filter-item${
                        category === item.value ? ' active' : ''
                      }`}
                      onClick={() => setCategory(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="form-label mb-1" htmlFor="priceBand">Price Range</label>
                  <select
                    id="priceBand"
                    className="form-select"
                    value={priceBand}
                    onChange={(e) => setPriceBand(e.target.value)}
                  >
                    <option value="all">All Prices</option>
                    <option value="budget">Budget (up to Rs. 500)</option>
                    <option value="mid">Mid Range (Rs. 501-1500)</option>
                    <option value="premium">Premium (above Rs. 1500)</option>
                  </select>
                </div>

                <div className="form-check mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="stockOnly"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="stockOnly">
                    In stock only
                  </label>
                </div>

                <button
                  className="btn btn-sm btn-clear-filters mt-3"
                  onClick={() => {
                    setCategory('all');
                    setSearch('');
                    setSort('default');
                    setPriceBand('all');
                    setInStockOnly(false);
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
            <div className="col-12 col-md-9">
              <div className="shop-toolbar d-flex flex-wrap justify-content-between align-items-center mb-3">
                <div className="shop-results-count">{filteredProducts.length} products found</div>
              </div>

              <div className="row g-2 g-md-3 mb-3">
                <div className="col-12 col-md-6">
                  <input
                    type="text"
                    className="form-control shop-search-input"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <select
                    className="form-select shop-sort-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="default">Sort by: Default</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>
              </div>
              <div id="productsContainer" className="row">
                {isLoadingProducts ? (
                  <div className="col-12">
                    <LoadingState title="Loading products" description="Fetching fresh items for your store view." />
                  </div>
                ) : productsError ? (
                  <div className="col-12">
                    <ErrorState title="Unable to load products" description={productsError} />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-12 text-center py-5">
                    <EmptyState
                      iconClass="fas fa-search"
                      title="No matching products"
                      description="Try changing your filters or search terms to find items."
                    />
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div className="col-6 col-md-6 col-lg-4 col-xl-3 col-xxl-2 mb-3" key={product.id}>
                      <div className="product-card product-card-compact">
                        <div className="product-image">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <i className={getProductIconClass(product.iconCategory || product.category)}></i>
                          )}
                        </div>
                        <div className="product-info">
                          <div className="product-name">{product.name}</div>
                          <div className="product-description">{product.description}</div>
                          <div className="product-price">Rs. {product.price}</div>
                          <div className="product-stock">In Stock: {product.stock}</div>
                          <div className="product-actions">
                            <button
                              className="btn-add-cart"
                              onClick={() => {
                                if (!user) {
                                  setLoginNotice('You need to login to buy this product.');
                                  showAlert('Please login before adding products to your cart.', 'error', 'Login required');
                                  return;
                                }
                                addToCart({
                                  id: product.id,
                                  name: product.name,
                                  price: product.price,
                                  iconClass: getProductIconClass(product.iconCategory || product.category)
                                });
                              }}
                              style={!user ? { opacity: 0.7 } : undefined}
                            >
                              <i className="fas fa-shopping-cart"></i> {user ? 'Add' : 'Login to Buy'}
                            </button>
                            <button className="btn-wishlist" title="Add to Wishlist">
                              <i className="fas fa-heart"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
