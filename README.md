# Krishi Vigyan Kendra (KVK) Management System

This project is a comprehensive management system for Krishi Vigyan Kendra (KVK). It consists of a React-based frontend and a Node.js/Express-based backend.

## Project Structure

- `KVK Frontent 19/`: React.js application for the user interface.
- `KVK Backend 19/`: Node.js/Express API server and MongoDB integration.

## Getting Started

### Backend Setup

1. Navigate to `KVK Backend 19/`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Seed the admin user: `node scripts/seedAdmin.js`
5. Start the server: `npm run dev`

### Frontend Setup

1. Navigate to `KVK Frontent 19/`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and set `REACT_APP_API_URL`
4. Start the application: `npm start`

## Deployment

Refer to the `.env.example` files in both directories for required environment variables.
