import axios from "axios"
import tokenService from "./token.service";

const baseURL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const api = axios.create({
    baseURL,
    timeout: 10000,
})

// REQUEST INTERCEPTOR → attach JWT
api.interceptors.request.use(
    (config) => {
        const token = tokenService.get();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// RESPONSE INTERCEPTOR → handle expiry / unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response &&
            (error.response.status === 401 ||
                error.response.status === 403)
        ) {
            tokenService.clear();
            alert("Session expired. Please login again.")
            // Using window.location.reload() to force a reset to login state
            window.location.reload()
        }

        return Promise.reject(error)
    }
)

export default api
