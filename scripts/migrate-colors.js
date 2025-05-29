#!/usr/bin/env node

/**
 * Color Migration Script
 * 
 * This script helps identify and optionally replace hardcoded Tailwind colors
 * with semantic theme-aware colors for proper dark mode support.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color mapping for automated replacement
const COLOR_MAPPINGS = {
  // Background colors
  'bg-background': 'bg-background',
  'bg-muted': 'bg-muted',
  'bg-accent': 'bg-accent',
  
  // Text colors
  'text-foreground': 'text-foreground',
  'text-muted-foreground': 'text-muted-foreground',
  'text-muted-foreground': 'text-muted-foreground',
  'text-foreground': 'text-foreground',
  'text-foreground': 'text-foreground',
  
  // Border colors
  'border-border': 'border-border',
  'border-input': 'border-input',
  
  // Hover states
  'hover:bg-muted': 'hover:bg-accent',
  'hover:text-foreground': 'hover:text-accent-foreground',
  'hover:text-muted-foreground': 'hover:text-foreground',
  'hover:border-input': 'hover:border-input',
};

// Patterns to search for (but handle manually due to context)
const MANUAL_REVIEW_PATTERNS = [
  'bg-gray-',
  'text-gray-',
  'border-gray-',
  'hover:bg-gray-',
  'hover:text-gray-',
  'focus:bg-gray-',
  'bg-black',
  'text-white',
];

function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next
        if (!['node_modules', '.next', '.git'].includes(item)) {
          walk(fullPath);
        }
      } else if (extensions.some(ext => fullPath.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for hardcoded colors
  for (const [hardcoded, semantic] of Object.entries(COLOR_MAPPINGS)) {
    if (content.includes(hardcoded)) {
      issues.push({
        type: 'auto-replaceable',
        hardcoded,
        semantic,
        count: (content.match(new RegExp(hardcoded, 'g')) || []).length
      });
    }
  }
  
  // Check for patterns that need manual review
  for (const pattern of MANUAL_REVIEW_PATTERNS) {
    const regex = new RegExp(pattern + '\\d+', 'g');
    const matches = content.match(regex);
    if (matches) {
      issues.push({
        type: 'manual-review',
        pattern,
        matches: [...new Set(matches)], // unique matches
        count: matches.length
      });
    }
  }
  
  return issues;
}

function generateReport() {
  console.log('🔍 Scanning for hardcoded colors...\n');
  
  const files = findFiles(process.cwd());
  const allIssues = {};
  
  for (const file of files) {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      allIssues[file] = issues;
    }
  }
  
  // Generate summary report
  const autoReplaceable = {};
  const manualReview = {};
  
  Object.entries(allIssues).forEach(([file, issues]) => {
    issues.forEach(issue => {
      if (issue.type === 'auto-replaceable') {
        autoReplaceable[issue.hardcoded] = (autoReplaceable[issue.hardcoded] || 0) + issue.count;
      } else {
        issue.matches.forEach(match => {
          manualReview[match] = (manualReview[match] || 0) + 1;
        });
      }
    });
  });
  
  console.log('📊 SUMMARY REPORT');
  console.log('==================\n');
  
  console.log('🤖 Auto-replaceable colors:');
  Object.entries(autoReplaceable).forEach(([color, count]) => {
    const semantic = COLOR_MAPPINGS[color];
    console.log(`  ${color} → ${semantic} (${count} occurrences)`);
  });
  
  console.log('\n🔍 Colors needing manual review:');
  Object.entries(manualReview).forEach(([color, count]) => {
    console.log(`  ${color} (${count} files)`);
  });
  
  console.log('\n📁 FILES WITH ISSUES:');
  console.log('=====================\n');
  
  Object.entries(allIssues).forEach(([file, issues]) => {
    console.log(`📄 ${file.replace(process.cwd(), '.')}`);
    issues.forEach(issue => {
      if (issue.type === 'auto-replaceable') {
        console.log(`  ✅ ${issue.hardcoded} → ${issue.semantic} (${issue.count}x)`);
      } else {
        console.log(`  ⚠️  ${issue.matches.join(', ')} (manual review needed)`);
      }
    });
    console.log('');
  });
  
  return { autoReplaceable: Object.keys(autoReplaceable).length > 0, allIssues };
}

function performAutoReplace() {
  console.log('🔄 Performing automatic replacements...\n');
  
  const files = findFiles(process.cwd());
  let totalReplacements = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let fileReplacements = 0;
    
    for (const [hardcoded, semantic] of Object.entries(COLOR_MAPPINGS)) {
      const before = content;
      content = content.replace(new RegExp(hardcoded, 'g'), semantic);
      const replacements = (before.match(new RegExp(hardcoded, 'g')) || []).length;
      if (replacements > 0) {
        fileReplacements += replacements;
        console.log(`  ${file.replace(process.cwd(), '.')}: ${hardcoded} → ${semantic} (${replacements}x)`);
      }
    }
    
    if (fileReplacements > 0) {
      fs.writeFileSync(file, content);
      totalReplacements += fileReplacements;
    }
  }
  
  console.log(`\n✅ Completed! Made ${totalReplacements} automatic replacements.`);
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--fix')) {
  const { autoReplaceable } = generateReport();
  if (autoReplaceable) {
    console.log('\n🔧 Running automatic fixes...\n');
    performAutoReplace();
    console.log('\n📋 Re-scanning after fixes...\n');
    generateReport();
  } else {
    console.log('\n✅ No auto-replaceable colors found!');
  }
} else {
  generateReport();
  console.log('\n💡 TIP: Run with --fix to automatically replace colors where possible');
  console.log('   Example: node scripts/migrate-colors.js --fix\n');
} 