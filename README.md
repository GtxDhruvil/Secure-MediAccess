# Secure Medical Access - Medical Record System

A revolutionary medical record system that puts patients in control of their data while providing healthcare providers secure, OTP-verified access when needed.

## 🚀 Features

### 🔐 Security & Privacy
- **OTP-Based Access Control**: Real-time consent via OTP verification for doctor access
- **End-to-End Encryption**: AES-256 encryption for sensitive medical data
- **Role-Based Access Control**: Separate dashboards for patients and doctors
- **Comprehensive Audit Trail**: Track every access, modification, and action
- **HIPAA Compliance Ready**: Built with healthcare security standards in mind

### 👥 User Management
- **Patient Dashboard**: View, manage, and control access to medical records
- **Doctor Dashboard**: Request access, manage patients, and create records
- **Admin Panel**: System monitoring and user management
- **Secure Authentication**: JWT-based authentication with session management

### 📁 Medical Records
- **Secure File Uploads**: Support for PDF, DOC, images with encryption
- **Record Management**: Create, update, and organize medical records
- **Access Control**: Granular permissions for different record types
- **Audit Logging**: Complete history of all record interactions

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Framework**: Express.js with TypeScript support
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT tokens with session management
- **Security**: Helmet, CORS, Rate limiting, Input validation
- **File Handling**: Multer with encryption and secure storage

### Frontend (React)
- **Framework**: React 18 with modern hooks
- **Styling**: TailwindCSS for responsive design
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form with validation
- **UI Components**: Lucide React icons + custom components

### Database Schema
- **Users**: Patient, doctor, and admin roles
- **Medical Records**: Encrypted data with file attachments
- **Access Requests**: OTP-based access control system
- **Audit Logs**: Comprehensive activity tracking

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd secure-medical-access

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your database and service credentials

# Create uploads directory
mkdir -p uploads/medical-records

# Start the server
npm run dev
```

### Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm start
```

### Database Setup
```bash
# Create PostgreSQL database
createdb secure_medical_access

# Run migrations (automatic with sequelize.sync)
# The server will automatically create tables on startup
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/secure_medical_access

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Session Configuration
SESSION_SECRET=your-session-secret-key

# File Upload
UPLOAD_PATH=uploads/medical-records
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png

# Email Service (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Client URL
CLIENT_URL=http://localhost:3000
```

## 🚀 Usage

### Starting the Application

```bash
# Development mode (both backend and frontend)
npm run dev

# Backend only
npm run server

# Frontend only
npm run client

# Production build
npm run build
npm start
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### OTP Management
- `POST /api/otp/request-access` - Request access to patient records
- `POST /api/otp/verify-otp` - Verify OTP and grant access
- `POST /api/otp/deny-access` - Deny access request
- `GET /api/otp/request-stats` - Get access request statistics

#### Patient Routes
- `GET /api/patient/medical-records` - Get patient's medical records
- `GET /api/patient/access-requests` - Get access requests
- `GET /api/patient/stats` - Get patient statistics
- `GET /api/patient/profile` - Get patient profile

#### Doctor Routes
- `GET /api/doctor/patients` - Get doctor's patients
- `GET /api/doctor/medical-records` - Get doctor's medical records
- `POST /api/doctor/medical-records` - Create new medical record
- `GET /api/doctor/stats` - Get doctor statistics

#### File Management
- `POST /api/files/upload` - Upload medical record files
- `GET /api/files/download/:filename` - Download files
- `GET /api/files/info/:filename` - Get file information

#### Admin Routes
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/health` - System health check

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Patient, Doctor, Admin)
- Session management with secure cookies
- Account lockout after failed attempts

### Data Protection
- AES-256 encryption for sensitive data
- Secure file uploads with type validation
- Input sanitization and validation
- SQL injection prevention

### Access Control
- OTP-based consent for record access
- Time-limited access permissions
- Comprehensive audit logging
- IP tracking and rate limiting

## 📱 User Interface

### Patient Dashboard
- Overview with medical record statistics
- Medical records management
- Access request approvals/denials
- Profile and security settings

### Doctor Dashboard
- Patient management
- Medical record creation and management
- Access request monitoring
- Analytics and reporting

### Responsive Design
- Mobile-first approach
- Modern UI components
- Accessibility features
- Cross-browser compatibility

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test

# Run all tests
npm run test:all
```

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple levels
- **Audit Trail**: Complete activity tracking
- **Health Checks**: System status monitoring
- **Error Handling**: Centralized error management

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client && npm run build

# Set environment variables
NODE_ENV=production

# Start production server
npm start
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Email**: support@securemedicalaccess.com
- **Phone**: +1-800-MEDICAL

## 🙏 Acknowledgments

- Healthcare security standards and best practices
- Open source community contributions
- HIPAA compliance guidelines
- Medical data protection regulations

---

**⚠️ Important Notice**: This system is designed for educational and development purposes. For production use in healthcare environments, ensure compliance with local regulations and conduct thorough security audits.
