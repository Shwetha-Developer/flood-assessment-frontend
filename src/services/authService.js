import api from './api'

export const login = async (email, password) => {
  const response = await api.post('/login', { email, password })
  localStorage.setItem('token', response.data.token)
  localStorage.setItem('user', JSON.stringify(response.data.user))
  return response.data
}

export const logout = async () => {
  try {
    await api.post('/logout')
  } catch (error) {
    console.log('Logout error', error)
  }
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}