import axios from 'axios'

const runtimeApiBase =
  (typeof window !== 'undefined' && window.__FITCOACH_CONFIG__?.API_BASE_URL) || null

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    runtimeApiBase ||
    '/api',
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export default api
