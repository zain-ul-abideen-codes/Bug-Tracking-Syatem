# BugTracker Pro

BugTracker Pro is a full-stack MERN bug tracking platform built for role-based software teams. It includes secure authentication, project management, issue tracking, analytics dashboards, screenshot uploads, and an embedded AI assistant.

The platform is designed around four roles:

- `administrator`
- `manager`
- `qa`
- `developer`

It now includes a modern Material UI frontend, JWT access and refresh token authentication, seeded demo users, improved session handling, and a streaming AI assistant with audit logging and RBAC-safe tools.

## Features

### Core Platform

- Secure login with JWT access tokens
- HTTP-only refresh token cookie flow
- Role-based route protection and API authorization
- Password hashing with `bcrypt`
- Project creation, editing, assignment, and deletion
- Bug and feature request tracking
- PNG and GIF screenshot uploads
- Comment and reopened workflow support
- Role-based dashboards and analytics
- Admin user management and password reset

### Frontend

- React SPA built with Vite
- Material UI based design system
- Responsive sidebar and top app bar
- DataGrid tables for issues and users
- Dialog-based create and edit flows
- Light and dark mode support
- Snackbar notifications
- Loading skeletons and empty states

### AI Agent

- Embedded BugBot chat interface
- Streaming-style agent responses
- RBAC-aware project and bug tools
- Session memory and audit trail
- Agent health, audit, and session routes
- Local fast-path and fallback behavior for common requests

## Tech Stack

### Frontend

- React
- Vite
- Material UI
- React Router
- Axios
- Recharts
- React Hook Form
- Day.js

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- LangChain
- OpenAI SDK
- Node Cache

## User Roles

### Administrator

- Full access to users, projects, issues, dashboards, and AI audit data
- Can create, edit, delete, and reset users
- Can create, edit, and delete projects
- Can create and delete issues
- Can view all analytics

### Manager

- Can create and manage projects
- Can assign QA engineers and developers to projects
- Can view project-level data
- Cannot manage user accounts

### QA Engineer

- Can create bugs and feature requests
- Can edit and delete only their own issues
- Can view assigned projects
- Can reopen issues and continue workflow discussion

### Developer

- Can view only assigned issues
- Can update issue status for assigned issues
- Cannot edit other issue attributes

