/**
 * PatientLetterHub Health Check
 * Run this after deploy: `node healthCheck.js`
 */

import fetch from 'node-fetch';

async function checkEndpoint(url, cookies = '') {
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Cookie': cookies },
    });

    if (!res.ok) {
      console.error(`❌ ${url} - HTTP ${res.status}`);
      return false;
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`❌ ${url} - Non-JSON response`);
      return false;
    }

    const data = await res.json();
    if (!data.success) {
      console.error(`❌ ${url} - API returned failure:`, data.message);
      return false;
    }

    console.log(`✅ ${url} - OK`);
    return true;
  } catch (err) {
    console.error(`❌ ${url} - ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Running PatientLetterHub health check...');

  // You might need to log in first to get cookies if required.
  // Here we assume open endpoints or pre-set test session.
  let allOk = true;

  allOk &= await checkEndpoint('http://localhost:5000/api/auth/user');
  allOk &= await checkEndpoint('http://localhost:5000/api/quotes');
  allOk &= await checkEndpoint('http://localhost:5000/api/orders');
  allOk &= await checkEndpoint('http://localhost:5000/api/settings/practice/locations');

  if (allOk) {
    console.log('🎉 All core endpoints are healthy!');
    process.exit(0);
  } else {
    console.error('❗ One or more endpoints failed.');
    process.exit(1);
  }
}

main();
