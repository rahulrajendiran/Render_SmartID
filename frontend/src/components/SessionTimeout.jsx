import { useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";

const TIMEOUT = 15 * 60 * 1000; // 15 minutes

export default function SessionTimeout() {
    const { logout } = useAuth();

    useEffect(() => {
        let timer = setTimeout(logout, TIMEOUT);

        const reset = () => {
            clearTimeout(timer);
            timer = setTimeout(logout, TIMEOUT);
        };

        window.addEventListener("mousemove", reset);
        window.addEventListener("keydown", reset);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("mousemove", reset);
            window.removeEventListener("keydown", reset);
        };
    }, [logout]);

    return null;
}
