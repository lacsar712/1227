import api from './request';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me')
};

export const categoriesApi = {
  list: () => api.get('/categories')
};

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  detail: (id) => api.get(`/products/${id}`)
};

export const cartApi = {
  list: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  updateQuantity: (id, quantity) => api.put(`/cart/${id}/quantity`, { quantity }),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart')
};

export const addressesApi = {
  list: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  remove: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.put(`/addresses/${id}/default`)
};

export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  detail: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders/create', data),
  pay: (id) => api.post(`/orders/${id}/pay`),
  cancel: (id) => api.post(`/orders/${id}/cancel`)
};
