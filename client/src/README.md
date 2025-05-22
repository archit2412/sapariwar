# Sapariwar - Family Tree Application

Sapariwar is a web-based application designed to help users create, visualize, and manage their family trees. Built with the MERN stack (MongoDB, Express.js, React, Node.js) and leveraging Firebase for authentication.

## Project Goal

To provide an intuitive and responsive platform for users to document their ancestry, explore family connections, and preserve their family history digitally.

## Features (Phase 1)

*   **User Authentication:** Secure sign-up and login using Firebase Authentication.
*   **Family Tree Creation:** Users can create multiple family trees.
*   **Member Management:**
    *   Add new family members with details (name, date of birth, date of death, gender, profile picture, biography).
    *   Edit existing member details.
    *   Remove members from a tree.
*   **Relationship Mapping:**
    *   Define relationships between members (parent, child, spouse).
    *   (Future: Extended relationships like siblings, grandparents, etc., will be derived or explicitly addable).
*   **Interactive Tree Visualization:**
    *   Display the family tree in a clear, graphical format.
    *   Pan and zoom capabilities for easy navigation.
    *   Click on members to view details.
*   **Responsive Design:** The application will be fully responsive and accessible on various devices (desktop, tablet, mobile).
*   **Privacy Settings:**
    *   Mark trees as "Private" (only accessible to the creator).
    *   Mark trees as "Public via Link" (accessible to anyone with the link, read-only).

## Tech Stack

*   **Frontend:** React (with Vite), JavaScript, HTML, CSS
    *   State Management: React Context API (or potentially Zustand/Redux later if complexity grows)
    *   Routing: `react-router-dom`
    *   Tree Visualization: (To be decided - e.g., `react-flow`, custom SVG, or other libraries)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (with Mongoose ODM)
*   **Authentication:** Firebase Authentication
*   **Deployment:** (To be decided - e.g., Vercel for frontend, Heroku/Render for backend)

## Project Structure

```
sapariwar/
├── client/             # React Frontend (Vite)
│   ├── public/
│   └── src/
├── server/             # Node.js/Express Backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm (or yarn)
*   MongoDB instance (local or cloud-hosted like MongoDB Atlas)
*   Firebase Account (for setting up Firebase Authentication)

### Setup - Backend (`server/`)

1.  Navigate to the `server` directory: `cd server`
2.  Install dependencies: `npm install`
3.  Create a `.env` file in the `server` directory and add the following environment variables:
    ```env
    PORT=5001 # Or any port you prefer for the backend
    MONGODB_URI=your_mongodb_connection_string
    FIREBASE_PROJECT_ID=your_firebase_project_id
    FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
    FIREBASE_PRIVATE_KEY=your_firebase_private_key_pem_format_escaped
    FIREBASE_CLIENT_EMAIL=your_firebase_client_email
    FIREBASE_CLIENT_ID=your_firebase_client_id
    FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
    FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
    FIREBASE_CLIENT_X509_CERT_URL=your_firebase_client_x509_cert_url
    # Alternatively, you can use GOOGLE_APPLICATION_CREDENTIALS pointing to your service account JSON file
    ```
    *Note: You'll get these Firebase credentials when you set up a service account in your Firebase project.*
4.  Start the development server: `npm run dev` (assuming you have a `dev` script in `server/package.json` like `"dev": "nodemon server.js"`)

### Setup - Frontend (`client/`)

1.  Navigate to the `client` directory: `cd client`
2.  Install dependencies: `npm install`
3.  Create a `.env.local` file in the `client` directory and add your Firebase client-side configuration:
    ```env
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_firebase_app_id
    ```
    *Note: You'll get these from your Firebase project settings (Web app configuration).*
4.  Start the development server: `npm run dev`
5.  The React app should now be running, typically on `http://localhost:5173` (Vite's default).

## API Endpoints (Phase 1)

*   See [API Endpoints Documentation](link_to_api_docs_later.md) (We can create this file later if needed, or list them here). For now, the main ones are:
    *   `POST /api/trees`
    *   `GET /api/trees`, `GET /api/trees/:treeId`
    *   `PUT /api/trees/:treeId`, `PUT /api/trees/:treeId/privacy`
    *   `DELETE /api/trees/:treeId`
    *   `GET /api/trees/:treeId/members`, `POST /api/trees/:treeId/members`
    *   `GET /api/members/:memberId`, `PUT /api/members/:memberId`, `DELETE /api/members/:memberId`

## Contributing

(Details to be added later if the project becomes open to contributions)

## License

(To be decided - e.g., MIT, Apache 2.0. If it's a personal project, you might not need one immediately, but good practice for open source.)

---

Built by Archit (@archit2412)
```

**Next Steps for you:**

1.  **Create the `README.md` file:** Copy the content above and save it as `README.md` in the root of your `sapariwar` project directory.
2.  **Review and Customize:**
    *   Fill in any placeholders (like Firebase credentials if you have them already, or just note where they go).
    *   Adjust any details that might be slightly different for your setup.
    *   The "Tree Visualization" tech stack is still TBD, which is fine for now.

This README provides a good starting point. We can always update and expand it as the project evolves.

What do you think? Is this a good draft for your `README.md`? Once you've created this file, we can think about what's next – perhaps starting to set up the `server` side of the project or diving into coding the first React components.