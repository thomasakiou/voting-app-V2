import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { authAPI, UserOut, usersAPI } from '../api';

interface AuthContextType {
    user: UserOut | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, phone: string) => Promise<void>;
    adminLogin: (username: string, password: string) => Promise<void>;
    verifyOTP: (username: string, otpCode: string) => Promise<UserOut>;
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
                const storedUsername = localStorage.getItem('voting_username');
                if (storedUsername) {
                    const storedAuthRole = localStorage.getItem('voting_auth_role');
                    const displayedFullName =
                        localStorage.getItem('fullname') ||
                        localStorage.getItem('voting_fullname') ||
                        storedUsername;
                    setUser({
                        id: 0,
                        username: storedUsername,
                        full_name: displayedFullName,
                        role: storedAuthRole === 'admin' ? 'admin' : 'voter',
                        is_active: true,
                    });
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (_username: string, _phone: string) => {
        // OTP delivery is handled by the auth API; this method is retained for compatibility.
    };

    const adminLogin = async (username: string, _password: string) => {
        const loginResponse = await authAPI.adminLogin(username, _password);
        localStorage.setItem('voting_username', username);
        localStorage.setItem('voting_fullname', loginResponse.fullname || username);
        localStorage.setItem('voting_auth_role', 'admin');
        setUser({
            id: 0,
            username,
            full_name: loginResponse.fullname || username,
            role: 'admin',
            is_active: true,
        });
    };

    const verifyOTP = async (username: string, otpCode: string) => {
        try {
            const loginResponse = await authAPI.verifyOTP(username, otpCode);
            // OTP login is the voter authentication flow. The backend may omit
            // role from this response, so it must always establish voter auth.
            const role: 'voter' = 'voter';
            const fullName = loginResponse.fullname || localStorage.getItem('fullname') || username;

            localStorage.setItem('voting_username', username);
            localStorage.setItem('voting_auth_role', role === 'voter' ? 'voter' : 'admin');
            localStorage.setItem('fullname', fullName);
            localStorage.setItem('voting_fullname', fullName);
            localStorage.setItem('access_token', authAPI.getToken() || '');

            const authenticatedUser: UserOut = {
                id: 0,
                username,
                full_name: fullName,
                role,
                is_active: true,
            };
            flushSync(() => {
                setUser(authenticatedUser);
            });
            return authenticatedUser;
        } catch (error) {
            setUser(null);
            throw error;
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
            localStorage.removeItem('fullname');
            localStorage.removeItem('voting_auth_role');
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
        adminLogin,
        verifyOTP,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
