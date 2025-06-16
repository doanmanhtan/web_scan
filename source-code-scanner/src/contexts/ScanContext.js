import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

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
    selectedTools: [], // Initialize empty, will be set by default tools from backend
    error: null,
    issuesFound: 0, // This will be updated by actual scan results
    availableTools: [], // New state for tools fetched from backend
    loadingTools: true, // New state for loading status of tools
    scanError: null, // Specific error for scan operations
  });

  // Fetch available tools from backend
  const fetchAvailableTools = useCallback(async () => {
    setScanState(prev => ({ ...prev, loadingTools: true, error: null }));
    try {
      const response = await fetch('/api/tools', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const tools = data.data.tools.map(tool => tool.name); // Assuming backend returns { data: { tools: [{ name: 'semgrep' }] } }
      setScanState(prev => ({
        ...prev,
        availableTools: tools,
        selectedTools: tools, // Select all available tools by default
        loadingTools: false,
      }));
    } catch (error) {
      console.error('Error fetching tools:', error);
      setScanState(prev => ({
        ...prev,
        error: `Failed to fetch tools: ${error.message}`,
        loadingTools: false,
        availableTools: [], // Clear tools on error
        selectedTools: [],
      }));
    }
  }, []);

  useEffect(() => {
    fetchAvailableTools();
  }, [fetchAvailableTools]);

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

  // Bắt đầu quét (kết nối với backend)
  const startScan = useCallback(async () => {
    console.log('Attempting to start scan...'); // Log 1
    setScanState((prev) => ({
      ...prev,
      isScanning: true,
      progress: 0,
      results: [],
      scanError: null,
      issuesFound: 0,
    }));

    try {
      const response = await fetch('/api/scans/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          files: scanState.files.map(file => ({
            name: file.name,
            path: file.path,
            content: file.content,
          })),
          scanType: scanState.scanType,
          selectedTools: scanState.selectedTools,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error response:', errorData); // Log 2: Error from backend
        throw new Error(errorData.message || 'Failed to start scan');
      }

      const scanResult = await response.json();
      console.log('Scan started successfully, backend response:', scanResult); // Log 3: Success response
      
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        progress: 100,
        results: scanResult.data?.results || [], // Check for data?.results
        issuesFound: scanResult.data?.issuesCount || 0, // Check for data?.issuesCount
      }));

    } catch (error) {
      console.error('Error in startScan function:', error); // Log 4: JS error
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        scanError: `Error: ${error.message}`,
        progress: 0,
      }));
    }
  }, [scanState.files, scanState.scanType, scanState.selectedTools]);

  // Tạm dừng quét
  const pauseScan = () => {
    setScanState((prev) => ({
      ...prev,
      isScanning: false,
      // In a real app, send pause command to backend
    }));
  };

  // Dừng quét
  const stopScan = () => {
    setScanState((prev) => ({
      ...prev,
      isScanning: false,
      progress: 0,
      currentFile: '',
      // In a real app, send stop command to backend
    }));
  };

  // Xóa tất cả file
  const clearFiles = () => {
    setScanState((prev) => ({
      ...prev,
      files: [],
    }));
  };

  // Helper để lấy ngẫu nhiên một file từ danh sách (có thể bỏ nếu không dùng cho mock progress)
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
    fetchAvailableTools, // Expose this function if needed to re-fetch tools
  };

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
};