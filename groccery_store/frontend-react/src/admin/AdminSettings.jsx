import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminSettings() {
  const { showAlert } = useAuth();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false,
    forceSsl: true,
    debugMode: false,
    enableExpressDelivery: true,
    lowStockAlertThreshold: 5,
    expiringMonthsAlert: 3
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryEdits, setCategoryEdits] = useState({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    apiService.get('/settings').then((resp) => {
      if (resp.status === 'success' && resp.settings) {
        setSettings((prev) => ({ ...prev, ...resp.settings }));
        showAlert('Settings loaded successfully.', 'success', 'Settings');
      } else {
        setMessage(resp.message || 'Failed to load settings.');
        showAlert(resp.message || 'Failed to load settings.', 'error', 'Settings');
      }
    }).catch(() => {
      setMessage('Failed to load settings.');
      showAlert('Failed to load settings.', 'error', 'Settings');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const resp = await apiService.get('/categories');
      if (resp.status === 'success') {
        setCategories(resp.categories || []);
      } else {
        setMessage(resp.message || 'Failed to load categories.');
        showAlert(resp.message || 'Failed to load categories.', 'error', 'Categories');
      }
    } catch (error) {
      setMessage('Failed to load categories.');
      showAlert('Failed to load categories.', 'error', 'Categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await apiService.put('/settings', settings);
      if (response.status === 'success') {
        setMessage('Settings saved successfully.');
        showAlert('Settings saved successfully.', 'success', 'Settings');
      } else {
        setMessage(response.message || 'Failed to save settings.');
        showAlert(response.message || 'Failed to save settings.', 'error', 'Settings');
      }
    } catch (error) {
      setMessage(error.message || 'Failed to save settings.');
      showAlert(error.message || 'Failed to save settings.', 'error', 'Settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (e) => {
    setSettings((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  const updateValue = (field) => (e) => {
    setSettings((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateCategoryEdit = (id, value) => {
    setCategoryEdits((prev) => ({ ...prev, [id]: value }));
  };

  const addCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      showAlert('Please enter a category name first.', 'error', 'Missing input');
      return;
    }
    try {
      const resp = await apiService.post('/categories', { name });
      if (resp.status === 'success') {
        setCategoryName('');
        showAlert('Category added successfully.', 'success', 'Categories');
        await loadCategories();
      } else {
        setMessage(resp.message || 'Failed to add category.');
        showAlert(resp.message || 'Failed to add category.', 'error', 'Categories');
      }
    } catch (error) {
      setMessage(error.message || 'Failed to add category.');
      showAlert(error.message || 'Failed to add category.', 'error', 'Categories');
    }
  };

  const saveCategory = async (category) => {
    const updatedName = String(categoryEdits[category._id] ?? category.name).trim();
    if (!updatedName) {
      showAlert('Category name cannot be empty.', 'error', 'Invalid action');
      return;
    }
    if (updatedName === category.name) {
      showAlert('Category name is unchanged.', 'info', 'No changes');
      return;
    }
    try {
      const resp = await apiService.put(`/categories/${category._id}`, { name: updatedName });
      if (resp.status === 'success') {
        setCategoryEdits((prev) => {
          const next = { ...prev };
          delete next[category._id];
          return next;
        });
        showAlert('Category updated successfully.', 'success', 'Categories');
        await loadCategories();
      } else {
        setMessage(resp.message || 'Failed to update category.');
        showAlert(resp.message || 'Failed to update category.', 'error', 'Categories');
      }
    } catch (error) {
      setMessage(error.message || 'Failed to update category.');
      showAlert(error.message || 'Failed to update category.', 'error', 'Categories');
    }
  };

  const deleteCategory = async (category) => {
    if (!category?._id) {
      showAlert('Category ID is missing.', 'error', 'Invalid action');
      return;
    }
    if (!window.confirm(`Delete category "${category.name}"?`)) {
      showAlert('Category deletion was cancelled.', 'info', 'Cancelled');
      return;
    }
    try {
      const resp = await apiService.delete(`/categories/${category._id}`);
      if (resp.status === 'success') {
        showAlert('Category deleted successfully.', 'success', 'Categories');
        await loadCategories();
      } else {
        setMessage(resp.message || 'Failed to delete category.');
        showAlert(resp.message || 'Failed to delete category.', 'error', 'Categories');
      }
    } catch (error) {
      setMessage(error.message || 'Failed to delete category.');
      showAlert(error.message || 'Failed to delete category.', 'error', 'Categories');
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <AdminTopbar title="Settings" iconClass="fas fa-cog" />
        <div className="admin-page-content">
          {message && <div className="alert alert-info">{message}</div>}
          {loading && <div className="alert alert-secondary">Loading settings...</div>}
          <div className="settings-card">
            <h4><i className="fas fa-sliders-h"></i> General Settings</h4>
            <div className="setting-item">
              <label>Maintenance Mode</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={updateField('maintenanceMode')}
                />
              </div>
            </div>
            <div className="setting-item">
              <label>Dark Mode</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={updateField('darkMode')}
                />
              </div>
            </div>
            <div className="setting-item">
              <label>Email Notifications</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={updateField('emailNotifications')}
                />
              </div>
            </div>
            <div className="setting-item">
              <label>SMS Notifications</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={updateField('smsNotifications')}
                />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h4><i className="fas fa-shield-alt"></i> Security Settings</h4>
            <div className="setting-item">
              <label>Two Factor Authentication</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={updateField('twoFactorAuth')}
                />
              </div>
            </div>
            <div className="setting-item">
              <label>Force HTTPS</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.forceSsl}
                  onChange={updateField('forceSsl')}
                />
              </div>
            </div>
            <div className="setting-item">
              <label>Debug Mode</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.debugMode}
                  onChange={updateField('debugMode')}
                />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h4><i className="fas fa-truck"></i> Delivery Settings</h4>
            <div className="setting-item">
              <label>Enable Express Delivery</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.enableExpressDelivery}
                  onChange={updateField('enableExpressDelivery')}
                />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h4><i className="fas fa-bell"></i> Product Alerts</h4>
            <div className="setting-item">
              <label>Low Stock Alert Threshold</label>
              <input
                type="number"
                className="form-control"
                value={settings.lowStockAlertThreshold}
                onChange={updateValue('lowStockAlertThreshold')}
                min="1"
                style={{ maxWidth: '140px' }}
              />
            </div>
            <div className="setting-item">
              <label>Expiring Soon (Months)</label>
              <input
                type="number"
                className="form-control"
                value={settings.expiringMonthsAlert}
                onChange={updateValue('expiringMonthsAlert')}
                min="1"
                style={{ maxWidth: '140px' }}
              />
            </div>
          </div>

          <div className="settings-card">
            <h4><i className="fas fa-tags"></i> Manage Categories</h4>
            <div className="setting-item">
              <label>New Category</label>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={addCategory}
                  disabled={!categoryName.trim()}
                >
                  Add
                </button>
              </div>
            </div>
            {categoriesLoading ? (
              <div className="text-muted">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-muted">No categories yet.</div>
            ) : (
              <div className="category-list">
                {categories.map((category) => (
                  <div className="category-row" key={category._id}>
                    <input
                      type="text"
                      className="form-control"
                      value={categoryEdits[category._id] ?? category.name}
                      onChange={(e) => updateCategoryEdit(category._id, e.target.value)}
                    />
                    <div className="category-actions">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => saveCategory(category)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteCategory(category)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="settings-card bg-light text-center">
            <button
              className="btn btn-lg btn-success"
              onClick={saveSettings}
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
