const { User } = require('./server/models');
const { sequelize } = require('./server/config/database');

async function updateDoctorDetails() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // --- IMPORTANT --- 
    // --- Change the email, specialization, and license number below ---
    const doctorEmail = 'archigazdar.co22d1@scet.ac.in'; // <--- SET THE DOCTOR'S EMAIL HERE
    const newSpecialization = 'Cardiology';       // <--- SET THE NEW SPECIALIZATION HERE
    const newLicenseNumber = 'MD-CARD-8899';     // <--- SET THE NEW LICENSE NUMBER HERE

    const doctor = await User.findOne({ where: { email: doctorEmail, role: 'doctor' } });

    if (!doctor) {
      console.error(`❌ Error: Could not find a doctor with the email: ${doctorEmail}`);
      process.exit(1);
    }

    doctor.specialization = newSpecialization;
    doctor.licenseNumber = newLicenseNumber;
    await doctor.save();

    console.log(`✅ Successfully updated doctor: ${doctor.firstName} ${doctor.lastName}`);
    console.log(`   New Specialization: ${doctor.specialization}`);
    console.log(`   New License Number: ${doctor.licenseNumber}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating doctor details:', error);
    process.exit(1);
  }
}

updateDoctorDetails();
