import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextValue {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userName: string;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');

  // JWT 파싱
  function decodeJWT(token: string) {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      const claims = decodeJWT(accessToken);
      setIsLoggedIn(true);
      setUserName(claims?.name || claims?.username || claims?.email || '');
      setIsAdmin(Boolean(claims?.role === 'ADMIN' || claims?.roles?.includes('ADMIN') || claims?.isAdmin));
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUserName('');
    }
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const claims = decodeJWT(accessToken);
    setIsLoggedIn(true);
    setUserName(claims?.name || claims?.username || claims?.email || '');
    setIsAdmin(Boolean(claims?.role === 'ADMIN' || claims?.roles?.includes('ADMIN') || claims?.isAdmin));
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserName('');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
