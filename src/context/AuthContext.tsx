import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import BASE_URL from '../utils/config';
import { User } from '../model/Users';

type AuthContextType = {
  userToken: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (refreshToken: string) => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  let isRefreshing = false;
  let refreshSubscribers: ((token: string | null) => void)[] = [];

  useEffect(() => {
    const loadData = async () => {
      const storedUserData = await SecureStore.getItemAsync('user');
      const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');

      if (storedUserData) {
        const { userInfo, accessToken } = JSON.parse(storedUserData);
        if (accessToken) {
          setUserToken(accessToken);
          setUser({ ...userInfo, refreshToken: storedRefreshToken });
        }
      }
    };
    loadData();
  }, []);

  // Hàm fetchWithAuth
  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let accessToken = userToken;
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    if (!accessToken) {
      await logout();
      throw new Error('No access token available');
    }

    // Khởi tạo headers nếu chưa có
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('Content-Type', 'application/json');

    // Tạo options mới với headers đã cập nhật
    const updatedOptions: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, updatedOptions);

    if (response.status === 401 && refreshToken) {
      console.warn('Token expired. Attempting to refresh token...');
      const newToken = await refreshAccessToken(refreshToken);
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, updatedOptions);
        if (!response.ok) {
          throw new Error(`Request failed after token refresh: ${response.status}`);
        }
      } else {
        await logout();
        throw new Error('Failed to refresh token');
      }
    }

    return response;
  };

  // Hàm làm mới token
  const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push(resolve);
      });
    }

    isRefreshing = true;
    try {
      const response = await fetch(`${BASE_URL}/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.message === 'Token refreshed') {
        const accessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;
        const updatedUser = { ...user, refreshToken: newRefreshToken } as User;

        await SecureStore.setItemAsync('user', JSON.stringify({ userInfo: user, accessToken }));
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        setUserToken(accessToken);
        setUser(updatedUser);

        refreshSubscribers.forEach((cb) => cb(accessToken));
        refreshSubscribers = [];
        return accessToken;
      } else {
        console.error('Refresh token failed:', data.message);
        refreshSubscribers.forEach((cb) => cb(null));
        refreshSubscribers = [];
        return null;
      }
    } catch (error) {
      console.error('Error during refresh token:', error);
      refreshSubscribers.forEach((cb) => cb(null));
      refreshSubscribers = [];
      return null;
    } finally {
      isRefreshing = false;
    }
  };

  // Hàm làm mới token (được export trong context)
  const refreshToken = async (refreshToken: string): Promise<void> => {
    const newToken = await refreshAccessToken(refreshToken);
    if (!newToken) {
      await logout();
      throw new Error('Failed to refresh token');
    }
  };

  // Hàm đăng nhập
  const signIn = async (phoneNumber: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          password: password,
          role: 'user',
        }),
      });

      const data = await response.json();

      if (data.message === 'Login successfully') {
        const userInfo = data.data.user;
        const accessToken = data.data.accessToken;
        const refreshToken = data.data.refreshToken;

        await SecureStore.setItemAsync('user', JSON.stringify({ userInfo, accessToken }));
        await SecureStore.setItemAsync('refreshToken', refreshToken);

        setUserToken(accessToken);
        setUser({ ...userInfo, refreshToken });
      } else {
        console.log('Login failed:', data.message);
        alert('Đăng nhập thất bại!');
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      alert('Lỗi kết nối!');
    }
  };

  // Hàm đăng xuất
  const logout = async (): Promise<void> => {
    if (!user || !userToken) {
      console.log('No user data available for logout');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('refreshToken');
      setUserToken(null);
      setUser(null);
      return;
    }

    try {
      const response = await fetchWithAuth(`${BASE_URL}/users/logout`, {
        method: 'POST',
        body: JSON.stringify({ id: user._id }),
      });

      const data = await response.json();

      if (data.message === 'Logged out successfully') {
        console.log('Logout successful');
      } else {
        console.log('Logout failed:', data.message);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('refreshToken');
      setUserToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, user, setUser, signIn, logout, refreshToken, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext in components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};