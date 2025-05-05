// src/db/repositories/userRepository.js
const User = require('../models/userModel');
const logger = require('../../utils/logger');

class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @param {Boolean} includePassword - Whether to include password in result
   * @returns {Object} User
   */
  async getUserById(userId, includePassword = false) {
    try {
      const query = User.findById(userId);
      if (includePassword) {
        query.select('+password');
      }
      return await query.exec();
    } catch (error) {
      logger.error(`Error getting user by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by username
   * @param {String} username - Username
   * @param {Boolean} includePassword - Whether to include password in result
   * @returns {Object} User
   */
  async getUserByUsername(username, includePassword = false) {
    try {
      const query = User.findOne({ username });
      if (includePassword) {
        query.select('+password');
      }
      return await query.exec();
    } catch (error) {
      logger.error(`Error getting user by username: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {String} email - Email
   * @param {Boolean} includePassword - Whether to include password in result
   * @returns {Object} User
   */
  async getUserByEmail(email, includePassword = false) {
    try {
      const query = User.findOne({ email });
      if (includePassword) {
        query.select('+password');
      }
      return await query.exec();
    } catch (error) {
      logger.error(`Error getting user by email: ${error.message}`);
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
      return await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user's last login time
   * @param {String} userId - User ID
   * @returns {Object} Updated user
   */
  async updateLastLogin(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { lastLogin: new Date() },
        { new: true }
      );
    } catch (error) {
      logger.error(`Error updating last login: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {String} userId - User ID
   * @returns {Object} Deleted user
   */
  async deleteUser(userId) {
    try {
      return await User.findByIdAndDelete(userId);
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all users with optional filtering
   * @param {Object} filter - Filter criteria
   * @param {Number} limit - Maximum number of results
   * @param {Number} skip - Number of results to skip
   * @returns {Array} List of users
   */
  async getUsers(filter = {}, limit = 100, skip = 0) {
    try {
      return await User.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      logger.error(`Error getting users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Count users with optional filtering
   * @param {Object} filter - Filter criteria
   * @returns {Number} Count of users
   */
  async countUsers(filter = {}) {
    try {
      return await User.countDocuments(filter);
    } catch (error) {
      logger.error(`Error counting users: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserRepository();


