import { useState, useEffect } from 'react';
import { User } from '../types';
import { mockUsers } from '../utils/mockData';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check against mock users
    const foundUser = mockUsers.find(u => u.username === username);
    
    if (foundUser && password === 'password') {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return true;
    }
    
    return false;
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return { user, login, logout, loading };
};