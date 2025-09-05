const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireDoctorAccess } = require('../middleware/auth');
const { User, MedicalRecord, AccessRequest, AuditLog } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads/medical-records';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(',');
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExt} is not allowed`));
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole('doctor'));

// Get doctor's patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await User.findAll({
      where: {
        role: 'patient',
        isActive: true
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 'lastLoginAt'],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    res.json({
      success: true,
      patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients'
    });
  }
});

// Get specific patient
router.get('/patients/:patientId', async (req, res) => {
  try {
    const patient = await User.findOne({
      where: {
        id: req.params.patientId,
        role: 'patient',
        isActive: true
      },
      attributes: { exclude: ['password'] }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      patient
    });
  } catch (error) {
    console.error(`Error deleting patient with ID: ${req.params.patientId}:`, error);
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient'
    });
  }
});

// Get doctor's medical records
router.get('/medical-records', async (req, res) => {
  try {
    const records = await MedicalRecord.findAll({
      where: {
        doctorId: req.user.id,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'dateOfBirth', 'gender']
        }
      ],
      order: [['recordDate', 'DESC']]
    });

    // Decrypt sensitive data for each record
    const decryptedRecords = records.map(record => {
      const decryptedData = record.decryptData();
      return {
        ...record.toJSON(),
        description: decryptedData?.description || record.description || '',
        title: decryptedData?.title || record.title || ''
      };
    });

    res.json({
      success: true,
      records: decryptedRecords
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records'
    });
  }
});

// Get specific medical record
router.get('/medical-records/:recordId', requireDoctorAccess, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      where: {
        id: req.params.recordId,
        doctorId: req.user.id,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'dateOfBirth', 'gender']
        }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Decrypt the record data
    const decryptedData = record.decryptData();

    res.json({
      success: true,
      record: {
        ...record.toJSON(),
        description: decryptedData?.description || record.description || '',
        title: decryptedData?.title || record.title || ''
      }
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical record'
    });
  }
});

// Create new medical record
router.post('/medical-records', upload.single('file'), async (req, res) => {
  try {
    const {
      patientId,
      recordType,
      title,
      description,
      recordDate,
      status = 'active',
      priority = 'medium'
    } = req.body;

    // Validate required fields
    if (!patientId || !recordType || !title || !description || !recordDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if patient exists and is active
    const patient = await User.findOne({
      where: {
        id: patientId,
        role: 'patient',
        isActive: true
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or inactive'
      });
    }

    // Create the medical record
    const recordData = {
      patientId,
      doctorId: req.user.id,
      recordType,
      title,
      description,
      recordDate,
      status,
      priority,
      isActive: true
    };

    if (req.file) {
      recordData.filePath = req.file.path;
      recordData.fileName = req.file.originalname;
      recordData.fileSize = req.file.size;
      recordData.fileType = req.file.mimetype;
    }

    const record = await MedicalRecord.create(recordData);

    // Log the record creation
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: patientId,
      action: 'record_upload',
      resourceType: 'medical_record',
      resourceId: record.id,
      details: { message: `Doctor created medical record: ${title}` },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      record: {
        ...record.toJSON(),
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email
        }
      }
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medical record'
    });
  }
});

// Update medical record
router.put('/medical-records/:recordId', requireDoctorAccess, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      where: {
        id: req.params.recordId,
        doctorId: req.user.id,
        isActive: true
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'tags'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await record.update(updateData);

    // Log the update
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: record.patientId,
      action: 'record_edit',
      resourceType: 'medical_record',
      resourceId: record.id,
      details: { message: `Doctor updated medical record: ${record.title}` },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      record
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medical record'
    });
  }
});

// Delete a medical record
router.delete('/medical-records/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const doctorId = req.user.id;

    const record = await MedicalRecord.findOne({
      where: {
        id: recordId,
        doctorId: doctorId,
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found or you do not have permission to delete it.' });
    }

    // Hard delete the record
    await record.destroy();

    // Log the action
    await AuditLog.create({
      userId: doctorId,
      targetUserId: record.patientId,
      action: 'record_delete',
      resourceType: 'medical_record',
      resourceId: record.id,
      details: { message: `Doctor permanently deleted medical record: ${record.title}` },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      outcome: 'success',
      severity: 'high',
    });

    res.status(200).json({ success: true, message: 'Medical record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({ success: false, message: 'Failed to delete medical record.' });
  }
});

// Download medical record
router.get('/medical-records/:recordId/download', requireDoctorAccess, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      where: {
        id: req.params.recordId,
        doctorId: req.user.id,
        isActive: true
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if file exists
    if (!record.filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found for this record'
      });
    }

    // Log the download action
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: record.patientId,
      action: 'file_download',
      resourceType: 'medical_record',
      resourceId: record.id,
      details: { message: `Doctor downloaded medical record: ${record.title}` },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    // Set headers for file download
    res.setHeader('Content-Type', record.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${record.fileName || `record-${record.id}.pdf`}"`);
    
    // Send the file
    res.sendFile(record.filePath, { root: process.cwd() });
  } catch (error) {
    console.error('Error downloading medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download medical record'
    });
  }
});

