import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

const ThemeContext = createContext(null);

const ROLE_THEME_PREFIX = "theme:";

const getThemeKey = (role) => (role ? `${ROLE_THEME_PREFIX}${role}` : null);

const readRoleTheme = (role) => {
    if (!role || typeof window === "undefined") {
        return "light";
    }

    const storedTheme = window.localStorage.getItem(getThemeKey(role));
    return storedTheme === "dark" ? "dark" : "light";
};

const applyTheme = (theme) => {
    if (typeof document === "undefined") {
        return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
};

export function ThemeProvider({ children }) {
    const { user } = useAuth();
    const role = user?.role || null;
    const [theme, setTheme] = useState(() => readRoleTheme(role));

    useEffect(() => {
        const nextTheme = readRoleTheme(role);
        setTheme(nextTheme);
        applyTheme(nextTheme);
    }, [role]);

    useEffect(() => {
        applyTheme(theme);

        if (role && typeof window !== "undefined") {
            window.localStorage.setItem(getThemeKey(role), theme);
        }
    }, [role, theme]);

    const value = useMemo(() => ({
        theme,
        role,
        setTheme,
        toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }), [role, theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
}
