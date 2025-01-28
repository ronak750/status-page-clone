# Status Page Application

A real-time status page application that allows organizations to monitor and display the health of their services.

## Features

- Real-time service status updates
- Incident management with updates
- Public status page for each organization
- 90-day status history timeline
- WebSocket-based real-time updates

## Tech Stack

### Frontend
- React.js
- TailwindCSS for styling
- Socket.io-client for real-time updates
- Axios for API requests

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.io for WebSocket server
- JWT for authentication

### DevOps
- Node.js >= 18.16.0
- npm for package management
- Build process with Create React App

## Prerequisites

- Node.js >= 18.16.0
- MongoDB
- npm or yarn

## Environment Variables

Create a .env file in the backend directory with:

env
MONGODB_URI=your_mongodb_connection_string
PORT=5050 (optional, defaults to 5050)

Create a .env file in the client directory with:

env
REACT_APP_CLERK_PUBLISHABLE_KEY=your_publishable_clerk_string


## Installation & Setup

1. Clone the repository:
bash
git clone <repository-url>
cd <repository-name>


2. Install dependencies and build the client:
bash
cd client
npm install
npm run build


3. Install backend dependencies:
bash
cd ../backend
npm install


## Running the Application

1. Start the server:
bash
cd backend
npm start


The application will be available at http://localhost:5050

## Development

For development with hot-reloading:

1. Start the backend:
bash
cd backend
npm run dev


2. In a separate terminal, start the client:
bash
cd client
npm start