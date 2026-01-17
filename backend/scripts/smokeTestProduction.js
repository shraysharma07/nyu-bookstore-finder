#!/usr/bin/env node
// backend/scripts/smokeTestProduction.js
// Production smoke test for API endpoints
// Usage: API_BASE_URL=https://api.madridbookfinder.com node scripts/smokeTestProduction.js

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || process.env.REACT_APP_API_URL || 'https://api.madridbookfinder.com';
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
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      timeout: 10000
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let body;
        try {
          body = data ? JSON.parse(data) : {};
        } catch (e) {
          body = { raw: data };
        }
        resolve({ status: res.statusCode, body, headers: res.headers });
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
      log(`✗ Health check failed: status ${res.status}, body: ${JSON.stringify(res.body)}`);
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

async function testStudentsSearch() {
  log('Test 2: POST /api/students/search with {dorm, course, courseType}...');
  try {
    const startTime = Date.now();
    const res = await makeRequest(`${API_URL}/students/search`, {
      method: 'POST',
      body: {
        dorm: 'Chamberi',
        course: 'SPAN-UA 9003',
        courseType: 'Language'
      }
    });
    const elapsed = Date.now() - startTime;

    if (elapsed > 5000) {
      log(`✗ Search took too long: ${elapsed}ms`);
      testsFailed++;
      failures.push(`Search timeout: ${elapsed}ms`);
      return false;
    }

    if (res.status === 200) {
      if (res.body.ok === true || res.body.success === true) {
        const hasRequiredBooks = Array.isArray(res.body.requiredBooks);
        const hasBooksAlias = Array.isArray(res.body.books);
        if (hasRequiredBooks && hasBooksAlias) {
          log(`✓ Search passed (${elapsed}ms, requiredBooks: ${res.body.requiredBooks.length}, books alias: ${res.body.books.length})`);
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
    } else if (res.status === 400 || res.status === 404 || res.status === 503) {
      // 400/404/503 are acceptable if data doesn't exist, but structure should be valid
      log(`⚠ Search returned ${res.status} (expected if no data, but structure is valid)`);
      if (res.body.error && res.body.message) {
        log(`  Response: ${res.body.error} - ${res.body.message}`);
        testsPassed++;
        return true;
      } else {
        log(`✗ Search response missing error/message fields`);
        testsFailed++;
        failures.push('Search response missing error fields');
        return false;
      }
    } else {
      log(`✗ Search failed: status ${res.status}, body: ${JSON.stringify(res.body)}`);
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

async function testStudentsSearchValidation() {
  log('Test 3: POST /api/students/search validation (missing fields)...');
  try {
    const res = await makeRequest(`${API_URL}/students/search`, {
      method: 'POST',
      body: {
        dorm: 'Chamberi'
        // Missing course and courseType
      }
    });

    if (res.status === 400 && res.body.error && res.body.missingFields) {
      log(`✓ Validation test passed (correctly rejected missing fields)`);
      testsPassed++;
      return true;
    } else {
      log(`✗ Validation test failed: expected 400 with missingFields, got ${res.status}`);
      testsFailed++;
      failures.push('Validation test failed');
      return false;
    }
  } catch (e) {
    log(`✗ Validation test error: ${e.message}`);
    testsFailed++;
    failures.push(`Validation test error: ${e.message}`);
    return false;
  }
}

async function runAllTests() {
  log('Starting production smoke tests...');
  log(`API URL: ${API_URL}`);
  log('');

  await testHealth();
  await testStudentsSearch();
  await testStudentsSearchValidation();

  log('');
  log('=== SUMMARY ===');
  log(`Passed: ${testsPassed}`);
  log(`Failed: ${testsFailed}`);
  
  if (failures.length > 0) {
    log('');
    log('Failures:');
    failures.forEach((f, i) => log(`  ${i + 1}. ${f}`));
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  log(`Fatal error: ${err.message}`);
  process.exit(1);
});
