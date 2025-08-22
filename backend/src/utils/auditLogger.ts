/**
 * Audit Logging Utility
 * 
 * Centralized audit logging for security-sensitive operations.
 * Provides consistent audit trail formatting and storage.
 */

import { pool } from '../config/database';
import { logger } from './logger';

export interface AuditLogEntry {
  action: string;
  tableName: string;
  recordId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  changedBy: string | null;
}

/**
 * Log User Action to Database Audit Trail
 * 
 * Records security-sensitive user actions to the audit_logs table
 * for compliance and security monitoring.
 * 
 * @param entry - Audit log entry details
 */
export const logUserAction = async (entry: AuditLogEntry): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.tableName,
        entry.recordId,
        entry.action,
        entry.oldData ? JSON.stringify(entry.oldData) : null,
        entry.newData ? JSON.stringify(entry.newData) : null,
        entry.changedBy
      ]
    );
  } catch (error) {
    logger.error('Failed to log audit entry', error);
  }
};

/**
 * Log User Action to CloudWatch
 * 
 * Creates structured CloudWatch log entries for monitoring and alerting.
 * 
 * @param action - Action description
 * @param details - Action details and context
 */
export const logCloudWatchAudit = (action: string, details: Record<string, unknown>): void => {
  console.log(`[AUDIT] ${action}`, {
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Combined Audit Logging
 * 
 * Logs to both database audit trail and CloudWatch for comprehensive tracking.
 * 
 * @param entry - Database audit entry
 * @param cloudWatchAction - CloudWatch action description  
 * @param cloudWatchDetails - CloudWatch details
 */
export const auditUserAction = async (
  entry: AuditLogEntry,
  cloudWatchAction: string,
  cloudWatchDetails: Record<string, unknown>
): Promise<void> => {
  await logUserAction(entry);
  logCloudWatchAudit(cloudWatchAction, cloudWatchDetails);
};