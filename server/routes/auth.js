const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, AuditLog } = require('../models');
const { logger } = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('phoneNumber').matches(/^\+?[\d\s\-\(\)]+$/),
  body('role').isIn(['patient', 'doctor']),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['Male', 'Female', 'Other', 'male', 'female', 'other', 'prefer_not_to_say'])
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const validatePasswordChange = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
];

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// User Registration
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      dateOfBirth,
      gender,
      address,
      emergencyContact
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      dateOfBirth,
      gender: gender.toLowerCase(),
      address,
      emergencyContact
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    // Log user registration
    await AuditLog.logSecurityEvent(
      user.id,
      'user_registration',
      {
        role,
        registrationMethod: 'email',
        ipAddress: req.ip
      },
      'low'
    );

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// User Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        error: 'Account temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      // Increment failed login attempts
      await user.incrementFailedLoginAttempts();
      
      // Log failed login attempt
      await AuditLog.logLogin(
        user.id,
        req.ip,
        req.get('User-Agent'),
        req.sessionID,
        'failure'
      );

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: 5 - user.failedLoginAttempts
      });
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLoginAttempts();
    
    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user.id, user.role);

    // Set session
    req.session.userId = user.id;
    req.session.role = user.role;

    // Log successful login
    await AuditLog.logLogin(
      user.id,
      req.ip,
      req.get('User-Agent'),
      req.sessionID,
      'success'
    );

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// User Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log logout
    await AuditLog.logSecurityEvent(
      req.user.id,
      'logout',
      {
        ipAddress: req.ip,
        sessionId: req.sessionID
      },
      'low'
    );

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destruction error:', err);
      }
    });

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Get Current User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Remove sensitive information
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.encryptionKey;

    res.json({
      user: userResponse
    });

  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// Update User Profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phoneNumber').optional().matches(/^\+?[\d\s\-\(\)]+$/),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  body('address').optional().trim(),
  body('emergencyContact').optional().isObject()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update user profile
    const allowedFields = [
      'firstName', 'lastName', 'phoneNumber', 'dateOfBirth',
      'gender', 'address', 'emergencyContact', 'preferences'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await user.update(updateData);

    // Log profile update
    await AuditLog.logSecurityEvent(
      req.user.id,
      'profile_update',
      {
        updatedFields: Object.keys(updateData),
        ipAddress: req.ip
      },
      'low'
    );

    // Remove sensitive information from response
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.encryptionKey;

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Change Password
router.post('/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'New password must be different from current password',
        code: 'PASSWORD_SAME_AS_CURRENT'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change
    await AuditLog.logSecurityEvent(
      req.user.id,
      'password_change',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      'high'
    );

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Refresh Token
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Generate new token
    const newToken = generateToken(user.id, user.role);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

// Forgot Password (Send Reset Link)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send password reset email with token
    // For now, just log the request
    await AuditLog.logSecurityEvent(
      user.id,
      'password_reset_requested',
      {
        ipAddress: req.ip,
        resetToken: resetToken.substring(0, 10) + '...'
      },
      'medium'
    );

    res.json({
      message: 'If an account with this email exists, a password reset link has been sent'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Failed to process password reset request',
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

// Reset Password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        error: 'Invalid reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password reset
    await AuditLog.logSecurityEvent(
      user.id,
      'password_reset_completed',
      {
        ipAddress: req.ip,
        resetMethod: 'token'
      },
      'high'
    );

    res.json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        error: 'Reset token has expired',
        code: 'RESET_TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        error: 'Invalid reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    logger.error('Reset password error:', error);
    res.status(500).json({
      error: 'Failed to reset password',
      code: 'RESET_PASSWORD_ERROR'
    });
  }
});

// Verify Email (if email verification is implemented)
router.post('/verify-email', [
  body('token').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token } = req.body;

    // Verify email verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'email_verification') {
      return res.status(400).json({
        error: 'Invalid verification token',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Mark email as verified
    user.isVerified = true;
    await user.save();

    // Log email verification
    await AuditLog.logSecurityEvent(
      user.id,
      'email_verified',
      {
        ipAddress: req.ip
      },
      'low'
    );

    res.json({
      message: 'Email verified successfully'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        error: 'Verification token has expired',
        code: 'VERIFICATION_TOKEN_EXPIRED'
      });
    }

    logger.error('Email verification error:', error);
    res.status(500).json({
      error: 'Failed to verify email',
      code: 'EMAIL_VERIFICATION_ERROR'
    });
  }
});

module.exports = router;

