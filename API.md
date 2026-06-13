# FitCoach Pro API

## Authentication

### `POST /api/auth/register`

Request body:

```json
{
  "name": "Hariom",
  "email": "hariom@example.com",
  "password": "strong-password"
}
```

### `POST /api/auth/login`

Request body:

```json
{
  "email": "hariom@example.com",
  "password": "strong-password"
}
```

Both auth endpoints return:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Hariom",
    "email": "hariom@example.com",
    "createdAt": "2026-06-13T00:00:00.000Z"
  }
}
```

## Protected endpoints

Use `Authorization: Bearer <token>`.

### `GET /api/profile/me`

Returns the authenticated user and the latest generated profile if present.

### `POST /api/profile/assessment`

Request body:

```json
{
  "gender": "Male",
  "age": 28,
  "heightCm": 175,
  "weightKg": 78,
  "activityLevel": "Active",
  "goal": "Body Recomposition",
  "dietPreference": "Non Vegetarian",
  "monthlyBudget": "Medium Budget",
  "experience": "Intermediate"
}
```

Returns the generated dashboard payload including metrics, diet plan, workout plan, and progress logs.

### `GET /api/dashboard`

Returns the latest complete dashboard payload.

### `GET /api/diet-plan/me`

Returns the personalized diet plan.

### `GET /api/workout-plan/me`

Returns the personalized workout plan.

### `GET /api/progress`

Returns all progress log entries for the latest profile.

### `POST /api/progress`

Request body:

```json
{
  "week": "Week 7",
  "weightKg": 76.8,
  "waistCm": 83.5,
  "energy": "Strong",
  "adherence": "Excellent"
}
```

Returns the updated progress history.
