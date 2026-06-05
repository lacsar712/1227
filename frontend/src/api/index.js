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

export const brandsApi = {
  list: (params) => api.get('/brands', { params }),
  all: () => api.get('/brands/all'),
  detail: (slug) => api.get(`/brands/${slug}`),
  products: (slug, params) => api.get(`/brands/${slug}/products`, { params })
};

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  detail: (id) => api.get(`/products/${id}`)
};

export const flashSalesApi = {
  list: () => api.get('/flash-sales'),
  homeList: (limit) => api.get('/flash-sales/home', { params: { limit } }),
  detail: (id) => api.get(`/flash-sales/${id}`),
  productActive: (productId) => api.get(`/flash-sales/product/${productId}/active`)
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
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  ship: (id) => api.post(`/orders/${id}/ship`),
  complete: (id) => api.post(`/orders/${id}/complete`)
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all')
};

export const questionsApi = {
  list: (productId, params) => api.get(`/questions/product/${productId}`, { params }),
  create: (productId, data) => api.post(`/questions/product/${productId}`, data),
  answer: (id, data) => api.put(`/questions/${id}/answer`, data)
};

export const pointsApi = {
  getAccount: () => api.get('/points/account'),
  getTransactions: (params) => api.get('/points/transactions', { params }),
  getProducts: (params) => api.get('/points/products', { params }),
  getProductDetail: (id) => api.get(`/points/products/${id}`),
  redeem: (productId) => api.post('/points/redeem', { product_id: productId }),
  getRecords: (params) => api.get('/points/records', { params })
};

export const refundsApi = {
  list: (params) => api.get('/refunds', { params }),
  detail: (id) => api.get(`/refunds/${id}`),
  getApplicableItems: (orderId) => api.get(`/refunds/order/${orderId}/applicable-items`),
  apply: (data) => api.post('/refunds/apply', data),
  cancel: (id) => api.post(`/refunds/${id}/cancel`),
  complete: (id) => api.post(`/refunds/${id}/complete`)
};

export const browseHistoryApi = {
  list: () => api.get('/browse-history'),
  add: (productId) => api.post('/browse-history/add', { product_id: productId }),
  remove: (productId) => api.delete(`/browse-history/${productId}`),
  clear: () => api.delete('/browse-history'),
  sync: (items) => api.post('/browse-history/sync', { items })
};
