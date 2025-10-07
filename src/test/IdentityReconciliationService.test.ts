import { Database } from '../database/Database';
import { IdentityReconciliationService } from '../services/IdentityReconciliationService';
import { LinkPrecedence } from '../models/Contact';

describe('IdentityReconciliationService', () => {
  let database: Database;
  let service: IdentityReconciliationService;

  beforeEach(async () => {
    database = new Database(':memory:');
    service = new IdentityReconciliationService(database);
  });

  afterEach(() => {
    database.close();
  });

  describe('Scenario 1: New Primary Contact Creation', () => {
    test('should create new primary contact with email only', async () => {
      const request = { email: 'new@example.com' };
      
      const result = await service.identify(request);
      
      expect(result.contact.primaryContactId).toBeDefined();
      expect(result.contact.emails).toEqual(['new@example.com']);
      expect(result.contact.phoneNumbers).toEqual([]);
      expect(result.contact.secondaryContactIds).toEqual([]);
    });

    test('should create new primary contact with phone only', async () => {
      const request = { phoneNumber: '+1234567890' };
      
      const result = await service.identify(request);
      
      expect(result.contact.primaryContactId).toBeDefined();
      expect(result.contact.emails).toEqual([]);
      expect(result.contact.phoneNumbers).toEqual(['+1234567890']);
      expect(result.contact.secondaryContactIds).toEqual([]);
    });

    test('should create new primary contact with both email and phone', async () => {
      const request = { 
        email: 'new@example.com',
        phoneNumber: '+1234567890'
      };
      
      const result = await service.identify(request);
      
      expect(result.contact.primaryContactId).toBeDefined();
      expect(result.contact.emails).toEqual(['new@example.com']);
      expect(result.contact.phoneNumbers).toEqual(['+1234567890']);
      expect(result.contact.secondaryContactIds).toEqual([]);
    });
  });

  describe('Scenario 2: Secondary Contact Creation', () => {
    test('should create secondary contact when existing contact has same email but new phone', async () => {
      // First, create a primary contact
      await service.identify({ email: 'user@example.com', phoneNumber: '+1111111111' });
      
      // Then, identify with same email but different phone
      const result = await service.identify({ 
        email: 'user@example.com', 
        phoneNumber: '+2222222222' 
      });
      
      expect(result.contact.emails).toEqual(['user@example.com']);
      expect(result.contact.phoneNumbers).toEqual(['+1111111111', '+2222222222']);
      expect(result.contact.secondaryContactIds).toHaveLength(1);
    });

    test('should create secondary contact when existing contact has same phone but new email', async () => {
      // First, create a primary contact
      await service.identify({ email: 'first@example.com', phoneNumber: '+1111111111' });
      
      // Then, identify with same phone but different email
      const result = await service.identify({ 
        email: 'second@example.com', 
        phoneNumber: '+1111111111' 
      });
      
      expect(result.contact.emails).toEqual(['first@example.com', 'second@example.com']);
      expect(result.contact.phoneNumbers).toEqual(['+1111111111']);
      expect(result.contact.secondaryContactIds).toHaveLength(1);
    });

    test('should not create secondary contact when request has exact same information', async () => {
      // First, create a primary contact
      const first = await service.identify({ email: 'user@example.com', phoneNumber: '+1111111111' });
      
      // Then, identify with exact same information
      const result = await service.identify({ 
        email: 'user@example.com', 
        phoneNumber: '+1111111111' 
      });
      
      expect(result.contact.primaryContactId).toBe(first.contact.primaryContactId);
      expect(result.contact.emails).toEqual(['user@example.com']);
      expect(result.contact.phoneNumbers).toEqual(['+1111111111']);
      expect(result.contact.secondaryContactIds).toEqual([]);
    });
  });

  describe('Scenario 3: Primary Contact Merging', () => {
    test('should merge two separate primary contacts when they share information', async () => {
      // Create first primary contact
      const first = await service.identify({ email: 'user1@example.com', phoneNumber: '+1111111111' });
      
      // Create second primary contact (different email and phone)
      const second = await service.identify({ email: 'user2@example.com', phoneNumber: '+2222222222' });
      
      expect(first.contact.primaryContactId).not.toBe(second.contact.primaryContactId);
      
      // Now link them with a request that has user1's email and user2's phone
      const merged = await service.identify({ 
        email: 'user1@example.com', 
        phoneNumber: '+2222222222' 
      });
      
      // The older contact should become primary
      const expectedPrimaryId = Math.min(first.contact.primaryContactId, second.contact.primaryContactId);
      expect(merged.contact.primaryContactId).toBe(expectedPrimaryId);
      
      // Should contain all emails and phones
      expect(merged.contact.emails).toContain('user1@example.com');
      expect(merged.contact.emails).toContain('user2@example.com');
      expect(merged.contact.phoneNumbers).toContain('+1111111111');
      expect(merged.contact.phoneNumbers).toContain('+2222222222');
      
      // Should have one secondary contact (the newer primary that was converted)
      expect(merged.contact.secondaryContactIds).toHaveLength(1);
    });

    test('should handle complex merge scenario with multiple contacts', async () => {
      // Create multiple primary contacts
      await service.identify({ email: 'user1@example.com' });
      await service.identify({ phoneNumber: '+1111111111' });
      await service.identify({ email: 'user2@example.com' });
      
      // Link them all together
      const result = await service.identify({ 
        email: 'user1@example.com', 
        phoneNumber: '+1111111111' 
      });
      
      expect(result.contact.emails).toContain('user1@example.com');
      expect(result.contact.phoneNumbers).toContain('+1111111111');
      expect(result.contact.secondaryContactIds.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle requests with only email', async () => {
      const result = await service.identify({ email: 'solo@example.com' });
      
      expect(result.contact.emails).toEqual(['solo@example.com']);
      expect(result.contact.phoneNumbers).toEqual([]);
    });

    test('should handle requests with only phone number', async () => {
      const result = await service.identify({ phoneNumber: '+9999999999' });
      
      expect(result.contact.emails).toEqual([]);
      expect(result.contact.phoneNumbers).toEqual(['+9999999999']);
    });

    test('should maintain order with primary contact information first', async () => {
      // Create primary with specific email and phone
      await service.identify({ email: 'primary@example.com', phoneNumber: '+1111111111' });
      
      // Add secondary with different email
      const result = await service.identify({ 
        email: 'secondary@example.com', 
        phoneNumber: '+1111111111' 
      });
      
      // Primary contact's email should be first
      expect(result.contact.emails[0]).toBe('primary@example.com');
      expect(result.contact.phoneNumbers[0]).toBe('+1111111111');
    });

    test('should handle secondary contacts linked to secondary contacts (complex linking)', async () => {
      // Create primary
      const primary = await service.identify({ email: 'primary@example.com' });
      
      // Create secondary linked to primary
      await service.identify({ 
        email: 'secondary@example.com', 
        phoneNumber: '+1111111111' 
      });
      
      // Create another contact that links to the secondary's phone
      const result = await service.identify({ 
        phoneNumber: '+1111111111',
        email: 'third@example.com'
      });
      
      // Should all be linked to the same primary
      expect(result.contact.primaryContactId).toBe(primary.contact.primaryContactId);
      expect(result.contact.emails).toContain('primary@example.com');
      expect(result.contact.emails).toContain('secondary@example.com');
      expect(result.contact.emails).toContain('third@example.com');
    });
  });

  describe('Database Integration', () => {
    test('should persist contacts correctly', async () => {
      await service.identify({ email: 'persist@example.com', phoneNumber: '+1234567890' });
      
      const allContacts = await database.getAllContacts();
      expect(allContacts).toHaveLength(1);
      expect(allContacts[0]?.email).toBe('persist@example.com');
      expect(allContacts[0]?.phoneNumber).toBe('+1234567890');
      expect(allContacts[0]?.linkPrecedence).toBe(LinkPrecedence.PRIMARY);
    });

    test('should create secondary contacts with correct linkage', async () => {
      const primary = await service.identify({ email: 'primary@example.com' });
      await service.identify({ 
        email: 'secondary@example.com', 
        phoneNumber: '+1111111111' 
      });
      
      const allContacts = await database.getAllContacts();
      const secondaryContact = allContacts.find(c => c.email === 'secondary@example.com');
      
      expect(secondaryContact?.linkPrecedence).toBe(LinkPrecedence.SECONDARY);
      expect(secondaryContact?.linkedId).toBe(primary.contact.primaryContactId);
    });
  });
});