import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // Send JWT cookies automatically
    headers: {
        'Content-Type': 'application/json',
    },
})

// Response interceptor: redirect to login on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Do not redirect if the original request was to /auth/me
            // This is necessary because AuthContext checks /auth/me on every page load
            const url = error.config?.url || '';
            if (url.endsWith('/auth/me')) {
                return Promise.reject(error);
            }

            // Don't redirect if already on an auth page
            const isAuthPage = ['/login', '/register', '/forgot-password'].includes(window.location.pathname)
            if (!isAuthPage) {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// Auth endpoints
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    verifyEmail: (data) => api.post('/auth/verify-email', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    updateProfile: (data) => api.put('/auth/profile', data),
}



// Station / Search
export const stationApi = {
    search: (q) => api.get(`/stations/search?q=${encodeURIComponent(q)}`),
    getCities: () => api.get('/stations/cities'),
}

export const searchApi = {
    findRoutes: (data) => api.post('/search/routes', data),
}

// Booking
export const bookingApi = {
    create: (data) => api.post('/bookings', data),
    getUserBookings: () => api.get('/bookings/user'),
    getById: (id) => api.get(`/bookings/${id}`),
    cancel: (id) => api.delete(`/bookings/${id}`),
}

// Tickets
export const ticketApi = {
    download: (id) => api.get(`/tickets/${id}/download`, { responseType: 'blob' }),
}

// Payment
export const paymentApi = {
    createSession: (data) => api.post('/payment/create-session', data),
}

// Seats
export const seatApi = {
    getSeatMap: (tripId) => api.get(`/seats/${tripId}`),
    getCoachSeats: (tripId, coachNo) => api.get(`/seats/${tripId}/coach/${coachNo}`),
    lockSeat: (tripId, seatNo) => api.post('/seats/lock', { tripId, seatNo }),
    unlockSeat: (tripId, seatNo) => api.post('/seats/unlock', { tripId, seatNo }),
    getLockTimer: (tripId, seatNo) => api.get(`/seats/${tripId}/lock-timer/${seatNo}`),
}

// Admin
export const adminApi = {
    // Carriers
    createCarrier: (data) => api.post('/admin/carriers', data),
    getCarriers: (params) => api.get('/admin/carriers', { params }),
    deleteCarrier: (id) => api.delete(`/admin/carriers/${id}`),
    // Vehicles
    createVehicle: (data) => api.post('/admin/vehicles', data),
    getVehicles: (params) => api.get('/admin/vehicles', { params }),
    deleteVehicle: (id) => api.delete(`/admin/vehicles/${id}`),
    // Stations
    createStation: (data) => api.post('/admin/stations', data),
    getStations: (params) => api.get('/admin/stations', { params }),
    deleteStation: (id) => api.delete(`/admin/stations/${id}`),
    // Trips
    createTrip: (data) => api.post('/admin/trips', data),
    getTrips: (params) => api.get('/admin/trips', { params }),
    deleteTrip: (id) => api.delete(`/admin/trips/${id}`),
    // Bookings
    getAllBookings: (params) => api.get('/admin/bookings', { params }),
    // Config
    upsertConfig: (data) => api.post('/admin/config', data),
    getConfigs: () => api.get('/admin/config'),
}

export default api
