# Customer Identity Reconciliation Web Service

A robust Node.js TypeScript web service that implements customer identity reconciliation through a single POST endpoint. The service automatically links contacts when they share email addresses or phone numbers, creating a unified view of customer identities.

## Features

- **Smart Contact Linking**: Automatically links contacts sharing email addresses or phone numbers
- **Primary/Secondary Hierarchy**: Maintains oldest contact as primary, newer related contacts as secondary
- **Contact Merging**: Merges separate primary contacts when new information links them
- **Comprehensive Validation**: Input validation for email and phone number formats
- **Robust Error Handling**: Graceful error handling with appropriate HTTP status codes
- **Full Test Coverage**: Comprehensive test suite covering all scenarios
- **TypeScript**: Fully typed codebase for better reliability and developer experience

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd customer-identity-reconciliation

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### Basic Usage

The service exposes a single endpoint:

```bash
POST /identify
Content-Type: application/json

{
  "email": "user@example.com",
  "phoneNumber": "+1234567890"
}
```

## API Reference

### POST /identify

Identifies and reconciles customer contacts based on email and/or phone number.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | No* | Valid email address |
| `phoneNumber` | string | No* | Valid phone number |

*At least one of `email` or `phoneNumber` must be provided.

#### Email Validation
- Must be a valid email format (e.g., `user@example.com`)

#### Phone Number Validation
- Accepts various formats: `+1234567890`, `(123) 456-7890`, `+1-234-567-8900`
- Length: 7-15 digits
- Optional country code with `+`

#### Response Format

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "another@example.com"],
    "phoneNumbers": ["+1234567890", "+0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `primaryContactId` | number | ID of the primary contact |
| `emails` | string[] | All emails (primary contact's email first) |
| `phoneNumbers` | string[] | All phone numbers (primary contact's phone first) |
| `secondaryContactIds` | number[] | IDs of secondary contacts linked to primary |

## Identity Reconciliation Scenarios

### Scenario 1: New Primary Contact

When no existing contacts match the provided information, a new primary contact is created.

**Request:**
```json
{
  "email": "new@example.com",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["new@example.com"],
    "phoneNumbers": ["+1234567890"],
    "secondaryContactIds": []
  }
}
```

### Scenario 2: Secondary Contact Creation

When a request shares some information with an existing contact but contains new data, a secondary contact is created.

**Existing Contact:** `{ email: "user@example.com", phoneNumber: "+1111111111" }`

**Request:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "+2222222222"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com"],
    "phoneNumbers": ["+1111111111", "+2222222222"],
    "secondaryContactIds": [2]
  }
}
```

### Scenario 3: Primary Contact Merging

When a request links two separate primary contacts, the older contact becomes primary and the newer becomes secondary.

**Existing Contacts:**
- Contact 1: `{ email: "user1@example.com", phoneNumber: "+1111111111" }`
- Contact 2: `{ email: "user2@example.com", phoneNumber: "+2222222222" }`

**Request (links them):**
```json
{
  "email": "user1@example.com",
  "phoneNumber": "+2222222222"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user1@example.com", "user2@example.com"],
    "phoneNumbers": ["+1111111111", "+2222222222"],
    "secondaryContactIds": [2]
  }
}
```

## Database Schema

### Contact Table

```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  email TEXT,
  linkedId INTEGER,
  linkPrecedence TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (linkedId) REFERENCES contacts(id)
);
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary key, auto-increment |
| `phoneNumber` | TEXT | Phone number (optional) |
| `email` | TEXT | Email address (optional) |
| `linkedId` | INTEGER | ID of primary contact (null for primary contacts) |
| `linkPrecedence` | TEXT | Either 'primary' or 'secondary' |
| `createdAt` | DATETIME | Creation timestamp |
| `updatedAt` | DATETIME | Last update timestamp |
| `deletedAt` | DATETIME | Soft delete timestamp (optional) |

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": "Validation failed",
  "details": [
    {
      "message": "\"email\" must be a valid email",
      "field": "email"
    }
  ]
}
```

## Development

### Available Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Project Structure

```
src/
├── database/           # Database layer
│   └── Database.ts     # SQLite database operations
├── models/             # TypeScript interfaces and types
│   └── Contact.ts      # Contact model definitions
├── routes/             # Express routes and controllers
│   └── identityRoutes.ts
├── services/           # Business logic
│   ├── IdentityReconciliationService.ts
│   └── ValidationService.ts
├── test/               # Test files
│   ├── api.test.ts
│   ├── IdentityReconciliationService.test.ts
│   ├── ValidationService.test.ts
│   └── setup.ts
└── server.ts           # Main server file
```

### Testing

The project includes comprehensive tests covering:

- **Unit Tests**: Service layer logic
- **Integration Tests**: API endpoint functionality  
- **Validation Tests**: Input validation scenarios
- **Database Tests**: Data persistence and retrieval
- **Edge Cases**: Complex linking scenarios

Run tests with:
```bash
npm test
```

### Configuration

The service uses SQLite as the database by default. For production, you can:

1. **File-based SQLite**: Change database path in `Database.ts`
2. **Other databases**: Replace SQLite with PostgreSQL, MySQL, etc.

Environment variables:
- `PORT`: Server port (default: 3000)

## Production Considerations

### Database

For production use, consider:

- **PostgreSQL/MySQL**: Replace SQLite for better concurrency
- **Connection Pooling**: Implement connection pooling for high load
- **Migrations**: Add database migration system
- **Backups**: Implement regular database backups

### Security

- **Rate Limiting**: Add rate limiting to prevent abuse
- **Authentication**: Add API authentication if needed
- **HTTPS**: Use HTTPS in production
- **Input Sanitization**: Additional input sanitization

### Monitoring

- **Logging**: Structured logging with Winston or similar
- **Metrics**: Application performance monitoring
- **Health Checks**: Enhanced health check endpoints
- **Error Tracking**: Error tracking service integration

### Scalability

- **Clustering**: Use Node.js cluster mode
- **Load Balancing**: Deploy behind load balancer
- **Caching**: Add Redis for caching frequent queries
- **Database Optimization**: Add proper indexes and query optimization

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For questions or issues, please open a GitHub issue or contact the development team.