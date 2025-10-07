# Customer Identity Reconciliation Web Service

A robust Node.js TypeScript web service that implements customer identity reconciliation through a single POST endpoint. The service automatically links contacts when they share email addresses or phone numbers, creating a unified view of customer identities.

🚀 **Live Demo**: [Deploy on Render](https://render.com)

## Features

- **Smart Contact Linking**: Automatically links contacts sharing email addresses or phone numbers
- **Primary/Secondary Hierarchy**: Maintains oldest contact as primary, newer related contacts as secondary
- **Contact Merging**: Merges separate primary contacts when new information links them
- **Comprehensive Validation**: Input validation for email and phone number formats
- **Robust Error Handling**: Graceful error handling with appropriate HTTP status codes
- **Full Test Coverage**: Comprehensive test suite covering all scenarios
- **TypeScript**: Fully typed codebase for better reliability and developer experience

## API Usage

### POST /identify

```bash
curl -X POST https://your-app.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phoneNumber": "+1234567890"
  }'
```

Response:
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com"],
    "phoneNumbers": ["+1234567890"],
    "secondaryContactIds": []
  }
}
```

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
git clone https://github.com/yourusername/customer-identity-reconciliation.git
cd customer-identity-reconciliation
npm install
npm run build
npm start
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

## Deployment

### Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/customer-identity-reconciliation)

### Manual Render Deployment

1. Fork this repository
2. Connect your GitHub account to Render
3. Create a new Web Service
4. Connect your repository
5. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18
6. Deploy!

## Documentation

- [API Examples](./EXAMPLES.md)
- [Database Schema](./README.md#database-schema)
- [Development Guide](./README.md#development)

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (easily replaceable)
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Linting**: ESLint

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/customer-identity-reconciliation/issues)
- 📖 Documentation: [Full Documentation](./README.md)