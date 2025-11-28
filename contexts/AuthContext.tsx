import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, UserOut, usersAPI } from '../api';

interface AuthContextType {
    user: UserOut | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserOut | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing token and fetch user data on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = authAPI.getToken();
            if (token) {
                try {
                    // Try to fetch current user data
                    // Since we don't have a /me endpoint, we'll store username in localStorage
                    const storedUsername = localStorage.getItem('voting_username');
                    if (storedUsername) {
                        try {
                            const userData = await usersAPI.getByUsername(storedUsername);
                            setUser(userData);
                            // Store full_name for fallback use
                            if (userData.full_name) {
                                localStorage.setItem('voting_fullname', userData.full_name);
                            }
                        } catch (error) {
                            console.warn('Failed to fetch user details on init, assuming voter role:', error);
                            // Try to get full_name from localStorage
                            const storedFullName = localStorage.getItem('voting_fullname');

                            // Fallback for voters who can't read user data
                            const fallbackUser: UserOut = {
                                id: 0,
                                username: storedUsername,
                                full_name: storedFullName || storedUsername,
                                role: 'voter',
                                is_active: true
                            };
                            setUser(fallbackUser);
                        }
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    // Clear invalid token
                    authAPI.clearToken();
                    localStorage.removeItem('voting_username');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            await authAPI.login(username, password);
            // Store username for later retrieval
            localStorage.setItem('voting_username', username);

            try {
                // Try to fetch user data
                const userData = await usersAPI.getByUsername(username);
                setUser(userData);
                // Store full_name for fallback use
                if (userData.full_name) {
                    localStorage.setItem('voting_fullname', userData.full_name);
                }
            } catch (error: any) {
                // If fetching user fails (likely 403 for voters), construct a minimal user object
                console.warn('Failed to fetch user details, assuming voter role:', error);

                // Try to get full_name from localStorage (if previously stored)
                const storedFullName = localStorage.getItem('voting_fullname');

                // We assume if they logged in but can't read users, they are a voter
                const fallbackUser: UserOut = {
                    id: 0, // Unknown ID
                    username: username,
                    full_name: storedFullName || username, // Use stored full_name or fallback to username
                    role: 'voter',
                    is_active: true
                };
                setUser(fallbackUser);
            }
        } catch (error) {
            setUser(null);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('voting_username');
            localStorage.removeItem('voting_fullname');
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        const storedUsername = localStorage.getItem('voting_username');
        if (storedUsername) {
            try {
                const userData = await usersAPI.getByUsername(storedUsername);
                setUser(userData);
            } catch (error) {
                console.error('Failed to refresh user data:', error);
            }
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
