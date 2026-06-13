# FitCoach Pro

FitCoach Pro is a full-stack AI fitness coach web application built with React, Vite, Tailwind CSS, Express, and MySQL-ready persistence.

## Features

- Premium landing page with hero, benefits, testimonials, and CTA
- JWT-style authentication
- 9-step assessment wizard
- BMI, maintenance calories, recommended calories, and macro calculations
- Indian vegetarian and non-vegetarian diet generation
- Beginner, intermediate, and advanced workout plans
- Dashboard with charts and progress logging
- MySQL schema plus automatic in-memory fallback for local verification

## Local setup

### Backend

1. Copy [server/.env.example](/home/hariom/Desktop/self/CRUD/crud/server/.env.example) to `server/.env` and fill in your values.
2. Run `npm install` inside `server`.
3. Run `npm run dev` inside `server`.

### Frontend

1. Copy [client/.env.example](/home/hariom/Desktop/self/CRUD/crud/client/.env.example) to `client/.env`.
2. Run `npm install` inside `client`.
3. Run `npm run dev` inside `client`.

## Database

- MySQL schema: [server/schema.sql](/home/hariom/Desktop/self/CRUD/crud/server/schema.sql)
- Tables: `users`, `fitness_profiles`, `diet_plans`, `workout_plans`, `progress_logs`

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profile/me`
- `POST /api/profile/assessment`
- `GET /api/dashboard`
- `GET /api/diet-plan/me`
- `GET /api/workout-plan/me`
- `GET /api/progress`
- `POST /api/progress`

## Notes

- If MySQL env vars are unavailable or the database is unreachable, the backend automatically runs in memory mode so the product flow can still be exercised locally.
- For production deployment, provide a strong `JWT_SECRET`, a real MySQL database, and a deployed frontend origin in `CLIENT_URL`.
