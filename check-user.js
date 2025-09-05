const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndFixUser() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'secure_medical_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    console.log('Checking user...');
    
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, email, role, is_active, is_verified FROM users WHERE email = $1',
      ['patient@test.com']
    );

    if (userCheck.rows.length === 0) {
      console.log('❌ User not found, creating new user...');
      
      // Create new user with proper password
      const hashedPassword = await bcrypt.hash('Test123!', 12);
      
      await pool.query(
        `INSERT INTO users (id, email, password, role, first_name, last_name, phone_number, 
         date_of_birth, gender, is_active, is_verified, failed_login_attempts, preferences, 
         created_at, updated_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        ['patient@test.com', hashedPassword, 'patient', 'Test', 'Patient', '+1234567890', 
         '1990-01-01', 'male', true, true, 0, '{}']
      );
      
      console.log('✅ New user created');
    } else {
      console.log('✅ User exists:', userCheck.rows[0]);
      
      // Reset password to ensure it's correct
      const hashedPassword = await bcrypt.hash('Test123!', 12);
      
      await pool.query(
        'UPDATE users SET password = $1, failed_login_attempts = 0, locked_until = NULL WHERE email = $2',
        [hashedPassword, 'patient@test.com']
      );
      
      console.log('✅ Password reset and account unlocked');
    }

    console.log('\n🔑 Login Credentials:');
    console.log('Email: patient@test.com');
    console.log('Password: Test123!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkAndFixUser();
