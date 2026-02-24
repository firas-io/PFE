# HabitFlow Backend API

## Overview
HabitFlow is a habit tracking application backend built with Fastify and MongoDB. It provides a complete RESTful API for managing user habits, tracking progress, and monitoring habit statistics.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Fastify 5.7.4
- **Database**: MongoDB 9.2.1
- **Database Driver**: Mongoose
- **Development**: Nodemon

## Getting Started

### Installation
```bash
npm install
```

### Configuration
Ensure MongoDB is running on `mongodb://127.0.0.1/habitflow`

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Root Endpoint
- `GET /` - Get API information and available endpoints

### Users
- `POST /users` - Create a new user (201)
- `GET /users` - Get all users (200)
- `GET /users/:id` - Get a specific user (200/404)
- `PUT /users/:id` - Update a user (200/404/400)
- `DELETE /users/:id` - Delete a user (204/404)

### Habits
- `POST /habits` - Create a new habit (201)
- `GET /habits` - Get all habits (200)
- `GET /habits/:id` - Get a specific habit (200/404)
- `PUT /habits/:id` - Update a habit (200/404/400)
- `DELETE /habits/:id` - Delete a habit (204/404)

### Habit Logs
- `POST /logs` - Create a habit log entry (201)
- `GET /logs` - Get all habit logs (200)
- `GET /logs/:id` - Get a specific log (200/404)
- `PUT /logs/:id` - Update a log entry (200/404/400)
- `DELETE /logs/:id` - Delete a log entry (204/404)

### Habit Stats
- `POST /stats` - Create habit statistics (201)
- `GET /stats` - Get all statistics (200)
- `GET /stats/:id` - Get specific statistics (200/404)
- `PUT /stats/:id` - Update statistics (200/404/400)
- `DELETE /stats/:id` - Delete statistics (204/404)

### Reminders
- `POST /reminders` - Create a reminder (201)
- `GET /reminders` - Get all reminders (200)
- `GET /reminders/:id` - Get a specific reminder (200/404)
- `PUT /reminders/:id` - Update a reminder (200/404/400)
- `DELETE /reminders/:id` - Delete a reminder (204/404)

### Sessions
- `POST /sessions` - Create a session (201)
- `GET /sessions` - Get all sessions (200)
- `GET /sessions/:id` - Get a specific session (200/404)
- `DELETE /sessions/:id` - Delete a session (204/404)

### Onboarding
- `POST /onboarding` - Create onboarding record (201)
- `GET /onboarding` - Get all onboarding records (200)
- `GET /onboarding/:id` - Get specific onboarding (200/404)
- `PUT /onboarding/:id` - Update onboarding (200/404/400)
- `DELETE /onboarding/:id` - Delete onboarding (204/404)

## Data Models

### User
```javascript
{
  nom: String (required),
  prenom: String (required),
  email: String (required, unique),
  departement: String,
  role: String (enum: ["utilisateur", "admin"], default: "utilisateur"),
  mot_de_passe: String (required),
  date_creation: Date (default: Date.now),
  dernier_login: Date
}
```

### Habit
```javascript
{
  utilisateur_id: ObjectId (ref: User, required),
  nom: String (required),
  description: String,
  categorie: String,
  frequence: String (enum: ["daily", "weekly", "monthly"]),
  date_creation: Date (default: Date.now)
}
```

### HabitLog
```javascript
{
  habit_id: ObjectId (ref: Habit, required),
  date: Date (required),
  statut: String (enum: ["completee", "non_completee", "partielle"], required),
  notes: String
}
```

### HabitStats
```javascript
{
  habit_id: ObjectId (ref: Habit, required, unique),
  streak_actuel: Number (default: 0),
  meilleur_streak: Number (default: 0),
  taux_completion: Number (default: 0),
  derniere_mise_a_jour: Date
}
```

### Reminder
```javascript
{
  habit_id: ObjectId (ref: Habit, required),
  utilisateur_id: ObjectId (ref: User, required),
  heure: String (required),
  type_notification: String (enum: ["email", "sms", "notification"], required),
  actif: Boolean (default: true)
}
```

### Session
```javascript
{
  utilisateur_id: ObjectId (ref: User, required),
  token: String (required),
  expiration: Date (required)
}
```

### Onboarding
```javascript
{
  utilisateur_id: ObjectId (ref: User, required),
  etape: String (required),
  termine: Boolean (default: false),
  date_debut: Date (default: Date.now),
  date_fin: Date
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Resource deleted successfully
- `400 Bad Request` - Invalid request data or validation error
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Project Structure
```
├── controllers/          # Business logic handlers
├── models/              # MongoDB schemas
├── routes/              # API route definitions
├── lib/                 # Database connection
├── server/              # Main server file
├── package.json         # Dependencies and scripts
└── debug.js             # Debugging utility
```

## Development

### Environment Variables
None required for basic setup (uses default MongoDB connection)

### Logging
The API uses Fastify's built-in logger. All requests and responses are logged with:
- Request method and URL
- Status code
- Response time

### Adding New Endpoints
1. Create a model in `models/`
2. Create routes in `routes/`
3. Register routes in `server/server.js`

## Database

MongoDB connection string: `mongodb://127.0.0.1/habitflow`

Ensure MongoDB is running before starting the server.

## License
ISC
