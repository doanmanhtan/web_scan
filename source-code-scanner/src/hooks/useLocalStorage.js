import { useState, useEffect } from 'react';

const useLocalStorage = (key, initialValue) => {
  // Hàm trạng thái để trả về giá trị từ localStorage hoặc initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Lấy giá trị từ localStorage
      const item = window.localStorage.getItem(key);
      // Parse để trả về một đối tượng thay vì một chuỗi JSON
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Nếu có lỗi, trả về initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Trả về một hàm wrapped để lưu cả state và localStorage
  const setValue = (value) => {
    try {
      // Cho phép value là một hàm giống như useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Lưu state
      setStoredValue(valueToStore);
      // Lưu vào localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Ghi log lỗi nếu có
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Đồng bộ giá trị từ localStorage nếu nó thay đổi trong tab khác
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        try {
          setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    // Lắng nghe sự kiện storage
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
};

export default useLocalStorage;