// Get doctor's access requests
router.get('/access-requests', async (req, res) => {
  try {
    const requests = await AccessRequest.findAll({
      where: {
        doctorId: req.user.id,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'dateOfBirth', 'gender']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch access requests'
    });
  }
});

// Get specific access request
router.get('/access-requests/:requestId', async (req, res) => {
  try {
    const request = await AccessRequest.findOne({
      where: {
        id: req.params.requestId,
        doctorId: req.user.id,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'dateOfBirth', 'gender']
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Error fetching access request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch access request'
    });
  }
});

// Cancel access request
router.delete('/access-requests/:requestId', async (req, res) => {
  try {
    const request = await AccessRequest.findOne({
      where: {
        id: req.params.requestId,
        doctorId: req.user.id,
        status: 'pending',
        isActive: true
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found or cannot be cancelled'
      });
    }

    await request.update({
      status: 'cancelled',
      isActive: false
    });

    // Log the cancellation
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: request.patientId,
      action: 'access_denied',
      resourceType: 'access_request',
      resourceId: request.id,
      details: { message: 'Doctor cancelled access request' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    res.json({
      success: true,
      message: 'Access request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling access request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel access request'
    });
  }
});

// Get doctor statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPatients,
      totalRecords,
      pendingRequests,
      activeAccess
    ] = await Promise.all([
      User.count({
        where: {
          role: 'patient',
          isActive: true
        }
      }),
      MedicalRecord.count({
        where: {
          doctorId: req.user.id,
          isActive: true
        }
      }),
      AccessRequest.count({
        where: {
          doctorId: req.user.id,
          status: 'pending',
          isActive: true
        }
      }),
      AccessRequest.count({
        where: {
          doctorId: req.user.id,
          status: 'approved',
          accessExpiresAt: {
            [Op.gt]: new Date()
          },
          isActive: true
        }
      })
    ]);

    // Get monthly records for the last 12 months
    const monthlyRecords = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = await MedicalRecord.count({
        where: {
          doctorId: req.user.id,
          recordDate: {
            [Op.between]: [monthStart, monthEnd]
          },
          isActive: true
        }
      });
      
      monthlyRecords.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        records: count
      });
    }

    // Get patient growth for the last 12 months (cumulative)
    const patientGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await User.count({
        where: {
          role: 'patient',
          isActive: true,
          createdAt: {
            [Op.lte]: monthEnd
          }
        }
      });

      patientGrowth.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        patients: count
      });
    }

    // Get record types distribution
    const recordTypesData = await MedicalRecord.findAll({
      where: {
        doctorId: req.user.id,
        isActive: true
      },
      attributes: ['recordType'],
      raw: true
    });

    const recordTypesCount = {};
    recordTypesData.forEach(record => {
      recordTypesCount[record.recordType] = (recordTypesCount[record.recordType] || 0) + 1;
    });

    const recordTypes = Object.entries(recordTypesCount).map(([name, value]) => ({
      name,
      value
    }));

    res.json({
      success: true,
      data: {
        totalPatients,
        totalRecords,
        pendingRequests,
        activeAccess,
        monthlyRecords,
        patientGrowth,
        recordTypes
      }
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor statistics'
    });
  }
});

// Get doctor profile
router.get('/profile', async (req, res) => {
  try {
    const doctor = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor profile'
    });
  }
});

// Update doctor profile
router.put('/profile', async (req, res) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'phoneNumber', 'address', 
      'specialization', 'hospital', 'preferences'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const doctor = await User.findByPk(req.user.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await doctor.update(updateData);

    // Log the profile update
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: req.user.id,
      action: 'profile_update',
      resourceType: 'user',
      resourceId: req.user.id,
      details: { message: 'Doctor updated their profile' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      doctor: {
        ...doctor.toJSON(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile'
    });
  }
});

// Get medical records for a specific patient (for approved access)
router.get('/patient/:patientId/medical-records', async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    console.log(`Doctor ${doctorId} requesting records for patient ${patientId}`);

    // Check if doctor has approved access to this patient
    const approvedRequest = await AccessRequest.findOne({
      where: {
        doctorId,
        patientId,
        status: 'approved'
      },
      order: [['createdAt', 'DESC']]
    });

    console.log('Approved request found:', approvedRequest ? 'Yes' : 'No');

    if (!approvedRequest) {
      // Let's also check all requests for debugging
      const allRequests = await AccessRequest.findAll({
        where: { doctorId, patientId },
        order: [['createdAt', 'DESC']]
      });
      console.log('All requests for this doctor-patient pair:', allRequests.length);
      
      return res.status(403).json({ 
        error: 'No approved access found for this patient',
        debug: { doctorId, patientId, requestCount: allRequests.length }
      });
    }

    // Fetch medical records created by this doctor for this patient
    const records = await MedicalRecord.findAll({
      where: {
        patientId,
        doctorId
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['recordDate', 'DESC']]
    });

    console.log(`Found ${records.length} medical records`);
    res.json({ records });
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records', details: error.message });
  }
});

