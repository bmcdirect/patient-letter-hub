#!/usr/bin/env node

/**
 * Script to remove debug logging from dashboard component
 * Run this after diagnosing the production dashboard loading issue
 */

const fs = require('fs');
const path = require('path');

const dashboardFile = path.join(__dirname, 'app', '(protected)', 'dashboard', 'page.tsx');

console.log('🧹 Removing debug logging from dashboard component...');

try {
  let content = fs.readFileSync(dashboardFile, 'utf8');
  
  // Remove all console.log statements
  content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
  
  // Remove empty lines that might be left behind
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Write back the cleaned content
  fs.writeFileSync(dashboardFile, content);
  
  console.log('✅ Debug logging removed successfully!');
  console.log('📝 Next steps:');
  console.log('   1. Review the changes: git diff');
  console.log('   2. Commit the cleanup: git add app/(protected)/dashboard/page.tsx');
  console.log('   3. Commit: git commit -m "Cleanup: Remove temporary debug logging from dashboard"');
  console.log('   4. Push: git push origin main');
  
} catch (error) {
  console.error('❌ Error removing debug logging:', error.message);
  process.exit(1);
}
