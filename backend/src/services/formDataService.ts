/**
 * Form Data Collection Service
 * 
 * This service handles the dynamic creation of tables for storing form submissions
 * based on the YAML form configuration. Each form configuration gets its own table
 * to accommodate different field structures and maintain data integrity.
 * 
 * Key features:
 * - Dynamic table creation based on form schema hash
 * - Tracks sensitive vs non-sensitive fields
 * - Records which user entered the data
 * - Provides type-safe data validation
 */

import crypto from 'crypto';
import { pool } from '../config/database';
import formSchemaService from './formSchema';
import { logger } from '../utils/logger';

interface FormField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  sensitive?: boolean;
  min?: number;
  max?: number;
}

interface FormSchema {
  title: string;
  description: string;
  fields: FormField[];
}

interface FormSubmission {
  [key: string]: any;
}

class FormDataService {
  /**
   * Generate a hash of the form schema for table naming
   */
  private generateFormHash(schema: FormSchema): string {
    const schemaString = JSON.stringify({
      title: schema.title,
      fields: schema.fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required,
        sensitive: f.sensitive
      }))
    });
    
    return crypto
      .createHash('sha256')
      .update(schemaString)
      .digest('hex')
      .substring(0, 16); // Use first 16 characters for table name
  }

  /**
   * Get the table name for the current form schema
   */
  private getTableName(): string {
    const schema = formSchemaService.getFormSchema();
    const hash = this.generateFormHash(schema);
    return `form_submissions_${hash}`;
  }

  /**
   * Create a table for storing form submissions if it doesn't exist
   */
  private async ensureTableExists(): Promise<string> {
    const schema = formSchemaService.getFormSchema();
    const tableName = this.getTableName();
    
    logger.debug('Ensuring table exists for form submissions', { 
      tableName,
      schemaTitle: schema.title,
      fieldCount: schema.fields.length
    });

    // Build column definitions dynamically based on form schema
    const columns = schema.fields.map(field => {
      let columnType: string;
      
      switch (field.type) {
        case 'text':
        case 'email':
          columnType = 'TEXT';
          break;
        case 'boolean':
          columnType = 'BOOLEAN';
          break;
        case 'slider':
          columnType = 'INTEGER';
          break;
        default:
          columnType = 'TEXT'; // Default to text for unknown types
      }
      
      return `${field.name} ${columnType}`;
    });

    // Create the table with standard metadata columns + dynamic form fields
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        submitted_by UUID NOT NULL,
        form_schema_hash VARCHAR(16) NOT NULL,
        ${columns.join(',\n        ')},
        CONSTRAINT fk_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    try {
      await pool.query(createTableQuery);
      logger.info('Form submissions table created or verified', { tableName });

      // Create an index on submitted_by for performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_${tableName}_submitted_by 
        ON ${tableName} (submitted_by)
      `);

      // Create an index on submitted_at for performance  
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_${tableName}_submitted_at
        ON ${tableName} (submitted_at)
      `);

      return tableName;
    } catch (error) {
      logger.error('Failed to create form submissions table', { 
        tableName, 
        error: (error as Error).message 
      });
      throw new Error(`Failed to create form submissions table: ${(error as Error).message}`);
    }
  }

  /**
   * Validate form submission data against the current schema
   */
  private validateSubmissionData(data: FormSubmission): { isValid: boolean; errors: string[] } {
    const schema = formSchemaService.getFormSchema();
    const errors: string[] = [];

    // Check required fields
    for (const field of schema.fields) {
      if (field.required && (data[field.name] === undefined || data[field.name] === null || data[field.name] === '')) {
        errors.push(`Field '${field.label}' is required`);
      }
    }

    // Type validation
    for (const field of schema.fields) {
      const value = data[field.name];
      if (value !== undefined && value !== null && value !== '') {
        switch (field.type) {
          case 'email':
            if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors.push(`Field '${field.label}' must be a valid email address`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`Field '${field.label}' must be true or false`);
            }
            break;
          case 'slider':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`Field '${field.label}' must be a number`);
            } else if (field.min !== undefined && value < field.min) {
              errors.push(`Field '${field.label}' must be at least ${field.min}`);
            } else if (field.max !== undefined && value > field.max) {
              errors.push(`Field '${field.label}' must be at most ${field.max}`);
            }
            break;
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Submit form data to the database
   */
  async submitFormData(data: FormSubmission, userId: string): Promise<{ success: boolean; submissionId?: string; errors?: string[] }> {
    try {
      // Validate the submission data
      const validation = this.validateSubmissionData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Ensure the table exists for this form schema
      const tableName = await this.ensureTableExists();
      const schema = formSchemaService.getFormSchema();
      const formHash = this.generateFormHash(schema);

      // Build the insert query dynamically
      const fieldNames = schema.fields.map(f => f.name);
      const validData = fieldNames.reduce((acc, fieldName) => {
        if (data[fieldName] !== undefined) {
          acc[fieldName] = data[fieldName];
        }
        return acc;
      }, {} as FormSubmission);

      const columns = ['submitted_by', 'form_schema_hash', ...Object.keys(validData)];
      const values = [userId, formHash, ...Object.values(validData)];
      const placeholders = values.map((_, index) => `$${index + 1}`);

      const insertQuery = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id, submitted_at
      `;

      logger.debug('Inserting form submission', {
        tableName,
        userId,
        fieldCount: Object.keys(validData).length,
        formHash
      });

      const result = await pool.query(insertQuery, values);
      const submission = result.rows[0];

      // Log sensitive fields separately for audit purposes
      const sensitiveFields = schema.fields
        .filter(f => f.sensitive && data[f.name] !== undefined)
        .map(f => f.name);

      if (sensitiveFields.length > 0) {
        logger.info('Form submission contains sensitive data', {
          submissionId: submission.id,
          userId,
          sensitiveFieldCount: sensitiveFields.length,
          tableName
        });

        // Log to audit table for sensitive data tracking
        await pool.query(`
          INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          tableName,
          submission.id,
          'INSERT',
          JSON.stringify({
            action: 'SENSITIVE_DATA_SUBMISSION',
            sensitiveFields,
            submissionTime: submission.submitted_at,
            formTitle: schema.title
          }),
          userId
        ]);
      }

      logger.info('Form submission successful', {
        submissionId: submission.id,
        tableName,
        userId,
        submittedAt: submission.submitted_at
      });

      return { success: true, submissionId: submission.id };

    } catch (error) {
      logger.error('Form submission failed', {
        userId,
        error: (error as Error).message,
        data: Object.keys(data)
      });
      
      return { 
        success: false, 
        errors: [`Failed to submit form: ${(error as Error).message}`] 
      };
    }
  }

  /**
   * Get form submissions for a specific user (admin only)
   */
  async getFormSubmissions(adminUserId: string, options: {
    limit?: number;
    offset?: number;
    userId?: string;
  } = {}): Promise<{ success: boolean; data?: any[]; total?: number; errors?: string[] }> {
    try {
      const tableName = this.getTableName();
      const { limit = 50, offset = 0, userId } = options;

      let whereClause = '';
      const queryParams: any[] = [];

      if (userId) {
        whereClause = 'WHERE submitted_by = $1';
        queryParams.push(userId);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get submissions with user info
      const dataQuery = `
        SELECT s.*, u.email as submitted_by_email, u.first_name, u.last_name
        FROM ${tableName} s
        JOIN users u ON s.submitted_by = u.id
        ${whereClause}
        ORDER BY s.submitted_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

      logger.info('Retrieved form submissions', {
        tableName,
        count: dataResult.rows.length,
        total,
        adminUserId
      });

      return { 
        success: true, 
        data: dataResult.rows,
        total
      };

    } catch (error) {
      logger.error('Failed to retrieve form submissions', {
        adminUserId,
        error: (error as Error).message
      });
      
      return { 
        success: false, 
        errors: [`Failed to retrieve submissions: ${(error as Error).message}`] 
      };
    }
  }

  /**
   * Get the current form schema information
   */
  getFormInfo(): { tableName: string; schemaHash: string; schema: FormSchema } {
    const schema = formSchemaService.getFormSchema();
    const tableName = this.getTableName();
    const schemaHash = this.generateFormHash(schema);

    return { tableName, schemaHash, schema };
  }

  /**
   * Drop a form table (primarily for testing cleanup)
   */
  async dropFormTable(tableName: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Security check - only allow dropping tables that match our pattern
      if (!tableName.startsWith('form_submissions_')) {
        return {
          success: false,
          message: 'Invalid table name - can only drop form submission tables'
        };
      }

      // Check if table exists first
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `;
      
      const checkResult = await pool.query(checkQuery, [tableName]);
      
      if (!checkResult.rows[0].exists) {
        return {
          success: true,
          message: `Table ${tableName} does not exist (already cleaned up)`
        };
      }

      // Drop the table
      const dropQuery = `DROP TABLE IF EXISTS ${tableName} CASCADE`;
      await pool.query(dropQuery);

      logger.info('Form table dropped successfully', { tableName });

      return {
        success: true,
        message: `Table ${tableName} dropped successfully`
      };

    } catch (error) {
      logger.error('Failed to drop form table', {
        tableName,
        error: (error as Error).message
      });

      return {
        success: false,
        message: `Failed to drop table: ${(error as Error).message}`
      };
    }
  }
}

// Export singleton instance
export default new FormDataService();