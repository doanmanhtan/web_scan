import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useApi = () => {
  const { logout } = useAuth();

  const apiCall = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    // Thêm token vào headers nếu có
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Kiểm tra nếu response là 401 (Unauthorized)
      if (response.status === 401) {
        // Token expired hoặc không hợp lệ
        logout();
        throw new Error('Authentication expired. Please login again.');
      }

      // Kiểm tra nếu response không thành công
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      // Nếu là lỗi network hoặc lỗi khác
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }, [logout]);

  const get = useCallback((url, options = {}) => {
    return apiCall(url, { ...options, method: 'GET' });
  }, [apiCall]);

  const post = useCallback((url, data, options = {}) => {
    return apiCall(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [apiCall]);

  const put = useCallback((url, data, options = {}) => {
    return apiCall(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [apiCall]);

  const del = useCallback((url, options = {}) => {
    return apiCall(url, { ...options, method: 'DELETE' });
  }, [apiCall]);

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
  };
}; 