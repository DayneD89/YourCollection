/**
 * Application Configuration Reader
 * 
 * This module provides centralized configuration management by reading from
 * the root party-survey.yaml file. It serves as the single source of truth
 * for application settings, credentials, and form configuration.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Types for configuration structure
interface AdminConfig {
  email: string;
  password: string;
}

interface FormField {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  sensitive: boolean;
  min?: number;
  max?: number;
  description?: string;
}

interface FormConfig {
  title: string;
  description: string;
  fields: FormField[];
}

interface AppConfiguration {
  admin: AdminConfig;
  form: FormConfig;
}

let cachedConfig: AppConfiguration | null = null;

/**
 * Get the path to the root configuration file
 */
function getConfigPath(): string {
  // From backend/src/config/, go up to project root
  const configPath = path.resolve(__dirname, '..', '..', '..', 'party-survey.yaml');
  return configPath;
}

/**
 * Load and parse the application configuration
 * 
 * @returns Parsed configuration object
 * @throws Error if configuration file cannot be read or parsed
 */
export function loadConfig(): AppConfiguration {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configPath = getConfigPath();
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContent) as AppConfiguration;
    
    // Validate required sections exist
    if (!config.admin || !config.admin.email || !config.admin.password) {
      throw new Error('Missing admin configuration in party-survey.yaml');
    }
    
    if (!config.form || !config.form.fields) {
      throw new Error('Missing form configuration in party-survey.yaml');
    }

    // Cache the config for subsequent calls
    cachedConfig = config;
    return config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw new Error(`Configuration loading failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get admin credentials from configuration
 */
export function getAdminCredentials(): AdminConfig {
  const config = loadConfig();
  return config.admin;
}


/**
 * Get form configuration
 */
export function getFormConfig(): FormConfig {
  const config = loadConfig();
  return config.form;
}

/**
 * Clear cached configuration (useful for testing or config reload)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}