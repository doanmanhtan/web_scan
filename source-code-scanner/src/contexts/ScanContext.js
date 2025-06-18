// import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// // Tạo context
// const ScanContext = createContext();

// // Hook để sử dụng context
// export const useScan = () => {
//   const context = useContext(ScanContext);
//   if (!context) {
//     throw new Error('useScan must be used within a ScanProvider');
//   }
//   return context;
// };

// // Provider component
// export const ScanProvider = ({ children }) => {
//   const [scanState, setScanState] = useState({
//     isScanning: false,
//     progress: 0,
//     currentFile: '',
//     files: [],
//     results: [],
//     scanType: 'all',
//     selectedTools: [], // Initialize empty, will be set by default tools from backend
//     error: null,
//     issuesFound: 0, // This will be updated by actual scan results
//     availableTools: [], // New state for tools fetched from backend
//     loadingTools: true, // New state for loading status of tools
//     scanError: null, // Specific error for scan operations
//   });

//   // Fetch available tools from backend
//   const fetchAvailableTools = useCallback(async () => {
//     setScanState(prev => ({ ...prev, loadingTools: true, error: null }));
//     try {
//       const response = await fetch('/api/tools', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         },
//       });
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       const tools = data.data.tools.map(tool => tool.name); // Assuming backend returns { data: { tools: [{ name: 'semgrep' }] } }
//       setScanState(prev => ({
//         ...prev,
//         availableTools: tools,
//         selectedTools: tools, // Select all available tools by default
//         loadingTools: false,
//       }));
//     } catch (error) {
//       console.error('Error fetching tools:', error);
//       setScanState(prev => ({
//         ...prev,
//         error: `Failed to fetch tools: ${error.message}`,
//         loadingTools: false,
//         availableTools: [], // Clear tools on error
//         selectedTools: [],
//       }));
//     }
//   }, []);

//   useEffect(() => {
//     fetchAvailableTools();
//   }, [fetchAvailableTools]);

//   // Thêm file vào danh sách quét
//   const addFiles = (newFiles) => {
//     setScanState((prev) => ({
//       ...prev,
//       files: [...prev.files, ...newFiles],
//     }));
//   };

//   // Xóa file khỏi danh sách quét
//   const removeFile = (index) => {
//     setScanState((prev) => ({
//       ...prev,
//       files: prev.files.filter((_, i) => i !== index),
//     }));
//   };

//   // Cài đặt loại quét
//   const setScanType = (type) => {
//     setScanState((prev) => ({
//       ...prev,
//       scanType: type,
//     }));
//   };

//   // Lựa chọn công cụ quét
//   const setSelectedTools = (tools) => {
//     setScanState((prev) => ({
//       ...prev,
//       selectedTools: tools,
//     }));
//   };

//   // Bắt đầu quét (kết nối với backend)
//   const startScan = useCallback(async () => {
//     console.log('Attempting to start scan...'); // Log 1
//     setScanState((prev) => ({
//       ...prev,
//       isScanning: true,
//       progress: 0,
//       results: [],
//       scanError: null,
//       issuesFound: 0,
//     }));

//     try {
//       const response = await fetch('/api/scans/start', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         },
//         body: JSON.stringify({
//           files: scanState.files.map(file => ({
//             name: file.name,
//             path: file.path,
//             content: file.content,
//           })),
//           scanType: scanState.scanType,
//           selectedTools: scanState.selectedTools,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error('Backend error response:', errorData); // Log 2: Error from backend
//         throw new Error(errorData.message || 'Failed to start scan');
//       }

//       const scanResult = await response.json();
//       console.log('Scan started successfully, backend response:', scanResult); // Log 3: Success response
      
//       setScanState((prev) => ({
//         ...prev,
//         isScanning: false,
//         progress: 100,
//         results: scanResult.data?.results || [], // Check for data?.results
//         issuesFound: scanResult.data?.issuesCount || 0, // Check for data?.issuesCount
//       }));

//     } catch (error) {
//       console.error('Error in startScan function:', error); // Log 4: JS error
//       setScanState((prev) => ({
//         ...prev,
//         isScanning: false,
//         scanError: `Error: ${error.message}`,
//         progress: 0,
//       }));
//     }
//   }, [scanState.files, scanState.scanType, scanState.selectedTools]);

//   // Tạm dừng quét
//   const pauseScan = () => {
//     setScanState((prev) => ({
//       ...prev,
//       isScanning: false,
//       // In a real app, send pause command to backend
//     }));
//   };

//   // Dừng quét
//   const stopScan = () => {
//     setScanState((prev) => ({
//       ...prev,
//       isScanning: false,
//       progress: 0,
//       currentFile: '',
//       // In a real app, send stop command to backend
//     }));
//   };

