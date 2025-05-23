const scanService = require('../../services/scanService');
const { logger } = require('../../utils/logger');

/**
 * Scan controller
 */
const scanController = {
  /**
   * Create a new scan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  // createScan: async (req, res) => {
  //   try {
  //     console.log('Files received:', req.files ? req.files.length : 'undefined');
  //     console.log('Request body:', req.body);
  //     console.log('User info:', req.user);//them

  //     const scanData = req.body;
  //     const files = req.files;
  //     const userId = req.user.id;
      
  //     if (!files || files.length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'No files uploaded'
  //       });
  //     }
      
  //     const result = await scanService.createScan(scanData, files, userId);
      
  //     res.status(201).json({
  //       success: true,
  //       message: 'Scan created successfully',
  //       data: result
  //     });
  //   } catch (error) {
  //     // logger.error(`Error in createScan controller: ${error.message}`);
  //     logger.error(`Error in createScan controller: ${error?.message || 'Unknown error'}`);
      
  //     res.status(500).json({
  //       success: false,
  //       message: 'Error creating scan'
  //     });
  //   }
  // },
  createScan: async (req, res) => {
    try {
      console.log('Files received:', req.files ? req.files.length : 'undefined');
      console.log('Request body:', req.body);
      console.log('User info:', req.user);
      
      const scanData = req.body;
      const files = req.files;
      const userId = req.user?.id;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      try {
        console.log('Calling scanService.createScan with:', {
          scanData, 
          fileCount: files.length,
          userId
        });
        
        const result = await scanService.createScan(scanData, files, userId);
        
        res.status(201).json({
          success: true,
          message: 'Scan created successfully',
          data: result
        });
        }catch (serviceError) {
          console.error('Lỗi từ service:', serviceError);
          
          // Tạo thông báo lỗi cụ thể hơn dựa trên loại lỗi
          let errorMessage = 'Lỗi khi tạo quét';
          if (serviceError.code === 'ENOENT') {
            errorMessage = 'Lỗi hệ thống tệp - thư mục có thể không tồn tại';
          } else if (serviceError.name === 'ValidationError') {
            errorMessage = 'Dữ liệu quét không hợp lệ';
          }
          
          throw new Error(`${errorMessage}: ${serviceError.message || 'Lỗi không xác định'}`);
      // } catch (serviceError) {
      //   console.error('Error from service:', serviceError);
      //   // Không truy cập serviceError.error ở đây
      //   throw serviceError; // Ném lại lỗi để xử lý ở khối catch ngoài
      }
    } catch (error) {
      console.error('Controller error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error creating scan',
        details: error.message || 'Unknown error'
      });
    }
  },
  /**
   * Start a scan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  startScan: async (req, res) => {
    try {
      const scanId = req.params.id;
      console.log('Starting scan with ID:', scanId);
      
      if (!scanId) {
        return res.status(400).json({
          success: false,
          message: 'Scan ID is required'
        });
      }

      // First try to get scan by MongoDB ID
      let scan;
      try {
        scan = await scanService.getScanById(scanId);
      } catch (error) {
        // If MongoDB ID fails, try with scanId
        try {
          scan = await scanService.getScanByUniqueId(scanId);
        } catch (secondError) {
          return res.status(404).json({
            success: false,
            message: 'Scan not found'
          });
        }
      }

      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
      }

      const result = await scanService.startScan(scan._id);
      
      res.status(200).json({
        success: true,
        message: 'Scan started successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in startScan:', error);
      
      // Xử lý các loại lỗi cụ thể
      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
      }
      
      if (error.message && error.message.includes('already in progress')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message && error.message.includes('already completed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      // Xử lý lỗi chung
      res.status(500).json({
        success: false,
        message: 'Error starting scan',
        error: error.message || 'Unknown error'
      });
    }
  },

  /**
   * Get scan by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getScanById: async (req, res) => {
    try {
      const scanId = req.params.id;
      
      const scan = await scanService.getScanById(scanId);
      
      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: scan
      });
    } catch (error) {
      logger.error(`Error in getScanById controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching scan'
      });
    }
  },

  /**
   * Get scan by unique scan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getScanByUniqueId: async (req, res) => {
    try {
      const scanId = req.params.scanId;
      
      const scan = await scanService.getScanByUniqueId(scanId);
      
      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: scan
      });
    } catch (error) {
      logger.error(`Error in getScanByUniqueId controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching scan'
      });
    }
  },

  /**
   * Get all scans with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllScans: async (req, res) => {
    try {
      const { 
        limit = 10, 
        skip = 0, 
        status, 
        scanType,
        tool,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build filter
      const filter = {};
      if (status) filter.status = status;
      if (scanType) filter.scanType = scanType;
      if (tool) filter.tools = tool;
      
      // Add user filter if not admin
      if (req.user.role !== 'admin') {
        filter.createdBy = req.user.id;
      }
      
      const result = await scanService.getScans(
        filter,
        parseInt(limit),
        parseInt(skip)
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error in getAllScans controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching scans'
      });
    }
  },

  /**
   * Delete scan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteScan: async (req, res) => {
    try {
      const scanId = req.params.id;
      
      await scanService.deleteScan(scanId);
      
      res.status(200).json({
        success: true,
        message: 'Scan deleted successfully'
      });
    } catch (error) {
      logger.error(`Error in deleteScan controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error deleting scan'
      });
    }
  },

  /**
   * Get vulnerabilities by scan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getVulnerabilitiesByScan: async (req, res) => {
    try {
      const scanId = req.params.id;
      const { 
        limit = 100, 
        skip = 0, 
        severity,
        type,
        tool,
        status,
        sortBy = 'severity',
        sortOrder = 'asc'
      } = req.query;
      
      // Build filter
      const filter = {};
      if (severity) filter.severity = severity;
      if (type) filter.type = type;
      if (tool) filter.tool = tool;
      if (status) filter.status = status;
      
      const result = await scanService.getVulnerabilitiesByScan(
        scanId,
        filter,
        parseInt(limit),
        parseInt(skip)
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error in getVulnerabilitiesByScan controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error fetching vulnerabilities'
      });
    }
  },

  /**
   * Get vulnerability statistics by scan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getVulnerabilityStatsByScan: async (req, res) => {
    try {
      const scanId = req.params.id;
      
      const stats = await scanService.getVulnerabilityStatsByScan(scanId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error in getVulnerabilityStatsByScan controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error fetching vulnerability statistics'
      });
    }
  },

  /**
   * Check scanner installation status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  checkScannerInstallation: async (req, res) => {
    try {
      const status = await scanService.checkScannerInstallation();
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error(`Error in checkScannerInstallation controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error checking scanner installation'
      });
    }
  },

  /**
   * Get scan statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getScanStats: async (req, res) => {
    try {
      const filter = {};
      
      // Add user filter if not admin
      if (req.user.role !== 'admin') {
        filter.createdBy = req.user.id;
      }
      
      const stats = await scanService.getScanStats(filter);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error in getScanStats controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching scan statistics'
      });
    }
  }
};

module.exports = scanController;
