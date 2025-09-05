const { Pool } = require('pg');
require('dotenv').config();

async function unlockUser() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'secure_medical_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    console.log('Connecting to database...');
    
    // Unlock the test patient account
    const result = await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = $1',
      ['patient@test.com']
    );

    if (result.rowCount > 0) {
      console.log('✅ Test patient account unlocked successfully');
      console.log('Email: patient@test.com');
      console.log('Password: Test123!');
      console.log('You can now login with these credentials');
    } else {
      console.log('❌ User not found');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error unlocking user:', error);
    await pool.end();
    process.exit(1);
  }
}

unlockUser();