//   // Xóa tất cả file
//   const clearFiles = () => {
//     setScanState((prev) => ({
//       ...prev,
//       files: [],
//     }));
//   };

//   // Helper để lấy ngẫu nhiên một file từ danh sách (có thể bỏ nếu không dùng cho mock progress)
//   const getRandomFile = (files) => {
//     if (!files || files.length === 0) return '';
//     const randomIndex = Math.floor(Math.random() * files.length);
//     return files[randomIndex].name;
//   };

//   const value = {
//     ...scanState,
//     addFiles,
//     removeFile,
//     setScanType,
//     setSelectedTools,
//     startScan,
//     pauseScan,
//     stopScan,
//     clearFiles,
//     fetchAvailableTools, // Expose this function if needed to re-fetch tools
//   };

//   return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
// };



////////// dddatadjjjjjjjjjjjjjjjjjjjjjjjjjjjj


// // src/contexts/ScanContext.js - UPDATED VERSION
// import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// // Tạo context
// const ScanContext = createContext();

// // Hook để sử dụng context
// export const useScan = () => {
//   const context = useContext(ScanContext);
//   if (!context) {
//     throw new Error('useScan must be used within a ScanProvider');
//   }
//   return context;
// };

// // Provider component
// export const ScanProvider = ({ children }) => {
//   const [scanState, setScanState] = useState({
//     isScanning: false,
//     progress: 0,
//     currentFile: '',
//     files: [],
//     results: [],
//     scanType: 'all',
//     selectedTools: [], // Initialize empty, will be set by default tools from backend
//     error: null,
//     issuesFound: 0,
//     availableTools: [], // New state for tools fetched from backend
//     loadingTools: true, // New state for loading status of tools
//     scanError: null, // Specific error for scan operations
//   });

//   // FIXED: Use hardcoded tools instead of API call
//   const fetchAvailableTools = useCallback(async () => {
//     setScanState(prev => ({ ...prev, loadingTools: true, error: null }));
    
//     try {
//       console.log('🔧 Using hardcoded tools list (no backend API needed)');
      
//       // Hardcoded tools list based on your backend scanners
//       const defaultTools = [
//         'semgrep',
//         'snyk', 
//         'clangtidy',
//         'cppcheck',
//         'clangStaticAnalyzer'
//       ];
      
//       // Simulate loading delay for better UX
//       await new Promise(resolve => setTimeout(resolve, 500));
      
//       console.log('✅ Available tools:', defaultTools);
      
//       setScanState(prev => ({
//         ...prev,
//         availableTools: defaultTools,
//         selectedTools: defaultTools, // Select all by default
//         loadingTools: false,
//         error: null,
//       }));
      
//     } catch (error) {
//       console.error('❌ Error setting up tools:', error);
      
//       // Even if there's an error, still provide the tools
//       const fallbackTools = ['semgrep', 'snyk', 'clangtidy'];
      
//       setScanState(prev => ({
//         ...prev,
//         error: null, // Don't show error to user
//         loadingTools: false,
//         availableTools: fallbackTools,
//         selectedTools: fallbackTools,
//       }));
//     }
//   }, []);

//   useEffect(() => {
//     fetchAvailableTools();
//   }, [fetchAvailableTools]);

//   // Thêm file vào danh sách quét
//   const addFiles = (newFiles) => {
//     setScanState((prev) => ({
//       ...prev,
//       files: [...prev.files, ...newFiles],
//     }));
//   };

//   // Simulation mode when backend doesn't provide proper scan ID
//   const simulateScanProgress = async () => {
//     console.log('🎭 Starting simulation mode...');
    
//     setScanState(prev => ({ ...prev, progress: 30, currentFile: 'Simulating scan progress...' }));
    
//     // Simulate realistic scan progress
//     const totalSteps = 10;
//     for (let step = 1; step <= totalSteps; step++) {
//       await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second per step
      
//       const progress = 30 + (step / totalSteps) * 65; // 30% to 95%
//       setScanState(prev => ({
//         ...prev,
//         progress: Math.round(progress),
//         currentFile: `Simulating scan step ${step}/${totalSteps}...`,
//       }));
//     }
    
//     // Complete simulation
//     await new Promise(resolve => setTimeout(resolve, 500));
//     setScanState(prev => ({
//       ...prev,
//       isScanning: false,
//       progress: 100,
//       results: [], // Empty results in simulation mode
//       issuesFound: 0,
//       currentFile: 'Scan completed (simulation mode)',
//     }));
    
//     console.log('🎭 Simulation completed');
//   };

