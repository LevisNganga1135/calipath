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
    