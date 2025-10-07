import Joi from 'joi';

export const identifyRequestSchema = Joi.object({
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]{7,15}$/).optional(),
}).or('email', 'phoneNumber'); // At least one of email or phoneNumber must be provided

export interface ValidationError {
  message: string;
  field?: string;
}

export class RequestValidator {
  public static validateIdentifyRequest(data: any): { isValid: boolean; errors: ValidationError[] } {
    const { error } = identifyRequestSchema.validate(data, { abortEarly: false });
    
    if (!error) {
      return { isValid: true, errors: [] };
    }

    const errors: ValidationError[] = error.details.map(detail => ({
      message: detail.message,
      field: detail.path.join('.'),
    }));

    return { isValid: false, errors };
  }

  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public static isValidPhoneNumber(phoneNumber: string): boolean {
    // Allow common phone number formats
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phoneNumber);
  }
}