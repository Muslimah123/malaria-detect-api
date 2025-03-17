// scripts/test-db-connection.js
require('dotenv').config();
const { Pool } = require('pg');

// Log all environment variables related to database (without exposing full password)
console.log('Database Configuration:');
console.log(`- DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME || 'not set'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '********' : 'not set'}`);

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Logging for troubleshooting
  debug: true
});

// Test connection
async function testConnection() {
  let client;
  try {
    console.log('Attempting to connect to database...');
    client = await pool.connect();
    console.log('Connection successful!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Query successful:');
    console.log(`Current time on database: ${result.rows[0].current_time}`);
    
    // List tables
    console.log('Listing tables:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rowCount === 0) {
      console.log('No tables found in the database.');
    } else {
      tables.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
  } catch (err) {
    console.error('Error connecting to database:');
    console.error(err);
    
    // Check common issues
    if (err.message.includes('password authentication failed')) {
      console.log('\nPossible solutions:');
      console.log('1. Check if your DB_PASSWORD in .env is correct');
      console.log('2. Verify user permissions in PostgreSQL');
      console.log('3. Check pg_hba.conf for authentication method (should be md5 or scram-sha-256)');
    }
    
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\nPossible solutions:');
      console.log('1. Check if PostgreSQL is running');
      console.log('2. Verify DB_HOST and DB_PORT are correct');
      console.log('3. Check firewall settings');
    }
    
    if (err.message.includes('database') && err.message.includes('does not exist')) {
      console.log('\nPossible solutions:');
      console.log('1. Create the database using: CREATE DATABASE malaria_detection;');
      console.log('2. Verify DB_NAME in .env matches an existing database');
    }
    
    if (err.message.includes('SCRAM-SERVER-FIRST-MESSAGE')) {
      console.log('\nPossible solutions:');
      console.log('1. Ensure DB_PASSWORD is properly quoted in .env (no trailing spaces)');
      console.log('2. Verify the password is correct');
      console.log('3. Try resetting the user password in PostgreSQL');
    }
    
  } finally {
    if (client) {
      client.release();
    }
    pool.end();
  }
}

testConnection();