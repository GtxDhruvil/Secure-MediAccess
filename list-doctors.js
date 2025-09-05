const { User } = require('./server/models');
const { sequelize } = require('./server/config/database');

async function listDoctors() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const doctors = await User.findAll({ 
      where: { role: 'doctor' },
      attributes: ['firstName', 'lastName', 'email', 'specialization', 'licenseNumber']
    });

    if (doctors.length === 0) {
      console.log('❌ No doctors found in the database.');
      process.exit(0);
    }

    console.log('✅ Found the following doctors:');
    doctors.forEach(doctor => {
      console.log('---');
      console.log(`  Name: ${doctor.firstName} ${doctor.lastName}`);
      console.log(`  Email: ${doctor.email}`);
      console.log(`  Specialization: ${doctor.specialization || 'Not set'}`);
      console.log(`  License Number: ${doctor.licenseNumber || 'Not set'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing doctors:', error);
    process.exit(1);
  }
}

listDoctors();
