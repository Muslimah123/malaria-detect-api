// scripts/init-database.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create connection pool (without database name to connect to postgres)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres', // Connect to default postgres database
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function initDatabase() {
  let client;
  try {
    console.log('Connecting to PostgreSQL server...');
    client = await pool.connect();
    
    // Check if database exists
    const dbName = process.env.DB_NAME || 'malaria_detection';
    console.log(`Checking if database "${dbName}" exists...`);
    
    const dbCheckResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);
    
    if (dbCheckResult.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      // Disconnect all other clients
      await client.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [dbName]);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully!`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
    
    // Close connection to postgres database
    client.release();
    
    // Connect to our newly created database
    console.log(`Connecting to "${dbName}" database...`);
    const dbPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: dbName,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    client = await dbPool.connect();
    
    // Run initialization SQL
    console.log('Initializing database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/db.sql'), 'utf8');
    
    // Split SQL by semicolon to execute each statement separately
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        console.warn(`Warning executing statement: ${error.message}`);
        console.warn('Statement:', statement.substring(0, 100) + '...');
        // Continue with next statement
      }
    }
    
    console.log('Database schema initialized successfully!');
    
    // Create default admin user if it doesn't exist
    const adminCheck = await client.query(`
      SELECT 1 FROM users WHERE email = 'admin@example.com'
    `);
    
    if (adminCheck.rowCount === 0) {
      console.log('Creating default admin user...');
      // Password: admin123
      await client.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Admin User', 'admin@example.com', '$2a$10$eiEp8rJFMQDFPVfhStQZVO8kW5oq3Mwh0aObUm/JdYjpULPYjmbai', 'admin')
      `);
      console.log('Default admin user created!');
      console.log('  Email: admin@example.com');
      console.log('  Password: admin123');
    } else {
      console.log('Default admin user already exists.');
    }
    
    console.log('\nDatabase setup completed successfully!');
    
  } catch (err) {
    console.error('Error during database initialization:');
    console.error(err);
  } finally {
    if (client) {
      client.release();
    }
    pool.end();
  }
}

// Run the initialization
initDatabase();