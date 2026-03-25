import axios from "axios"
import toast from "react-hot-toast"
import tokenService from "./token.service";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
    console.error("VITE_API_URL is not configured. API calls will fail.");
}

const api = axios.create({
    baseURL: baseURL ? `${baseURL}/api` : undefined,
    timeout: 10000,
})

// REQUEST INTERCEPTOR → attach JWT
api.interceptors.request.use(
    (config) => {
        const token = tokenService.get();
        const isPublicAuthRequest = config.url?.startsWith("/auth/") || config.url?.startsWith("/otp/")

        if (token && !isPublicAuthRequest) {
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
        const shouldSkipAuthRedirect = error.config?.skipAuthRedirect
        const status = error.response?.status
        const isPublicAuthRequest = error.config?.url?.startsWith("/auth/") || error.config?.url?.startsWith("/otp/")

        if (
            !shouldSkipAuthRedirect &&
            !isPublicAuthRequest &&
            status === 401
        ) {
            tokenService.clear();
            toast.error("Session expired. Please login again.");
            window.location.assign("/")
        }

        return Promise.reject(error)
    }
)

export default api
