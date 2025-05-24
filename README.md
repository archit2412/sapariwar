# Sapariwar Backend API

> **Repository Owner:** [archit2412](https://github.com/archit2412)

This document provides clear, professional instructions for operating, testing, and configuring the Sapariwar backend API, including Firebase authentication setup and accurate relationship management.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Family Tree](#family-tree)
  - [Family Member & Relationships](#family-member--relationships)
- [Data Model](#data-model)
- [Testing with Postman](#testing-with-postman)
- [Troubleshooting](#troubleshooting)
- [Contact](#contact)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or above)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Postman](https://www.postman.com/downloads/)
- [Firebase Console](https://console.firebase.google.com/) account for authentication

---

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/archit2412/sapariwar.git
   cd sapariwar/backend
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables** (see [Environment Variables](#environment-variables)):
   - Copy `.env.example` to `.env`
   - Edit `.env` as needed

4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The API server will run on `http://localhost:5000` by default.

---

## Environment Variables

Example `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/sapariwar
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## Firebase Setup

The frontend uses **Firebase Authentication**.  
Complete these steps before running or deploying the frontend:

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Click "Add Project" and follow the instructions.

2. **Enable Authentication Providers:**
   - In your Firebase project dashboard, navigate to "Authentication" > "Sign-in method".
   - Enable "Email/Password" and any other providers (such as "Google") as needed.

3. **Get your Firebase Config:**
   - Go to "Project settings" (gear icon).
   - Under "Your apps", select the web app (or create one).
   - Copy the Firebase config object (looks like the example below).

4. **Replace the Config in the Project:**
   - Open `client/src/firebase.js`.
   - Replace the config object with your own credentials:
     ```js
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID",
       measurementId: "YOUR_MEASUREMENT_ID" // (optional)
     };
     ```
   - Save the file.

5. **(Optional) Add Authorized Domains:**
   - In Firebase console, under Authentication > Settings, add your local dev domain (usually `localhost`) and any deployed frontend URLs.

6. **Test Authentication:**
   - Start the frontend.
   - Register a user or sign in using enabled providers.
   - Ensure login, signup, and Google Auth (if enabled) work as expected.

---

## API Endpoints

### Authentication

- `POST   /api/auth/register` — Register a new user  
  **Body:** `{ "email": "user@example.com", "password": "Secret123" }`

- `POST   /api/auth/login` — User login  
  **Body:** `{ "email": "user@example.com", "password": "Secret123" }`

- `GET    /api/auth/profile` — Get current user profile (JWT required)

---

### Family Tree

- `POST   /api/trees` — Create a new family tree  
  **Body:** `{ "name": "Sharma Family", "description": "..." }`

- `GET    /api/trees` — List all family trees owned by authenticated user

- `GET    /api/trees/:treeId` — Get details of a specific family tree

- `DELETE /api/trees/:treeId` — Delete a tree and all its members

---

### Family Member & Relationships

- `POST   /api/trees/:treeId/members` — Add a new family member  
  **Body Example:**
  ```json
  {
    "firstName": "Ram",
    "lastName": "Sharma",
    "gender": "Male",
    "dateOfBirth": "1960-01-01",
    "parents": ["60af...", "60bf..."],       // Array of parent member IDs (can be empty/one/two)
    "spouses": [{ "spouseId": "60cf..." }]  // Array of spouse links
  }
  ```

- `GET    /api/trees/:treeId/members` — List all members in a tree

- `GET    /api/trees/:treeId/members/:memberId` — Get details of a member

- `PUT    /api/trees/:treeId/members/:memberId` — Update member details and relationships  
  **Body Example:**
  ```json
  {
    "firstName": "Sita",
    "parents": ["60df...", "60ef..."],  // Update parents (array of IDs)
    "spouses": [{ "spouseId": "60ff..." }]
  }
  ```

- `DELETE /api/trees/:treeId/members/:memberId` — Remove member from tree and all relationships

#### Relationship Management Notes

- **Parents:**  
  - Always an array of member IDs (`parents: [parentId1, parentId2]`)
  - To update parents, send the new array (can be empty, one, or two).

- **Spouses:**  
  - Array of objects: `spouses: [{ "spouseId": "..." }]`
  - Multiple spouses are supported.

- **Children:**  
  - Usually derived from other members' `parents` arrays.
  - Can be set/updated for direct linkage if needed.

---

## Data Model

### FamilyMember Schema (excerpt)

```js
{
  firstName: String,
  lastName: String,
  gender: "Male" | "Female" | "Other" | ...,
  dateOfBirth: Date,
  parents: [ObjectId],           // Array of member IDs
  children: [ObjectId],          // Array of member IDs
  spouses: [{ spouseId: ObjectId }]
  // ...other fields (biography, profilePictureUrl, etc.)
}
```

**There are no `fatherId` or `motherId` fields in the schema. Use `parents` array for all parent relationships.**

---

## Testing with Postman

1. **Set your base URL:**  
   `http://localhost:5000`

2. **Authenticate:**
   - Register and/or log in to obtain a JWT token.
   - Set the token in the "Authorization" tab as a **Bearer Token** for all protected routes.

3. **Add a Family Member:**
   - **POST** `/api/trees/:treeId/members`
   - **Body Example:**
     ```json
     {
       "firstName": "Lakshman",
       "gender": "Male",
       "parents": ["PARENT_MEMBERID1", "PARENT_MEMBERID2"],
       "spouses": [{ "spouseId": "SPOUSE_MEMBERID" }]
     }
     ```

4. **Update Relationships:**
   - **PUT** `/api/trees/:treeId/members/:memberId`
   - **Body Example:**
     ```json
     {
       "parents": ["NEW_PARENT_ID1", "NEW_PARENT_ID2"]
     }
     ```

5. **Remove a Member:**
   - **DELETE** `/api/trees/:treeId/members/:memberId`

**Tip:**  
Endpoints will automatically update children and spouses as needed to maintain bidirectional relationship integrity.

---

## Troubleshooting

- **MongoDB Connection Errors:**  
  Ensure `MONGODB_URI` in `.env` is correct and MongoDB is running.

- **JWT/Auth Issues:**  
  Double-check your JWT_SECRET and Authorization header.

- **Firebase Authentication Issues:**  
  - Ensure config in `client/src/firebase.js` matches your Firebase console.
  - Enable all required sign-in providers (Email/Password, Google, etc.).
  - Add localhost (and any deployed domains) as authorized domains in Firebase Authentication settings.

- **Data Consistency:**  
  The API maintains referential integrity for parents, children, and spouses.

- **CORS/Browser Issues:**  
  Postman is immune to CORS, but for browser clients, ensure CORS is handled in your Express config.

---

## Contact

For technical questions, bug reports, or contributions, please contact [archit2412](https://github.com/archit2412).

---

**Sapariwar Backend — Professional API & Setup Documentation**  
_Last updated: 2025-05-24_
