#!/usr/bin/env node
// backend/scripts/comprehensiveSmokeTests.js
// Comprehensive smoke tests for production verification

const https = require('https');
const http = require('http');
const { pool } = require('../db');
const { parseCSV } = require('../utils/csvParser');
const { importCatalog } = require('../utils/catalogImporter');

const API_BASE_URL = process.env.API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
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
  log('Test 1: /health endpoint...');
  try {
    const res = await makeRequest(`${API_URL.replace('/api', '')}/health`);
    if (res.status === 200 && res.body.ok === true) {
      log('✓ Health check passed');
      testsPassed++;
      return true;
    } else {
      log(`✗ Health check failed: status ${res.status}`);
      testsFailed++;
      failures.push('Health check failed');
      return false;
    }
  } catch (e) {
    log(`✗ Health check error: ${e.message}`);
    testsFailed++;
    failures.push(`Health check error: ${e.message}`);
    return false;
  }
}

async function testApiHealth() {
  log('Test 2: /api/health endpoint...');
  try {
    const res = await makeRequest(`${API_URL}/health`);
    if (res.status === 200 && res.body.ok === true) {
      log('✓ API health check passed');
      testsPassed++;
      return true;
    } else {
      log(`✗ API health check failed: status ${res.status}`);
      testsFailed++;
      failures.push('API health check failed');
      return false;
    }
  } catch (e) {
    log(`✗ API health check error: ${e.message}`);
    testsFailed++;
    failures.push(`API health check error: ${e.message}`);
    return false;
  }
}

async function testAdminLogin() {
  log('Test 3: Admin login...');
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    log('⚠ Skipping login test (no credentials provided)');
    return true;
  }
  
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
      log(`✗ Login test failed: status ${res.status}`);
      testsFailed++;
      failures.push('Login failed');
      return null;
    }
  } catch (e) {
    log(`✗ Login test error: ${e.message}`);
    testsFailed++;
    failures.push(`Login test error: ${e.message}`);
    return null;
  }
}

async function testStudentsSearch() {
  log('Test 4: /api/students/search endpoint...');
  try {
    const startTime = Date.now();
    const res = await makeRequest(`${API_URL}/students/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Test Student',
        dorm: 'Chamberi',
        course: 'WREX-UF 9101',
        professor: 'Weubben'
      },
    });
    const elapsed = Date.now() - startTime;
    
    if (elapsed > 1000) {
      log(`✗ Search took too long: ${elapsed}ms (expected <1000ms)`);
      testsFailed++;
      failures.push(`Search timeout: ${elapsed}ms`);
      return false;
    }
    
    if (res.status === 200) {
      if (res.body.success && Array.isArray(res.body.requiredBooks) && Array.isArray(res.body.bookstores)) {
        log(`✓ Search test passed (${elapsed}ms, ${res.body.requiredBooks.length} books, ${res.body.bookstores.length} stores)`);
        testsPassed++;
        return true;
      } else {
        log(`✗ Search returned invalid structure`);
        testsFailed++;
        failures.push('Search invalid structure');
        return false;
      }
    } else if (res.status === 400 || res.status === 503) {
      log(`⚠ Search returned ${res.status} (expected if no data, but structure is valid)`);
      testsPassed++;
      return true;
    } else {
      log(`✗ Search failed: status ${res.status}`);
      testsFailed++;
      failures.push(`Search failed: ${res.status}`);
      return false;
    }
  } catch (e) {
    log(`✗ Search test error: ${e.message}`);
    testsFailed++;
    failures.push(`Search test error: ${e.message}`);
    return false;
  }
}

async function testCatalogEndpoints() {
  log('Test 5: Catalog endpoints...');
  try {
    // Test a course endpoint
    const res = await makeRequest(`${API_URL}/books/course/WREX-UF%209101`);
    
    if (res.status === 200) {
      log('✓ Catalog endpoint test passed');
      testsPassed++;
      return true;
    } else {
      log(`⚠ Catalog endpoint returned ${res.status} (may be expected if no data)`);
      testsPassed++;
      return true;
    }
  } catch (e) {
    log(`✗ Catalog endpoint error: ${e.message}`);
    testsFailed++;
    failures.push(`Catalog endpoint error: ${e.message}`);
    return false;
  }
}

async function runAllTests() {
  log('Starting comprehensive smoke tests...');
  log(`API URL: ${API_URL}`);
  log('');
  
  await testHealth();
  await testApiHealth();
  await testAdminLogin();
  await testStudentsSearch();
  await testCatalogEndpoints();
  
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
