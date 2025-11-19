const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole, requireDoctorAccess } = require('../middleware/auth');
const { AccessRequest, User, AuditLog } = require('../models');
const otpService = require('../services/otpService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateAccessRequest = [
  body('patientId').isUUID(),
  body('requestType').isIn(['view_records', 'add_prescription', 'view_specific_record', 'emergency_access']),
  body('reason').optional().trim().isLength({ min: 10, max: 500 }),
  body('urgency').optional().isIn(['routine', 'urgent', 'emergency']),
  body('accessDuration').optional().isInt({ min: 15, max: 1440 }), // 15 minutes to 24 hours
  body('scope').optional().isIn(['all_records', 'specific_records', 'limited_time', 'read_only']),
  body('specificRecordIds').optional().isArray()
];

const validateOTPVerification = [
  body('accessRequestId').isUUID(),
  body('otpCode').isLength({ min: 6, max: 6 }).isNumeric()
];

// Doctor requests access to patient records
router.post('/request-access', 
  authenticateToken, 
  requireRole('doctor'),
  validateAccessRequest,
  async (req, res) => {
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
        patientId,
        requestType,
        reason,
        urgency,
        accessDuration,
        scope,
        specificRecordIds
      } = req.body;

      const doctorId = req.user.id;

      // Check if patient exists
      const patient = await User.findByPk(patientId);
      if (!patient || patient.role !== 'patient') {
        return res.status(404).json({
          error: 'Patient not found',
          code: 'PATIENT_NOT_FOUND'
        });
      }

      // Check if doctor already has active access
      const existingAccess = await AccessRequest.findActiveAccess(doctorId, patientId);
      if (existingAccess) {
        return res.status(409).json({
          error: 'You already have active access to this patient\'s records',
          code: 'ACCESS_ALREADY_GRANTED',
          accessExpiresAt: existingAccess.accessExpiresAt,
          remainingTime: existingAccess.getRemainingAccessTime()
        });
      }

      // Check if there's already a pending request
      const pendingRequest = await AccessRequest.findOne({
        where: {
          doctorId,
          patientId,
          status: 'pending',
          isActive: true
        }
      });

      if (pendingRequest) {
        const { accessRequest: refreshedRequest, otp: debugOtp } = await otpService.resendOTP(pendingRequest.id, patientId);

        await AuditLog.logAccessRequest(
          doctorId,
          patientId,
          pendingRequest.id,
          'pending'
        );

        const responsePayload = {
          message: 'Access request already pending. A new OTP has been sent to the patient.',
          code: 'REQUEST_PENDING_OTP_RESENT',
          requestId: pendingRequest.id,
          patientName: patient.getFullName(),
          otpExpiry: refreshedRequest.otpExpiry,
          wasResent: true
        };

        if (debugOtp) {
          responsePayload.debugOtp = debugOtp;
        }

        return res.status(200).json(responsePayload);
      }

      // Create access request with OTP
      const result = await otpService.createAccessRequest(doctorId, patientId, {
        requestType,
        reason,
        urgency,
        accessDuration: accessDuration || 60, // Default 1 hour
        scope,
        specificRecordIds: specificRecordIds || []
      });

      const { accessRequest, otp: debugOtp, debugOtp: altDebugOtp } = result;
      const finalOtp = debugOtp || altDebugOtp;

      // Log access request
      await AuditLog.logAccessRequest(
        doctorId,
        patientId,
        accessRequest.id,
        'success'
      );

      const responsePayload = {
        message: 'Access request sent successfully. Patient will receive OTP for verification.',
        requestId: accessRequest.id,
        patientName: patient.getFullName(),
        otpExpiry: accessRequest.otpExpiry,
        estimatedDeliveryTime: '1-2 minutes'
      };

      // Always include OTP in debug mode or if email might have failed
      if (finalOtp) {
        responsePayload.debugOtp = finalOtp;
      }

      res.status(201).json(responsePayload);

    } catch (error) {
      logger.error('Access request error:', error);
      
      if (error.message.includes('Failed to send OTP')) {
        return res.status(500).json({
          error: 'Failed to send OTP. Please try again or contact support.',
          code: 'OTP_DELIVERY_FAILED'
        });
      }

      res.status(500).json({
        error: 'Failed to create access request',
        code: 'ACCESS_REQUEST_ERROR'
      });
    }
  }
);

