# API Examples

This document contains example requests and responses for the Customer Identity Reconciliation Service.

## Example 1: Creating a New Primary Contact

### Request
```bash
POST /identify
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "phoneNumber": "+1-555-123-4567"
}
```

### Response
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john.doe@example.com"],
    "phoneNumbers": ["+1-555-123-4567"],
    "secondaryContactIds": []
  }
}
```

## Example 2: Adding Secondary Contact Information

### Existing Contact
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "phoneNumber": "+1-555-123-4567",
  "linkPrecedence": "primary"
}
```

### Request (Adding work email)
```bash
POST /identify
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "phoneNumber": "+1-555-123-4567"
}
```

### Response
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john.doe@example.com", "john.doe@company.com"],
    "phoneNumbers": ["+1-555-123-4567"],
    "secondaryContactIds": [2]
  }
}
```

## Example 3: Merging Two Primary Contacts

### Existing Contacts
**Contact 1:**
```json
{
  "id": 1,
  "email": "john@personal.com",
  "phoneNumber": "+1-555-111-1111",
  "linkPrecedence": "primary",
  "createdAt": "2023-01-01T10:00:00Z"
}
```

**Contact 2:**
```json
{
  "id": 3,
  "email": "john@work.com", 
  "phoneNumber": "+1-555-222-2222",
  "linkPrecedence": "primary",
  "createdAt": "2023-01-02T10:00:00Z"
}
```

### Request (Links them together)
```bash
POST /identify
Content-Type: application/json

{
  "email": "john@personal.com",
  "phoneNumber": "+1-555-222-2222"
}
```

### Response
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john@personal.com", "john@work.com"],
    "phoneNumbers": ["+1-555-111-1111", "+1-555-222-2222"],
    "secondaryContactIds": [3, 4]
  }
}
```

## Example 4: Complex Linking Scenario

### Scenario Description
A customer has multiple touchpoints:
1. Signs up with personal email
2. Makes purchase with work email and personal phone
3. Updates profile with work phone
4. Customer service creates record linking all information

### Step 1: Initial Signup
```bash
POST /identify
{
  "email": "jane@personal.com"
}
```

Response:
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["jane@personal.com"],
    "phoneNumbers": [],
    "secondaryContactIds": []
  }
}
```

### Step 2: Purchase with Work Email
```bash
POST /identify
{
  "email": "jane@company.com",
  "phoneNumber": "+1-555-333-3333"
}
```

Response:
```json
{
  "contact": {
    "primaryContactId": 2,
    "emails": ["jane@company.com"],
    "phoneNumbers": ["+1-555-333-3333"],
    "secondaryContactIds": []
  }
}
```

### Step 3: Profile Update Links Personal Email with Personal Phone
```bash
POST /identify
{
  "email": "jane@personal.com",
  "phoneNumber": "+1-555-333-3333"
}
```

Response (Merges contacts 1 and 2):
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["jane@personal.com", "jane@company.com"],
    "phoneNumbers": ["+1-555-333-3333"],
    "secondaryContactIds": [2, 3]
  }
}
```

### Step 4: Add Work Phone
```bash
POST /identify
{
  "email": "jane@company.com",
  "phoneNumber": "+1-555-444-4444"
}
```

Response:
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["jane@personal.com", "jane@company.com"],
    "phoneNumbers": ["+1-555-333-3333", "+1-555-444-4444"],
    "secondaryContactIds": [2, 3, 4]
  }
}
```

## Example 5: Validation Errors

### Invalid Email Format
```bash
POST /identify
{
  "email": "invalid-email",
  "phoneNumber": "+1-555-123-4567"
}
```

Response (400 Bad Request):
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

### Invalid Phone Number Format
```bash
POST /identify
{
  "email": "user@example.com",
  "phoneNumber": "invalid-phone"
}
```

Response (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": [
    {
      "message": "\"phoneNumber\" with value \"invalid-phone\" fails to match the required pattern: /^\\+?[\\d\\s\\-\\(\\)]{7,15}$/",
      "field": "phoneNumber"
    }
  ]
}
```

### Missing Both Email and Phone
```bash
POST /identify
{
}
```

Response (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": [
    {
      "message": "\"value\" must contain at least one of [email, phoneNumber]"
    }
  ]
}
```

## Example 6: Testing with curl

### Basic Request
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+1234567890"
  }'
```

### Email Only
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Phone Only
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

## Example 7: Testing with PowerShell (Windows)

### Basic Request
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/identify" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","phoneNumber":"+1234567890"}'
```

### With Error Handling
```powershell
try {
  $result = Invoke-RestMethod -Uri "http://localhost:3000/identify" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"email":"test@example.com"}'
  
  Write-Host "Success:"
  $result | ConvertTo-Json -Depth 10
}
catch {
  Write-Host "Error:"
  $_.Exception.Response.StatusCode
  $error[0].ErrorDetails.Message
}
```

## Example 8: JavaScript/Node.js Client

```javascript
const axios = require('axios');

async function identifyContact(email, phoneNumber) {
  try {
    const response = await axios.post('http://localhost:3000/identify', {
      email,
      phoneNumber
    });
    
    console.log('Contact identified:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Validation error:', error.response.data);
    } else {
      console.error('Network error:', error.message);
    }
    throw error;
  }
}

// Usage examples
identifyContact('user@example.com', '+1234567890');
identifyContact('user@example.com', null); // Email only
identifyContact(null, '+1234567890'); // Phone only
```

## Example 9: Python Client

```python
import requests
import json

def identify_contact(email=None, phone_number=None):
    url = 'http://localhost:3000/identify'
    payload = {}
    
    if email:
        payload['email'] = email
    if phone_number:
        payload['phoneNumber'] = phone_number
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        print(f"Response: {response.text}")
        raise
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        raise

# Usage examples
result = identify_contact('user@example.com', '+1234567890')
print(json.dumps(result, indent=2))
```

## Health Check Example

```bash
curl -X GET http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2023-10-07T12:00:00.000Z",
  "service": "Customer Identity Reconciliation Service"
}
```