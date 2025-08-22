import express from 'express';
import formSchemaService from '../services/formSchema';
import formDataService from '../services/formDataService';
import { verifyToken, requireAdmin } from './auth';

const router = express.Router();

/**
 * GET /api/forms/schema
 * Get the form schema for the survey form
 * Requires authentication
 */
router.get('/schema', verifyToken, (req, res) => {
  try {
    const schema = formSchemaService.getFormSchema();
    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    console.error('Error loading form schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load form configuration',
      error: (error as Error).message
    });
  }
});

/**
 * POST /api/forms/submit
 * Submit form data with validation and dynamic table storage
 * Requires authentication - user ID is logged as the data enterer
 */
router.post('/submit', verifyToken, async (req: any, res) => {
  try {
    const formData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required for form submission'
      });
    }

    // Submit the form data using the form data service
    const result = await formDataService.submitFormData(formData, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Form submitted successfully',
        data: {
          submissionId: result.submissionId,
          submittedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Form validation failed',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process form submission',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/forms/submissions
 * Get form submissions (admin only)
 * Query parameters: limit, offset, userId
 */
router.get('/submissions', verifyToken, requireAdmin, async (req: any, res) => {
  try {
    const { limit, offset, userId } = req.query;
    const adminUserId = req.user?.id;

    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      userId: userId || undefined
    };

    const result = await formDataService.getFormSubmissions(adminUserId, options);

    if (result.success) {
      res.json({
        success: true,
        data: {
          submissions: result.data,
          total: result.total,
          pagination: {
            limit: options.limit || 50,
            offset: options.offset || 0
          }
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve form submissions',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error retrieving form submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve form submissions',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/forms/info
 * Get current form information including table name and schema hash (admin only)
 */
router.get('/info', verifyToken, requireAdmin, (req, res) => {
  try {
    const formInfo = formDataService.getFormInfo();
    res.json({
      success: true,
      data: {
        tableName: formInfo.tableName,
        schemaHash: formInfo.schemaHash,
        schema: {
          title: formInfo.schema.title,
          description: formInfo.schema.description,
          fieldCount: formInfo.schema.fields.length,
          sensitiveFields: formInfo.schema.fields.filter(f => f.sensitive).length
        }
      }
    });
  } catch (error) {
    console.error('Error getting form info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get form information',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/forms/fields/sensitive
 * Get list of sensitive field names (for server-side processing)
 * Requires authentication
 */
router.get('/fields/sensitive', verifyToken, (req, res) => {
  try {
    const sensitiveFields = formSchemaService.getSensitiveFields();
    res.json({
      success: true,
      data: sensitiveFields
    });
  } catch (error) {
    console.error('Error getting sensitive fields:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sensitive fields',
      error: (error as Error).message
    });
  }
});

/**
 * DELETE /api/forms/table/:tableName
 * Drop a form data table (admin only, primarily for testing cleanup)
 */
router.delete('/table/:tableName', verifyToken, requireAdmin, async (req: any, res) => {
  try {
    const { tableName } = req.params;
    
    // Basic security check - only allow dropping tables that match form table pattern
    if (!tableName.startsWith('form_submissions_')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table name - can only drop form submission tables'
      });
    }

    const result = await formDataService.dropFormTable(tableName);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Form table ${tableName} dropped successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to drop form table'
      });
    }
  } catch (error) {
    console.error('Error dropping form table:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to drop form table',
      error: (error as Error).message
    });
  }
});

export default router;