# Feel The Burn 🔥

Your all-in-one calisthenics companion — browse exercises, plan your diet, track your progress, and build a training streak.

**Live app:** [calipath-eta.vercel.app](https://calipath-eta.vercel.app)

## About

Feel The Burn is a React fitness tracker built around a bodyweight/calisthenics training workflow. It pulls exercise data from the public [wger](https://wger.de) exercise API and layers on custom tools for goal-based exercise curation, workout building, diet estimation, and progress/streak tracking — all wrapped in a dark ember/charcoal design system.

## Features

- **Exercise Library** (`/exercises`) — Browse bodyweight exercises from the wger API, filterable by category and target muscle.
- **Exercise Detail** (`/exercise/:id`) — Full exercise info (description, primary muscles, equipment) with an "Add to My Workout" action.
- **My Workout** (`/my-workout`) — A running list of exercises you've added from the library, with the count shown live in the nav bar. Remove items individually.
- **Body Goals** (`/goals`) — Curated exercise sets for four training goals (Bulk, Athletic, Lean, Muscular), mapped from wger's exercise categories using a training-split-principle mapping defined in-app (not an AI recommendation).
- **Profile & Diet** (`/profile`) — Enter age, sex, height, weight, and activity level (metric or imperial) to get:
  - Estimated daily calories (BMR via Mifflin-St Jeor formula × activity multiplier) for cutting/maintenance/bulking
  - A sample meal plan with macro breakdown (protein/carbs/fat) and per-meal calorie suggestions for whichever goal you select
- **Progress Tracker** (`/progress`) — Log weight and body measurements over time, visualized with a Recharts line graph: actual weight, measurements, and a projected trendline based on a selected cutting/maintenance/bulking goal (~7,700 kcal ≈ 1kg approximation).
- **Streak Monitor** (`/streak`) — Mark today as trained, see current and longest streaks, and view the last 7 days at a glance.

## Tech Stack

- **React** + **Vite**
- **React Router** (`react-router-dom`) for client-side routing
- **Tailwind CSS v4** (CSS-first `@theme` config) with a custom design system:
  - Colors: `char`, `charcoal`, `charcoal-light`, `ember`, `ember-dark`, `gold`, `chalk`, `steel`
  - Fonts: Bebas Neue (`font-display`), Space Grotesk (`font-body`), JetBrains Mono (`font-mono`)
  - Signature `.ember-bar` gradient divider used under headings
- **Recharts** for the progress graph
- **wger REST API** (`exerciseinfo` endpoint) for exercise data — no API key required
- Browser **localStorage** for persisting workout, profile, progress logs, and streak data client-side (per-device, not synced)
- Deployed on **Vercel**

## Project Structure

\```
src/
├── main.jsx                # App entry point
├── App.jsx                 # Router setup, nav bar, My Workout state (localStorage)
├── index.css                # Tailwind import + design system tokens
└── components/
    ├── Home.jsx              # Landing page with feature grid
    ├── ExerciseList.jsx       # Exercise library with category/muscle filters
    ├── ExerciseDetail.jsx     # Single exercise view + add-to-workout
    ├── MyWorkout.jsx          # Saved workout list
    ├── Profile.jsx            # Calorie + meal plan estimator
    ├── Progress.jsx           # Weight/measurement tracker + chart
    
    ## Features

- **Exercise Library** — browse and filter bodyweight exercises by category and muscle group, powered by the [wger](https://wger.de) public API
- **My Workout** — save exercises to a personal routine (full CRUD, tied to your account)
- **Profile & Diet** — estimated daily calorie target (Mifflin-St Jeor formula) and a sample macro/meal-plan breakdown
- **Progress Tracker** — log weight/measurements over time, view a trend chart with a goal-based projection line
- **Streak Monitor** — track consecutive training days
- **Body Goals** — curated exercise sets by training-split goal (Bulk, Athletic, Lean, Muscular)
- **Real user accounts** — signup/login with JWT authentication and bcrypt-hashed passwords

## Tech Stack

**Frontend:** React, React Router, Tailwind CSS v4, Recharts, Vite
**Backend:** Flask, SQLAlchemy, PostgreSQL, Flask-Migrate, Flask-JWT-Extended, Flask-Bcrypt, Flask-CORS
**External API:** [wger.de](https://wger.de/api/v2/) (exercise data)

## Project Structure

calipath/
├── src/ # React frontend
│ ├── components/ # Page components (ExerciseList, Profile, Progress, etc.)
│ └── App.jsx # Routes, nav, auth state
├── server/ # Flask backend
│ ├── app.py # App factory, blueprint registration
│ ├── config.py # Environment-based configuration
│ ├── models/ # SQLAlchemy models (User, Routine, WorkoutLog)
│ ├── routes/ # Blueprints (auth, routines, workout_logs)
│ └── migrations/ # Alembic migration history
└── README.md


## Data Model

Two core relational resources, both owned by a `User`:

- **User** → `id, name, email, password_hash`
- **Routine** (a saved workout exercise) → `id, exercise_id, exercise_name, category, thumbnail, user_id`
- **WorkoutLog** (a progress entry) → `id, date, weight_kg, measurement_cm, user_id`

`Routine` and `WorkoutLog` each belong to exactly one `User` via a foreign key (`user_id`), and every mutating request is scoped to the JWT-authenticated user — no user can read, edit, or delete another user's data.

## API Endpoints

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create an account, returns JWT |
| POST | `/api/auth/login` | No | Log in, returns JWT |
| GET | `/api/auth/me` | Yes | Get the current logged-in user |
| GET | `/api/routines` | Yes | List the current user's saved routines |
| POST | `/api/routines` | Yes | Save a new routine |
| PATCH | `/api/routines/:id` | Yes (owner only) | Update a routine |
| DELETE | `/api/routines/:id` | Yes (owner only) | Delete a routine |
| GET | `/api/workout-logs` | Yes | List the current user's progress logs |
| POST | `/api/workout-logs` | Yes | Add a progress log entry |
| DELETE | `/api/workout-logs/:id` | Yes (owner only) | Delete a progress log entry |

All endpoints return standard error responses: `400` (malformed request), `401` (missing/invalid token), `403` (attempting to modify another user's data), `404` (resource not found), `500` (unexpected server error).

## Local Setup

### Backend

```bash
cd server
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file (see below), then:
createdb feelthebburn_dev          # or use your Postgres GUI of choice
flask db upgrade
python app.py                      # runs on http://127.0.0.1:5555
```

**`server/.env`** (not committed — see `.gitignore`):

DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/feelthebburn_dev
JWT_SECRET_KEY=replace-with-a-random-string


### Frontend

```bash
npm install
npm run dev                        # runs on http://localhost:5173
```

The frontend expects the backend at `http://127.0.0.1:5555/api` (see `API_BASE` in `src/App.jsx`) — update this constant if your backend runs elsewhere.

## Authentication

Auth is JWT-based: on signup/login, the backend returns a token which the frontend stores and attaches to subsequent requests via the `Authorization: Bearer <token>` header. Passwords are hashed with bcrypt before storage — plaintext passwords are never persisted.

## Roadmap

- **Phase 3:** Expand ownership-based features (edit routines, richer progress analytics), tighten CORS for production, deploy backend to Render
- Optional: real Spotify playlist integration, AI-assisted meal suggestions, expanded exercise image coverage

## Author

Levis Nganga — Software Engineering, Moringa School