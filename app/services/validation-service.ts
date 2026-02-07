/**
 * Input Validation Service
 * Provides comprehensive input validation and sanitization
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  type?: 'string' | 'number' | 'email' | 'url' | 'boolean';
  allowedValues?: string[];
  customValidator?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

export class ValidationService {
  /**
   * Validate data against a schema
   */
  validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, any> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const sanitizedValue = this.sanitizeValue(value, rule);
      
      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip validation for optional empty fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        sanitizedData[field] = sanitizedValue;
        continue;
      }

      // Type validation
      if (rule.type && !this.validateType(sanitizedValue, rule.type)) {
        errors[field] = `${field} must be a valid ${rule.type}`;
        continue;
      }

      // Length validation
      if (rule.minLength && sanitizedValue.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
        continue;
      }

      if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
        errors[field] = `${field} must be no more than ${rule.maxLength} characters`;
        continue;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
        errors[field] = `${field} format is invalid`;
        continue;
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(sanitizedValue)) {
        errors[field] = `${field} must be one of: ${rule.allowedValues.join(', ')}`;
        continue;
      }

      // Custom validation
      if (rule.customValidator) {
        const customResult = rule.customValidator(sanitizedValue);
        if (customResult !== true) {
          errors[field] = typeof customResult === 'string' ? customResult : `${field} is invalid`;
          continue;
        }
      }

      sanitizedData[field] = sanitizedValue;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Sanitize a single value
   */
  private sanitizeValue(value: any, rule: ValidationRule): any {
    if (value === undefined || value === null) {
      return value;
    }

    // Convert to string for sanitization
    let sanitized = String(value);

    // Basic HTML sanitization (remove script tags and dangerous attributes)
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Convert back to appropriate type
    switch (rule.type) {
      case 'number':
        const num = Number(sanitized);
        return isNaN(num) ? sanitized : num;
      case 'boolean':
        return sanitized.toLowerCase() === 'true';
      default:
        return sanitized;
    }
  }

  /**
   * Validate type
   */
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'boolean':
        return typeof value === 'boolean';
      default:
        return true;
    }
  }

  /**
   * Predefined validation schemas
   */
  static schemas = {
    // User authentication
    signUp: {
      email: {
        required: true,
        type: 'email' as const,
        maxLength: 255
      },
      password: {
        required: true,
        type: 'string' as const,
        minLength: 8,
        maxLength: 128,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      }
    },

    // Ebook creation
    createEbook: {
      title: {
        required: true,
        type: 'string' as const,
        minLength: 1,
        maxLength: 200
      },
      topic: {
        required: true,
        type: 'string' as const,
        minLength: 5,
        maxLength: 500
      },
      wordCount: {
        type: 'number' as const,
        customValidator: (value: number) => value >= 1000 && value <= 100000
      },
      tone: {
        required: true,
        type: 'string' as const,
        allowedValues: ['auto', 'formal', 'casual', 'storytelling', 'academic', 'persuasive', 'custom']
      },
      audience: {
        required: true,
        type: 'string' as const,
        minLength: 3,
        maxLength: 100
      },
      aiProvider: {
        required: true,
        type: 'string' as const,
        allowedValues: ['auto', 'openai', 'anthropic', 'google', 'xai', 'deepseek']
      }
    },

    // Children's book creation
    createChildrensBook: {
      title: {
        required: true,
        type: 'string' as const,
        minLength: 1,
        maxLength: 100
      },
      ageGroup: {
        required: true,
        type: 'string' as const,
        allowedValues: ['0-2', '3-5', '6-8', '9-12']
      },
      theme: {
        required: true,
        type: 'string' as const,
        minLength: 3,
        maxLength: 200
      },
      illustrationStyle: {
        required: true,
        type: 'string' as const,
        allowedValues: ['cartoon', 'watercolor', 'digital-art', 'hand-drawn', 'minimalist']
      },
      pageCount: {
        required: true,
        type: 'number' as const,
        customValidator: (value: number) => [8, 12, 16, 20].includes(value)
      }
    },

    // API key management
    saveApiKey: {
      provider: {
        required: true,
        type: 'string' as const,
        allowedValues: ['openai', 'anthropic', 'google', 'xai', 'deepseek', 'elevenlabs']
      },
      apiKey: {
        required: true,
        type: 'string' as const,
        minLength: 10,
        maxLength: 500,
        pattern: /^[a-zA-Z0-9\-_.]+$/
      }
    },

    // Brainstorm input
    brainstorm: {
      topic: {
        required: true,
        type: 'string' as const,
        minLength: 5,
        maxLength: 500
      },
      provider: {
        required: true,
        type: 'string' as const,
        allowedValues: ['auto', 'openai', 'anthropic', 'google', 'xai', 'deepseek']
      },
      model: {
        required: true,
        type: 'string' as const,
        minLength: 1,
        maxLength: 100
      }
    }
  };

  /**
   * Quick validation using predefined schemas
   */
  static validateWithSchema(data: Record<string, any>, schemaName: keyof typeof ValidationService.schemas): ValidationResult {
    const service = new ValidationService();
    const schema = ValidationService.schemas[schemaName];
    return service.validate(data, schema);
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  }): { isValid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

    if (file.size > maxSize) {
      return { isValid: false, error: `File size must be less than ${maxSize / 1024 / 1024}MB` };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { isValid: false, error: `File type ${file.type} is not allowed` };
    }

    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        return { isValid: false, error: `File extension must be one of: ${allowedExtensions.join(', ')}` };
      }
    }

    return { isValid: true };
  }
}

export const validationService = new ValidationService();