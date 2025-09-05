const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, MedicalRecord, AccessRequest } = require('../models');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Middleware to require specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${role} role required.`
      });
    }

    next();
  };
};

// Middleware to require patient access to specific record
const requirePatientAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient role required.'
      });
    }

    const recordId = req.params.recordId;
    const record = await MedicalRecord.findByPk(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    if (record.patientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own medical records.'
      });
    }

    req.record = record;
    next();
  } catch (error) {
    console.error('Patient access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access verification failed'
    });
  }
};

// Middleware to require doctor access to specific record
const requireDoctorAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Doctor role required.'
      });
    }

    const recordId = req.params.recordId;
    const record = await MedicalRecord.findByPk(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    if (record.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access medical records you created.'
      });
    }

    req.record = record;
    next();
  } catch (error) {
    console.error('Doctor access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access verification failed'
    });
  }
};

// Middleware to check if user has active access to patient records
const checkPatientAccess = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Doctor role required.'
      });
    }

    const patientId = req.params.patientId || req.body.patientId;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID required'
      });
    }

    // Check if doctor has active access to patient records
    const accessRequest = await AccessRequest.findOne({
      where: {
        doctorId: req.user.id,
        patientId: patientId,
        status: 'approved',
        accessExpiresAt: {
          [require('sequelize').Op.gt]: new Date()
        },
        isActive: true
      }
    });

    if (!accessRequest) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. No active access to patient records.'
      });
    }

    req.patientAccess = accessRequest;
    next();
  } catch (error) {
    console.error('Patient access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access verification failed'
    });
  }
};

// Middleware to rate limit requests
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

    if (recentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

// Middleware to log requests
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePatientAccess,
  requireDoctorAccess,
  checkPatientAccess,
  rateLimit,
  logRequest
};
