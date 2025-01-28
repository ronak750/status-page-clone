# Status Page Application

A real-time status page application built with React, Node.js, and WebSocket for live updates.

## Features

- Real-time status updates using WebSocket
- Service status monitoring
- Incident management
- Public status page
- Team management
- Authentication using Clerk

## Tech Stack

- Frontend: React, TailwindCSS
- Backend: Node.js, Express
- Database: MongoDB
- Real-time: Socket.io
- Authentication: Clerk

## Prerequisites

- Node.js >= 18.16.0
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables:

Backend (.env):
```
NODE_ENV=production
PORT=5050
MONGODB_URI=your_mongodb_uri
```

Frontend (.env):
```
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

4. Start the application:

Development:
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd client
npm start
```

Production:
```bash
# Build frontend
cd client
npm run build

# Start backend
cd ../backend
npm start
```

## Deployment

1. Frontend:
- Build the React app: `cd client && npm run build`
- Deploy the `build` folder to your hosting service (Netlify, Vercel, etc.)

2. Backend:
- Deploy to your preferred hosting (Heroku, DigitalOcean, AWS, etc.)
- Set up environment variables on your hosting platform
- Ensure MongoDB connection string is properly configured

## Environment Variables

Backend:
- `NODE_ENV`: production/development
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string

Frontend:
- `REACT_APP_CLERK_PUBLISHABLE_KEY`: Clerk authentication key
- `REACT_APP_API_URL`: Backend API URL

## License

[Your License]
