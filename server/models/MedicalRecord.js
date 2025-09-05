const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const { sequelize } = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  recordType: {
    type: DataTypes.ENUM(
      'lab_report',
      'prescription',
      'medical_note',
      'scan_result',
      'vaccination_record',
      'allergy_info',
      'medication_history',
      'surgery_record',
      'dental_record',
      'other'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  encryptedData: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  encryptionKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recordDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'archived', 'deleted'),
    defaultValue: 'active'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  insuranceInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'medical_records',
  hooks: {
    beforeCreate: async (record) => {
      // Generate encryption key for sensitive data
      if (record.encryptedData) {
        record.encryptionKey = crypto.randomBytes(32).toString('hex');
      }
    }
  }
});

// Instance methods
MedicalRecord.prototype.encryptData = function(data) {
  if (!this.encryptionKey) {
    this.encryptionKey = crypto.randomBytes(32).toString('hex');
  }
  
  const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  this.encryptedData = encrypted;
  return encrypted;
};

MedicalRecord.prototype.decryptData = function() {
  if (!this.encryptedData || !this.encryptionKey) {
    return null;
  }
  
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(this.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

MedicalRecord.prototype.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

MedicalRecord.prototype.getFileExtension = function() {
  if (!this.fileName) return null;
  return this.fileName.split('.').pop().toLowerCase();
};

MedicalRecord.prototype.getFileSizeInMB = function() {
  if (!this.fileSize) return 0;
  return (this.fileSize / (1024 * 1024)).toFixed(2);
};

// Class methods
MedicalRecord.findByPatient = function(patientId) {
  return this.findAll({
    where: { patientId, isActive: true },
    order: [['recordDate', 'DESC']]
  });
};

MedicalRecord.findByDoctor = function(doctorId) {
  return this.findAll({
    where: { doctorId, isActive: true },
    order: [['recordDate', 'DESC']]
  });
};

MedicalRecord.findByType = function(patientId, recordType) {
  return this.findAll({
    where: { patientId, recordType, isActive: true },
    order: [['recordDate', 'DESC']]
  });
};

MedicalRecord.findExpiredRecords = function() {
  return this.findAll({
    where: {
      expiryDate: {
        [sequelize.Op.lt]: new Date()
      },
      isActive: true
    }
  });
};

MedicalRecord.searchRecords = function(patientId, searchTerm) {
  return this.findAll({
    where: {
      patientId,
      isActive: true,
      [sequelize.Op.or]: [
        { title: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { description: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { tags: { [sequelize.Op.overlap]: [searchTerm] } }
      ]
    },
    order: [['recordDate', 'DESC']]
  });
};

module.exports = MedicalRecord;

