const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { User, MedicalRecord, AccessRequest, AuditLog } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole('admin'));

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalRecords,
      totalRequests,
      totalAuditLogs
    ] = await Promise.all([
      User.count({ where: { isActive: true } }),
      User.count({ where: { role: 'patient', isActive: true } }),
      User.count({ where: { role: 'doctor', isActive: true } }),
      MedicalRecord.count({ where: { isActive: true } }),
      AccessRequest.count({ where: { isActive: true } }),
      AuditLog.count()
    ]);

    // Get recent activity
    const recentActivity = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    // Get system health metrics
    const systemHealth = {
      database: 'healthy',
      fileSystem: 'healthy',
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalRecords,
        totalRequests,
        totalAuditLogs,
        recentActivity,
        systemHealth
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true };
    if (role) whereClause.role = role;
    if (status === 'active') whereClause.isActive = true;
    if (status === 'inactive') whereClause.isActive = false;
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      users: users.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.count / limit),
        totalUsers: users.count,
        usersPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get specific user
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Update user
router.put('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const allowedFields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 
      'gender', 'address', 'specialization', 'hospital', 'isActive'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await user.update(updateData);

    // Log the user update
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: user.id,
      action: 'admin_update_user',
      resourceType: 'user',
      resourceId: user.id,
      details: `Admin updated user: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...user.toJSON(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Deactivate user
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive: false });

    // Log the user deactivation
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: user.id,
      action: 'admin_deactivate_user',
      resourceType: 'user',
      resourceId: user.id,
      details: `Admin deactivated user: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user'
    });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (action) whereClause.action = action;
    if (userId) whereClause.userId = userId;
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const logs = await AuditLog.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      logs: logs.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(logs.count / limit),
        totalLogs: logs.count,
        logsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
});

// Get system health
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'healthy';
    try {
      await User.findOne({ limit: 1 });
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // Check file system
    let fsStatus = 'healthy';
    try {
      const uploadPath = process.env.UPLOAD_PATH || 'uploads/medical-records';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
    } catch (error) {
      fsStatus = 'unhealthy';
    }

    const health = {
      timestamp: new Date().toISOString(),
      status: dbStatus === 'healthy' && fsStatus === 'healthy' ? 'healthy' : 'degraded',
      services: {
        database: dbStatus,
        fileSystem: fsStatus,
        api: 'healthy'
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check system health'
    });
  }
});

// Get access requests overview
router.get('/access-requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true };
    if (status) whereClause.status = status;

    const requests = await AccessRequest.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization']
        },
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      requests: requests.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(requests.count / limit),
        totalRequests: requests.count,
        requestsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch access requests'
    });
  }
});

// Get medical records overview
router.get('/medical-records', async (req, res) => {
  try {
    const { recordType, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true };
    if (recordType) whereClause.recordType = recordType;

    const records = await MedicalRecord.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization']
        },
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      records: records.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(records.count / limit),
        totalRecords: records.count,
        recordsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records'
    });
  }
});

module.exports = router;








