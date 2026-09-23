import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export interface User {
  id: number;
  user_name: string;
  user_email: string;
  type: string; // 'admin' | 'packing' | 'box' | 'invoice' | 'gate'
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Purge any legacy persistent localStorage session to enforce login on open
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}

    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          sessionStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/login', { email, password: pass });
    sessionStorage.setItem('token', res.data.access_token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(res.data.user);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // Quick switch role utility for immediate demo & testing of all 5 personas
  const switchRole = async (role: string) => {
    const roleCredentials: Record<string, [string, string]> = {
      admin: ['admin@admin.com', 'admin'],
      packing: ['dpr@talbros.com', 'dpr'],
      box: ['fgs@talbros.com', 'fgs'],
      invoice: ['invoice@talbros.com', 'invoice'],
      gate: ['gate@talbros.com', 'gate'],
    };

    const creds = roleCredentials[role.toLowerCase()];
    if (creds) {
      await login(creds[0], creds[1]);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
