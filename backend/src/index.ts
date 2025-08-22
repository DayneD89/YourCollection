/**
 * Party Collection Backend API Server
 * 
 * This is the main entry point for the backend API server. It sets up an Express.js
 * application with all necessary middleware, routes, and database connections.
 * 
 * Key responsibilities:
 * - Configure Express app with security and CORS middleware
 * - Set up API routes for authentication and user management
 * - Connect to PostgreSQL database
 * - Provide health check endpoints
 * - Handle graceful server startup and error handling
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { connectDB } from './config/database'
import authRoutes from './routes/auth'
import formsRoutes from './routes/forms'
import { logger } from './utils/logger'

// Load environment variables from .env file
// This must be called before using any process.env variables
dotenv.config()

// Create Express application instance
const app = express()

// Set server port from environment variable or default to 3001
const PORT = process.env.PORT || 3001

/**
 * MIDDLEWARE SETUP
 * Middleware functions execute in the order they are added with app.use()
 * Each middleware has access to request/response objects and can modify them
 */

// Security middleware - adds various HTTP headers to secure the app
// Examples: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
app.use(helmet())

// CORS (Cross-Origin Resource Sharing) middleware
// Allows frontend on different port/domain to make requests to this API
app.use(cors({
  // Only allow requests from the frontend URL (security measure)
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Allow cookies/credentials to be sent in cross-origin requests
  // This is needed for authentication tokens
  credentials: true
}))

// HTTP request logging middleware
// Logs all incoming requests with details (method, URL, status, response time)
// 'combined' format includes IP, user agent, and other details
app.use(morgan('combined'))

// JSON parsing middleware
// Automatically parses JSON bodies in POST/PUT requests
// Makes JSON data available in req.body
app.use(express.json())

// URL-encoded form parsing middleware
// Handles form submissions with Content-Type: application/x-www-form-urlencoded
// extended: true allows parsing of nested objects
app.use(express.urlencoded({ extended: true }))

/**
 * ROUTE DEFINITIONS
 * Routes define what happens when specific URLs are requested
 */

// Root endpoint - provides basic API information
// GET / returns JSON with API details
app.get('/', (req, res) => {
  res.json({
    message: 'Party Collection Backend API',
    version: '1.0.0',
    status: 'running'
  })
})

// Health check endpoint - used by monitoring systems and tests
// GET /health returns server and database status
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected' // TODO: Add actual database health check
  })
})

// Authentication and user management routes
// All routes starting with /api/auth are handled by authRoutes
// Examples: /api/auth/login, /api/auth/users, etc.
app.use('/api/auth', authRoutes)

// Form schema and submission routes
// All routes starting with /api/forms are handled by formsRoutes
// Examples: /api/forms/schema, /api/forms/submit, etc.
app.use('/api/forms', formsRoutes)

/**
 * SERVER STARTUP FUNCTION
 * 
 * This async function handles the server startup process:
 * 1. Connect to PostgreSQL database
 * 2. Start Express server on specified port
 * 3. Handle any startup errors gracefully
 */
const startServer = async () => {
  try {
    // Attempt to connect to PostgreSQL database
    // This will throw an error if connection fails
    await connectDB()
    
    // Start the Express server listening on the specified port
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`API available at: http://localhost:${PORT}`)
      logger.info(`Health check: http://localhost:${PORT}/health`)
      logger.debug('Debug logging is enabled')
      
      // Log configuration details in debug mode
      logger.debug('Server configuration', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        debugEnabled: logger.isDebugEnabled(),
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      })
    })
  } catch (error) {
    // If startup fails, log the error and exit the process
    // process.exit(1) indicates an error occurred
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

// Start the server
// This is the actual execution that begins when the file is run
startServer()