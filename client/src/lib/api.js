import axios from 'axios'

const API_BASE_URL = 'https://fitcoach-pr.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export default api
