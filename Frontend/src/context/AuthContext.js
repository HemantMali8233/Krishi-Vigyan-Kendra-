// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('kvkAuthToken');
      const storedUser = sessionStorage.getItem('kvkUser');

      if (token) {
        try {
          const fresh = await authAPI.getMe();
          const base = storedUser ? JSON.parse(storedUser) : {};
          const merged = { ...base, ...fresh, token };
          sessionStorage.setItem('kvkUser', JSON.stringify(merged));
          sessionStorage.setItem('kvkUserRole', merged.role);
          setUser(merged);
          setIsAuthenticated(true);
        } catch (error) {
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              setUser(parsed);
              setIsAuthenticated(true);
            } catch {
              logout();
            }
          } else {
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function (with loginType: 'admin' or 'scientist')
  const login = async (email, password, loginType) => {
    const data = await authAPI.login(email, password, loginType);

    // Store token and user data
    sessionStorage.setItem('kvkAuthToken', data.token);
    sessionStorage.setItem('kvkUser', JSON.stringify(data));
    sessionStorage.setItem('kvkUserRole', data.role);

    setUser(data);
    setIsAuthenticated(true);

    return data;
  };

  // Register function (scientist only - now includes phone)
  const register = async (name, email, phone, password) => {
    const data = await authAPI.register(name, email, phone, password);
    // Do not log in here – just return for toast
    return data;
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem('kvkAuthToken');
    sessionStorage.removeItem('kvkUser');
    sessionStorage.removeItem('kvkUserRole');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
