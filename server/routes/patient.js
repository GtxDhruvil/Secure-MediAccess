const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requirePatientAccess } = require('../middleware/auth');
const { User, MedicalRecord, AccessRequest, AuditLog } = require('../models');
const { Op } = require('sequelize');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole('patient'));

// Get patient's medical records
router.get('/medical-records', async (req, res) => {
  try {
    const records = await MedicalRecord.findAll({
      where: {
        patientId: req.user.id,
        isActive: true
      },
      order: [['recordDate', 'DESC']]
    });

    // Get doctor details for each record and handle decryption safely
    const recordsWithDoctors = await Promise.all(
      records.map(async (record) => {
        let doctor = null;
        if (record.doctorId) {
          doctor = await User.findByPk(record.doctorId, {
            attributes: ['id', 'firstName', 'lastName', 'email']
          });
        }

        // Safely handle decryption
        let decryptedData = { title: record.title, description: record.description };
        try {
          if (record.decryptData && typeof record.decryptData === 'function') {
            const result = record.decryptData();
            if (result) {
              decryptedData = result;
            }
          }
        } catch (decryptError) {
          console.warn('Failed to decrypt record data:', decryptError.message);
        }

        return {
          ...record.toJSON(),
          description: decryptedData?.description || record.description || '',
          title: decryptedData?.title || record.title || '',
          doctor: doctor ? doctor.toJSON() : null
        };
      })
    );

    res.json({
      success: true,
      records: recordsWithDoctors
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
router.get('/medical-records/:recordId', requirePatientAccess, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      where: {
        id: req.params.recordId,
        patientId: req.user.id,
        isActive: true
      },
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
        description: decryptedData.description,
        title: decryptedData.title
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

// Download medical record
router.get('/medical-records/:recordId/download', requirePatientAccess, async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      where: {
        id: req.params.recordId,
        patientId: req.user.id,
        isActive: true
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Get patient data
    const patient = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'gender']
    });

    // Get doctor data
    const doctor = await User.findByPk(record.doctorId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'specialization', 'licenseNumber']
    });

    if (!patient || !doctor) {
      return res.status(404).json({
        success: false,
        message: 'Patient or doctor information not found'
      });
    }

    // Decrypt record data
    let decryptedData = { title: record.title, description: record.description };
    try {
      if (record.decryptData && typeof record.decryptData === 'function') {
        const result = record.decryptData();
        if (result) {
          decryptedData = result;
        }
      }
    } catch (decryptError) {
      console.warn('Failed to decrypt record data:', decryptError.message);
    }

    // Prepare record data for PDF generation
    const recordData = {
      ...record.toJSON(),
      title: decryptedData.title || record.title || 'Medical Record',
      description: decryptedData.description || record.description || 'No description available'
    };

    // Generate PDF report
    const MedicalReportGenerator = require('../utils/pdfGenerator');
    const generator = new MedicalReportGenerator();
    const pdfDoc = await generator.generateMedicalReport(recordData, patient.toJSON(), doctor.toJSON());

    // Log the download action
    await AuditLog.logRecordAccess(req.user.id, req.user.id, record.id, {
      action: 'report_download',
      details: 'Patient downloaded their own medical report.'
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medical-report-${patient.firstName}-${patient.lastName}-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    // Pipe the PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('Error generating medical report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate medical report'
    });
  }
});

