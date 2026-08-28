# Feel The Burn 🔥

Your all-in-one calisthenics companion — browse exercises, plan your diet, track your progress, and build a training streak.

**Live app:** [calipath-eta.vercel.app](https://calipath-eta.vercel.app)
**Live API:** [calipath-api.onrender.com](https://calipath-api.onrender.com)

> The backend is on Render's free tier, which spins down after inactivity. The first request after a period of idle time can take 30–60 seconds to wake up — if signup/login seems to hang on first try, give it a moment and try again.

## About

Feel The Burn is a full-stack calisthenics companion: a React frontend paired with a Flask + PostgreSQL backend. It pulls exercise data from the public [wger](https://wger.de) API and layers on real user accounts, goal-based exercise curation, workout building, diet estimation, and progress/streak tracking — wrapped in a dark ember/charcoal design system.

This started as a Phase 1 React app using browser `localStorage` for everything, then was extended in Phase 2 with a real Flask + PostgreSQL backend for account data — real signups, persistent routines, and progress history that survive a lost device or cleared cache.

## Features

- **Exercise Library** (`/exercises`) — Browse bodyweight exercises from the wger API, filterable by category and target muscle.
- **Exercise Detail** (`/exercise/:id`) — Full exercise info (description, primary muscles, equipment) with an "Add to My Workout" action.
- **My Workout** (`/my-workout`) — Your saved routine, backed by a real account. Requires login. Full create/read/delete against the backend, tied to your user.
- **Progress Tracker** (`/progress`) — Log weight and body measurements over time, backed by a real account. Requires login. Visualized with a Recharts graph: actual weight, measurements, and a projected trendline based on a selected cutting/maintenance/bulking goal (~7,700 kcal ≈ 1kg approximation).
- **Body Goals** (`/goals`) — Curated exercise sets for four training goals (Bulk, Athletic, Lean, Muscular), mapped from wger's exercise categories using a training-split-principle mapping defined in-app (not an AI recommendation).
- **Profile & Diet** (`/profile`) — Estimated daily calories (Mifflin-St Jeor formula × activity multiplier) for cutting/maintenance/bulking, plus a sample meal plan with a macro breakdown.
- **Streak Monitor** (`/streak`) — Mark today as trained, see current and longest streaks, and view the last 7 days at a glance.
- **Real user accounts** — signup/login with JWT authentication and bcrypt-hashed passwords.

Profile, Streak, and Body Goals selections currently persist in browser `localStorage` (per-device). My Workout and Progress persist to the backend database, tied to your account, and follow you across devices once logged in.

## Tech Stack

**Frontend:** React + Vite, React Router, Tailwind CSS v4 (CSS-first `@theme` config), Recharts
**Backend:** Flask, SQLAlchemy, PostgreSQL, Flask-Migrate, Flask-JWT-Extended, Flask-Bcrypt, Flask-CORS, gunicorn
**External API:** [wger.de](https://wger.de/api/v2/) (exercise data, no key required)
**Hosting:** Frontend on Vercel, backend + database on Render

**Design system:** colors `char`, `charcoal`, `charcoal-light`, `ember`, `ember-dark`, `gold`, `chalk`, `steel`; fonts Bebas Neue (`font-display`), Space Grotesk (`font-body`), JetBrains Mono (`font-mono`); signature `.ember-bar` divider under headings.

## Project Structure


calipath/
├── src/                      # React frontend
│   ├── main.jsx                # App entry point
│   ├── App.jsx                  # Router, nav bar, auth state, Routines API calls
│   ├── index.css                 # Tailwind import + design system tokens
│   └── components/
│       ├── Home.jsx                # Landing page with feature grid
│       ├── ExerciseList.jsx         # Exercise library with category/muscle filters
│       ├── ExerciseDetail.jsx        # Single exercise view + add-to-workout
│       ├── MyWorkout.jsx              # Saved routine list (backend-backed)
│       ├── Profile.jsx                 # Calorie + meal plan estimator
│       ├── Progress.jsx                 # Weight/measurement tracker + chart (backend-backed)
│       ├── Streak.jsx                    # Training streak tracker
│       ├── BodyGoals.jsx                  # Goal-curated exercise sets
│       ├── AuthModal.jsx                   # Signup / login modal
│       └── Footer.jsx                       # Animated footer
├── server/                   # Flask backend
│   ├── app.py                   # App factory, blueprint registration, CORS config
│   ├── config.py                 # Environment-based configuration
│   ├── requirements.txt           # Python dependencies
│   ├── Procfile                    # Render start command
│   ├── models/                      # SQLAlchemy models (User, Routine, WorkoutLog)
│   ├── routes/                       # Blueprints (auth, routines, workout_logs)
│   └── migrations/                    # Alembic migration history
└── README.md


## Data Model

Two core relational resources, both owned by a `User`:

- **User** → `id, name, email, password_hash`
- **Routine** (a saved workout exercise) → `id, exercise_id, exercise_name, category, thumbnail, user_id`
- **WorkoutLog** (a progress entry) → `id, date, weight_kg, measurement_cm, user_id`

`Routine` and `WorkoutLog` each belong to exactly one `User` via a foreign key (`user_id`). Every mutating request is scoped to the JWT-authenticated user — no user can read, edit, or delete another user's data.

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

## Authentication

Auth is JWT-based: on signup/login, the backend returns a token which the frontend stores and attaches to subsequent requests via the `Authorization: Bearer <token>` header. Passwords are hashed with bcrypt before storage — plaintext passwords are never persisted.

## Local Setup

### Backend

bash
cd server
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt


Create `server/.env` (not committed — see `.gitignore`):


DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/feelthebburn_dev
JWT_SECRET_KEY=replace-with-a-random-string


Then set up and run:

bash
createdb feelthebburn_dev          # or use your Postgres GUI of choice
flask db upgrade
python app.py                      # runs on http://127.0.0.1:5555
 

### Frontend

bash
npm install
npm run dev                        # runs on http://localhost:5173


The frontend reads the backend URL from `VITE_API_BASE`, falling back to `http://127.0.0.1:5555/api` if unset — so local dev works with no extra configuration. To point at a different backend, create a `.env.local` in the project root:


VITE_API_BASE=http://127.0.0.1:5555/api


### Deployment env vars

- **Render (backend):** `DATABASE_URL` (from the Render Postgres instance), `JWT_SECRET_KEY` (a separate secret from your local dev one)
- **Vercel (frontend):** `VITE_API_BASE` set to the deployed backend's URL plus `/api` (e.g. `https://calipath-api.onrender.com/api`)

Render is configured to run `flask db upgrade` before starting gunicorn on every deploy, so schema migrations apply automatically.

## Roadmap

- Migrate Profile, Streak, and Body Goals selections from `localStorage` to the backend, so they follow the account across devices like Routines and Progress already do
- Add PATCH support and richer analytics on Progress
- Expand exercise image coverage and add real Spotify playlist / AI-assisted meal suggestions (exploratory)

## Author

Levis Nganga — Software Engineering, Moringa School
[github.com/LevisNganga1135](https://github.com/LevisNganga1135)
