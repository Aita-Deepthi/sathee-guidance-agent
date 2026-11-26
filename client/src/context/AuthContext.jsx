import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  // Restore the session on page load (persistent login)
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('sathee:logout', onLogout);
    return () => window.removeEventListener('sathee:logout', onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    tokenStore.set(res.data.token);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    tokenStore.set(res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    return res.data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