// Patient verifies OTP and grants access
router.post('/verify-otp',
  authenticateToken,
  requireRole('patient'),
  validateOTPVerification,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { accessRequestId, otpCode } = req.body;
      const patientId = req.user.id;

      // Verify OTP and grant access
      const accessRequest = await otpService.verifyOTP(accessRequestId, otpCode, patientId);

      // Get doctor details
      const doctor = await User.findByPk(accessRequest.doctorId);

      res.json({
        message: 'Access granted successfully',
        accessRequest: {
          id: accessRequest.id,
          doctorName: doctor.getFullName(),
          accessGrantedAt: accessRequest.accessGrantedAt,
          accessExpiresAt: accessRequest.accessExpiresAt,
          scope: accessRequest.scope,
          requestType: accessRequest.requestType
        }
      });

    } catch (error) {
      logger.error('OTP verification error:', error);

      if (error.message.includes('Access request not found')) {
        return res.status(404).json({
          error: 'Access request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: 'Unauthorized to verify this access request',
          code: 'UNAUTHORIZED_VERIFICATION'
        });
      }

      if (error.message.includes('not pending')) {
        return res.status(400).json({
          error: 'Access request is not pending',
          code: 'REQUEST_NOT_PENDING'
        });
      }

      if (error.message.includes('expired')) {
        return res.status(400).json({
          error: 'OTP has expired',
          code: 'OTP_EXPIRED'
        });
      }

      if (error.message.includes('Maximum OTP attempts exceeded')) {
        return res.status(400).json({
          error: 'Maximum OTP attempts exceeded. Request has been cancelled.',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        });
      }

      if (error.message.includes('Invalid OTP code')) {
        return res.status(400).json({
          error: 'Invalid OTP code',
          code: 'INVALID_OTP',
          remainingAttempts: 3 - (await AccessRequest.findByPk(req.body.accessRequestId)).otpAttempts
        });
      }

      res.status(500).json({
        error: 'Failed to verify OTP',
        code: 'OTP_VERIFICATION_ERROR'
      });
    }
  }
);