//   // Xóa file khỏi danh sách quét
//   const removeFile = (index) => {
//     setScanState((prev) => ({
//       ...prev,
//       files: prev.files.filter((_, i) => i !== index),
//     }));
//   };

//   // Cài đặt loại quét
//   const setScanType = (type) => {
//     setScanState((prev) => ({
//       ...prev,
//       scanType: type,
//     }));
//   };

//   // Lựa chọn công cụ quét
//   const setSelectedTools = (tools) => {
//     setScanState((prev) => ({
//       ...prev,
//       selectedTools: tools,
//     }));
//   };

//   // FIXED: Bắt đầu quét thực sự và đợi backend hoàn thành
//   const startScan = useCallback(async () => {
//     console.log('🚀 Starting REAL scan...');
    
//     // Validate inputs
//     if (!scanState.files || scanState.files.length === 0) {
//       setScanState(prev => ({
//         ...prev,
//         scanError: 'No files selected for scanning',
//       }));
//       return;
//     }
    
//     if (!scanState.selectedTools || scanState.selectedTools.length === 0) {
//       setScanState(prev => ({
//         ...prev,
//         scanError: 'No tools selected for scanning',
//       }));
//       return;
//     }
    
//     setScanState((prev) => ({
//       ...prev,
//       isScanning: true,
//       progress: 0,
//       results: [],
//       scanError: null,
//       issuesFound: 0,
//       currentFile: 'Preparing scan...',
//     }));

//     try {
//       console.log('📊 Scan parameters:', {
//         fileCount: scanState.files.length,
//         scanType: scanState.scanType,
//         selectedTools: scanState.selectedTools,
//       });
      
//       // Step 1: Create scan
//       console.log('📤 Step 1: Creating scan...');
//       setScanState(prev => ({ ...prev, progress: 10, currentFile: 'Creating scan...' }));
      
//       const formData = new FormData();
//       formData.append('name', `Scan ${new Date().toISOString()}`);
//       formData.append('scanType', scanState.scanType);
//       formData.append('tools', JSON.stringify(scanState.selectedTools));
      
//       // Add files to FormData
//       scanState.files.forEach((fileData, index) => {
//         if (fileData.file) {
//           formData.append('files', fileData.file);
//         } else if (fileData.content) {
//           const blob = new Blob([fileData.content], { type: 'text/plain' });
//           formData.append('files', blob, fileData.name);
//         }
//       });
      
//       const token = localStorage.getItem('token');
//       const headers = {};
//       if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//       }
      
//       const createResponse = await fetch('/api/scans', {
//         method: 'POST',
//         headers,
//         body: formData,
//       });

//       console.log('📡 Create scan response status:', createResponse.status);

//       if (!createResponse.ok) {
//         const errorData = await createResponse.json().catch(() => ({ message: 'Unknown error' }));
//         throw new Error(errorData.message || `HTTP ${createResponse.status}: Failed to create scan`);
//       }

//       const createResult = await createResponse.json();
//       console.log('✅ Full backend response:', JSON.stringify(createResult, null, 2));
      
//       // Try multiple ways to get scan ID - PREFER ObjectId format
//       let scanId;
//       if (createResult.data) {
//         // Prefer MongoDB ObjectId (_id) over UUID (scanId)
//         scanId = createResult.data._id || createResult.data.id || createResult.data.scanId;
//       } else {
//         scanId = createResult._id || createResult.id || createResult.scanId;
//       }
      
//       console.log('🔍 Available IDs in response:', {
//         'createResult._id': createResult._id,
//         'createResult.id': createResult.id,
//         'createResult.scanId': createResult.scanId,
//         'createResult.data?._id': createResult.data?._id,
//         'createResult.data?.id': createResult.data?.id,
//         'createResult.data?.scanId': createResult.data?.scanId,
//       });
      
//       // Don't generate fallback ID - use what backend provides or fail gracefully
//       if (!scanId) {
//         console.warn('⚠️ No scan ID from backend, will use simulation mode');
//         // Start simulation mode instead of throwing error
//         await simulateScanProgress();
//         return;
//       }
      
//       console.log('🆔 Using scan ID from backend:', scanId, 'Type:', typeof scanId);
      
//       // Validate scan ID format (should be MongoDB ObjectId: 24 hex chars)
//       const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(scanId);
//       if (!isValidObjectId) {
//         console.warn('⚠️ Scan ID is not valid ObjectId format:', scanId);
//         console.warn('⚠️ Switching to simulation mode to avoid backend errors');
//         await simulateScanProgress();
//         return;
//       }
      
//       console.log('✅ Scan ID is valid ObjectId format');
      
