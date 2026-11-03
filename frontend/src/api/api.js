import axios from 'axios'

const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const baseURL = envUrl.startsWith('http://') || envUrl.startsWith('https://')
  ? envUrl
  : `https://${envUrl}`

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusbite_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('campusbite_token')
      localStorage.removeItem('campusbite_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ───────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (data) =>
  api.post('/auth/register', data)

export const getMe = () =>
  api.get('/auth/me')

// ─── Restaurants ─────────────────────────────────────────────────────────────
export const getRestaurants = (params) =>
  api.get('/restaurants', { params })

export const getRestaurant = (id) =>
  api.get(`/restaurants/${id}`)

export const createRestaurant = (data) =>
  api.post('/restaurants', data)

export const updateRestaurant = (id, data) =>
  api.put(`/restaurants/${id}`, data)

// ─── Menu ────────────────────────────────────────────────────────────────────
export const getMenu = (restaurantId) =>
  api.get(`/restaurants/${restaurantId}/menu`)

export const addMenuItem = (restaurantId, data) =>
  api.post(`/restaurants/${restaurantId}/menu`, data)

export const updateMenuItem = (id, data) =>
  api.put(`/menu/${id}`, data)

export const deleteMenuItem = (id) =>
  api.delete(`/menu/${id}`)

export const toggleAvailability = (id) =>
  api.patch(`/menu/${id}/toggle`)

// ─── Orders ──────────────────────────────────────────────────────────────────
export const placeOrder = (data) =>
  api.post('/orders', data)

export const getOrders = (params) =>
  api.get('/orders', { params })

export const getOrder = (id) =>
  api.get(`/orders/${id}`)

export const updateOrderStatus = (id, data) =>
  api.patch(`/orders/${id}/status`, data)

export const getReminders = () =>
  api.get('/orders/owner/reminders').catch(() => api.get('/orders/reminders'))

// ─── Delivery ─────────────────────────────────────────────────────────────────
export const getDeliveryOrders = () =>
  api.get('/delivery/orders')

export const getDeliveryPartners = () =>
  api.get('/delivery/partners')

export const updateDeliveryStatus = (id, data) =>
  api.patch(`/delivery/orders/${id}/status`, data)

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const submitReview = (data) =>
  api.post('/reviews', data)

export const getReviews = (restaurantId) =>
  api.get(`/restaurants/${restaurantId}/reviews`)

// ─── Payments ─────────────────────────────────────────────────────────────────
export const getPayments = () =>
  api.get('/payments')

// ─── Refunds ──────────────────────────────────────────────────────────────────
export const requestRefund = (data) =>
  api.post('/refunds', data)

export const getRefunds = () =>
  api.get('/refunds')

export const updateRefund = (id, data) =>
  api.patch(`/refunds/${id}`, data)

// ─── AI ───────────────────────────────────────────────────────────────────────
export const getInsights = (query) =>
  api.post('/ai/insights', { query })

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getRestaurantStats = () =>
  api.get('/stats/restaurant').catch(() => api.get('/owner/stats'))

export default api
