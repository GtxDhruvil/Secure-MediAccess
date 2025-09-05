const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const AccessRequest = sequelize.define('AccessRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  requestType: {
    type: DataTypes.ENUM('view_records', 'add_prescription', 'view_specific_record', 'emergency_access'),
    allowNull: false,
    defaultValue: 'view_records'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'denied', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  otpCode: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: false
  },
  otpAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxOtpAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  accessGrantedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accessExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accessDuration: {
    type: DataTypes.INTEGER, // in minutes
    defaultValue: 60
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  urgency: {
    type: DataTypes.ENUM('routine', 'urgent', 'emergency'),
    defaultValue: 'routine'
  },
  specificRecordIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  scope: {
    type: DataTypes.ENUM('all_records', 'specific_records', 'limited_time', 'read_only'),
    defaultValue: 'all_records'
  },
  patientNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  doctorNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'access_requests',
  indexes: [
    {
      // Use physical column names because underscored: true
      fields: ['doctor_id', 'patient_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['otp_expiry']
    }
  ]
});

// Instance methods
AccessRequest.prototype.isOtpExpired = function() {
  return new Date() > this.otpExpiry;
};

AccessRequest.prototype.isOtpValid = function(otp) {
  return this.otpCode === otp && !this.isOtpExpired();
};

AccessRequest.prototype.canAttemptOtp = function() {
  return this.otpAttempts < this.maxOtpAttempts;
};

AccessRequest.prototype.incrementOtpAttempts = async function() {
  this.otpAttempts += 1;
  if (this.otpAttempts >= this.maxOtpAttempts) {
    this.status = 'expired';
  }
  await this.save();
};

AccessRequest.prototype.grantAccess = async function() {
  this.status = 'approved';
  this.accessGrantedAt = new Date();
  this.accessExpiresAt = new Date(Date.now() + this.accessDuration * 60 * 1000);
  await this.save();
};

AccessRequest.prototype.denyAccess = async function(reason) {
  this.status = 'denied';
  this.patientNotes = reason;
  await this.save();
};

AccessRequest.prototype.isAccessExpired = function() {
  if (!this.accessExpiresAt) return false;
  return new Date() > this.accessExpiresAt;
};

AccessRequest.prototype.getRemainingAccessTime = function() {
  if (!this.accessExpiresAt) return 0;
  const remaining = this.accessExpiresAt - new Date();
  return Math.max(0, Math.floor(remaining / (1000 * 60))); // in minutes
};

// Class methods
AccessRequest.findPendingRequests = function(patientId) {
  return this.findAll({
    where: {
      patientId,
      status: 'pending',
      isActive: true
    },
    order: [['createdAt', 'DESC']]
  });
};

AccessRequest.findActiveAccess = function(doctorId, patientId) {
  return this.findOne({
    where: {
      doctorId,
      patientId,
      status: 'approved',
      isActive: true,
      accessExpiresAt: {
        [Op.gt]: new Date()
      }
    }
  });
};

AccessRequest.findExpiredRequests = function() {
  return this.findAll({
    where: {
      otpExpiry: {
        [Op.lt]: new Date()
      },
      status: 'pending',
      isActive: true
    }
  });
};

AccessRequest.findByStatus = function(status) {
  return this.findAll({
    where: { status, isActive: true },
    order: [['createdAt', 'DESC']]
  });
};

AccessRequest.findUrgentRequests = function() {
  return this.findAll({
    where: {
      urgency: 'emergency',
      status: 'pending',
      isActive: true
    },
    order: [['createdAt', 'ASC']]
  });
};

AccessRequest.cleanupExpiredRequests = async function() {
  const expiredRequests = await this.findExpiredRequests();
  for (const request of expiredRequests) {
    request.status = 'expired';
    request.isActive = false;
    await request.save();
  }
  return expiredRequests.length;
};

module.exports = AccessRequest;