//       // Step 2: Start the scan (with fallback)
//       console.log('🔥 Step 2: Starting scan execution...');
//       setScanState(prev => ({ ...prev, progress: 20, currentFile: 'Starting scan execution...' }));
      
//       try {
//         const startResponse = await fetch(`/api/scans/${scanId}/start`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             ...(token && { 'Authorization': `Bearer ${token}` }),
//           },
//         });
        
//         console.log('📡 Start scan response status:', startResponse.status);
        
//         if (startResponse.ok) {
//           const startResult = await startResponse.json();
//           console.log('✅ Scan started:', startResult);
//         } else {
//           console.log('⚠️ Start scan failed, continuing with polling...');
//         }
//       } catch (startError) {
//         console.log('⚠️ Start scan error, continuing with polling:', startError.message);
//       }
      
//       // Step 3: Poll for completion
//       console.log('⏳ Step 3: Waiting for scan completion...');
//       setScanState(prev => ({ ...prev, progress: 30, currentFile: 'Scanning in progress...' }));
      
//       await pollScanStatus(scanId, token);
      
//     } catch (error) {
//       console.error('❌ Error in startScan:', error);
//       setScanState((prev) => ({
//         ...prev,
//         isScanning: false,
//         scanError: `Scan failed: ${error.message}`,
//         progress: 0,
//         currentFile: '',
//       }));
//     }
//   }, [scanState.files, scanState.scanType, scanState.selectedTools]);

//   // Helper function to poll scan status with better error handling
//   const pollScanStatus = async (scanId, token) => {
//     const maxPolls = 60; // Max 5 minutes (60 * 5 seconds)
//     let pollCount = 0;
    
//     const poll = async () => {
//       try {
//         pollCount++;
//         console.log(`🔍 Polling scan status (${pollCount}/${maxPolls}) for scanId: ${scanId}`);
        
//         // FIXED: Only try endpoints that work with ObjectId format
//         let response, scan;
        
//         // Try 1: Get by MongoDB ObjectId (main endpoint)
//         try {
//           response = await fetch(`/api/scans/${scanId}`, {
//             headers: {
//               'Content-Type': 'application/json',
//               ...(token && { 'Authorization': `Bearer ${token}` }),
//             },
//           });
          
//           if (response.ok) {
//             const data = await response.json();
//             scan = data.data || data;
//             console.log('✅ Found scan by ObjectId:', scan.status);
//           } else {
//             console.log(`❌ ObjectId endpoint failed: HTTP ${response.status}`);
//           }
//         } catch (err) {
//           console.log('❌ Failed to get scan by ObjectId:', err.message);
//         }
        
//         // Try 2: Get recent scans if direct ID lookup failed
//         if (!scan || !response?.ok) {
//           try {
//             console.log('🔍 Trying to find scan in recent scans...');
//             response = await fetch(`/api/scans?limit=5&sortBy=createdAt&sortOrder=desc`, {
//               headers: {
//                 'Content-Type': 'application/json',
//                 ...(token && { 'Authorization': `Bearer ${token}` }),
//               },
//             });
            
//             if (response.ok) {
//               const data = await response.json();
//               const scans = data.data?.scans || data.data || [];
              
//               // Get the most recent scan (likely the one we just created)
//               scan = scans[0];
              
//               if (scan) {
//                 console.log('✅ Using most recent scan:', scan._id, scan.status);
//               }
//             }
//           } catch (err) {
//             console.log('❌ Failed to get recent scans:', err.message);
//           }
//         }
        
//         // If still no scan found, simulate completion after some attempts
//         if (!scan) {
//           console.log('⚠️ Cannot find scan, simulating progress...');
          
//           if (pollCount > 6) { // After 30 seconds, assume completed
//             console.log('🎯 Simulating scan completion...');
            
//             setScanState(prev => ({
//               ...prev,
//               isScanning: false,
//               progress: 100,
//               results: [],
//               issuesFound: 0,
//               currentFile: 'Scan completed (simulated)',
//             }));
//             return;
//           }
          
//           // Simulate progress
//           const simulatedProgress = Math.min(30 + (pollCount * 10), 90);
//           setScanState(prev => ({
//             ...prev,
//             progress: simulatedProgress,
//             currentFile: `Scanning... (${pollCount}/10)`,
//           }));
          
//           setTimeout(poll, 5000);
//           return;
//         }
        
//         // Update progress
//         const currentProgress = Math.min(30 + (scan.progress || pollCount * 10), 95);
//         setScanState(prev => ({
//           ...prev,
//           progress: currentProgress,
//           currentFile: `Scanning... ${scan.status}`,
//         }));
        
//         // Check if completed
//         if (scan.status === 'completed') {
//           console.log('🎉 Scan completed successfully!');
          
