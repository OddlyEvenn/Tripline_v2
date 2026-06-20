/**
 * Real-time Socket.io client for Tripline.
 *
 * NOTE: This file scaffolds the Socket.io client.
 * To activate full real-time, install socket.io-client:
 *   npm install socket.io-client
 * and uncomment the import below.
 *
 * Events emitted by server:
 *   seat_locked       : { tripId, seatNo, userId }
 *   seat_released     : { tripId, seatNo }
 *   booking_confirmed : { bookingId, status }
 *   trip_updated      : { tripId, availableSeats }
 */

// import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'

let socket = null

/**
 * Returns a singleton socket connection.
 * Call connect() to initialize, then subscribe to events.
 */
export function getSocket() {
    if (!socket) {
        // Uncomment when socket.io-client is installed:
        // socket = io(SOCKET_URL, {
        //   withCredentials: true,
        //   transports: ['websocket'],
        //   autoConnect: true,
        // })
        // For now, return a no-op stub to prevent import errors
        socket = createStub()
    }
    return socket
}

/**
 * Subscribe to a specific socket event.
 * @param {string} event – event name
 * @param {Function} handler – callback
 * @returns {Function} unsubscribe function
 */
export function onEvent(event, handler) {
    const s = getSocket()
    s.on(event, handler)
    return () => s.off(event, handler)
}

/**
 * Emit an event to the server.
 */
export function emitEvent(event, payload) {
    const s = getSocket()
    s.emit(event, payload)
}

/**
 * Disconnect the socket when the app unmounts.
 */
export function disconnect() {
    if (socket) {
        socket.disconnect?.()
        socket = null
    }
}

// No-op stub for when socket.io-client is not yet installed
function createStub() {
    const handlers = {}
    return {
        on: (event, handler) => {
            handlers[event] = handlers[event] || []
            handlers[event].push(handler)
        },
        off: (event, handler) => {
            if (handlers[event]) {
                handlers[event] = handlers[event].filter(h => h !== handler)
            }
        },
        emit: (event, payload) => {
            console.debug('[Socket stub] emit:', event, payload)
        },
        disconnect: () => {
            console.debug('[Socket stub] disconnected')
        },
        connected: false,
    }
}

export const SOCKET_EVENTS = {
    SEAT_LOCKED: 'seat_locked',
    SEAT_RELEASED: 'seat_released',
    BOOKING_CONFIRMED: 'booking_confirmed',
    TRIP_UPDATED: 'trip_updated',
}
