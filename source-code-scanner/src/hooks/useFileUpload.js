import { useState, useCallback } from 'react';

const useFileUpload = (options = {}) => {
  const { 
    acceptedTypes = [], 
    maxFileSize = Infinity,
    maxFiles = Infinity,
    onUploadStart,
    onUploadSuccess,
    onUploadError,
  } = options;
  
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const validateFile = useCallback((file) => {
    // Kiểm tra định dạng file
    if (acceptedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File type "${fileExtension}" is not supported. Accepted types: ${acceptedTypes.join(', ')}.`
        };
      }
    }

    // Kiểm tra kích thước file
    if (file.size > maxFileSize) {
      const maxSizeMB = maxFileSize / (1024 * 1024);
      return {
        isValid: false,
        error: `File is too large. Maximum size is ${maxSizeMB} MB.`
      };
    }

    return { isValid: true };
  }, [acceptedTypes, maxFileSize]);

  const uploadFiles = useCallback((fileList) => {
    setError(null);
    
    // Kiểm tra số lượng file
    if (fileList.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    // Validate từng file
    const validatedFiles = Array.from(fileList).map(file => {
      const validation = validateFile(file);
      return {
        file,
        ...validation
      };
    });

    // Kiểm tra nếu có lỗi
    const hasErrors = validatedFiles.some(item => !item.isValid);
    if (hasErrors) {
      const errorMessages = validatedFiles
        .filter(item => !item.isValid)
        .map(item => item.error)
        .join('\n');
      
      setError(errorMessages);
      
      if (onUploadError) {
        onUploadError(errorMessages);
      }
      
      return;
    }

    // Bắt đầu upload
    setIsUploading(true);
    setUploadProgress(0);
    
    if (onUploadStart) {
      onUploadStart(validatedFiles.map(item => item.file));
    }

    // Giả lập quá trình upload
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        
        const uploadedFiles = validatedFiles.map(item => {
          return {
            name: item.file.name,
            path: item.file.path || URL.createObjectURL(item.file),
            size: item.file.size,
            type: item.file.type,
            lastModified: item.file.lastModified,
            isDirectory: item.file.isDirectory || false,
          };
        });
        
        setFiles(prev => [...prev, ...uploadedFiles]);
        
        if (onUploadSuccess) {
          onUploadSuccess(uploadedFiles);
        }
      }
    }, 100);
  }, [maxFiles, validateFile, onUploadStart, onUploadSuccess, onUploadError]);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const removeFile = useCallback((indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  }, []);

  return {
    files,
    isUploading,
    uploadProgress,
    error,
    uploadFiles,
    clearFiles,
    removeFile
  };
};

export default useFileUpload;