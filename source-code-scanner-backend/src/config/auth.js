// src/config/auth.js
/**
 * Authentication configuration
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default_jwt_secret_change_this_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  algorithm: 'HS256'
};

const passwordConfig = {
  saltRounds: 10, // Number of salt rounds for bcrypt
  minLength: 8    // Minimum password length
};

module.exports = {
  jwtConfig,
  passwordConfig
};
