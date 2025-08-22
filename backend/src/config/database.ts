/**
 * PostgreSQL Database Configuration and Connection Management
 * 
 * This module handles all database connectivity for the Party Collection backend.
 * It uses the 'pg' (node-postgres) library to create a connection pool that
 * efficiently manages multiple concurrent database connections.
 * 
 * Key concepts:
 * - Connection Pool: Maintains multiple database connections for better performance
 * - Environment Variables: Database credentials loaded from .env file
 * - Error Handling: Graceful handling of connection failures
 * - Lifecycle Management: Functions to connect and disconnect from database
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'
import { logger } from '../utils/logger'

// Load environment variables from .env file
// This ensures database credentials are available from process.env
dotenv.config()

/**
 * PostgreSQL Connection Pool
 * 
 * A pool maintains multiple database connections that can be reused across requests.
 * This is much more efficient than creating a new connection for each database query.
 * 
 * Benefits of connection pooling:
 * - Faster query execution (no connection overhead)
 * - Better resource management
 * - Automatic connection recovery
 * - Concurrent request handling
 */
export const pool = new Pool({
  // Database server hostname/IP
  // Local: 'localhost', Remote: RDS endpoint from environment
  host: process.env.DB_HOST || 'localhost',
  
  // PostgreSQL server port
  // 5432 is the default PostgreSQL port
  port: parseInt(process.env.DB_PORT || '5432'),
  
  // Name of the database to connect to
  // This database must exist before connecting
  database: process.env.DB_NAME || 'party_collection',
  
  // PostgreSQL username with access to the database
  user: process.env.DB_USER || 'postgres',
  
  // Password for the PostgreSQL user
  password: process.env.DB_PASSWORD || 'password',
  
  // Pool configuration optimized for different environments
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  
  // SSL configuration for remote databases
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' 
    ? { rejectUnauthorized: false } 
    : false,
})

/**
 * Connect to PostgreSQL Database
 * 
 * This function initializes the database connection and verifies that
 * the database is accessible. It should be called during application startup.
 * 
 * @returns Promise<void> - Resolves if connection successful, rejects on error
 * 
 * How it works:
 * 1. Attempts to get a connection from the pool
 * 2. If successful, the connection is automatically returned to pool
 * 3. If failed, logs error and exits the application
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Test the connection by getting a client from the pool
    // This will throw an error if the database is unreachable
    const client = await pool.connect()
    
    // Release the client back to the pool immediately
    // We only needed to test the connection
    client.release()
    
    logger.info('PostgreSQL connected successfully')
    logger.info(`Connected to database: ${process.env.DB_NAME || 'party_collection'}`)
    logger.info(`Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`)
    
    // Debug information about connection pool
    logger.debug('Database connection pool configured', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'party_collection',
      user: process.env.DB_USER || 'postgres',
      maxConnections: pool.options.max || 10,
      idleTimeout: pool.options.idleTimeoutMillis || 30000
    })
  } catch (error) {
    // Connection failed - this is a critical error
    logger.error('Error connecting to PostgreSQL')
    logger.error('Please check:')
    logger.error('1. PostgreSQL server is running')
    logger.error('2. Database credentials in .env file are correct')
    logger.error('3. Database exists and user has proper permissions')
    logger.error('Connection error details', error)
    
    // Exit the application since we can't function without database
    // Exit code 1 indicates an error occurred
    process.exit(1)
  }
}

/**
 * Disconnect from PostgreSQL Database
 * 
 * This function gracefully closes all connections in the pool.
 * It should be called when the application is shutting down to ensure
 * all database connections are properly closed.
 * 
 * @returns Promise<void> - Resolves when all connections are closed
 * 
 * Note: This is typically called in process shutdown handlers
 * or application cleanup routines.
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    // Close all connections in the pool
    // This will wait for any active queries to complete
    await pool.end()
    
    logger.info('PostgreSQL connection closed')
  } catch (error) {
    // Log error but don't exit - we're shutting down anyway
    logger.error('Error closing PostgreSQL connection', error)
  }
}

/**
 * Example Usage in Other Files:
 * 
 * import { pool } from '../config/database'
 * 
 * // Execute a query
 * const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
 * const user = result.rows[0]
 * 
 * // The connection is automatically returned to the pool after the query
 */