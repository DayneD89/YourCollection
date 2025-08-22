#!/usr/bin/env node

/**
 * Configuration Reader for Shell Scripts
 * 
 * This utility reads the party-survey.yaml config file and outputs
 * shell-friendly environment variable assignments.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function readConfig() {
  try {
    // Path to config file from scripts directory
    const configPath = path.join(__dirname, '../../../party-survey.yaml');
    
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      process.exit(1);
    }
    
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContent);
    
    if (!config.admin) {
      console.error('Missing admin configuration in party-survey.yaml');
      process.exit(1);
    }
    
    // Output shell-friendly format
    console.log(`ADMIN_EMAIL="${config.admin.email}"`);
    console.log(`ADMIN_PASSWORD="${config.admin.password}"`);
    
  } catch (error) {
    console.error('Failed to read configuration:', error.message);
    process.exit(1);
  }
}

// Handle command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default: output all config as shell variables
    readConfig();
  } else {
    console.error('Usage: node read-config.js');
    process.exit(1);
  }
}

module.exports = { readConfig };