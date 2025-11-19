const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { MedicalRecord, AuditLog } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

// Upload file for medical record
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate file hash for integrity checking
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Log the file upload
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: req.user.id,
      action: 'upload_file',
      resourceType: 'file',
      resourceId: req.file.filename,
      details: `File uploaded: ${req.file.originalname}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        hash: fileHash
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
});

// Download file (with access control)
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.env.UPLOAD_PATH || 'uploads/medical-records', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Log the file download
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: req.user.id,
      action: 'download_file',
      resourceType: 'file',
      resourceId: filename,
      details: `File downloaded: ${filename}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
});

// Get file info
router.get('/info/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.env.UPLOAD_PATH || 'uploads/medical-records', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    res.json({
      success: true,
      file: {
        filename,
        originalname: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        hash: fileHash
      }
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file info'
    });
  }
});

// Delete file (admin only)
router.delete('/:filename', requireRole('admin'), async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.env.UPLOAD_PATH || 'uploads/medical-records', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    // Log the file deletion
    await AuditLog.create({
      userId: req.user.id,
      targetUserId: req.user.id,
      action: 'delete_file',
      resourceType: 'file',
      resourceId: filename,
      details: `File deleted: ${filename}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      outcome: 'success'
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

// List uploaded files (admin only)
router.get('/list', requireRole('admin'), async (req, res) => {
  try {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads/medical-records';
    
    if (!fs.existsSync(uploadPath)) {
      return res.json({
        success: true,
        files: []
      });
    }

    const files = fs.readdirSync(uploadPath);
    const fileList = [];

    for (const filename of files) {
      const filePath = path.join(uploadPath, filename);
      const stats = fs.statSync(filePath);
      
      fileList.push({
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    }

    res.json({
      success: true,
      files: fileList
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files'
    });
  }
});

module.exports = router;









