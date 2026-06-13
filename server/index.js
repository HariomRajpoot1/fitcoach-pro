const express = require('express');
const cors = require('cors');
const { createRateLimiter } = require('./middleware/rateLimiter');
const { initializeStore, store, getStorageMode } = require('./repositories/store');
const { hashPassword, verifyPassword } = require('./lib/security');
const { signToken } = require('./lib/jwt');
const { requireAuth } = require('./middleware/auth');
const {
  calculateAssessment,
  createDietPlan,
  createWorkoutPlan,
  createProgressProjection,
  createFitnessScore,
} = require('./services/planFactory');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const allowAnyVercelOrigin = process.env.ALLOW_ANY_VERCEL_ORIGIN !== 'false';

const generalRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120),
  message: 'Too many requests from this IP, please try again later.',
});

const writeRateLimiter = createRateLimiter({
  windowMs: Number(process.env.WRITE_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  maxRequests: Number(process.env.WRITE_RATE_LIMIT_MAX_REQUESTS || 30),
  methods: ['POST', 'PUT', 'DELETE'],
  message: 'Too many write requests from this IP, please slow down.',
});

app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        (allowAnyVercelOrigin && /\.vercel\.app$/i.test(new URL(origin).hostname))
      ) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
  })
);
app.use(generalRateLimiter);
app.use(writeRateLimiter);

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at || user.createdAt,
  };
}

function buildDashboardPayload(profileRecord) {
  const parseField = (value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return JSON.parse(value);
    }

    return value;
  };

  const assessment = parseField(profileRecord.assessment_json || profileRecord.assessmentJson);
  const metrics = parseField(profileRecord.metrics_json || profileRecord.metricsJson);
  const dietPlan = parseField(profileRecord.diet_plan_json || profileRecord.dietPlanJson);
  const workoutPlan = parseField(profileRecord.workout_plan_json || profileRecord.workoutPlanJson);
  const progressLogs = parseField(profileRecord.progress_logs_json || profileRecord.progressLogsJson);

  return { 
    profile: assessment,
    metrics,
    fitnessScore: createFitnessScore(assessment, metrics),
    dietPlan,
    workoutPlan,
    progressLogs,
    storageMode: getStorageMode(),
  };
}

app.get('/api/health', async (req, res) => {
  res.json({
    success: true,
    app: 'FitCoach Pro API',
    storageMode: getStorageMode(),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required.',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await store.findUserByEmail(normalizedEmail);

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with that email already exists.',
    });
  }

  const user = await store.createUser({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
  });

  const token = signToken({ sub: user.id, email: user.email });

  return res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  const user = await store.findUserByEmail(String(email).trim().toLowerCase());

  if (!user || !verifyPassword(password, user.password_hash || user.passwordHash)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const token = signToken({ sub: user.id, email: user.email });

  return res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

app.get('/api/profile/me', requireAuth, async (req, res) => {
  const user = await store.findUserById(req.user.id);
  const latestProfile = await store.findLatestProfileByUserId(req.user.id);

  res.json({
    success: true,
    user: sanitizeUser(user),
    hasAssessment: Boolean(latestProfile),
    profile: latestProfile ? buildDashboardPayload(latestProfile) : null,
  });
});

app.post('/api/profile/assessment', requireAuth, async (req, res) => {
  const assessment = req.body;
  const requiredFields = [
    'gender',
    'age',
    'heightCm',
    'weightKg',
    'activityLevel',
    'goal',
    'dietPreference',
    'monthlyBudget',
    'experience',
  ];

  const missingField = requiredFields.find((field) => assessment[field] === undefined || assessment[field] === '');

  if (missingField) {
    return res.status(400).json({
      success: false,
      message: `Missing required field: ${missingField}`,
    });
  }

  const metrics = calculateAssessment(assessment);
  const dietPlan = createDietPlan(assessment, metrics);
  const workoutPlan = createWorkoutPlan(assessment, metrics);
  const progressLogs = createProgressProjection(assessment, metrics);

  const profileRecord = await store.saveProfile({
    userId: req.user.id,
    assessment,
    metrics,
    dietPlan,
    workoutPlan,
    progressLogs,
  });

  res.status(201).json({
    success: true,
    dashboard: buildDashboardPayload(profileRecord),
  });
});

app.get('/api/dashboard', requireAuth, async (req, res) => {
  const latestProfile = await store.findLatestProfileByUserId(req.user.id);

  if (!latestProfile) {
    return res.status(404).json({
      success: false,
      message: 'Complete the assessment to unlock your dashboard.',
    });
  }

  res.json({
    success: true,
    dashboard: buildDashboardPayload(latestProfile),
  });
});

app.get('/api/diet-plan/me', requireAuth, async (req, res) => {
  const latestProfile = await store.findLatestProfileByUserId(req.user.id);

  if (!latestProfile) {
    return res.status(404).json({ success: false, message: 'No diet plan found.' });
  }

  res.json({
    success: true,
    dietPlan: JSON.parse(latestProfile.diet_plan_json || latestProfile.dietPlanJson),
  });
});

app.get('/api/workout-plan/me', requireAuth, async (req, res) => {
  const latestProfile = await store.findLatestProfileByUserId(req.user.id);

  if (!latestProfile) {
    return res.status(404).json({ success: false, message: 'No workout plan found.' });
  }

  res.json({
    success: true,
    workoutPlan: JSON.parse(latestProfile.workout_plan_json || latestProfile.workoutPlanJson),
  });
});

app.get('/api/progress', requireAuth, async (req, res) => {
  const latestProfile = await store.findLatestProfileByUserId(req.user.id);

  if (!latestProfile) {
    return res.status(404).json({ success: false, message: 'No progress data found.' });
  }

  res.json({
    success: true,
    progressLogs: JSON.parse(latestProfile.progress_logs_json || latestProfile.progressLogsJson),
  });
});

app.post('/api/progress', requireAuth, async (req, res) => {
  const { week, weightKg, waistCm, energy, adherence } = req.body;

  if (!week || !weightKg) {
    return res.status(400).json({
      success: false,
      message: 'Week and weightKg are required.',
    });
  }

  const latestProfile = await store.findLatestProfileByUserId(req.user.id);

  if (!latestProfile) {
    return res.status(404).json({ success: false, message: 'No assessment found for this user.' });
  }

  const progressLogs = JSON.parse(latestProfile.progress_logs_json || latestProfile.progressLogsJson);
  progressLogs.push({
    week,
    weightKg: Number(weightKg),
    waistCm: waistCm ? Number(waistCm) : null,
    energy: energy || 'Good',
    adherence: adherence || 'On Track',
  });

  const updatedProfile = await store.updateProgressLogs(latestProfile.id, progressLogs);

  res.json({
    success: true,
    progressLogs: JSON.parse(updatedProfile.progress_logs_json || updatedProfile.progressLogsJson),
  });
});

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;

  res.status(status).json({
    success: false,
    message: error.message || 'Internal server error.',
  });
});

initializeStore()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`FitCoach Pro API running on port ${PORT} using ${getStorageMode()} storage`);
    });
  })
  .catch((error) => {
    console.error('Failed to start FitCoach Pro API', error);
    process.exit(1);
  });
