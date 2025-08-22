const path = require('path');
const fs = require('fs');
const { readConfig } = require('../config-reader');

// Load test environment variables with centralized configuration
function loadTestConfig() {
    // Determine test environment from TEST_ENV or NODE_ENV
    const testEnv = process.env.TEST_ENV || process.env.NODE_ENV || 'development';
    
    console.log(`Loading test configuration for environment: ${testEnv}`);
    console.log(`Configuration source: test-runner.js (centralized)`);
    
    // All test environment variables are now set by test-runner.js
    // This function just logs what was configured and provides defaults
    
    // Environment-specific API URL defaults
    const defaultApiUrls = {
        local: 'http://localhost:3001',
        development: process.env.DEV_API_URL || 'http://localhost:3001',
        dev: process.env.DEV_API_URL || 'http://localhost:3001', 
        production: process.env.PROD_API_URL || 'https://api.party-collection.com',
        prod: process.env.PROD_API_URL || 'https://api.party-collection.com'
    };
    
    // Read admin credentials from root config
    const rootConfig = readConfig();
    
    const config = {
        environment: testEnv,
        adminEmail: process.env.ADMIN_EMAIL || rootConfig.admin.email,
        adminPassword: process.env.ADMIN_PASSWORD || rootConfig.admin.password,
        baseUrl: process.env.BASE_URL || 'http://localhost:3000',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || defaultApiUrls[testEnv] || 'http://localhost:3001',
        testCleanup: process.env.TEST_CLEANUP_USERS === 'true',
        parallelIsolation: process.env.TEST_PARALLEL_ISOLATION === 'true'
    };
    
    console.log(`Test configuration loaded for environment: ${testEnv}`);
    console.log(`API URL: ${config.apiUrl}`);
    
    return config;
}

// Helper to create unique test users for parallel test isolation
function generateTestUser(testContext, role = 'user') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    const uniqueId = `${timestamp}-${random}`;
    
    return {
        email: `e2etest-${role}-${uniqueId}@example.com`,
        password: role === 'admin' ? 'TestAdmin123!@#' : 'TestUser123!@#',
        firstName: 'Test',
        lastName: role === 'admin' ? 'Admin' : 'User',
        role: role
    };
}

// API helper to create test users
async function createTestUser(testUser, adminCredentials) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: adminCredentials.email,
            password: adminCredentials.password
        })
    });
    
    const loginData = await response.json();
    if (!loginData.success) {
        throw new Error(`Admin login failed: ${loginData.message}`);
    }
    
    // Extract token from the correct location
    const token = loginData.token || loginData.data?.token;
    if (!token) {
        throw new Error(`Admin login succeeded but no token returned: ${JSON.stringify(loginData)}`);
    }
    
    const createResponse = await fetch(`${apiUrl}/api/auth/create-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            email: testUser.email,
            password: testUser.password,
            role: testUser.role,
            first_name: testUser.first_name || testUser.firstName,
            last_name: testUser.last_name || testUser.lastName
        })
    });
    
    // Check if response is JSON or HTML error
    const responseText = await createResponse.text();
    let createData;
    
    try {
        createData = JSON.parse(responseText);
    } catch (error) {
        throw new Error(`API returned non-JSON response (status ${createResponse.status}): ${responseText.substring(0, 200)}...`);
    }
    
    if (!createData.success) {
        throw new Error(`User creation failed: ${createData.message}`);
    }
    
    return { ...testUser, id: createData.data?.user?.id };
}

// API helper to delete test users - handles both user IDs and emails
async function deleteTestUser(userIdentifier, adminCredentials) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Login as admin
    const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: adminCredentials.email,
            password: adminCredentials.password
        })
    });
    
    const loginData = await response.json();
    if (!loginData.success) {
        console.warn(`Admin login failed during cleanup: ${loginData.message}`);
        return false;
    }
    
    const token = loginData.token || loginData.data?.token;
    let userId = userIdentifier;
    
    // If userIdentifier looks like an email, find the user ID first
    if (userIdentifier.includes('@')) {
        const usersResponse = await fetch(`${apiUrl}/api/auth/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const usersData = await usersResponse.json();
        if (!usersData.success) {
            console.warn(`Failed to list users during cleanup: ${usersData.message}`);
            return false;
        }
        
        const user = usersData.data?.users?.find(u => u.email === userIdentifier);
        if (!user) {
            console.warn(`User not found for cleanup: ${userIdentifier}`);
            return false;
        }
        
        userId = user.id;
    }
    
    // Delete the user by ID
    const deleteResponse = await fetch(`${apiUrl}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    const deleteData = await deleteResponse.json();
    return deleteData.success;
}

// Helper to get admin credentials from config
function getAdminCredentials() {
    const config = readConfig();
    return {
        email: process.env.ADMIN_EMAIL || config.admin.email,
        password: process.env.ADMIN_PASSWORD || config.admin.password
    };
}

module.exports = {
    loadTestConfig,
    generateTestUser,
    createTestUser,
    deleteTestUser,
    getAdminCredentials
};