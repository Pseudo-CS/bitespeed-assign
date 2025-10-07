import { RequestValidator } from '../services/ValidationService';

describe('ValidationService', () => {
  describe('validateIdentifyRequest', () => {
    test('should pass validation with valid email only', () => {
      const data = { email: 'test@example.com' };
      const result = RequestValidator.validateIdentifyRequest(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should pass validation with valid phone number only', () => {
      const data = { phoneNumber: '+1234567890' };
      const result = RequestValidator.validateIdentifyRequest(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should pass validation with both valid email and phone', () => {
      const data = { 
        email: 'test@example.com',
        phoneNumber: '+1234567890'
      };
      const result = RequestValidator.validateIdentifyRequest(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail validation when both email and phone are missing', () => {
      const data = {};
      const result = RequestValidator.validateIdentifyRequest(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should fail validation with invalid email format', () => {
      const data = { email: 'invalid-email' };
      const result = RequestValidator.validateIdentifyRequest(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('email'))).toBe(true);
    });

    test('should fail validation with invalid phone number format', () => {
      const data = { phoneNumber: 'abc123' };
      const result = RequestValidator.validateIdentifyRequest(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('phoneNumber'))).toBe(true);
    });

    test('should accept various valid phone number formats', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+1 234 567 8900',
        '+1-234-567-8900',
        '(123) 456-7890',
        '+44 20 7946 0958'
      ];

      for (const phone of validPhones) {
        const data = { phoneNumber: phone };
        const result = RequestValidator.validateIdentifyRequest(data);
        expect(result.isValid).toBe(true);
      }
    });

    test('should reject invalid phone number formats', () => {
      const invalidPhones = [
        'not-a-phone',
        '123',
        '+123456789012345678', // too long
        '!@#$%^&*()',
        ''
      ];

      for (const phone of invalidPhones) {
        const data = { phoneNumber: phone };
        const result = RequestValidator.validateIdentifyRequest(data);
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('isValidEmail', () => {
    test('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@company.org',
        'test123@domain-name.com'
      ];

      for (const email of validEmails) {
        expect(RequestValidator.isValidEmail(email)).toBe(true);
      }
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user.domain.com',
        ''
      ];

      for (const email of invalidEmails) {
        expect(RequestValidator.isValidEmail(email)).toBe(false);
      }
    });
  });

  describe('isValidPhoneNumber', () => {
    test('should validate correct phone number formats', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+1 234 567 8900',
        '+44 20 7946 0958'
      ];

      for (const phone of validPhones) {
        expect(RequestValidator.isValidPhoneNumber(phone)).toBe(true);
      }
    });

    test('should reject invalid phone number formats', () => {
      const invalidPhones = [
        'not-a-phone',
        '123',
        '+123456789012345678',
        '!@#$%^&*()'
      ];

      for (const phone of invalidPhones) {
        expect(RequestValidator.isValidPhoneNumber(phone)).toBe(false);
      }
    });
  });
});