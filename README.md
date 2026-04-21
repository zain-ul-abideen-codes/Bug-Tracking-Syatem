# Bug Tracking System

Professional MERN stack Bug Tracking System with role-based access, JWT authentication, refresh token flow, project management, issue management, screenshot uploads, and analytics dashboards.

## Tech Stack

- Frontend: React.js + Vite
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Auth: JWT access tokens + refresh token in HTTP-only cookie
- Uploads: Multer
- Charts: Recharts

## Roles

- Administrator
  Full access to users, projects, issues, dashboard, and password resets
- Manager
  Can manage projects and view project analytics
- QA Engineer
  Can create issues and manage only their own issues
- Developer
  Can view assigned issues and update only status

## Main Features

- Login with email/password
- Refresh-token based session recovery
- Auto-logout with session expired message
- User management for admin
- Project assignment flow for manager/admin
- Bug and feature request management
- PNG/GIF screenshot upload support
- Role-based dashboard with cards, pie charts, bar chart, and velocity chart
- Search and filter support on issues page
- Sample seed scripts for quick demo data

## Folder Structure

```text
bug-tracking-system/
|-- client/
|   |-- index.html
|   |-- package.json
|   |-- vite.config.js
|   `-- src/
|       |-- api/
|       |-- components/
|       |   |-- charts/
|       |   |-- common/
|       |   |-- layout/
|       |   `-- modals/
|       |-- context/
|       |-- hooks/
|       |-- pages/
|       `-- styles/
|-- server/
|   |-- package.json
|   `-- src/
|       |-- config/
|       |-- controllers/
|       |-- middleware/
|       |-- models/
|       |-- routes/
|       |-- seeds/
|       |-- services/
|       |-- uploads/
|       |-- utils/
|       `-- validators/
|-- .env
|-- .env.example
|-- package.json
`-- README.md
```

## Environment Variables

Project root `.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api
MONGODB_URI=mongodb://127.0.0.1:27017/bug-tracking-system
JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_COOKIE_NAME=refreshToken
UPLOAD_DIR=server/src/uploads
SEED_ADMIN_NAME=System Administrator
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin@12345
```

## Installation

Run these commands from the project root:

```powershell
npm install
npm install --prefix server
npm install --prefix client
```

Or use:

```powershell
npm run install:all
```

## Run Project

Start both frontend and backend:

```powershell
npm run dev
```

If combined dev command gives environment/process issue, run separately:

Backend:

```powershell
npm run dev --prefix server
```

Frontend:

```powershell
npm run dev --prefix client
```

## URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## Seed Commands

Initial admin:

```powershell
npm run seed:admin --prefix server
```

Demo role users:

```powershell
npm run seed:demo-users --prefix server
```

Sample project and sample issues:

```powershell
npm run seed:sample-data --prefix server
```

## Demo Login Credentials

- Admin
  - Email: `admin@example.com`
  - Password: `Admin@12345`
- Manager
  - Email: `manager@example.com`
  - Password: `Manager@123`
- QA Engineer
  - Email: `qa@example.com`
  - Password: `Qa@123456`
- Developer
  - Email: `developer@example.com`
  - Password: `Developer@123`

## MongoDB Data Kahan Save Ho Raha Hai

Current connection string:

```text
mongodb://127.0.0.1:27017/bug-tracking-system
```

Iska matlab:

- MongoDB server local machine par chal raha hai
- Database ka naam hai: `bug-tracking-system`

Collections normally ye hongi:

- `users`
- `projects`
- `bugs`

## MongoDB Data Kaise Dekhen

### Option 1: MongoDB Compass

Sab se easy method:

1. MongoDB Compass install/open karo
2. Connection string paste karo:

```text
mongodb://127.0.0.1:27017
```

3. Connect karo
4. Left side mein database `bug-tracking-system` open karo
5. Uske andar `users`, `projects`, `bugs` collections dekh lo

### Option 2: mongosh

PowerShell mein:

```powershell
mongosh
```

Phir:

```javascript
show dbs
use bug-tracking-system
show collections
db.users.find().pretty()
db.projects.find().pretty()
db.bugs.find().pretty()
```

### Option 3: VS Code MongoDB Extension

1. VS Code mein `MongoDB for VS Code` extension install karo
2. New connection banao
3. URI do:

```text
mongodb://127.0.0.1:27017
```

4. `bug-tracking-system` database open karke collections inspect karo

## Helpful Queries

All users:

```javascript
db.users.find().pretty()
```

All projects:

```javascript
db.projects.find().pretty()
```

All bugs:

```javascript
db.bugs.find().pretty()
```

Only admin user:

```javascript
db.users.find({ email: "admin@example.com" }).pretty()
```

Only sample project:

```javascript
db.projects.find({ title: "Apollo Platform Revamp" }).pretty()
```

## Notes

- Server will not start if MongoDB connection fails
- Passwords are hashed with bcrypt
- Refresh token is stored in HTTP-only cookie
- Uploaded issue screenshots are deleted from disk when issue is deleted or screenshot is replaced
- Issue creation requires a project, and developer assignment must belong to the selected project