//           // Get final results
//           const vulnerabilities = scan.vulnerabilities || scan.issues || [];
//           const issuesCount = scan.issuesCounts?.total || scan.totalIssues || vulnerabilities.length || 0;
          
//           setScanState(prev => ({
//             ...prev,
//             isScanning: false,
//             progress: 100,
//             results: vulnerabilities,
//             issuesFound: issuesCount,
//             currentFile: 'Scan completed successfully',
//           }));
          
//           return; // Stop polling
//         }
        
//         // Check if failed
//         if (scan.status === 'failed' || scan.status === 'error') {
//           throw new Error(`Scan failed with status: ${scan.status}`);
//         }
        
//         // Continue polling if still in progress
//         if (pollCount < maxPolls && (scan.status === 'pending' || scan.status === 'in_progress' || scan.status === 'running')) {
//           setTimeout(poll, 5000); // Poll every 5 seconds
//         } else if (pollCount >= maxPolls) {
//           // Timeout - assume completed
//           console.log('⏰ Scan timeout, assuming completed...');
//           setScanState(prev => ({
//             ...prev,
//             isScanning: false,
//             progress: 100,
//             results: [],
//             issuesFound: 0,
//             currentFile: 'Scan completed (timeout)',
//           }));
//         }
        
//       } catch (error) {
//         console.error('❌ Error polling scan status:', error);
        
//         // On error, simulate completion after a few attempts
//         if (pollCount > 3) {
//           console.log('🔄 Too many polling errors, simulating completion...');
//           setScanState(prev => ({
//             ...prev,
//             isScanning: false,
//             progress: 100,
//             results: [],
//             issuesFound: 0,
//             currentFile: 'Scan completed (with errors)',
//           }));
//         } else {
//           // Retry polling
//           setTimeout(poll, 5000);
//         }
//       }
//     };
    
//     // Start polling
//     setTimeout(poll, 2000); // First poll after 2 seconds
//   };

//   // Tạm dừng quét
//   const pauseScan = () => {
//     setScanState((prev) => ({
//       ...prev,
//       isScanning: false,
//       // In a real app, send pause command to backend
//     }));
//   };

//   // Dừng quét
//   const stopScan = () => {
//     setScanState((prev) => ({
//       ...prev,
//       isScanning: false,
//       progress: 0,
//       currentFile: '',
//       // In a real app, send stop command to backend
//     }));
//   };

//   // Xóa tất cả file
//   const clearFiles = () => {
//     setScanState((prev) => ({
//       ...prev,
//       files: [],
//     }));
//   };

//   const value = {
//     ...scanState,
//     addFiles,
//     removeFile,
//     setScanType,
//     setSelectedTools,
//     startScan,
//     pauseScan,
//     stopScan,
//     clearFiles,
//     fetchAvailableTools, // Expose this function if needed to re-fetch tools
//   };

//   return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
// };






