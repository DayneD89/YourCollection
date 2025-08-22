#!/usr/bin/env node

/**
 * Test Configuration Reader
 * 
 * This utility reads the party-survey.yaml config file and provides
 * configuration values for the test system.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function readConfig() {
  try {
    // Path to config file from test directory
    const configPath = path.join(__dirname, '../party-survey.yaml');
    
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      // Return defaults if config file not found
      return {
        admin: {
          email: 'admin@example.com',
          password: 'AdminTest123@'
        }
      };
    }
    
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContent);
    
    if (!config.admin) {
      console.error('Missing admin configuration in party-survey.yaml');
      return {
        admin: {
          email: 'admin@example.com',
          password: 'AdminTest123@'
        }
      };
    }
    
    return config;
    
  } catch (error) {
    console.error('Failed to read configuration:', error.message);
    // Return defaults on error
    return {
      admin: {
        email: 'admin@example.com',
        password: 'AdminTest123@'
      }
    };
  }
}

// Handle command line usage
if (require.main === module) {
  const config = readConfig();
  console.log(`ADMIN_EMAIL="${config.admin.email}"`);
  console.log(`ADMIN_PASSWORD="${config.admin.password}"`);
}

module.exports = { readConfig };