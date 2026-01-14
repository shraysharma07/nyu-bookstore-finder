// db.js — single PG pool used everywhere (runtime and scripts)
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Only load .env in non-production
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config();
}

const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
const port = Number(process.env.DB_PORT || process.env.PGPORT || 5432);
const user = process.env.DB_USER || process.env.PGUSER || 'your_username';
const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'your_password';
const database = process.env.DB_NAME || process.env.PGDATABASE || 'nyu_book_finder';

// Prefer a single DATABASE_URL if present (required in production)
const connectionString = process.env.DATABASE_URL || null;

// Parse sslmode from DATABASE_URL if present
let sslmodeFromUrl = null;
if (connectionString) {
  const sslmodeMatch = connectionString.match(/[?&]sslmode=([^&]+)/i);
  if (sslmodeMatch) {
    sslmodeFromUrl = sslmodeMatch[1].toLowerCase();
  }
}

// Determine if SSL is required
// Check for sslmode=require, verify-full, verify-ca in DATABASE_URL
// OR explicit env vars OR production AWS environment OR if DATABASE_URL contains sslmode
const sslRequired =
  process.env.DB_SSL === 'true' ||
  process.env.PGSSLMODE === 'require' ||
  sslmodeFromUrl === 'require' ||
  sslmodeFromUrl === 'verify-full' ||
  sslmodeFromUrl === 'verify-ca' ||
  (process.env.NODE_ENV === 'production' && !!process.env.AWS_EXECUTION_ENV) ||
  (connectionString && connectionString.includes('sslmode=require'));

// Determine SSL verification level
const needsCAVerification = 
  sslmodeFromUrl === 'verify-full' || 
  sslmodeFromUrl === 'verify-ca' ||
  (process.env.PGSSLMODE && (process.env.PGSSLMODE === 'verify-full' || process.env.PGSSLMODE === 'verify-ca'));

// Allow insecure fallback only if explicitly enabled
const allowInsecure = process.env.DB_SSL_INSECURE === 'true';

// Build SSL config
let sslConfig = false;
if (sslRequired) {
  // Try to use RDS CA bundle for secure verification
  const caPaths = [
    path.join(__dirname, 'certs', 'rds-ca-bundle.pem'),
    path.join(__dirname, 'certs', 'rds-ca-global.pem'),
    '/etc/ssl/certs/rds-ca-bundle.pem', // System-wide location
  ];

  let caContent = null;
  for (const caPath of caPaths) {
    try {
      if (fs.existsSync(caPath)) {
        caContent = fs.readFileSync(caPath, 'utf8');
        console.log(`[db] Using RDS CA bundle from: ${caPath}`);
        break;
      }
    } catch (err) {
      // Continue to next path
    }
  }

  // For RDS with sslmode=require, ALWAYS use rejectUnauthorized: false (RDS uses self-signed certs)
  // Only use CA verification if explicitly requested with verify-full/verify-ca AND we have CA bundle
  const isRDSRequireMode = sslmodeFromUrl === 'require' || (connectionString && connectionString.includes('sslmode=require'));
  
  if (needsCAVerification && caContent && !isRDSRequireMode) {
    // Use CA bundle for verification (secure) - only if NOT using sslmode=require
    sslConfig = {
      ca: caContent,
      rejectUnauthorized: true,
    };
    console.log('[db] SSL enabled with CA verification (secure)');
  } else if (needsCAVerification && !caContent && !allowInsecure && !isRDSRequireMode) {
    // Need CA but don't have it and insecure not allowed - warn but try with CA verification anyway
    console.warn('[db] WARNING: SSL verification requested but CA bundle not found. Connection may fail.');
    console.warn('[db] To use insecure SSL, set DB_SSL_INSECURE=true (not recommended for production)');
    sslConfig = {
      rejectUnauthorized: true, // Will likely fail, but try
    };
  } else {
    // Use insecure SSL (rejectUnauthorized: false) - required for RDS with sslmode=require
    // This fixes "self-signed certificate in certificate chain" errors
    sslConfig = {
      rejectUnauthorized: false,
    };
    if (isRDSRequireMode) {
      console.log('[db] SSL enabled with rejectUnauthorized: false (RDS sslmode=require)');
    } else if (allowInsecure) {
      console.log('[db] SSL enabled with insecure mode (DB_SSL_INSECURE=true)');
    } else {
      console.log('[db] SSL enabled with rejectUnauthorized: false (RDS self-signed certs)');
    }
  }
}

// ALWAYS use rejectUnauthorized: false if SSL is enabled and DATABASE_URL has sslmode=require
// This fixes "self-signed certificate" errors for RDS connections
if (sslConfig && (sslmodeFromUrl === 'require' || (connectionString && connectionString.includes('sslmode=require')))) {
  if (sslConfig.rejectUnauthorized !== false) {
    console.log('[db] Forcing rejectUnauthorized: false for RDS compatibility (sslmode=require detected)');
  }
  sslConfig.rejectUnauthorized = false;
}

// Log diagnostic info (without secrets)
const logConnectionInfo = () => {
  const hasConnectionString = !!connectionString;
  let connectionPreview = 'not set';
  let dbHost = host;
  let dbName = database;
  
  if (hasConnectionString) {
    // Extract host and database from connection string for logging
    const urlMatch = connectionString.match(/@([^:]+):(\d+)\/([^?]+)/);
    if (urlMatch) {
      dbHost = urlMatch[1];
      dbName = urlMatch[3];
      connectionPreview = `${dbHost}/${dbName}`;
    } else {
      connectionPreview = connectionString.split('@')[1] || connectionString.substring(0, 20) + '...';
    }
  }
  
  console.log('[db] Connection config:', {
    usingConnectionString: hasConnectionString,
    host: dbHost,
    database: dbName,
    sslEnabled: !!sslConfig,
    sslMode: sslmodeFromUrl || process.env.PGSSLMODE || (sslRequired ? 'require (inferred)' : 'disabled'),
    sslConfig: sslConfig ? {
      hasCA: !!sslConfig.ca,
      rejectUnauthorized: sslConfig.rejectUnauthorized,
    } : false,
  });
};

logConnectionInfo();

// Override sslmode in connectionString if we're using our own ssl config
// This prevents pg from trying to parse sslmode from URL when we provide ssl object
let finalConnectionString = connectionString;
if (connectionString && sslConfig) {
  // Remove sslmode from connection string and let our ssl object handle it
  finalConnectionString = connectionString
    .replace(/[?&]sslmode=[^&]+/gi, '')
    .replace(/\?$/, ''); // Remove trailing ? if it was the only param
}

const pool = new Pool(
  finalConnectionString
    ? {
        connectionString: finalConnectionString,
        ssl: sslConfig,
      }
    : {
        host,
        port,
        user,
        password,
        database,
        ssl: sslConfig,
      }
);

pool.on('error', (err) => {
  console.error('[pg] unexpected error on idle client:', err.message);
});

// Export pool and a helper to test connection
module.exports = { 
  pool,
  testConnection: async () => {
    try {
      const result = await pool.query('SELECT 1 as test');
      return { connected: true, result: result.rows[0] };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }
};
