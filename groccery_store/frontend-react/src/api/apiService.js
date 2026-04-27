const DEFAULT_API_BASE = (() => {
  if (import.meta.env.VITE_API_BASE) {
    return String(import.meta.env.VITE_API_BASE).replace(/\/$/, '');
  }

  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';

  if (isLocal) {
    return 'http://localhost:5000/api';
  }

  // For deployed frontends, same-origin /api works when a reverse proxy is configured.
  return `${window.location.origin}/api`;
})();

class ApiService {
  constructor(baseURL = DEFAULT_API_BASE) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders(isFormData = false) {
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, data) {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: this.getHeaders(isFormData),
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined)
    });
    return response.json();
  }

  get(endpoint) {
    return this.request('GET', endpoint);
  }

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  register(userData) {
    return this.post('/auth/register', userData);
  }

  login(email, password) {
    return this.post('/auth/login', { email, password });
  }

  getCurrentUser() {
    return this.get('/auth/me');
  }

  getProducts(limit = 100, offset = 0) {
    return this.get(`/products?limit=${limit}&offset=${offset}`);
  }

  getProduct(id) {
    return this.get(`/products/${id}`);
  }

  getProductsByCategory(category) {
    return this.get(`/products/category/${category}`);
  }

  searchProducts(query) {
    return this.get(`/products/search/${query}`);
  }

  getCategories() {
    return this.get('/products/categories/all');
  }

  createOrder(orderData) {
    return this.post('/orders', orderData);
  }

  getMyOrders() {
    return this.get('/orders/my-orders');
  }

  getMessageInbox() {
    return this.get('/messages/inbox');
  }

  getMessageConversation(conversationId) {
    return this.get(`/messages/${conversationId}`);
  }

  getUnreadMessageCount() {
    return this.get('/messages/unread-count');
  }

  sendMessage(payload) {
    return this.post('/messages/send', payload);
  }

  replyToConversation(conversationId, payload) {
    return this.post(`/messages/${conversationId}/reply`, payload);
  }

  markConversationRead(conversationId) {
    return this.put(`/messages/${conversationId}/read`, {});
  }

  getCustomers(limit = 500, offset = 0, search = '') {
    return this.get(`/customers?limit=${limit}&offset=${offset}&search=${encodeURIComponent(search)}`);
  }

  getDeliveryRiders() {
    return this.get('/staff/riders/available');
  }
}

export const apiService = new ApiService();
