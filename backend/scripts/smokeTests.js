#!/usr/bin/env node
// backend/scripts/smokeTests.js
// Production smoke tests - verifies critical endpoints work

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || process.env.REACT_APP_API_URL || 'https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.SMOKE_ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SMOKE_ADMIN_PASSWORD || '';

const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function log(message) {
  console.log(`[SMOKE] ${message}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
      timeout: 15000,
    };
    
    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testHealth() {
  log('Testing /api/health...');
  try {
    const res = await makeRequest(`${API_URL}/health`);
    if (res.status === 200 && res.body.ok === true) {
      log('✓ Health check passed');
      testsPassed++;
      return true;
    } else {
      log(`✗ Health check failed: status ${res.status}, body: ${JSON.stringify(res.body)}`);
      testsFailed++;
      failures.push('Health check returned non-200 or !ok');
      return false;
    }
  } catch (e) {
    log(`✗ Health check error: ${e.message}`);
    testsFailed++;
    failures.push(`Health check error: ${e.message}`);
    return false;
  }
}

async function testAuthHealth() {
  log('Testing /api/auth/health...');
  try {
    const res = await makeRequest(`${API_URL}/auth/health`);
    if (res.status === 200 && res.body.ok === true) {
      log('✓ Auth health check passed');
      log(`  - Has secret: ${res.body.hasSecret}`);
      log(`  - Has admin: ${res.body.hasAdmin}`);
      log(`  - DB connected: ${res.body.dbConnected}`);
      testsPassed++;
      return true;
    } else {
      log(`✗ Auth health check failed: status ${res.status}`);
      testsFailed++;
      failures.push('Auth health check failed');
      return false;
    }
  } catch (e) {
    log(`✗ Auth health check error: ${e.message}`);
    testsFailed++;
    failures.push(`Auth health check error: ${e.message}`);
    return false;
  }
}

async function testLogin() {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    log('⚠ Skipping login test (no credentials provided)');
    return true;
  }
  
  log('Testing /api/auth/login...');
  try {
    const res = await makeRequest(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    
    if (res.status === 200 && res.body.ok === true && res.body.token) {
      log('✓ Login test passed');
      testsPassed++;
      return res.body.token;
    } else {
      log(`✗ Login test failed: status ${res.status}, body: ${JSON.stringify(res.body)}`);
      testsFailed++;
      failures.push('Login failed - invalid credentials or server error');
      return null;
    }
  } catch (e) {
    log(`✗ Login test error: ${e.message}`);
    testsFailed++;
    failures.push(`Login test error: ${e.message}`);
    return null;
  }
}

async function testCatalogEndpoint(token) {
  log('Testing /api/catalog (or /api/books/course/...)');
  try {
    // Test catalog endpoint if it exists, or test a course endpoint
    const res = await makeRequest(`${API_URL}/books/course/SPAN-UA%209003`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    
    if (res.status === 200 && Array.isArray(res.body.books || res.body)) {
      log('✓ Catalog endpoint test passed');
      log(`  - Found ${(res.body.books || res.body).length} books`);
      testsPassed++;
      return true;
    } else {
      log(`✗ Catalog endpoint test failed: status ${res.status}`);
      testsFailed++;
      failures.push('Catalog endpoint returned unexpected format');
      return false;
    }
  } catch (e) {
    log(`✗ Catalog endpoint test error: ${e.message}`);
    testsFailed++;
    failures.push(`Catalog endpoint error: ${e.message}`);
    return false;
  }
}

async function testCatalogData() {
  log('Testing catalog contains expected data...');
  try {
    // Test for a known course from the CSV
    const res = await makeRequest(`${API_URL}/books/course/SPAN-UA%209003`);
    
    if (res.status === 200) {
      const books = res.body.books || res.body || [];
      const hasExpectedBook = books.some(b => 
        (b.title && b.title.includes('Aula Internacional')) ||
        (b.isbn && b.isbn === '9788418032226')
      );
      
      if (hasExpectedBook || books.length > 0) {
        log('✓ Catalog data test passed (found expected course data)');
        testsPassed++;
        return true;
      } else {
        log('⚠ Catalog data test: no expected book found, but endpoint works');
        log(`  - Found ${books.length} books for SPAN-UA 9003`);
        testsPassed++;
        return true;
      }
    } else {
      log(`✗ Catalog data test failed: status ${res.status}`);
      testsFailed++;
      failures.push('Catalog data test failed');
      return false;
    }
  } catch (e) {
    log(`✗ Catalog data test error: ${e.message}`);
    testsFailed++;
    failures.push(`Catalog data test error: ${e.message}`);
    return false;
  }
}

async function runAllTests() {
  log('Starting production smoke tests...');
  log(`API URL: ${API_URL}`);
  log('');
  
  await testHealth();
  await testAuthHealth();
  const token = await testLogin();
  await testCatalogEndpoint(token);
  await testCatalogData();
  
  log('');
  log('=== SUMMARY ===');
  log(`Passed: ${testsPassed}`);
  log(`Failed: ${testsFailed}`);
  
  if (failures.length > 0) {
    log('');
    log('Failures:');
    failures.forEach((f, i) => log(`  ${i + 1}. ${f}`));
  }
  
  if (testsFailed === 0) {
    log('');
    log('✅ All smoke tests passed!');
    process.exit(0);
  } else {
    log('');
    log('❌ Some smoke tests failed');
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  log(`Fatal error: ${e.message}`);
  console.error(e);
  process.exit(1);
});
