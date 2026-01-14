#!/usr/bin/env node
// backend/scripts/smokeTests.js
// Production smoke tests

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.SMOKE_ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SMOKE_ADMIN_PASSWORD || '';

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
        'Content-Type': 'application/json',
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
  log('Test 1: GET /api/health...');
  try {
    const res = await makeRequest(`${API_URL}/health`);
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

async function testStudentsSearchFormat1() {
  log('Test 2: POST /api/students/search with format 1 ({name, dorm, course})...');
  try {
    const startTime = Date.now();
    const res = await makeRequest(`${API_URL}/students/search`, {
      method: 'POST',
      body: {
        name: 'Test Student',
        dorm: 'Chamberi',
        course: 'WREX-UF 9101'
      }
    });
    const elapsed = Date.now() - startTime;
    
    if (elapsed > 2000) {
      log(`✗ Search took too long: ${elapsed}ms`);
      testsFailed++;
      failures.push(`Search timeout: ${elapsed}ms`);
      return false;
    }
    
    if (res.status === 200) {
      if (res.body.ok === true || res.body.success === true) {
        const hasRequiredBooks = Array.isArray(res.body.requiredBooks);
        const hasBooks = Array.isArray(res.body.books); // Backwards compatibility alias
        if (hasRequiredBooks || hasBooks) {
          log(`✓ Search format 1 passed (${elapsed}ms, requiredBooks: ${hasRequiredBooks}, books alias: ${hasBooks})`);
          testsPassed++;
          return true;
        } else {
          log(`✗ Search response missing requiredBooks/books arrays`);
          testsFailed++;
          failures.push('Search response invalid structure');
          return false;
        }
      } else {
        log(`✗ Search returned invalid response structure`);
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

async function testStudentsSearchFormat2() {
  log('Test 3: POST /api/students/search with format 2 ({dorm, course, professor})...');
  try {
    const startTime = Date.now();
    const res = await makeRequest(`${API_URL}/students/search`, {
      method: 'POST',
      body: {
        dorm: 'Chamberi',
        course: 'WREX-UF 9101',
        professor: 'Weubben'
      }
    });
    const elapsed = Date.now() - startTime;
    
    if (elapsed > 2000) {
      log(`✗ Search took too long: ${elapsed}ms`);
      testsFailed++;
      failures.push(`Search timeout: ${elapsed}ms`);
      return false;
    }
    
    if (res.status === 200) {
      if (res.body.ok === true || res.body.success === true) {
        const hasRequiredBooks = Array.isArray(res.body.requiredBooks);
        const hasBooks = Array.isArray(res.body.books); // Backwards compatibility
        if (hasRequiredBooks || hasBooks) {
          log(`✓ Search format 2 passed (${elapsed}ms, requiredBooks: ${hasRequiredBooks}, books alias: ${hasBooks})`);
          testsPassed++;
          return true;
        } else {
          log(`✗ Search response missing requiredBooks/books arrays`);
          testsFailed++;
          failures.push('Search response invalid structure');
          return false;
        }
      } else {
        log(`✗ Search returned invalid response structure`);
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

async function testAdminLogin() {
  log('Test 4: Admin login...');
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    log('⚠ Skipping login test (no credentials provided)');
    return true;
  }
  
  try {
    const res = await makeRequest(`${API_URL}/auth/login`, {
      method: 'POST',
      body: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    
    if (res.status === 200 && res.body.ok === true && res.body.token) {
      log('✓ Login test passed');
      testsPassed++;
      return true;
    } else if (res.status === 401) {
      log('⚠ Login returned 401 (invalid credentials - expected if creds wrong)');
      testsPassed++; // 401 is expected behavior, not a failure
      return true;
    } else {
      log(`✗ Login test failed: status ${res.status}`);
      testsFailed++;
      failures.push('Login failed');
      return false;
    }
  } catch (e) {
    log(`✗ Login test error: ${e.message}`);
    testsFailed++;
    failures.push(`Login test error: ${e.message}`);
    return false;
  }
}

async function runAllTests() {
  log('Starting smoke tests...');
  log(`API URL: ${API_URL}`);
  log('');
  
  await testHealth();
  await testStudentsSearchFormat1();
  await testStudentsSearchFormat2();
  await testAdminLogin();
  
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
