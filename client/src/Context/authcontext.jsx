import {
  useEffect,
  useState,
} from 'react';

import AuthContext from './authContextValue';

import {
  registerUser as registerUserService,
  loginUser as loginUserService,
} from '../Service/api';

import API from '../Service/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('token') || null
  );

  const [loading, setLoading] = useState(true);

  // Restore authentication when the app reloads
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('token');

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get('/auth/profile');

        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Register an applicant
  const register = async (formData) => {
    const response = await registerUserService(formData);
    return response;
  };

  // Log in a user
  const login = async (credentials) => {
    const response = await loginUserService(credentials);

    if (!response.token) {
      throw new Error('The server did not return an authentication token.');
    }

    setToken(response.token);
    setUser(response);

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));

    return response;
  };

  // Log out a user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
