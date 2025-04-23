import React, { createContext, useState, useContext } from 'react';

// Tạo context
const ScanContext = createContext();

// Hook để sử dụng context
export const useScan = () => {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
};

// Provider component
export const ScanProvider = ({ children }) => {
  const [scanState, setScanState] = useState({
    isScanning: false,
    progress: 0,
    currentFile: '',
    files: [],
    results: [],
    scanType: 'all',
    selectedTools: ['semgrep', 'snyk', 'clangtidy'],
    error: null,
    issuesFound: 0,
  });

  // Thêm file vào danh sách quét
  const addFiles = (newFiles) => {
    setScanState((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));
  };

  // Xóa file khỏi danh sách quét
  const removeFile = (index) => {
    setScanState((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // Cài đặt loại quét
  const setScanType = (type) => {
    setScanState((prev) => ({
      ...prev,
      scanType: type,
    }));
  };

  // Lựa chọn công cụ quét
  const setSelectedTools = (tools) => {
    setScanState((prev) => ({
      ...prev,
      selectedTools: tools,
    }));
  };

  // Bắt đầu quét
  const startScan = () => {
    setScanState((prev) => ({
      ...prev,
      isScanning: true,
      progress: 0,
      results: [],
      error: null,
      issuesFound: 0,
    }));
    
    // Giả lập tiến trình quét
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      if (progress <= 100) {
        setScanState((prev) => ({
          ...prev,
          progress,
          currentFile: getRandomFile(prev.files),
          issuesFound: Math.floor(progress / 10),
        }));
      } else {
        clearInterval(interval);
        setScanState((prev) => ({
          ...prev,
          isScanning: false,
          progress: 100,
        }));
      }
    }, 800);
  };

  // Tạm dừng quét
  const pauseScan = () => {
    setScanState((prev) => ({
      ...prev,
      isScanning: false,
    }));
  };

  // Dừng quét
  const stopScan = () => {
    setScanState((prev) => ({
      ...prev,
      isScanning: false,
      progress: 0,
      currentFile: '',
    }));
  };

  // Xóa tất cả file
  const clearFiles = () => {
    setScanState((prev) => ({
      ...prev,
      files: [],
    }));
  };

  // Helper để lấy ngẫu nhiên một file từ danh sách
  const getRandomFile = (files) => {
    if (!files || files.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * files.length);
    return files[randomIndex].name;
  };

  const value = {
    ...scanState,
    addFiles,
    removeFile,
    setScanType,
    setSelectedTools,
    startScan,
    pauseScan,
    stopScan,
    clearFiles,
  };

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
};