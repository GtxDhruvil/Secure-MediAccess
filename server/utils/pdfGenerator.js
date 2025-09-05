const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class MedicalReportGenerator {
  constructor() {
    this.doc = null;
    this.pageWidth = 595.28; // A4 width in points
    this.pageHeight = 841.89; // A4 height in points
    this.margin = 50;
    this.currentY = this.margin;
  }

  async generateMedicalReport(recordData, patientData, doctorData) {
    this.doc = new PDFDocument({ 
      size: 'A4',
      margin: this.margin,
      info: {
        Title: `Medical Report - ${patientData.firstName} ${patientData.lastName}`,
        Author: `Dr. ${doctorData.firstName} ${doctorData.lastName}`,
        Subject: 'Medical Report',
        Creator: 'Secure Medical Access System'
      }
    });

    this.currentY = this.margin;

    // Header
    this.addHeader();
    
    // Doctor Information
    this.addDoctorInfo(doctorData, recordData.recordDate);
    
    // Patient Information
    this.addPatientInfo(patientData);
    
    // Medical Record Details
    this.addMedicalRecord(recordData);
    
    // Attachments
    if (recordData.filePath) {
      await this.addAttachment(recordData);
    }
    
    // Footer
    this.addFooter();

    return this.doc;
  }

  addHeader() {
    // Hospital/Clinic Header
    this.doc.fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text('SECURE MEDICAL CENTER', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 30;
    
    this.doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('Advanced Healthcare Solutions | Secure Medical Records', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 15;
    
    this.doc.fontSize(10)
      .text('📍 123 Medical Plaza, Healthcare District | 📞 +1 (555) 123-4567 | 📧 info@securemedical.com', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 40;
    
    // Title
    this.doc.fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('MEDICAL REPORT', this.margin, this.currentY, { align: 'center' });
    
    this.currentY += 30;
    
    // Horizontal line
    this.doc.strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(this.margin, this.currentY)
      .lineTo(this.pageWidth - this.margin, this.currentY)
      .stroke();
    
    this.currentY += 20;
  }

  addDoctorInfo(doctorData, visitDate) {
    this.doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('ATTENDING PHYSICIAN', this.margin, this.currentY);
    
    this.currentY += 25;
    
    const doctorInfo = [
      { label: 'Doctor Name:', value: `Dr. ${doctorData.firstName} ${doctorData.lastName}` },
      { label: 'Specialization:', value: doctorData.specialization || 'General Medicine' },
      { label: 'License Number:', value: doctorData.licenseNumber || 'MD-2024-001' },
      { label: 'Visit Date:', value: new Date(visitDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) },
      { label: 'Contact:', value: doctorData.email }
    ];

    doctorInfo.forEach(info => {
      this.doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text(info.label, this.margin, this.currentY);
      
      this.doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#1f2937')
        .text(info.value, this.margin + 120, this.currentY);
      
      this.currentY += 20;
    });
    
    this.currentY += 15;
  }

  addPatientInfo(patientData) {
    this.doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('PATIENT INFORMATION', this.margin, this.currentY);
    
    this.currentY += 25;
    
    const age = patientData.dateOfBirth ? 
      Math.floor((new Date() - new Date(patientData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
      'N/A';
    
    const patientInfo = [
      { label: 'Patient Name:', value: `${patientData.firstName} ${patientData.lastName}` },
      { label: 'Date of Birth:', value: patientData.dateOfBirth ? 
        new Date(patientData.dateOfBirth).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : 'Not provided' },
      { label: 'Age:', value: `${age} years` },
      { label: 'Gender:', value: patientData.gender || 'Not specified' },
      { label: 'Contact:', value: patientData.email },
      { label: 'Phone:', value: patientData.phoneNumber || 'Not provided' },
      { label: 'Patient ID:', value: patientData.id.substring(0, 8).toUpperCase() }
    ];

    patientInfo.forEach(info => {
      this.doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text(info.label, this.margin, this.currentY);
      
      this.doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#1f2937')
        .text(info.value, this.margin + 120, this.currentY);
      
      this.currentY += 20;
    });
    
    this.currentY += 15;
  }

  addMedicalRecord(recordData) {
    this.doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('MEDICAL RECORD DETAILS', this.margin, this.currentY);
    
    this.currentY += 25;
    
    // Record Type Badge
    this.doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .rect(this.margin, this.currentY, 100, 20)
      .fill('#3b82f6')
      .fillColor('#ffffff')
      .text(recordData.recordType.toUpperCase(), this.margin + 10, this.currentY + 6);
    
    this.currentY += 35;
    
    // Record Title
    this.doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('Title:', this.margin, this.currentY);
    
    this.currentY += 18;
    
    this.doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#1f2937')
      .text(recordData.title, this.margin, this.currentY);
    
    this.currentY += 25;
    
    // Description/Prescription
    this.doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('Description/Prescription:', this.margin, this.currentY);
    
    this.currentY += 20;
    
    // Description box
    const boxWidth = this.pageWidth - 2 * this.margin;
    const descriptionHeight = Math.max(60, this.doc.heightOfString(recordData.description, { width: boxWidth - 20 }));
    
    this.doc.rect(this.margin, this.currentY, boxWidth, descriptionHeight + 20)
      .stroke('#e5e7eb');
    
    this.doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#1f2937')
      .text(recordData.description, this.margin + 10, this.currentY + 10, { 
        width: boxWidth - 20,
        align: 'left'
      });
    
    this.currentY += descriptionHeight + 40;
  }

  async addAttachment(recordData) {
    if (this.currentY > this.pageHeight - 200) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
    
    this.doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('ATTACHMENTS', this.margin, this.currentY);
    
    this.currentY += 20;
    
    const filePath = path.resolve(recordData.filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    
    if (fs.existsSync(filePath)) {
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension)) {
        // Image attachment
        try {
          const imageWidth = 400;
          const imageHeight = 300;
          
          this.doc.fontSize(11)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(`Attached Image: ${recordData.fileName || 'Medical Image'}`, this.margin, this.currentY);
          
          this.currentY += 20;
          
          this.doc.image(filePath, this.margin, this.currentY, {
            width: imageWidth,
            height: imageHeight,
            fit: [imageWidth, imageHeight]
          });
          
          this.currentY += imageHeight + 20;
        } catch (error) {
          console.error('Error adding image to PDF:', error);
          this.doc.fontSize(11)
            .font('Helvetica')
            .fillColor('#ef4444')
            .text(`Error loading image: ${recordData.fileName}`, this.margin, this.currentY);
          this.currentY += 20;
        }
      } else {
        // Other file types
        this.doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text(`Attached File: ${recordData.fileName || 'Medical Document'}`, this.margin, this.currentY);
        
        this.currentY += 15;
        
        this.doc.fontSize(10)
          .fillColor('#9ca3af')
          .text(`File Type: ${fileExtension.toUpperCase()}`, this.margin, this.currentY);
        
        this.currentY += 15;
        
        this.doc.fontSize(10)
          .fillColor('#3b82f6')
          .text('Note: Original file is available for download separately.', this.margin, this.currentY);
        
        this.currentY += 30;
      }
    } else {
      this.doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#ef4444')
        .text('Attachment file not found on server.', this.margin, this.currentY);
      this.currentY += 20;
    }
  }

  addFooter() {
    const footerY = this.pageHeight - 80;
    
    // Horizontal line
    this.doc.strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(this.margin, footerY)
      .lineTo(this.pageWidth - this.margin, footerY)
      .stroke();
    
    // Footer text
    this.doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('This is a computer-generated medical report from Secure Medical Access System.', 
        this.margin, footerY + 10, { align: 'center' });
    
    this.doc.fontSize(8)
      .fillColor('#9ca3af')
      .text(`Generated on: ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, this.margin, footerY + 25, { align: 'center' });
    
    // Simple page number on current page only
    this.doc.fontSize(8)
      .fillColor('#9ca3af')
      .text('Page 1', 
        this.pageWidth - this.margin - 50, this.pageHeight - 30, { align: 'right' });
  }
}

module.exports = MedicalReportGenerator;
