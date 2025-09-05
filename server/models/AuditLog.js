const { DataTypes, Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  targetUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM(
      'login',
      'logout',
      'password_change',
      'profile_update',
      'user_registration',
      'user_deleted',
      'record_upload',
      'record_view',
      'record_edit',
      'record_delete',
      'access_request',
      'access_granted',
      'access_denied',
      'otp_sent',
      'otp_verified',
      'otp_failed',
      'file_download',
      'file_upload',
      'report_download',
      'search_performed',
      'export_data',
      'admin_action',
      'system_event',
      'viewed_approved_record',
      'viewed_attachment'
    ),
    allowNull: false
  },
  resourceType: {
    type: DataTypes.ENUM(
      'user',
      'medical_record',
      'access_request',
      'file',
      'system',
      'otp',
      'audit_log'
    ),
    allowNull: false
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'low'
  },
  outcome: {
    type: DataTypes.ENUM('success', 'failure', 'partial', 'pending'),
    defaultValue: 'success'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_logs',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resource_type']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['ip_address']
    }
  ]
});

// Instance methods
AuditLog.prototype.isHighSeverity = function() {
  return ['high', 'critical'].includes(this.severity);
};

AuditLog.prototype.isRecent = function(minutes = 60) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  return this.timestamp > cutoff;
};

AuditLog.prototype.getFormattedTimestamp = function() {
  return this.timestamp.toISOString();
};

// Class methods
AuditLog.findByUser = function(userId, limit = 100) {
  return this.findAll({
    where: { userId },
    order: [['timestamp', 'DESC']],
    limit
  });
};

AuditLog.findByAction = function(action, limit = 100) {
  return this.findAll({
    where: { action },
    order: [['timestamp', 'DESC']],
    limit
  });
};

AuditLog.findByResource = function(resourceType, resourceId) {
  return this.findAll({
    where: { resourceType, resourceId },
    order: [['timestamp', 'DESC']]
  });
};

AuditLog.findBySeverity = function(severity, limit = 100) {
  return this.findAll({
    where: { severity },
    order: [['timestamp', 'DESC']],
    limit
  });
};

AuditLog.findByTimeRange = function(startDate, endDate) {
  return this.findAll({
    where: {
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [['timestamp', 'DESC']]
  });
};

AuditLog.findFailedActions = function(limit = 100) {
  return this.findAll({
    where: { outcome: 'failure' },
    order: [['timestamp', 'DESC']],
    limit
  });
};

AuditLog.findSuspiciousActivity = function(limit = 100) {
  return this.findAll({
    where: {
      [sequelize.Op.or]: [
        { severity: 'high' },
        { severity: 'critical' },
        { outcome: 'failure' }
      ]
    },
    order: [['timestamp', 'DESC']],
    limit
  });
};

AuditLog.getActivitySummary = async function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const summary = await this.findAll({
    where: {
      userId,
      timestamp: {
        [Op.gte]: startDate
      }
    },
    attributes: [
      'action',
      'outcome',
      'severity',
      [fn('COUNT', col('id')), 'count']
    ],
    group: ['action', 'outcome', 'severity'],
    order: [[fn('COUNT', col('id')), 'DESC']]
  });
  
  return summary;
};

AuditLog.cleanupOldLogs = async function(daysToKeep = 365) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  const deletedCount = await this.destroy({
    where: {
      timestamp: {
        [Op.lt]: cutoffDate
      }
    }
  });
  
  return deletedCount;
};

// Static methods for common audit events
AuditLog.logLogin = async function(userId, ipAddress, userAgent, sessionId, outcome = 'success') {
  return await this.create({
    userId,
    action: 'login',
    resourceType: 'user',
    resourceId: userId,
    ipAddress,
    userAgent,
    sessionId,
    outcome,
    severity: outcome === 'success' ? 'low' : 'medium'
  });
};

AuditLog.logAccessRequest = async function(doctorId, patientId, requestId, outcome = 'success') {
  return await this.create({
    userId: doctorId,
    targetUserId: patientId,
    action: 'access_request',
    resourceType: 'access_request',
    resourceId: requestId,
    outcome,
    severity: 'medium'
  });
};

AuditLog.logRecordAccess = async function(userId, patientId, requestId, details, outcome = 'success') {
  let resourceType = 'access_request'; // Default
  if (details.action === 'viewed_attachment') {
    resourceType = 'file';
  } else if (details.action === 'viewed_approved_record') {
    resourceType = 'medical_record';
  }

  return await this.create({
    userId,
    targetUserId: patientId,
    action: details.action,
    resourceType: resourceType,
    resourceId: requestId,
    details,
    outcome,
    severity: 'medium',
    ipAddress: details.ipAddress,
    userAgent: details.userAgent
  });
};

AuditLog.logSecurityEvent = async function(userId, action, details, severity = 'medium') {
  return await this.create({
    userId,
    action,
    resourceType: 'system',
    details,
    severity,
    outcome: 'success'
  });
};

module.exports = AuditLog;

