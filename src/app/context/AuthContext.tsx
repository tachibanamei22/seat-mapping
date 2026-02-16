'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, USERS, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('seatBooking_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('seatBooking_user');
            }
        }
        setLoaded(true);
    }, []);

    const login = (username: string, password: string): boolean => {
        const found = USERS.find(
            u => u.username === username && u.password === password
        );
        if (found) {
            setUser(found);
            localStorage.setItem('seatBooking_user', JSON.stringify(found));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('seatBooking_user');
    };

    if (!loaded) {
        return null; // Don't render until we've checked localStorage
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
                isAdmin: user?.role === 'admin',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
