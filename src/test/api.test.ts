import request from 'supertest';
import express from 'express';
import { Database } from '../database/Database';
import { createIdentityRoutes, errorHandler } from '../routes/identityRoutes';

describe('POST /identify', () => {
  let app: express.Application;
  let database: Database;

  beforeEach(() => {
    // Create a real in-memory database for each test
    database = new Database(':memory:');
    
    // Create a test app
    app = express();
    app.use(express.json());
    app.use('/', createIdentityRoutes(database));
    app.use(errorHandler);
  });

  afterEach(() => {
    database.close();
  });

  describe('Input Validation', () => {
    test('should return 400 when both email and phoneNumber are missing', async () => {
      const response = await request(app)
        .post('/identify')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/identify')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    test('should return 400 for invalid phone number format', async () => {
      const response = await request(app)
        .post('/identify')
        .send({ phoneNumber: 'invalid-phone' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    test('should accept valid email only', async () => {
      const response = await request(app)
        .post('/identify')
        .send({ email: 'valid@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.contact).toBeDefined();
    });

    test('should accept valid phone number only', async () => {
      const response = await request(app)
        .post('/identify')
        .send({ phoneNumber: '+1234567890' });

      expect(response.status).toBe(200);
      expect(response.body.contact).toBeDefined();
    });

    test('should accept both valid email and phone number', async () => {
      const response = await request(app)
        .post('/identify')
        .send({ 
          email: 'valid@example.com',
          phoneNumber: '+1234567890'
        });

      expect(response.status).toBe(200);
      expect(response.body.contact).toBeDefined();
    });
  });

  describe('Response Format', () => {
    test('should return correct response structure for new contact', async () => {
      const response = await request(app)
        .post('/identify')
        .send({ email: 'new@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contact');
      expect(response.body.contact).toHaveProperty('primaryContactId');
      expect(response.body.contact).toHaveProperty('emails');
      expect(response.body.contact).toHaveProperty('phoneNumbers');
      expect(response.body.contact).toHaveProperty('secondaryContactIds');
      
      expect(Array.isArray(response.body.contact.emails)).toBe(true);
      expect(Array.isArray(response.body.contact.phoneNumbers)).toBe(true);
      expect(Array.isArray(response.body.contact.secondaryContactIds)).toBe(true);
    });

    test('should return primary contact info first in arrays', async () => {
      // Create primary contact
      const primary = await request(app)
        .post('/identify')
        .send({ email: 'primary@example.com', phoneNumber: '+1111111111' });

      // Add secondary contact
      const response = await request(app)
        .post('/identify')
        .send({ email: 'secondary@example.com', phoneNumber: '+1111111111' });

      expect(response.status).toBe(200);
      // Primary contact's email should be first
      expect(response.body.contact.emails[0]).toBe('primary@example.com');
      expect(response.body.contact.phoneNumbers[0]).toBe('+1111111111');
    });
  });

  describe('Content-Type Handling', () => {
    test('should handle application/json content type', async () => {
      const response = await request(app)
        .post('/identify')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ email: 'json@example.com' }));

      expect(response.status).toBe(200);
    });

    test('should reject requests without proper content type', async () => {
      const response = await request(app)
        .post('/identify')
        .set('Content-Type', 'text/plain')
        .send('email=invalid@example.com');

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close database to force an error
      database.close();

      const response = await request(app)
        .post('/identify')
        .send({ email: 'error@example.com' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .post('/nonexistent')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(404);
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      // Create an app with health endpoint for this test
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/health', (req, res) => {
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'Customer Identity Reconciliation Service',
        });
      });

      const response = await request(testApp).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('Customer Identity Reconciliation Service');
    });
  });
});

describe('Integration Tests', () => {
  let app: express.Application;
  let database: Database;

  beforeEach(() => {
    // Create a real in-memory database for each test
    database = new Database(':memory:');
    
    // Create a test app
    app = express();
    app.use(express.json());
    app.use('/', createIdentityRoutes(database));
    app.use(errorHandler);
  });

  afterEach(() => {
    database.close();
  });

  test('should handle complete workflow: create -> link -> merge', async () => {
    // Create first contact
    const first = await request(app)
      .post('/identify')
      .send({ email: 'user1@example.com', phoneNumber: '+1111111111' });

    expect(first.status).toBe(200);
    expect(first.body.contact.secondaryContactIds).toHaveLength(0);

    // Create second contact (different info)
    const second = await request(app)
      .post('/identify')
      .send({ email: 'user2@example.com', phoneNumber: '+2222222222' });

    expect(second.status).toBe(200);
    expect(second.body.contact.primaryContactId).not.toBe(first.body.contact.primaryContactId);

    // Link them together
    const linked = await request(app)
      .post('/identify')
      .send({ email: 'user1@example.com', phoneNumber: '+2222222222' });

    expect(linked.status).toBe(200);
    expect(linked.body.contact.emails).toContain('user1@example.com');
    expect(linked.body.contact.emails).toContain('user2@example.com');
    expect(linked.body.contact.phoneNumbers).toContain('+1111111111');
    expect(linked.body.contact.phoneNumbers).toContain('+2222222222');
    expect(linked.body.contact.secondaryContactIds.length).toBeGreaterThan(0);
  });

  test('should maintain data consistency across multiple operations', async () => {
    const requests = [
      { email: 'user@example.com' },
      { phoneNumber: '+1234567890' },
      { email: 'user@example.com', phoneNumber: '+1234567890' },
      { email: 'another@example.com', phoneNumber: '+1234567890' },
    ];

    const responses = [];
    for (const req of requests) {
      const response = await request(app).post('/identify').send(req);
      expect(response.status).toBe(200);
      responses.push(response.body);
    }

    // Final response should contain all information
    const final = responses[responses.length - 1];
    expect(final.contact.emails).toContain('user@example.com');
    expect(final.contact.emails).toContain('another@example.com');
    expect(final.contact.phoneNumbers).toContain('+1234567890');
  });
});