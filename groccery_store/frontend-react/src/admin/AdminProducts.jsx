import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/UIStates.jsx';

export default function AdminProducts({ SidebarComponent = AdminSidebar }) {
  const { user, showAlert } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [alertScope, setAlertScope] = useState('all');
  const [expiringMonths, setExpiringMonths] = useState('1');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const socketRef = useRef(null);
  const [form, setForm] = useState({
    id: '',
    name: '',
    category: 'fruits',
    price: '',
    stock_quantity: '',
    description: '',
    expiry_date: '',
    image_file: null
  });
  const [imagePreview, setImagePreview] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [mode, setMode] = useState('add');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const [highlightId, setHighlightId] = useState('');
  const [highlightQuery, setHighlightQuery] = useState('');
  const initialFilterLoadSkipped = useRef(false);
  const clearHighlight = () => {
    setHighlightId('');
    setHighlightQuery('');
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      params.set('offset', '0');
      if (!highlightQuery && alertScope !== 'all') {
        if (alertScope === 'expired') {
          params.set('expired', 'true');
        } else if (alertScope === 'expiring') {
          params.set('expiringMonths', expiringMonths);
        }
        if (lowStockThreshold) {
          params.set('lowStock', String(parseInt(lowStockThreshold, 10)));
        }
      }
      const response = await apiService.get(`/products?${params.toString()}`);
      const source = response.products || response.data || [];
      const sorted = [...source].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProducts(sorted.map((p, index) => ({
        id: p._id || String(index + 1),
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock_quantity ?? p.stock ?? 0,
        description: p.description || '',
        imageUrl: p.image_url || p.imageUrl || '',
        expiryDate: p.expiry_date || '',
        createdAt: p.created_at || p.createdAt || ''
      })));
    } catch (error) {
      setProducts([]);
      setProductsError(error.message || 'Failed to load products.');
      showAlert(error.message || 'Failed to load products.', 'error', 'Products');
    } finally {
      setProductsLoading(false);
    }
  };

  const availableCategories = Array.from(
    new Set(products.map((p) => String(p.category || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const categoryOptions = categories.length
    ? categories.map((c) => c.name)
    : availableCategories.length
      ? availableCategories
      : ['fruits', 'vegetables', 'meat-dairy'];

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await apiService.get('/categories');
      if (response.status === 'success') {
        setCategories(response.categories || []);
      }
    } catch (error) {
      setCategories([]);
      showAlert(error.message || 'Failed to load categories.', 'error', 'Categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadProducts().catch(() => {});
    loadCategories().catch(() => {});
  }, []);


  useEffect(() => {
    const socketBase = apiService.baseURL.replace(/\/api\/?$/, '');
    if (!socketRef.current) {
      socketRef.current = io(socketBase, { transports: ['websocket'] });
    }

    const socket = socketRef.current;
    socket.on('products:changed', () => {
      loadProducts().catch(() => {});
    });

    return () => {
      if (socket) {
        socket.off('products:changed');
      }
    };
  }, []);

  useEffect(() => {
    if (!initialFilterLoadSkipped.current) {
      initialFilterLoadSkipped.current = true;
      return;
    }
    loadProducts().catch(() => {});
  }, [alertScope, expiringMonths, lowStockThreshold, highlightQuery]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get('highlight') || '';
    setHighlightQuery(highlight);
    if (highlight) {
      setAlertScope('all');
      setLowStockThreshold('');
      setSearch('');
      setCategoryFilter('');
    }
  }, [location.search]);

  useEffect(() => {
    if (!highlightQuery || products.length === 0) return;
    const normalizedQuery = String(highlightQuery).toLowerCase();
    const byId = products.find((p) => String(p.id) === String(highlightQuery));
    const byName = products.find((p) => (p.name || '').toLowerCase() === normalizedQuery);
    const match = byId || byName;
    if (match) {
      setHighlightId(match.id);
    }
  }, [highlightQuery, products]);

  useEffect(() => {
    if (!highlightId || products.length === 0) return;
    const row = document.getElementById(`product-row-${highlightId}`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, products]);

  useEffect(() => {
    if (!highlightId) return undefined;
    const timeout = setTimeout(() => {
      setHighlightId('');
    }, 5000);
    return () => clearTimeout(timeout);
  }, [highlightId]);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalCategory = useCustomCategory ? customCategory.trim() : form.category;
      if (!finalCategory) {
        showAlert('Please choose or enter a category.', 'error', 'Missing category');
        setIsSubmitting(false);
        return;
      }
      if (!form.name || !form.price || Number.isNaN(Number(form.price))) {
        showAlert('Please enter a valid name and price before saving.', 'error', 'Invalid product data');
        setIsSubmitting(false);
        return;
      }
      if (useCustomCategory) {
        const categoryResponse = await apiService.post('/categories', { name: finalCategory });
        if (categoryResponse?.status === 'error') {
          showAlert(categoryResponse.message || 'Could not create category.', 'error', 'Category');
        }
      }

      // Use FormData if there's a file, otherwise use regular JSON
      let payload;
      if (form.image_file) {
        // FormData for multipart file upload
        payload = new FormData();
        payload.append('name', form.name);
        payload.append('category', finalCategory);
        payload.append('price', parseFloat(form.price));
        payload.append('stock_quantity', parseInt(form.stock_quantity, 10) || 0);
        payload.append('description', form.description);
        if (form.expiry_date) {
          payload.append('expiry_date', form.expiry_date);
        }
        payload.append('image', form.image_file); // Note: API expects 'image' field for Multer
      } else {
        // Regular JSON payload
        payload = {
          name: form.name,
          category: finalCategory,
          price: parseFloat(form.price),
          stock_quantity: parseInt(form.stock_quantity, 10) || 0,
          description: form.description,
          expiry_date: form.expiry_date || null
        };
      }

      let response;
      if (mode === 'add') {
        response = await apiService.post('/products', payload);
      } else {
        response = await apiService.put(`/products/${form.id}`, payload);
      }

      // Check if response has error status
      if (response?.status === 'error') {
        showAlert(response.message || 'Failed to save product.', 'error', 'Product save failed');
        setIsSubmitting(false);
        return;
      }

      // Success
      showAlert(mode === 'add' ? 'Product added successfully.' : 'Product updated successfully.', 'success', 'Product saved');
      
      setForm({ id: '', name: '', category: 'fruits', price: '', stock_quantity: '', description: '', expiry_date: '', image_file: null });
      setImagePreview('');
      setCustomCategory('');
      setUseCustomCategory(false);
      setMode('add');
      setShowModal(false);
      await loadProducts();
      await loadCategories();
    } catch (error) {
      showAlert(error.message || 'Failed to save product.', 'error', 'Product save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (product) => {
    setMode('edit');
    setShowModal(true);
    const isKnown = categoryOptions.includes(product.category);
    setUseCustomCategory(!isKnown);
    setCustomCategory(!isKnown ? product.category : '');
    setImagePreview(''); // Clear preview when editing
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock_quantity: product.stock,
      description: product.description,
      expiry_date: product.expiryDate ? String(product.expiryDate).slice(0, 10) : '',
      image_file: null // No file initially when editing
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        e.target.value = '';
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        e.target.value = '';
        return;
      }

      setForm((prev) => ({ ...prev, image_file: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setForm((prev) => ({ ...prev, image_file: null }));
      setImagePreview('');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      showAlert('Delete cancelled.', 'info', 'Action cancelled');
      return;
    }
    try {
      await apiService.delete(`/products/${id}`);
      showAlert('Product deleted successfully.', 'success', 'Deleted');
      await loadProducts();
    } catch (error) {
      showAlert(error.message || 'Failed to delete product.', 'error', 'Delete failed');
    }
  };

  return (
    <div className="admin-container">
      <SidebarComponent />
      <div className="admin-content">
        <AdminTopbar title="Manage Products" iconClass="fas fa-box" />
        <div className="admin-page-content">
          <div className="container-fluid">
            <div className="d-flex justify-content-end align-items-center mb-4">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setMode('add');
                  setImagePreview('');
                  setForm({ id: '', name: '', category: 'fruits', price: '', stock_quantity: '', description: '', expiry_date: '', image_file: null });
                  setShowModal(true);
                }}
              >
                <i className="fas fa-plus"></i> Add Product
              </button>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    clearHighlight();
                  }}
                />
              </div>
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    clearHighlight();
                  }}
                >
                  <option value="">All Categories</option>
                  {(categories.length ? categories.map((c) => c.name) : availableCategories).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={alertScope}
                  onChange={(e) => {
                    setAlertScope(e.target.value);
                    clearHighlight();
                  }}
                >
                  <option value="all">All Products</option>
                  <option value="expiring">Expiring Soon</option>
                  <option value="not-expiring">Not Expiring Within</option>
                  <option value="no-expiry">No Expiry Date</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={expiringMonths}
                  onChange={(e) => {
                    setExpiringMonths(e.target.value);
                    clearHighlight();
                  }}
                  disabled={alertScope === 'expired' || alertScope === 'no-expiry'}
                >
                  <option value="1">Within 1 Month</option>
                  <option value="6">Within 6 Months</option>
                  <option value="12">Within 1 Year</option>
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={lowStockThreshold}
                  onChange={(e) => {
                    setLowStockThreshold(e.target.value);
                    clearHighlight();
                  }}
                >
                  <option value="">All Stock Levels</option>
                  <option value="5">Low Stock {'<='} 5</option>
                  <option value="10">Low Stock {'<='} 10</option>
                  <option value="20">Low Stock {'<='} 20</option>
                </select>
              </div>
            </div>

            <div className="table-container product-table">
              {productsLoading ? (
                <LoadingState title="Loading products" description="Preparing inventory list for management." />
              ) : productsError ? (
                <ErrorState title="Unable to load inventory" description={productsError} />
              ) : filtered.length === 0 ? (
                <EmptyState title="No products found" description="Update search or category filters to see products." />
              ) : (
              <table className="table table-hover mb-0 admin-data-table admin-products-table">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Expiry</th>
                    <th>Created</th>
                    <th className="admin-description-col">Description</th>
                    <th className="admin-table-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      id={`product-row-${p.id}`}
                      className={highlightId && String(p.id) === String(highlightId) ? 'product-row-highlight' : ''}
                    >
                      <td>#{p.id}</td>
                      <td>
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <i className="fas fa-box text-muted"></i>
                          )}
                        </div>
                      </td>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>Rs. {Number(p.price || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${p.stock <= 5 ? 'bg-danger' : p.stock <= 10 ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td>{formatDate(p.expiryDate)}</td>
                      <td>{formatDate(p.createdAt)}</td>
                      <td
                        className="admin-description-cell"
                        title={p.description && p.description.trim() ? p.description : 'No description added'}
                      >
                        {p.description && p.description.trim() ? p.description : 'No description added'}
                      </td>
                      <td className="admin-table-actions-cell">
                        <button className="btn btn-sm btn-warning" onClick={() => startEdit(p)}>
                          <i className="fas fa-edit"></i>
                        </button>{' '}
                        {isAdmin && (
                          <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(p.id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>

            {showModal && (
              <>
                <div className="modal fade show" style={{ display: 'block' }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div
                        className="modal-header"
                        style={{ background: 'linear-gradient(135deg, #2f9e44 0%, #1f7a32 100%)' }}
                      >
                        <h5 className="modal-title text-white">
                          {mode === 'add' ? 'Add New Product' : 'Edit Product'}
                        </h5>
                        <button type="button" className="btn-close" onClick={closeModal}></button>
                      </div>
                      <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                          <div className="mb-3">
                            <label className="form-label">Product Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={form.name}
                              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Category</label>
                            <select
                              className="form-select"
                              value={useCustomCategory ? '__custom__' : form.category}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '__custom__') {
                                  setUseCustomCategory(true);
                                  setCustomCategory('');
                                } else {
                                  setUseCustomCategory(false);
                                  setCustomCategory('');
                                  setForm((prev) => ({ ...prev, category: value }));
                                }
                              }}
                              required
                            >
                              {categoryOptions.map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                              <option value="__custom__">Add New Category...</option>
                            </select>
                            {useCustomCategory && (
                              <input
                                type="text"
                                className="form-control mt-2"
                                placeholder="Enter new category"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                required
                              />
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Price</label>
                            <input
                              type="number"
                              className="form-control"
                              value={form.price}
                              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Stock</label>
                            <input
                              type="number"
                              className="form-control"
                              value={form.stock_quantity}
                              onChange={(e) => setForm((prev) => ({ ...prev, stock_quantity: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Expiry Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={form.expiry_date}
                              onChange={(e) => setForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea
                              className="form-control"
                              rows="3"
                              value={form.description}
                              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            ></textarea>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Product Image</label>
                            <div className="input-group">
                              <input
                                type="file"
                                className="form-control"
                                id="productImageInput"
                                accept="image/*"
                                onChange={handleImageChange}
                                title="Upload product image (JPEG, PNG, GIF, WebP - Max 5MB)"
                              />
                            </div>
                            <small className="text-muted d-block mt-2">
                              Allowed formats: JPEG, PNG, GIF, WebP (Max 5MB)
                            </small>
                          </div>
                          {imagePreview && (
                            <div className="mb-3">
                              <label className="form-label">Image Preview</label>
                              <div className="image-preview-container">
                                <img
                                  src={imagePreview}
                                  alt="Product preview"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {mode === 'add' ? 'Adding Product...' : 'Updating Product...'}
                              </>
                            ) : (
                              mode === 'add' ? 'Add Product' : 'Update Product'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="modal-backdrop fade show"></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
