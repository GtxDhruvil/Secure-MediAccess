const bcrypt = require('bcryptjs');
const { User } = require('./server/models');
const { sequelize } = require('./server/config/database');

async function createTestUser() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected');

    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 12);

    // Create test patient
    const testPatient = await User.create({
      email: 'patient@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Patient',
      phoneNumber: '+1234567890',
      role: 'patient',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      isActive: true,
      isVerified: true
    });

    console.log('✅ Test patient created successfully:');
    console.log('Email: patient@test.com');
    console.log('Password: Test123!');
    console.log('Role: patient');
    console.log('ID:', testPatient.id);

    // Create test doctor
    const testDoctor = await User.create({
      email: 'doctor@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Doctor',
      phoneNumber: '+1234567891',
      role: 'doctor',
      specialization: 'General Medicine',
      licenseNumber: 'MD123456',
      isActive: true,
      isVerified: true
    });

    console.log('✅ Test doctor created successfully:');
    console.log('Email: doctor@test.com');
    console.log('Password: Test123!');
    console.log('Role: doctor');
    console.log('ID:', testDoctor.id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
}

createTestUser();
