import { useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI, getAuthToken } from '../utils/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Verify token and get user profile
      authAPI.getProfile()
        .then(response => {
          if (response.success) {
            setUser(response.data);
          }
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('authToken');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(username, password);
      if (response.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
    }
  };

  return { user, login, logout, loading };
};