// Get patient's access requests
router.get('/access-requests', async (req, res) => {
  try {
    const requests = await AccessRequest.findAll({
      where: {
        patientId: req.user.id,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });

    // Get doctor details for each request
    const requestsWithDoctors = await Promise.all(
      requests.map(async (request) => {
        const doctor = await User.findByPk(request.doctorId, {
          attributes: ['id', 'firstName', 'lastName', 'email']
        });
        return {
          ...request.toJSON(),
          doctor: doctor ? doctor.toJSON() : null
        };
      })
    );

    res.json({
      success: true,
      requests: requestsWithDoctors
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
        patientId: req.user.id,
        isActive: true
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    // Get doctor details separately
    const doctor = await User.findByPk(request.doctorId, {
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    res.json({
      success: true,
      request: {
        ...request.toJSON(),
        doctor: doctor ? doctor.toJSON() : null
      }
    });
  } catch (error) {
    console.error('Error fetching access request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch access request'
    });
  }
});

// Get patient statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalRecords,
      pendingRequests,
      activeAccess,
      lastLogin
    ] = await Promise.all([
      MedicalRecord.count({
        where: {
          patientId: req.user.id,
          isActive: true
        }
      }),
      AccessRequest.count({
        where: {
          patientId: req.user.id,
          status: 'pending',
          isActive: true
        }
      }),
      AccessRequest.count({
        where: {
          patientId: req.user.id,
          status: 'approved',
          accessExpiresAt: {
            [Op.gt]: new Date()
          },
          isActive: true
        }
      }),
      User.findByPk(req.user.id, {
        attributes: ['lastLoginAt']
      })
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        pendingRequests,
        activeAccess,
        lastLogin: lastLogin?.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient statistics'
    });
  }
});

// Get patient profile
router.get('/profile', async (req, res) => {
  try {
    const patient = await User.findByPk(req.user.id, {
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
    console.error('Error fetching patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient profile'
    });
  }
});

// Update patient profile
router.put('/profile', async (req, res) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'phoneNumber', 'address', 
      'emergencyContact', 'preferences'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const patient = await User.findByPk(req.user.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    await patient.update(updateData);

    // Log the profile update
    await AuditLog.logSecurityEvent(req.user.id, 'profile_update', { updatedFields: Object.keys(updateData) }, 'low');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      patient: {
        ...patient.toJSON(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient profile'
    });
  }
});

// Get patient's medical history summary
router.get('/medical-history', async (req, res) => {
  try {
    const records = await MedicalRecord.findAll({
      where: {
        patientId: req.user.id,
        isActive: true
      },
      attributes: ['id', 'recordType', 'recordDate', 'status', 'priority'],
      order: [['recordDate', 'DESC']],
      limit: 50
    });

    // Group records by type and year
    const historySummary = records.reduce((acc, record) => {
      const year = new Date(record.recordDate).getFullYear();
      const type = record.recordType;
      
      if (!acc[year]) acc[year] = {};
      if (!acc[year][type]) acc[year][type] = 0;
      
      acc[year][type]++;
      return acc;
    }, {});

    res.json({
      success: true,
      historySummary
    });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical history'
    });
  }
});

// Get patient's emergency contacts
router.get('/emergency-contacts', async (req, res) => {
  try {
    const patient = await User.findByPk(req.user.id, {
      attributes: ['emergencyContact']
    });

    res.json({
      success: true,
      emergencyContacts: patient.emergencyContact || []
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts'
    });
  }
});

// Update emergency contacts
router.put('/emergency-contacts', async (req, res) => {
  try {
    const { emergencyContact } = req.body;

    if (!Array.isArray(emergencyContact)) {
      return res.status(400).json({
        success: false,
        message: 'Emergency contacts must be an array'
      });
    }

    const patient = await User.findByPk(req.user.id);
    await patient.update({ emergencyContact });

    // Log the update
    await AuditLog.logSecurityEvent(req.user.id, 'profile_update', { action: 'emergency_contacts_updated' }, 'low');

    res.json({
      success: true,
      message: 'Emergency contacts updated successfully'
    });
  } catch (error) {
    console.error('Error updating emergency contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency contacts'
    });
  }
});

// Get patient dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const patientId = req.user.id;

    // Get total medical records count
    const totalRecords = await MedicalRecord.count({
      where: {
        patientId,
        isActive: true
      }
    });

    // Get pending access requests count
    const pendingRequests = await AccessRequest.count({
      where: {
        patientId,
        status: 'pending',
        isActive: true
      }
    });

    // Get active access count
    const activeAccess = await AccessRequest.count({
      where: {
        patientId,
        status: 'approved',
        isActive: true
      }
    });

    // Get last login from user
    const patient = await User.findByPk(patientId, {
      attributes: ['lastLogin']
    });

    res.json({
      success: true,
      data: {
        totalRecords,
        pendingRequests,
        activeAccess,
        lastLogin: patient?.lastLogin || null
      }
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

module.exports = router;



