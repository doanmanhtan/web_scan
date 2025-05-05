// src/api/controllers/userController.js
const userService = require('../../services/userService');
const logger = require('../../utils/logger');

/**
 * User controller
 */
const userController = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register: async (req, res) => {
    try {
      const userData = req.body;
      
      // Default role to 'user' if not provided or not admin
      if (!userData.role || (req.user && req.user.role !== 'admin')) {
        userData.role = 'user';
      }
      
      const result = await userService.registerUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error(`Error in register controller: ${error.message}`);
      
      if (error.message.includes('already')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error registering user'
      });
    }
  },

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const result = await userService.loginUser(username, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error(`Error in login controller: ${error.message}`);
      
      if (error.message === 'Invalid credentials' || error.message === 'Account is disabled') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error logging in'
      });
    }
  },

  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const user = await userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error(`Error in getProfile controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching profile'
      });
    }
  },

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const user = await userService.updateUser(userId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      logger.error(`Error in updateProfile controller: ${error.message}`);
      
      if (error.message.includes('already registered')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  },

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      await userService.changePassword(userId, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error(`Error in changePassword controller: ${error.message}`);
      
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error changing password'
      });
    }
  },

  /**
   * Get all users (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllUsers: async (req, res) => {
    try {
      const { limit = 10, skip = 0, role, active } = req.query;
      
      // Build filter
      const filter = {};
      if (role) filter.role = role;
      if (active !== undefined) filter.isActive = active === 'true';
      
      const result = await userService.getUsers(
        filter,
        parseInt(limit),
        parseInt(skip)
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error in getAllUsers controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching users'
      });
    }
  },

  /**
   * Get user by ID (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserById: async (req, res) => {
    try {
      const userId = req.params.id;
      
      const user = await userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error(`Error in getUserById controller: ${error.message}`);
      
      // src/api/controllers/userController.js (tiếp tục)
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error fetching user'
      });
    }
  },

  /**
   * Update user role (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateUserRole: async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required'
        });
      }
      
      const user = await userService.updateUserRole(userId, role);
      
      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      logger.error(`Error in updateUserRole controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Invalid role')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error updating user role'
      });
    }
  },

  /**
   * Toggle user active status (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  toggleUserActive: async (req, res) => {
    try {
      const userId = req.params.id;
      
      const user = await userService.toggleUserActive(userId);
      
      res.status(200).json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: user
      });
    } catch (error) {
      logger.error(`Error in toggleUserActive controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error toggling user active status'
      });
    }
  },

  /**
   * Delete user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      
      await userService.deleteUser(userId);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error(`Error in deleteUser controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error deleting user'
      });
    }
  }
};

module.exports = userController;