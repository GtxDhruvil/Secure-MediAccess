const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { User, AccessRequest, AuditLog } = require('../models');
const { logger } = require('../utils/logger');

class OTPService {
  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // OTP configuration
    this.otpLength = parseInt(process.env.OTP_LENGTH) || 6;
    this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  }

  // Generate OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Send OTP via email
  async sendOTPEmail(email, otp, purpose = 'access') {
    try {
      const subject = purpose === 'access' 
        ? 'Medical Record Access Request - OTP Verification'
        : 'Your OTP Code';

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">Secure Medical Access</h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-bottom: 15px;">OTP Verification Required</h3>
            <p style="color: #475569; line-height: 1.6;">
              ${purpose === 'access' 
                ? 'A doctor has requested access to your medical records. To approve this request, please use the OTP code below:'
                : 'Please use the following OTP code to complete your verification:'
              }
            </p>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              This OTP will expire in ${this.otpExpiryMinutes} minutes.<br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; color: #64748b; font-size: 12px;">
            <p>This is an automated message from Secure Medical Access System.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: html
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      logger.info('OTP email sent successfully', {
        email,
        purpose,
        messageId: result.messageId
      });

      return true;
    } catch (error) {
      logger.error('Failed to send OTP email', {
        email,
        purpose,
        error: error.message
      });
      throw new Error('Failed to send OTP email');
    }
  }

  // Send OTP via SMS (Twilio)
  async sendOTPSMS(phoneNumber, otp, purpose = 'access') {
    try {
      // This would integrate with Twilio
      // For now, we'll log the OTP for development purposes
      logger.info('OTP SMS would be sent', {
        phoneNumber,
        otp,
        purpose
      });

      // In production, you would use:
      // const twilioClient = require('twilio')(accountSid, authToken);
      // await twilioClient.messages.create({
      //   body: `Your OTP code is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes.`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phoneNumber
      // });

      return true;
    } catch (error) {
      logger.error('Failed to send OTP SMS', {
        phoneNumber,
        purpose,
        error: error.message
      });
      throw new Error('Failed to send OTP SMS');
    }
  }

  // Create access request
  async createAccessRequest(doctorId, patientId, options = {}) {
    const {
      requestType = 'view_records',
      reason = 'Medical consultation',
      urgency = 'routine',
      accessDuration = 60,
      scope = 'all_records',
      specificRecordIds = []
    } = options;
    try {
      // Check if there's already a pending request
      const existingRequest = await AccessRequest.findOne({
        where: {
          doctorId,
          patientId,
          status: 'pending',
          isActive: true
        }
      });

      if (existingRequest) {
        throw new Error('Access request already pending for this patient');
      }

      // Generate OTP
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

      // Create access request
      const accessRequest = await AccessRequest.create({
        doctorId,
        patientId,
        requestType,
        reason,
        urgency,
        accessDuration,
        scope,
        specificRecordIds,
        otpCode: otp,
        otpExpiry,
        status: 'pending',
        isActive: true
      });

      // Get patient details
      const patient = await User.findByPk(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Send OTP to patient
      try {
        await this.sendOTPEmail(patient.email, otp, 'access');
      } catch (emailError) {
        // Log email error but don't fail the request creation
        logger.error('Failed to send OTP email, but request created', {
          requestId: accessRequest.id,
          email: patient.email,
          error: emailError.message
        });
        
        // For development, log the OTP to console
        if (process.env.NODE_ENV === 'development') {
          console.log(`\n🔐 OTP for development: ${otp}`);
          console.log(`📧 Patient email: ${patient.email}`);
          console.log(`⏰ Expires at: ${accessRequest.otpExpiry}\n`);
        }
      }

      // Log the access request
      await AuditLog.logAccessRequest(doctorId, patientId, accessRequest.id, 'success');

      logger.info('Access request created successfully', {
        requestId: accessRequest.id,
        doctorId,
        patientId,
        requestType
      });

      return accessRequest;
    } catch (error) {
      logger.error('Failed to create access request', {
        doctorId,
        patientId,
        error: error.message
      });
      throw error;
    }
  }

  // Verify OTP and grant access
  async verifyOTP(requestId, otp, patientId) {
    try {
      const accessRequest = await AccessRequest.findOne({
        where: {
          id: requestId,
          status: 'pending',
          isActive: true
        }
      });

      if (!accessRequest) {
        throw new Error('Access request not found or already processed');
      }

      // Verify that the patient is authorized to approve this request
      if (accessRequest.patientId !== patientId) {
        throw new Error('Unauthorized to verify this access request');
      }

      // Check if OTP has expired
      if (new Date() > accessRequest.otpExpiry) {
        await accessRequest.update({
          status: 'expired',
          isActive: false
        });

        throw new Error('OTP has expired');
      }

      // Verify OTP
      if (accessRequest.otpCode !== otp) {
        // Log failed attempt
        await AuditLog.logSecurityEvent(
          accessRequest.patientId,
          'otp_failed',
          { accessRequestId: accessRequest.id, doctorId: accessRequest.doctorId },
          'medium'
        );

        throw new Error('Invalid OTP');
      }

      // Grant access
      const accessExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await accessRequest.update({
        status: 'approved',
        accessGrantedAt: new Date(),
        accessExpiresAt: accessExpiry,
        isActive: true
      });

      // Log successful access
      await AuditLog.logSecurityEvent(
        accessRequest.patientId,
        'access_granted',
        { accessRequestId: accessRequest.id, doctorId: accessRequest.doctorId },
        'medium'
      );

      logger.info('Access granted successfully', {
        requestId: accessRequest.id,
        doctorId: accessRequest.doctorId,
        patientId: accessRequest.patientId
      });

      return accessRequest;
    } catch (error) {
      logger.error('Failed to verify OTP', {
        requestId,
        error: error.message
      });
      throw error;
    }
  }

  // Resend OTP
  async resendOTP(requestId, patientId) {
    try {
      const accessRequest = await AccessRequest.findOne({
        where: {
          id: requestId,
          patientId: patientId,
          status: 'pending',
          isActive: true
        }
      });

      if (!accessRequest) {
        throw new Error('Access request not found or unauthorized');
      }

      // Generate new OTP
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

      // Update access request with new OTP
      await accessRequest.update({
        otpCode: otp,
        otpExpiry,
        otpAttempts: 0 // Reset attempts
      });

      // Get patient details
      const patient = await User.findByPk(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Send new OTP
      await this.sendOTPEmail(patient.email, otp, 'access');

      logger.info('OTP resent successfully', {
        requestId: accessRequest.id,
        patientId
      });

      return accessRequest;
    } catch (error) {
      logger.error('Failed to resend OTP', {
        requestId,
        patientId,
        error: error.message
      });
      throw error;
    }
  }

  // Deny access request
  async denyAccess(requestId, patientId, reason = 'Access denied by patient') {
    try {
      const accessRequest = await AccessRequest.findOne({
        where: {
          id: requestId,
          status: 'pending',
          isActive: true
        }
      });

      if (!accessRequest) {
        throw new Error('Access request not found or already processed');
      }

      // Verify that the patient is authorized to deny this request
      if (accessRequest.patientId !== patientId) {
        throw new Error('Unauthorized to deny this access request');
      }

      await accessRequest.update({
        status: 'denied',
        isActive: false,
        denialReason: reason
      });

      // Log the denial
      await AuditLog.logSecurityEvent(
        accessRequest.patientId,
        'access_denied',
        { accessRequestId: accessRequest.id, doctorId: accessRequest.doctorId, reason },
        'medium'
      );

      logger.info('Access denied successfully', {
        requestId: accessRequest.id,
        doctorId: accessRequest.doctorId,
        patientId: accessRequest.patientId,
        reason
      });

      return accessRequest;
    } catch (error) {
      logger.error('Failed to deny access', {
        requestId,
        patientId,
        error: error.message
      });
      throw error;
    }
  }

  // Check if doctor has active access to patient
  async hasActiveAccess(doctorId, patientId) {
    try {
      const accessRequest = await AccessRequest.findOne({
        where: {
          doctorId,
          patientId,
          status: 'approved',
          accessExpiresAt: {
            [require('sequelize').Op.gt]: new Date()
          },
          isActive: true
        }
      });

      return !!accessRequest;
    } catch (error) {
      logger.error('Failed to check active access', {
        doctorId,
        patientId,
        error: error.message
      });
      return false;
    }
  }

  // Get OTP statistics
  async getOTPStats() {
    try {
      const stats = await AccessRequest.findAll({
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status']
      });

      const result = {
        pending: 0,
        approved: 0,
        denied: 0,
        expired: 0,
        cancelled: 0
      };

      stats.forEach(stat => {
        const count = parseInt(stat.getDataValue('count'));
        result[stat.status] = count;
      });

      return result;
    } catch (error) {
      logger.error('Failed to get OTP stats', {
        error: error.message
      });
      throw error;
    }
  }

  // Get access request statistics
  async getAccessRequestStats(doctorId = null, patientId = null) {
    try {
      const whereClause = { isActive: true };
      
      if (doctorId) whereClause.doctorId = doctorId;
      if (patientId) whereClause.patientId = patientId;

      const stats = await AccessRequest.findAll({
        where: whereClause,
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status']
      });

      const result = {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        expired: 0
      };

      stats.forEach(stat => {
        const count = parseInt(stat.getDataValue('count'));
        result[stat.status] = count;
        result.total += count;
      });

      return result;
    } catch (error) {
      logger.error('Failed to get access request stats', {
        doctorId,
        patientId,
        error: error.message
      });
      throw error;
    }
  }

  // Clean up expired OTPs
  async cleanupExpiredOTPs() {
    try {
      const expiredRequests = await AccessRequest.findAll({
        where: {
          status: 'pending',
          otpExpiry: {
            [require('sequelize').Op.lt]: new Date()
          },
          isActive: true
        }
      });

      for (const request of expiredRequests) {
        await request.update({
          status: 'expired',
          isActive: false
        });
      }

      logger.info(`Cleaned up ${expiredRequests.length} expired OTPs`);
      return expiredRequests.length;
    } catch (error) {
      logger.error('Failed to cleanup expired OTPs', {
        error: error.message
      });
      throw error;
    }
  }
}

// Create singleton instance
const otpService = new OTPService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  otpService.cleanupExpiredOTPs().catch(error => {
    logger.error('Failed to cleanup expired OTPs in scheduled task', error);
  });
}, 5 * 60 * 1000);

module.exports = otpService;
