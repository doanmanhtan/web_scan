// src/api/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

// Cấu hình multer để lưu file vào bộ nhớ
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Route test đơn giản - không yêu cầu xác thực
router.post('/upload-test', upload.array('files', 20), (req, res) => {
  try {
    console.log('============ TEST UPLOAD ============');
    console.log('Request files:', req.files ? req.files.length : 'undefined');
    console.log('Request body:', req.body);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được upload',
        requestHeaders: req.headers
      });
    }
    
    // Chi tiết về các file đã upload
    const fileDetails = req.files.map(file => ({
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer ? 'Buffer exists' : 'No buffer'
    }));
    
    res.status(200).json({
      success: true,
      message: 'Upload test thành công',
      filesCount: req.files.length,
      fileDetails,
      body: req.body
    });
  } catch (error) {
    console.error('Test upload error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Lỗi test upload',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;