## Project Structure

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
|-- scripts/
|   `-- dev-server.js
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
|-- .env.example
|-- package.json
`-- README.md
```

## Environment Variables

Create a root `.env` file and copy values from `.env.example`.

### Required Application Variables

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

### AI Agent Variables

```env
OPENAI_API_KEY=sk-...
AGENT_MODEL=gpt-4o
AGENT_MAX_TOKENS=2000
AGENT_TEMPERATURE=0
AGENT_MAX_ITERATIONS=6
AGENT_SESSION_TTL_DAYS=7
AGENT_CACHE_TTL_SECONDS=120
AGENT_RATE_LIMIT_PER_MINUTE=30
AGENT_STREAM=true
AGENT_INTENT_CLASSIFIER=true
AGENT_PROACTIVE_ALERTS=true
AGENT_VOICE_INPUT=true
```

## Installation

From the project root:

```powershell
npm install
npm install --prefix server
npm install --prefix client
```

Or use the helper command:

```powershell
npm run install:all
```

## Running the Project

### Recommended: Single Command Development Mode

The root development command starts:

- local MongoDB if it is not already running
- the backend server
- the frontend dev server

Run:

```powershell
npm run dev
```

This uses:

- [package.json](D:\final-project\bug-tracking-system\package.json)
- [scripts/dev-server.js](D:\final-project\bug-tracking-system\scripts\dev-server.js)

The development launcher expects:

- MongoDB executable at `C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe`
- writable MongoDB data directory at `D:\mongodb-data`

### Manual Run Mode

If you prefer to run services separately:

#### Backend

```powershell
npm run start --prefix server
```

or during development:

```powershell
npm run dev --prefix server
```

#### Frontend

```powershell
npm run dev --prefix client
```

#### MongoDB Manual Fallback

If your MongoDB Windows service is unavailable, run MongoDB manually:

```powershell
mkdir D:\mongodb-data -ErrorAction SilentlyContinue
& "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "D:\mongodb-data"
```

Keep that window open while using the application.

## Application URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## Seed Commands

### Seed Admin Account

```powershell
npm run seed:admin --prefix server
```

### Seed Demo Role Accounts

```powershell
npm run seed:demo-users --prefix server
```

### Seed Sample Project and Issue Data

```powershell
npm run seed:sample-data --prefix server
```

## Demo Credentials

### Administrator

- Email: `admin@example.com`
- Password: `Admin@12345`

### Manager

- Email: `manager@example.com`
- Password: `Manager@123`

### QA Engineer

- Email: `qa@example.com`
- Password: `Qa@123456`

### Developer

- Email: `developer@example.com`
- Password: `Developer@123`

## Database Notes

### Default MongoDB Connection

```text
mongodb://127.0.0.1:27017/bug-tracking-system
```

### Main Collections

- `users`
- `projects`
- `bugs`
- `agentconversations`
- `auditlogs`

Additional collections may appear for notifications or future agent features depending on usage.

## Viewing Data in MongoDB

### MongoDB Compass

1. Open MongoDB Compass
2. Connect with:

```text
mongodb://127.0.0.1:27017
```

3. Open the `bug-tracking-system` database
4. Browse the collections

### mongosh

```powershell
mongosh
```

Then:

```javascript
show dbs
use bug-tracking-system
show collections
db.users.find().pretty()
db.projects.find().pretty()
db.bugs.find().pretty()
```

## Useful MongoDB Queries

### View All Users

```javascript
db.users.find().pretty()
```

### View All Projects

```javascript
db.projects.find().pretty()
```

### View All Bugs

```javascript
db.bugs.find().pretty()
```

### View Admin Account

```javascript
db.users.find({ email: "admin@example.com" }).pretty()
```

### View Sample Project

```javascript
db.projects.find({ title: "Apollo Platform Revamp" }).pretty()
```

## Backend Architecture

The backend follows a structured MVC-style organization.

### Models

- `User`
- `Project`
- `Bug`
- `AgentConversation`
- `AuditLog`

### Controllers

- authentication
- users
- projects
- bugs
- dashboard
- AI agent

### Middleware

- JWT verification
- role authorization
- global error handling

### Services

- token generation and verification
- file upload rules
- AI agent orchestration
- caching
- alerting
- suggestion engine

## Frontend Architecture

### Layout and UI

- shared MUI layout shell
- responsive sidebar and app bar
- dialogs for create and edit flows
- reusable chips, empty states, and skeleton loaders

### Pages

- Login
- Dashboard
- Projects
- Project Details
- Issues
- Users
- AI Agent
- AI Audit

### State and Session Handling

- auth state stored in context
- refresh-token based re-authentication
- session expiry handling with redirect
- snackbar notifications via global notification context

## Bug Workflow

### Issue Types

- `bug`
- `feature`

### Status Flow

#### Bug

- `new`
- `started`
- `resolved`
- `reopened`

#### Feature

- `new`
- `started`
- `completed`
- `reopened`

### Workflow Behavior

- QA or admin creates an issue
- the issue belongs to a project
- the issue may be assigned to a developer
- the developer updates status
- QA can reopen if the issue persists
- comments and activity support the feedback loop

## File Upload Rules

Screenshot uploads are handled with Multer and restricted to:

- `.png`
- `.gif`

When an issue is deleted, its screenshot file is also removed from the server.

## Dashboard Analytics

The dashboard is role-aware and may include:

- total issues
- total projects
- open issues
- resolved work
- issue type distribution
- issue status distribution
- bugs per project
- recent issue activity

## AI Agent Setup and Architecture

### What BugBot Does

BugBot is an embedded AI assistant for the platform. It can:

- answer project and issue questions
- inspect role-scoped bugs and projects
- stream replies in the frontend
- maintain session context
- surface proactive alerts
- log every important tool action for auditing

### Important Backend Agent Files

- [server/src/services/intentClassifier.js](D:\final-project\bug-tracking-system\server\src\services\intentClassifier.js)
- [server/src/services/agentCache.js](D:\final-project\bug-tracking-system\server\src\services\agentCache.js)
- [server/src/services/suggestionEngine.js](D:\final-project\bug-tracking-system\server\src\services\suggestionEngine.js)
- [server/src/services/alertService.js](D:\final-project\bug-tracking-system\server\src\services\alertService.js)
- [server/src/services/agentTools.js](D:\final-project\bug-tracking-system\server\src\services\agentTools.js)
- [server/src/services/agentService.js](D:\final-project\bug-tracking-system\server\src\services\agentService.js)
- [server/src/utils/streamHelpers.js](D:\final-project\bug-tracking-system\server\src\utils\streamHelpers.js)
- [server/src/models/AgentConversation.js](D:\final-project\bug-tracking-system\server\src\models\AgentConversation.js)
- [server/src/models/AuditLog.js](D:\final-project\bug-tracking-system\server\src\models\AuditLog.js)

### Important Frontend Agent Files

- [client/src/hooks/useAgentChat.js](D:\final-project\bug-tracking-system\client\src\hooks\useAgentChat.js)
- [client/src/components/BugBotRenderer.jsx](D:\final-project\bug-tracking-system\client\src\components\BugBotRenderer.jsx)
- [client/src/components/AgentChat.jsx](D:\final-project\bug-tracking-system\client\src\components\AgentChat.jsx)
- [client/src/pages/AgentPage.jsx](D:\final-project\bug-tracking-system\client\src\pages\AgentPage.jsx)
- [client/src/pages/AuditPage.jsx](D:\final-project\bug-tracking-system\client\src\pages\AuditPage.jsx)

### AI Routes

- `POST /api/agent/chat`
- `GET /api/agent/sessions`
- `DELETE /api/agent/sessions/:id`
- `GET /api/agent/audit`
- `GET /api/agent/audit/stats`
- `GET /api/agent/health`

### Agent Streaming Events

BugBot can emit:

- `token`
- `tool_start`
- `tool_end`
- `suggestions`
- `alert`
- `done`
- `error`

### Agent Security Model

- JWT-protected routes
- rate limiting per user
- RBAC checked in every tool
- input sanitization
- prompt injection blocking
- audit logging for both success and failure

### Agent Performance Model

- quick local intent detection
- cached deterministic responses
- parallel database aggregation where useful
- streaming output for faster perceived response time

## Testing the AI Agent

1. Start the full project:

```powershell
npm run dev
```

2. Log in to the frontend
3. Open the AI Agent page
4. Try prompts such as:

```text
Show my projects
Show my bugs
Show dashboard stats
Find bugs login error
Show overdue issues
```

5. As admin, open the AI Audit page to review tool activity

## Notes

- The backend will not start if MongoDB is unavailable
- The root `npm run dev` command depends on your local MongoDB executable path
- Passwords are never stored in plaintext
- Refresh tokens are stored in HTTP-only cookies
- Project and issue permissions are enforced per role
- Some large frontend bundles still produce Vite chunk-size warnings, but the production build completes successfully

## Current Status

This repository currently includes:

- a working role-based MERN bug tracker
- a Material UI based frontend redesign
- seeded demo users and sample data
- improved session handling and refresh recovery
- AI assistant routes and UI
- admin audit view for AI activity

Good next steps for future improvement include:

- code splitting for bundle reduction
- richer notification history
- saved filters and advanced issue search
- kanban issue board
- profile and settings pages
