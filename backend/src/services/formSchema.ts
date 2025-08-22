import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'number' | 'slider' | 'boolean';
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  sensitive: boolean;
  min?: number;
  max?: number;
}

export interface FormSchema {
  title: string;
  description: string;
  fields: FormField[];
}

export interface FormConfig {
  form: FormSchema;
}

class FormSchemaService {
  private configPath: string;

  constructor() {
    // Path to the YAML file in the root directory
    this.configPath = path.join(__dirname, '../../../party-survey.yaml');
  }

  /**
   * Load and parse the YAML configuration file
   */
  public loadFormSchema(): FormSchema {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`Form configuration file not found at: ${this.configPath}`);
      }

      const fileContent = fs.readFileSync(this.configPath, 'utf8');
      const config: FormConfig = YAML.parse(fileContent);

      if (!config.form) {
        throw new Error('Invalid YAML structure: missing "form" section');
      }

      this.validateFormSchema(config.form);
      return config.form;
    } catch (error) {
      throw new Error(`Failed to load form schema: ${(error as Error).message}`);
    }
  }

  /**
   * Validate the form schema structure
   */
  private validateFormSchema(schema: FormSchema): void {
    if (!schema.title || typeof schema.title !== 'string') {
      throw new Error('Form title is required and must be a string');
    }

    if (!schema.description || typeof schema.description !== 'string') {
      throw new Error('Form description is required and must be a string');
    }

    if (!Array.isArray(schema.fields) || schema.fields.length === 0) {
      throw new Error('Form must have at least one field');
    }

    schema.fields.forEach((field, index) => {
      this.validateField(field, index);
    });
  }

  /**
   * Validate individual field configuration
   */
  private validateField(field: FormField, index: number): void {
    const prefix = `Field ${index + 1}`;

    if (!field.name || typeof field.name !== 'string') {
      throw new Error(`${prefix}: name is required and must be a string`);
    }

    const validTypes = ['text', 'email', 'number', 'slider', 'boolean'];
    if (!validTypes.includes(field.type)) {
      throw new Error(`${prefix}: type must be one of: ${validTypes.join(', ')}`);
    }

    if (!field.label || typeof field.label !== 'string') {
      throw new Error(`${prefix}: label is required and must be a string`);
    }

    if (typeof field.required !== 'boolean') {
      throw new Error(`${prefix}: required must be a boolean`);
    }

    if (typeof field.sensitive !== 'boolean') {
      throw new Error(`${prefix}: sensitive must be a boolean`);
    }

    // Validate slider-specific properties
    if (field.type === 'slider') {
      if (typeof field.min !== 'number' || typeof field.max !== 'number') {
        throw new Error(`${prefix}: slider type requires numeric min and max values`);
      }
      if (field.min >= field.max) {
        throw new Error(`${prefix}: slider min value must be less than max value`);
      }
    }
  }

  /**
   * Get form schema with validation
   */
  public getFormSchema(): FormSchema {
    return this.loadFormSchema();
  }

  /**
   * Get only non-sensitive field names (for client-side filtering)
   */
  public getNonSensitiveFields(): string[] {
    const schema = this.loadFormSchema();
    return schema.fields
      .filter(field => !field.sensitive)
      .map(field => field.name);
  }

  /**
   * Get only sensitive field names (for server-side handling)
   */
  public getSensitiveFields(): string[] {
    const schema = this.loadFormSchema();
    return schema.fields
      .filter(field => field.sensitive)
      .map(field => field.name);
  }
}

export default new FormSchemaService();