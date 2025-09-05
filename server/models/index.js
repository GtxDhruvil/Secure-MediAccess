const User = require('./User');
const MedicalRecord = require('./MedicalRecord');
const AccessRequest = require('./AccessRequest');
const AuditLog = require('./AuditLog');

// Define associations
User.hasMany(MedicalRecord, { as: 'medicalRecords', foreignKey: 'patientId' });
MedicalRecord.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });

User.hasMany(MedicalRecord, { as: 'doctorRecords', foreignKey: 'doctorId' });
MedicalRecord.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });

User.hasMany(AccessRequest, { as: 'doctorRequests', foreignKey: 'doctorId' });
AccessRequest.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });

User.hasMany(AccessRequest, { as: 'patientRequests', foreignKey: 'patientId' });
AccessRequest.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });

User.hasMany(AuditLog, { as: 'auditLogs', foreignKey: 'userId' });
AuditLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });

User.hasMany(AuditLog, { as: 'targetAuditLogs', foreignKey: 'targetUserId' });
AuditLog.belongsTo(User, { as: 'targetUser', foreignKey: 'targetUserId' });

module.exports = {
  User,
  MedicalRecord,
  AccessRequest,
  AuditLog
};