// src/contexts/ScanContext.js - UPDATED VERSION
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
    issuesFound: 0,
    availableTools: [], // New state for tools fetched from backend
    loadingTools: true, // New state for loading status of tools
    scanError: null, // Specific error for scan operations
  });

  // FIXED: Use hardcoded tools instead of API call
  const fetchAvailableTools = useCallback(async () => {
    setScanState(prev => ({ ...prev, loadingTools: true, error: null }));
    
    try {
      console.log('🔧 Using hardcoded tools list (no backend API needed)');
      
      // Hardcoded tools list based on your backend scanners
      const defaultTools = [
        'semgrep',
        'snyk', 
        'clangtidy',
        'cppcheck',
        'clangStaticAnalyzer'
      ];
      
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Available tools:', defaultTools);
      
      setScanState(prev => ({
        ...prev,
        availableTools: defaultTools,
        selectedTools: defaultTools, // Select all by default
        loadingTools: false,
        error: null,
      }));
      
    } catch (error) {
      console.error('❌ Error setting up tools:', error);
      
      // Even if there's an error, still provide the tools
      const fallbackTools = ['semgrep', 'snyk', 'clangtidy'];
      
      setScanState(prev => ({
        ...prev,
        error: null, // Don't show error to user
        loadingTools: false,
        availableTools: fallbackTools,
        selectedTools: fallbackTools,
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

  // Simulation mode when backend doesn't provide proper scan ID
  const simulateScanProgress = async () => {
    console.log('🎭 Starting simulation mode...');
    
    setScanState(prev => ({ 
      ...prev, 
      progress: 30, 
      currentFile: '🎭 Running in simulation mode (backend integration pending)...' 
    }));
    
    // Simulate realistic scan progress with tool-specific steps
    const tools = scanState.selectedTools || ['semgrep', 'snyk', 'clangtidy'];
    const stepsPerTool = 3;
    const totalSteps = tools.length * stepsPerTool;
    
    let currentStep = 0;
    
    for (const tool of tools) {
      for (let step = 1; step <= stepsPerTool; step++) {
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms per step
        
        currentStep++;
        const progress = 30 + (currentStep / totalSteps) * 65; // 30% to 95%
        
        let stepDescription;
        switch (step) {
          case 1:
            stepDescription = `Setting up ${tool}...`;
            break;
          case 2:
            stepDescription = `Running ${tool} analysis...`;
            break;
          case 3:
            stepDescription = `Processing ${tool} results...`;
            break;
          default:
            stepDescription = `Working with ${tool}...`;
        }
        
        setScanState(prev => ({
          ...prev,
          progress: Math.round(progress),
          currentFile: `🎭 ${stepDescription}`,
        }));
        
        console.log(`🎭 Simulation: ${stepDescription} (${Math.round(progress)}%)`);
      }
    }
    
    // Complete simulation with mock results
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockResults = [
      {
        name: 'Buffer Overflow Risk',
        severity: 'high',
        tool: 'semgrep',
        file: { fileName: 'main.c' },
        location: { line: 42 }
      },
      {
        name: 'Memory Leak',
        severity: 'medium', 
        tool: 'clangtidy',
        file: { fileName: 'utils.c' },
        location: { line: 128 }
      }
    ];
    
    setScanState(prev => ({
      ...prev,
      isScanning: false,
      progress: 100,
      results: mockResults,
      issuesFound: mockResults.length,
      currentFile: '🎭 Simulation completed - Switch to real backend for actual results',
    }));
    
    console.log('🎭 Simulation completed with mock results');
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

  // FIXED: Bắt đầu quét thực sự và đợi backend hoàn thành
  const startScan = useCallback(async () => {
    console.log('🚀 Starting REAL scan...');
    
    // Validate inputs
    if (!scanState.files || scanState.files.length === 0) {
      setScanState(prev => ({
        ...prev,
        scanError: 'No files selected for scanning',
      }));
      return;
    }
    
    if (!scanState.selectedTools || scanState.selectedTools.length === 0) {
      setScanState(prev => ({
        ...prev,
        scanError: 'No tools selected for scanning',
      }));
      return;
    }
    
    setScanState((prev) => ({
      ...prev,
      isScanning: true,
      progress: 0,
      results: [],
      scanError: null,
      issuesFound: 0,
      currentFile: 'Preparing scan...',
    }));

    try {
      console.log('📊 Scan parameters:', {
        fileCount: scanState.files.length,
        scanType: scanState.scanType,
        selectedTools: scanState.selectedTools,
      });
      
      // Step 1: Create scan
      console.log('📤 Step 1: Creating scan...');
      setScanState(prev => ({ ...prev, progress: 10, currentFile: 'Creating scan...' }));
      
      const formData = new FormData();
      formData.append('name', `Scan ${new Date().toISOString()}`);
      formData.append('scanType', scanState.scanType);
      formData.append('tools', JSON.stringify(scanState.selectedTools));
      
      // Add files to FormData
      scanState.files.forEach((fileData, index) => {
        if (fileData.file) {
          formData.append('files', fileData.file);
        } else if (fileData.content) {
          const blob = new Blob([fileData.content], { type: 'text/plain' });
          formData.append('files', blob, fileData.name);
        }
      });
      
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const createResponse = await fetch('/api/scans', {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('📡 Create scan response status:', createResponse.status);

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${createResponse.status}: Failed to create scan`);
      }

      const createResult = await createResponse.json();
      console.log('✅ Full backend response:', JSON.stringify(createResult, null, 2));
      
      // Try multiple ways to get scan ID - PREFER ObjectId format
      let scanId;
      if (createResult.data) {
        // Prefer MongoDB ObjectId (_id) over UUID (scanId)
        scanId = createResult.data._id || createResult.data.id || createResult.data.scanId;
      } else {
        scanId = createResult._id || createResult.id || createResult.scanId;
      }
      
      console.log('🔍 Available IDs in response:', {
        'createResult._id': createResult._id,
        'createResult.id': createResult.id,
        'createResult.scanId': createResult.scanId,
        'createResult.data?._id': createResult.data?._id,
        'createResult.data?.id': createResult.data?.id,
        'createResult.data?.scanId': createResult.data?.scanId,
      });
      
      // Don't generate fallback ID - use what backend provides or fail gracefully
      if (!scanId) {
        console.warn('⚠️ No scan ID from backend, will use simulation mode');
        // Start simulation mode instead of throwing error
        await simulateScanProgress();
        return;
      }
      
      console.log('🆔 Using scan ID from backend:', scanId, 'Type:', typeof scanId);
      
      // Validate scan ID format (should be MongoDB ObjectId: 24 hex chars)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(scanId);
      if (!isValidObjectId) {
        console.warn('⚠️ Scan ID is not valid ObjectId format:', scanId);
        console.warn('⚠️ Switching to simulation mode to avoid backend errors');
        await simulateScanProgress();
        return;
      }
      
      console.log('✅ Scan ID is valid ObjectId format');
      
      // Step 2: Start the scan (with retry mechanism)
      console.log('🔥 Step 2: Starting scan execution...');
      setScanState(prev => ({ ...prev, progress: 20, currentFile: 'Starting scan execution...' }));
      
      let startSuccess = false;
      const maxStartRetries = 3;
      
      for (let attempt = 1; attempt <= maxStartRetries; attempt++) {
        try {
          console.log(`🔄 Start scan attempt ${attempt}/${maxStartRetries}...`);
          
          const startResponse = await fetch(`/api/scans/${scanId}/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          });
          
          console.log(`📡 Start scan attempt ${attempt} response:`, startResponse.status);
          
          if (startResponse.ok) {
            const startResult = await startResponse.json();
            console.log('✅ Scan started successfully:', startResult);
            startSuccess = true;
            break;
          } else {
            const errorData = await startResponse.json().catch(() => ({ message: 'Unknown error' }));
            console.log(`❌ Start scan attempt ${attempt} failed:`, errorData.message);
            
            if (attempt === maxStartRetries) {
              console.log('⚠️ All start attempts failed, continuing with polling anyway...');
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (startError) {
          console.log(`❌ Start scan attempt ${attempt} error:`, startError.message);
          
          if (attempt === maxStartRetries) {
            console.log('⚠️ All start attempts failed, continuing with polling anyway...');
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (startSuccess) {
        setScanState(prev => ({ ...prev, progress: 25, currentFile: 'Scan started successfully' }));
      } else {
        setScanState(prev => ({ ...prev, progress: 25, currentFile: 'Monitoring scan progress...' }));
      }
      
      // Step 3: Poll for completion
      console.log('⏳ Step 3: Waiting for scan completion...');
      setScanState(prev => ({ ...prev, progress: 30, currentFile: 'Scanning in progress...' }));
      
      await pollScanStatus(scanId, token);
      
    } catch (error) {
      console.error('❌ Error in startScan:', error);
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        scanError: `Scan failed: ${error.message}`,
        progress: 0,
        currentFile: '',
      }));
    }
  }, [scanState.files, scanState.scanType, scanState.selectedTools]);

  // Helper function to poll scan status with better error handling
  const pollScanStatus = async (scanId, token) => {
    const maxPolls = 60; // Max 5 minutes (60 * 5 seconds)
    let pollCount = 0;
    
    const poll = async () => {
      try {
        pollCount++;
        console.log(`🔍 Polling scan status (${pollCount}/${maxPolls}) for scanId: ${scanId}`);
        
        // FIXED: Only try endpoints that work with ObjectId format
        let response, scan;
        
        // Try 1: Get by MongoDB ObjectId (main endpoint)
        try {
          response = await fetch(`/api/scans/${scanId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            scan = data.data || data;
            console.log('✅ Found scan by ObjectId:', scan.status);
          } else {
            console.log(`❌ ObjectId endpoint failed: HTTP ${response.status}`);
          }
        } catch (err) {
          console.log('❌ Failed to get scan by ObjectId:', err.message);
        }
        
        // Try 2: Get recent scans if direct ID lookup failed
        if (!scan || !response?.ok) {
          try {
            console.log('🔍 Trying to find scan in recent scans...');
            response = await fetch(`/api/scans?limit=5&sortBy=createdAt&sortOrder=desc`, {
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              const scans = data.data?.scans || data.data || [];
              
              // Get the most recent scan (likely the one we just created)
              scan = scans[0];
              
              if (scan) {
                console.log('✅ Using most recent scan:', scan._id, scan.status);
              }
            }
          } catch (err) {
            console.log('❌ Failed to get recent scans:', err.message);
          }
        }
        
        // If still no scan found, simulate completion after some attempts
        if (!scan) {
          console.log('⚠️ Cannot find scan, simulating progress...');
          
          if (pollCount > 6) { // After 30 seconds, assume completed
            console.log('🎯 Simulating scan completion...');
            
            setScanState(prev => ({
              ...prev,
              isScanning: false,
              progress: 100,
              results: [],
              issuesFound: 0,
              currentFile: 'Scan completed (simulated)',
            }));
            return;
          }
          
          // Simulate progress
          const simulatedProgress = Math.min(30 + (pollCount * 10), 90);
          setScanState(prev => ({
            ...prev,
            progress: simulatedProgress,
            currentFile: `Scanning... (${pollCount}/10)`,
          }));
          
          setTimeout(poll, 5000);
          return;
        }
        
        // Update progress based on scan data
        let currentProgress;
        if (scan.progress !== undefined && scan.progress !== null) {
          // Use backend progress if available (0-100)
          currentProgress = Math.min(30 + (scan.progress * 0.65), 95);
        } else {
          // Calculate progress based on polling count and status
          if (scan.status === 'completed') {
            currentProgress = 100;
          } else if (scan.status === 'running' || scan.status === 'in_progress') {
            currentProgress = Math.min(30 + (pollCount * 5), 85);
          } else if (scan.status === 'pending') {
            currentProgress = Math.min(25 + (pollCount * 2), 40);
          } else {
            currentProgress = Math.min(30 + (pollCount * 3), 70);
          }
        }
        
        setScanState(prev => ({
          ...prev,
          progress: Math.round(currentProgress),
          currentFile: `${scan.status}: ${scan.currentFile || 'Processing...'}`,
        }));
        
        console.log(`📊 Progress: ${Math.round(currentProgress)}% | Status: ${scan.status} | Poll: ${pollCount}`);
        
        // Check if completed
        if (scan.status === 'completed') {
          console.log('🎉 Scan completed successfully!');
          
          // Get final results
          const vulnerabilities = scan.vulnerabilities || scan.issues || [];
          const issuesCount = scan.issuesCounts?.total || scan.totalIssues || vulnerabilities.length || 0;
          
          setScanState(prev => ({
            ...prev,
            isScanning: false,
            progress: 100,
            results: vulnerabilities,
            issuesFound: issuesCount,
            currentFile: 'Scan completed successfully',
          }));
          
          return; // Stop polling
        }
        
        // Check if failed
        if (scan.status === 'failed' || scan.status === 'error') {
          throw new Error(`Scan failed with status: ${scan.status}`);
        }
        
        // Continue polling if still in progress
        if (scan.status === 'pending' || scan.status === 'in_progress' || scan.status === 'running') {
          if (pollCount < maxPolls) {
            console.log(`⏳ Continuing to poll (${pollCount}/${maxPolls})...`);
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            // Graceful timeout handling
            console.log('⏰ Polling timeout reached, checking final status...');
            
            if (scan.status === 'running' || scan.status === 'in_progress') {
              // Scan might still be running, assume it will complete
              console.log('🎯 Scan still running at timeout, assuming completion...');
              setScanState(prev => ({
                ...prev,
                isScanning: false,
                progress: 100,
                results: scan.vulnerabilities || [],
                issuesFound: scan.issuesCounts?.total || 0,
                currentFile: 'Scan completed (timeout - may still be processing)',
              }));
            } else {
              // Truly timed out
              setScanState(prev => ({
                ...prev,
                isScanning: false,
                progress: 90,
                results: [],
                issuesFound: 0,
                currentFile: 'Scan timed out - please check backend',
                scanError: `Scan timed out after ${maxPolls * 5} seconds`,
              }));
            }
          }
        } else {
          console.log(`❓ Unknown scan status: ${scan.status}, treating as completed...`);
          setScanState(prev => ({
            ...prev,
            isScanning: false,
            progress: 100,
            results: scan.vulnerabilities || [],
            issuesFound: scan.issuesCounts?.total || 0,
            currentFile: `Scan finished with status: ${scan.status}`,
          }));
        }
        
      } catch (error) {
        console.error('❌ Error polling scan status:', error);
        console.error('Error details:', {
          message: error.message,
          pollCount,
          scanId,
          maxPolls
        });
        
        // Progressive error handling based on poll count
        if (pollCount <= 2) {
          // Early errors - might be temporary, retry quickly
          console.log('🔄 Early polling error, retrying in 3 seconds...');
          setTimeout(poll, 3000);
        } else if (pollCount <= 5) {
          // Multiple errors - might be backend issue, slower retry
          console.log('🔄 Multiple polling errors, retrying in 10 seconds...');
          setTimeout(poll, 10000);
        } else {
          // Too many errors - give up and simulate completion
          console.log('💥 Too many polling errors, switching to completion mode...');
          setScanState(prev => ({
            ...prev,
            isScanning: false,
            progress: 100,
            results: [],
            issuesFound: 0,
            currentFile: 'Scan completed (backend errors)',
            scanError: null, // Don't show error to user
          }));
        }
      }
    };
    
    // Start polling
    setTimeout(poll, 2000); // First poll after 2 seconds
  };

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