// Patient denies access
router.post('/deny-access',
  authenticateToken,
  requireRole('patient'),
  [
    body('accessRequestId').isUUID(),
    body('reason').optional().trim().isLength({ min: 5, max: 500 })
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { accessRequestId, reason } = req.body;
      const patientId = req.user.id;

      const accessRequest = await AccessRequest.findByPk(accessRequestId);
      
      if (!accessRequest || accessRequest.patientId !== patientId) {
        return res.status(404).json({
          error: 'Access request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      if (accessRequest.status !== 'pending') {
        return res.status(400).json({
          error: 'Access request is not pending',
          code: 'REQUEST_NOT_PENDING'
        });
      }

      // Deny access
      await accessRequest.denyAccess(reason || 'Access denied by patient');

      // Log access denial
      await AuditLog.logSecurityEvent(
        patientId,
        'access_denied',
        {
          accessRequestId: accessRequest.id,
          doctorId: accessRequest.doctorId,
          reason: reason || 'Access denied by patient'
        },
        'medium'
      );

      res.json({
        message: 'Access denied successfully',
        requestId: accessRequest.id
      });

    } catch (error) {
      logger.error('Access denial error:', error);
      res.status(500).json({
        error: 'Failed to deny access',
        code: 'ACCESS_DENIAL_ERROR'
      });
    }
  }
);

// Resend OTP
router.post('/resend-otp',
  authenticateToken,
  requireRole('patient'),
  [
    body('accessRequestId').isUUID()
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { accessRequestId } = req.body;
      const patientId = req.user.id;

      // Resend OTP
      const accessRequest = await otpService.resendOTP(accessRequestId, patientId);

      res.json({
        message: 'OTP resent successfully',
        requestId: accessRequest.id,
        otpExpiry: accessRequest.otpExpiry,
        estimatedDeliveryTime: '1-2 minutes'
      });

    } catch (error) {
      logger.error('OTP resend error:', error);

      if (error.message.includes('not found or unauthorized')) {
        return res.status(404).json({
          error: 'Access request not found or unauthorized',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      if (error.message.includes('not pending')) {
        return res.status(400).json({
          error: 'Cannot resend OTP for non-pending request',
          code: 'REQUEST_NOT_PENDING'
        });
      }

      res.status(500).json({
        error: 'Failed to resend OTP',
        code: 'OTP_RESEND_ERROR'
      });
    }
  }
);

// Get pending access requests for patient
router.get('/pending-requests',
  authenticateToken,
  requireRole('patient'),
  async (req, res) => {
    try {
      const patientId = req.user.id;
      const pendingRequests = await AccessRequest.findPendingRequests(patientId);

      // Get doctor details for each request
      const requestsWithDoctorDetails = await Promise.all(
        pendingRequests.map(async (request) => {
          const doctor = await User.findByPk(request.doctorId);
          return {
            id: request.id,
            doctorName: doctor.getFullName(),
            doctorEmail: doctor.email,
            requestType: request.requestType,
            reason: request.reason,
            urgency: request.urgency,
            scope: request.scope,
            createdAt: request.createdAt,
            otpExpiry: request.otpExpiry,
            remainingTime: Math.max(0, Math.floor((request.otpExpiry - new Date()) / (1000 * 60)))
          };
        })
      );

      res.json({
        pendingRequests: requestsWithDoctorDetails,
        count: requestsWithDoctorDetails.length
      });

    } catch (error) {
      logger.error('Get pending requests error:', error);
      res.status(500).json({
        error: 'Failed to fetch pending requests',
        code: 'FETCH_REQUESTS_ERROR'
      });
    }
  }
);

// Get access request details
router.get('/request/:requestId',
  authenticateToken,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      const accessRequest = await AccessRequest.findByPk(requestId);
      if (!accessRequest) {
        return res.status(404).json({
          error: 'Access request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      // Check if user is authorized to view this request
      if (accessRequest.doctorId !== userId && accessRequest.patientId !== userId) {
        return res.status(403).json({
          error: 'Unauthorized to view this access request',
          code: 'UNAUTHORIZED_VIEW'
        });
      }

      // Get user details
      const [doctor, patient] = await Promise.all([
        User.findByPk(accessRequest.doctorId),
        User.findByPk(accessRequest.patientId)
      ]);

      const requestDetails = {
        id: accessRequest.id,
        doctorName: doctor.getFullName(),
        patientName: patient.getFullName(),
        requestType: accessRequest.requestType,
        status: accessRequest.status,
        reason: accessRequest.reason,
        urgency: accessRequest.urgency,
        scope: accessRequest.scope,
        createdAt: accessRequest.createdAt,
        otpExpiry: accessRequest.otpExpiry,
        accessGrantedAt: accessRequest.accessGrantedAt,
        accessExpiresAt: accessRequest.accessExpiresAt,
        remainingAccessTime: accessRequest.getRemainingAccessTime()
      };

      res.json({
        accessRequest: requestDetails
      });

    } catch (error) {
      logger.error('Get access request error:', error);
      res.status(500).json({
        error: 'Failed to fetch access request',
        code: 'FETCH_REQUEST_ERROR'
      });
    }
  }
);

// Cancel access request (doctor can cancel their own request)
router.delete('/request/:requestId',
  authenticateToken,
  requireRole('doctor'),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const doctorId = req.user.id;

      const accessRequest = await AccessRequest.findByPk(requestId);
      if (!accessRequest) {
        return res.status(404).json({
          error: 'Access request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      if (accessRequest.doctorId !== doctorId) {
        return res.status(403).json({
          error: 'Unauthorized to cancel this access request',
          code: 'UNAUTHORIZED_CANCELLATION'
        });
      }

      if (accessRequest.status !== 'pending') {
        return res.status(400).json({
          error: 'Cannot cancel non-pending request',
          code: 'REQUEST_NOT_PENDING'
        });
      }

      // Cancel request
      accessRequest.status = 'cancelled';
      accessRequest.isActive = false;
      await accessRequest.save();

      // Log cancellation
      await AuditLog.logSecurityEvent(
        doctorId,
        'access_request_cancelled',
        {
          accessRequestId: accessRequest.id,
          patientId: accessRequest.patientId
        },
        'low'
      );

      res.json({
        message: 'Access request cancelled successfully',
        requestId: accessRequest.id
      });

    } catch (error) {
      logger.error('Cancel access request error:', error);
      res.status(500).json({
        error: 'Failed to cancel access request',
        code: 'CANCELLATION_ERROR'
      });
    }
  }
);

// Get OTP statistics (admin only)
router.get('/stats',
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const stats = await otpService.getOTPStats();
      
      res.json({
        otpStatistics: stats,
        totalRequests: Object.values(stats).reduce((sum, count) => sum + count, 0)
      });

    } catch (error) {
      logger.error('Get OTP stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch OTP statistics',
        code: 'STATS_FETCH_ERROR'
      });
    }
  }
);

module.exports = router;

