// src/services/userService.js
const { logger } = require('../utils/logger');
const userRepository = require('../db/repositories/userRepository');
const { comparePassword, generateToken, hashPassword } = require('../utils/securityUtils');
const { jwtConfig } = require('../config/auth');

/**
 * Service for managing users
 */
class UserService {
  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user and token
   */
  async registerUser(userData) {
    try {
      // Check if username already exists
      const existingUsername = await userRepository.getUserByUsername(userData.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }
      
      // Check if email already exists
      const existingEmail = await userRepository.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already registered');
      }
      
      // Create user
      const user = await userRepository.createUser(userData);
      
      // Generate token
      const token = generateToken({
        id: user._id,
        username: user.username,
        role: user.role
      });
      
      logger.info(`User registered: ${user._id}`);
      
      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      };
    } catch (error) {
      logger.error(`Error registering user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Login user
   * @param {String} username - Username or email
   * @param {String} password - Password
   * @returns {Object} User and token
   */
  async loginUser(username, password) {
    try {
      // Check if input is email or username
      const isEmail = username.includes('@');
      
      // Get user by username or email with password
      const user = isEmail
        ? await userRepository.getUserByEmail(username, true)
        : await userRepository.getUserByUsername(username, true);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is disabled');
      }
      
      // Verify password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
      
      // Update last login
      await userRepository.updateLastLogin(user._id);
      
      // Generate token
      const token = generateToken({
        id: user._id,
        username: user.username,
        role: user.role
      });
      
      logger.info(`User logged in: ${user._id}`);
      
      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      };
    } catch (error) {
      logger.error(`Error logging in user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {Object} User
   */
  async getUserById(userId) {
    try {
      const user = await userRepository.getUserById(userId);
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
    } catch (error) {
      logger.error(`Error getting user by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const user = await userRepository.getUserById(userId);
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Filter allowed fields for update
      const allowedFields = ['firstName', 'lastName', 'email'];
      const filteredUpdate = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdate[key] = updateData[key];
        }
      });
      
      // Check if email is being updated and already exists
      if (filteredUpdate.email && filteredUpdate.email !== user.email) {
        const existingEmail = await userRepository.getUserByEmail(filteredUpdate.email);
        if (existingEmail) {
          throw new Error('Email already registered');
        }
      }
      
      const updatedUser = await userRepository.updateUser(userId, filteredUpdate);
      
      logger.info(`User updated: ${userId}`);
      
      return {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      };
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Boolean} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password
      const user = await userRepository.getUserById(userId, true);
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Verify current password
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      await userRepository.updateUser(userId, { password: hashedPassword });
      
      logger.info(`Password changed for user: ${userId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error changing password: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all users with optional filtering
   * @param {Object} filter - Filter criteria
   * @param {Number} limit - Maximum number of results
   * @param {Number} skip - Number of results to skip
   * @returns {Object} Users with pagination
   */
  async getUsers(filter = {}, limit = 10, skip = 0) {
    try {
      const users = await userRepository.getUsers(filter, limit, skip);
      const total = await userRepository.countUsers(filter);
      
      // Map users to sanitized format (without password)
      const mappedUsers = users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }));
      
      return {
        users: mappedUsers,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + limit
        }
      };
    } catch (error) {
      logger.error(`Error getting users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {String} userId - User ID
   * @returns {Boolean} Success status
   */
  async deleteUser(userId) {
    try {
      // Check if user exists
      const user = await userRepository.getUserById(userId);
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Delete user
      await userRepository.deleteUser(userId);
      
      logger.info(`User deleted: ${userId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user role
   * @param {String} userId - User ID
   * @param {String} role - New role
   * @returns {Object} Updated user
   */
  async updateUserRole(userId, role) {
    try {
      // Validate role
      const validRoles = ['admin', 'user', 'security_team', 'dev_team'];
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      const user = await userRepository.updateUser(userId, { role });
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      logger.info(`User role updated: ${userId} -> ${role}`);
      
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      };
    } catch (error) {
      logger.error(`Error updating user role: ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggle user active status
   * @param {String} userId - User ID
   * @returns {Object} Updated user
   */
  async toggleUserActive(userId) {
    try {
      const user = await userRepository.getUserById(userId);
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      const updatedUser = await userRepository.updateUser(userId, {
        isActive: !user.isActive
      });
      
      logger.info(`User active status toggled: ${userId} -> ${!user.isActive}`);
      
      return {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      };
    } catch (error) {
      logger.error(`Error toggling user active status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get JWT token expiration time
   * @returns {String} JWT expiration time
   */
  getTokenExpiration() {
    return jwtConfig.expiresIn;
  }
}

module.exports = new UserService();