// Serve medical record attachments for approved access
router.get('/attachment/:recordId', async (req, res) => {
  console.log('\n--- Serving Attachment ---');
  try {
    const { recordId } = req.params;
    const doctorId = req.user.id;

    console.log(`[Request] DoctorID: ${doctorId}, RecordID: ${recordId}`);

    const record = await MedicalRecord.findOne({
      where: {
        id: recordId,
        doctorId
      }
    });

    console.log('[DB] Medical record found:', record ? record.toJSON() : null);

    if (!record) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Serve the file from the path stored in the database
    const filePath = path.resolve(record.filePath);
    const fileExists = fs.existsSync(filePath);

    console.log(`[File System] Resolved Path: ${filePath}`);
    console.log(`[File System] File Exists: ${fileExists}`);

    if (!fileExists) {
      console.error(`File not found at path: ${filePath}`);
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Log the file access
    try {
      await AuditLog.logRecordAccess(doctorId, patientId, approvedRequest.id, {
        action: 'viewed_attachment',
        fileName,
        timestamp: new Date(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });
    } catch (logError) {
      console.error('Failed to log file access:', logError);
    }

    console.log(`[Response] Sending file with Content-Type: ${record.fileType || 'application/octet-stream'}`);

    // Set appropriate headers and send file
    res.setHeader('Content-Type', record.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${record.fileName || fileName}"`); // Use original filename if available
    res.sendFile(filePath);

  } catch (error) {
    console.error('Error serving attachment:', error);
    res.status(500).json({ error: 'Failed to serve attachment' });
  }
});

// Log record access for audit trail
router.post('/log-record-access', async (req, res) => {
  try {
    const { requestId, patientId, action } = req.body;
    const doctorId = req.user.id;

    // Create audit log entry
    await AuditLog.logRecordAccess(doctorId, patientId, requestId, {
      action,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging record access:', error);
    res.status(500).json({ error: 'Failed to log access' });
  }
});

const crypto = require('crypto');

// Add a new patient
router.post('/patients', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber } = req.body;
    const doctorId = req.user.id;

    // 1. Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name, and email are required.' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    // 3. Generate a temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex');

    // 4. Create the new patient user
    const newPatient = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      role: 'patient',
      password: temporaryPassword, // The model should hash this automatically
      isActive: true, // Or false, pending email verification
    });

    // 5. Log the action
    await AuditLog.create({
      userId: doctorId,
      targetUserId: newPatient.id,
      action: 'patient_created',
      resourceType: 'user',
      resourceId: newPatient.id,
      details: { message: `Doctor created a new patient account for ${email}` },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      outcome: 'success'
    });

    // 6. Send response (excluding password)
    const patientData = newPatient.toJSON();
    delete patientData.password;

    res.status(201).json({
      success: true,
      message: 'Patient created successfully.',
      patient: patientData
    });

  } catch (error) {
    if (error instanceof TypeError) {
      console.error('Authentication error:', error);
      return res.status(401).json({ success: false, message: 'Authentication error. Please log in again.' });
    }
    console.error('Error creating patient:', error);
    res.status(500).json({ success: false, message: 'Failed to create patient.' });
  }
});

// Soft delete a patient
router.delete('/patients/:patientId', requireRole('doctor'), async (req, res) => {
  console.log(`Attempting to delete patient with ID: ${req.params.patientId} by doctor ID: ${req.user.id}`);
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    // 1. Find the patient
    const patient = await User.findOne({
      where: {
        id: patientId,
        role: 'patient',
      }
    });

    if (!patient) {
      console.log(`Patient with ID: ${patientId} not found.`);
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // 2. Perform soft delete by setting isActive to false
    console.log(`Patient found: ${patient.firstName} ${patient.lastName}. Soft deleting...`);
    await patient.update({ isActive: false });

    // 3. Log the action
    await AuditLog.create({
      userId: doctorId,
      targetUserId: patient.id,
      action: 'user_deleted',
      resourceType: 'user',
      resourceId: patient.id,
      details: { message: `Doctor removed patient account: ${patient.email}` },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      outcome: 'success'
    });

    // 4. Send success response
    res.status(200).json({ success: true, message: 'Patient removed successfully.' });

  } catch (error) {
    console.error('Error removing patient:', error);
    res.status(500).json({ success: false, message: 'Failed to remove patient.' });
  }
});

module.exports = router;


