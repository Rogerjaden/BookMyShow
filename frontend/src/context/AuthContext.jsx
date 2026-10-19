import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi } from '../api/authApi';

const AuthContext = createContext(null);

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }
};

const extractUserFromToken = (token) => {
  const decoded = parseJwt(token);
  if (!decoded) return null;

  // Check expiration
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    return null;
  }

  // Normalize role
  let role = decoded.role || decoded.roles?.[0] || decoded.authorities?.[0] || 'USER';
  if (typeof role === 'string' && role.startsWith('ROLE_')) {
    role = role.replace('ROLE_', '');
  }

  return {
    ...decoded,
    name: decoded.name || decoded.sub || 'User',
    email: decoded.email || decoded.sub || '',
    role: role,
    sub: decoded.sub,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const parsedUser = extractUserFromToken(token);
      if (parsedUser) {
        setUser(parsedUser);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await loginApi(credentials);
    const { accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    const parsedUser = extractUserFromToken(accessToken);
    setUser(parsedUser);
    return response.data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await logoutApi({ refreshToken });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const isAdmin = () => {
    if (!user) return false;
    const role = user.role?.toUpperCase();
    return (
      role === 'ADMIN' ||
      role === 'ROLE_ADMIN' ||
      (Array.isArray(user.roles) && user.roles.some((r) => r.toUpperCase().includes('ADMIN')))
    );
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
