# Indomie Raffle Code Generator

A simple web app to generate unique 7-character raffle/lucky draw codes. Each generated code is stored in a list, and duplicate codes are automatically skipped.

## Features

- **Two code types:**
  - **Alphabetic**: A–Z only
  - **Alphanumeric**: A–Z + 0–9 (mixed case output in uppercase)
- **Real-time code list**: All generated codes displayed with their type
- **Duplicate prevention**: Once a code is generated, it won't be generated again in the same session
- **Easy reset**: Clear all codes to start fresh (with confirmation)
- **Clean UI**: Modern, responsive design with status messages

## Installation & Usage

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

The app will be available at `http://localhost:3000`

### 3. Generate codes

1. Select a code type (Alphabetic or AlphaNumeric)
2. Click **Generate Code** to create a new 7-character code
3. Each code appears in the list below with its type
4. Codes are guaranteed to be unique within the session
5. Click **Reset List** to clear all codes (with confirmation)

## API Endpoints

- **POST `/api/generate`**
  - Body: `{ "type": "alphabetic" | "alphanumeric" }`
  - Response: `{ "code": "ABC1234", "type": "alphanumeric", "totalGenerated": 5 }`

- **GET `/api/codes`**
  - Response: `{ "codes": ["ABC1234", "XYZ5678"], "total": 2 }`

- **POST `/api/reset`**
  - Clears all generated codes (testing/admin use)

## Notes

- **In-memory storage**: Codes are stored in RAM. Restart the server to clear all codes.
- **For production**: Replace the in-memory `Set` with a database (SQLite, PostgreSQL, etc.) to persist codes across restarts.
- **Collision handling**: If 100 consecutive generation attempts fail to produce a unique code, an error is returned (very unlikely with 36^7 ≈ 78B possible codes).

## Next Steps

- Add persistent storage (SQLite/PostgreSQL) to save codes to a database
- Add export to CSV
- Add rate limiting to prevent abuse
- Add organization-specific code prefixes
- Add code expiration / validity dates
