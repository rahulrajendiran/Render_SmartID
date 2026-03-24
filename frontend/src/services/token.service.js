import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "authToken";

const tokenService = {
    set: (token) => {
        localStorage.setItem(TOKEN_KEY, token);
    },
    get: () => {
        return localStorage.getItem(TOKEN_KEY);
    },
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
    },
    isValid: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp > currentTime;
        } catch {
            return false;
        }
    }
};

export default tokenService;
