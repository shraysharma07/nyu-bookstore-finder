#!/usr/bin/env node
// backend/scripts/generateAdminHash.js
// Generate bcrypt hash for admin password

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateHash(password) {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);
  return hash;
}

// Get password from command line or prompt
const password = process.argv[2];

if (password) {
  // Password provided as argument
  const hash = generateHash(password);
  console.log('');
  console.log('=== Admin Password Hash Generated ===');
  console.log('');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('Set this in EB:');
  console.log(`  eb setenv ADMIN_PASSWORD_HASH="${hash}"`);
  console.log('');
  process.exit(0);
} else {
  // Prompt for password
  rl.question('Enter admin password: ', (password) => {
    if (!password) {
      console.error('Password cannot be empty');
      process.exit(1);
    }
    
    const hash = generateHash(password);
    console.log('');
    console.log('=== Admin Password Hash Generated ===');
    console.log('');
    console.log('Hash:', hash);
    console.log('');
    console.log('Set this in EB:');
    console.log(`  eb setenv ADMIN_PASSWORD_HASH="${hash}"`);
    console.log('');
    console.log('Or set both username and hash:');
    console.log(`  eb setenv ADMIN_USERNAME="admin" ADMIN_PASSWORD_HASH="${hash}"`);
    console.log('');
    rl.close();
  });
}
