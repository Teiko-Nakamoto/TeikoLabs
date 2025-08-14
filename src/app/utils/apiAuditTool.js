// API Audit Tool - Comprehensive verification of 15-second caching implementation
// This tool scans all files to ensure blockchain API calls use proper caching

import fs from 'fs';
import path from 'path';

// Patterns to detect blockchain API calls
const BLOCKCHAIN_PATTERNS = {
  // Direct fetchCallReadOnlyFunction calls (should be wrapped)
  directCalls: [
    /fetchCallReadOnlyFunction\s*\(\s*\{/g,
    /fetchCallReadOnlyFunction\s*\(\s*params/g,
    /fetchCallReadOnlyFunction\s*\(\s*{[\s\S]*?}\s*\)/g
  ],
  
  // Properly cached calls (what we want)
  cachedCalls: [
    /loggedBlockchainCall\s*\(\s*['"`][^'"`]+['"`]\s*,/g,
    /loggedBlockchainCall\s*\(\s*`[^`]+`\s*,/g
  ],
  
  // API route patterns that should use caching
  apiRoutes: [
    /\/api\/.*\.js$/,
    /\/api\/.*\.ts$/
  ],
  
  // Files that should contain blockchain calls
  blockchainFiles: [
    /fetchTokenData\.js$/,
    /swapLogic\.js$/,
    /hiro-config\.js$/,
    /cacheLogger\.js$/,
    /.*\.js$/
  ]
};

// Function to scan a file for blockchain API calls
function scanFileForBlockchainCalls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const goodCalls = [];
    
    // Check for direct blockchain calls (issues)
    BLOCKCHAIN_PATTERNS.directCalls.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Get line number
          const lines = content.split('\n');
          const lineNumber = lines.findIndex(line => line.includes(match.trim())) + 1;
          
          issues.push({
            type: 'direct_call',
            pattern: `Pattern ${index + 1}`,
            match: match.trim().substring(0, 100) + '...',
            line: lineNumber,
            file: filePath
          });
        });
      }
    });
    
    // Check for properly cached calls (good)
    BLOCKCHAIN_PATTERNS.cachedCalls.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const lines = content.split('\n');
          const lineNumber = lines.findIndex(line => line.includes(match.trim())) + 1;
          
          goodCalls.push({
            type: 'cached_call',
            pattern: `Cached Pattern ${index + 1}`,
            match: match.trim().substring(0, 100) + '...',
            line: lineNumber,
            file: filePath
          });
        });
      }
    });
    
    return { issues, goodCalls };
  } catch (error) {
    return { issues: [], goodCalls: [], error: error.message };
  }
}

// Function to recursively scan directories
function scanDirectory(dirPath, results = { issues: [], goodCalls: [], files: [] }) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath, results);
      } else if (stat.isFile() && /\.(js|ts|jsx|tsx)$/.test(item)) {
        const fileResults = scanFileForBlockchainCalls(fullPath);
        results.issues.push(...fileResults.issues);
        results.goodCalls.push(...fileResults.goodCalls);
        results.files.push(fullPath);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return results;
  }
}

// Function to generate audit report
function generateAuditReport(scanResults) {
  const report = {
    summary: {
      totalFiles: scanResults.files.length,
      totalIssues: scanResults.issues.length,
      totalGoodCalls: scanResults.goodCalls.length,
      complianceRate: scanResults.goodCalls.length / (scanResults.issues.length + scanResults.goodCalls.length) * 100
    },
    issues: scanResults.issues,
    goodCalls: scanResults.goodCalls,
    recommendations: []
  };
  
  // Generate recommendations
  if (scanResults.issues.length > 0) {
    report.recommendations.push('❌ Found direct blockchain calls that need caching');
    report.recommendations.push('🔧 Wrap all fetchCallReadOnlyFunction calls with loggedBlockchainCall');
    report.recommendations.push('⏱️ Ensure all calls use 15-second cache duration');
  }
  
  if (scanResults.goodCalls.length > 0) {
    report.recommendations.push('✅ Found properly cached blockchain calls');
  }
  
  if (report.summary.complianceRate === 100) {
    report.recommendations.push('🎉 All blockchain calls are properly cached!');
  }
  
  return report;
}

// Main audit function
export async function auditBlockchainAPICalls() {
  console.log('🔍 Starting comprehensive blockchain API audit...');
  
  // Scan the src directory
  const scanResults = scanDirectory('./src');
  
  // Generate report
  const report = generateAuditReport(scanResults);
  
  // Display results
  console.log('\n📊 AUDIT RESULTS:');
  console.log('================');
  console.log(`📁 Files scanned: ${report.summary.totalFiles}`);
  console.log(`❌ Issues found: ${report.summary.totalIssues}`);
  console.log(`✅ Good calls: ${report.summary.totalGoodCalls}`);
  console.log(`📈 Compliance rate: ${report.summary.complianceRate.toFixed(1)}%`);
  
  if (report.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    console.log('================');
    report.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`   Type: ${issue.type}`);
      console.log(`   Pattern: ${issue.pattern}`);
      console.log(`   Match: ${issue.match}`);
      console.log('');
    });
  }
  
  if (report.goodCalls.length > 0) {
    console.log('\n✅ PROPERLY CACHED CALLS:');
    console.log('========================');
    report.goodCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.file}:${call.line}`);
      console.log(`   Type: ${call.type}`);
      console.log(`   Pattern: ${call.pattern}`);
      console.log(`   Match: ${call.match}`);
      console.log('');
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('==================');
  report.recommendations.forEach(rec => console.log(`• ${rec}`));
  
  return report;
}

// Function to check specific files
export function auditSpecificFiles(filePaths) {
  console.log('🔍 Auditing specific files...');
  
  const results = { issues: [], goodCalls: [], files: [] };
  
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const fileResults = scanFileForBlockchainCalls(filePath);
      results.issues.push(...fileResults.issues);
      results.goodCalls.push(...fileResults.goodCalls);
      results.files.push(filePath);
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  });
  
  return generateAuditReport(results);
}

// Function to verify cache duration
export function verifyCacheDuration() {
  console.log('⏱️ Verifying cache duration settings...');
  
  const cacheFiles = [
    './src/app/utils/cacheLogger.js',
    './src/app/utils/hiro-config.js',
    './src/app/utils/fetchTokenData.js'
  ];
  
  const results = [];
  
  cacheFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for 15-second cache duration
      const cachePatterns = [
        /15000/g, // 15 seconds in milliseconds
        /15\s*\*\s*1000/g, // 15 * 1000
        /cacheDuration\s*=\s*15000/g,
        /CACHE_DURATION\s*=\s*15000/g
      ];
      
      const found = cachePatterns.some(pattern => pattern.test(content));
      results.push({
        file: filePath,
        has15SecondCache: found,
        patterns: cachePatterns.map(pattern => pattern.test(content))
      });
    }
  });
  
  return results;
}

// Export for use in other files
export default {
  auditBlockchainAPICalls,
  auditSpecificFiles,
  verifyCacheDuration,
  scanFileForBlockchainCalls
};
