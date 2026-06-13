const { getDatabase } = require('../config/database');

let storageMode = 'memory';
let db = null;
let counters = {
  users: 1,
  profiles: 1,
};

const memoryStore = {
  users: [],
  profiles: [],
};

const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS fitness_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    assessment_json JSON NOT NULL,
    metrics_json JSON NOT NULL,
    diet_plan_json JSON NOT NULL,
    workout_plan_json JSON NOT NULL,
    progress_logs_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS diet_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    profile_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    plan_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES fitness_profiles(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS workout_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    profile_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    plan_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES fitness_profiles(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS progress_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    profile_id INT NOT NULL,
    week_label VARCHAR(60) NOT NULL,
    weight_kg DECIMAL(6,2) NOT NULL,
    waist_cm DECIMAL(6,2) NULL,
    energy VARCHAR(40),
    adherence VARCHAR(40),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES fitness_profiles(id) ON DELETE CASCADE
  )`,
];

async function initializeStore() {
  db = await getDatabase();

  if (!db) {
    storageMode = 'memory';
    return;
  }

  for (const statement of CREATE_TABLES) {
    await db.query(statement);
  }

  storageMode = 'mysql';
}

async function findUserByEmail(email) {
  if (storageMode === 'mysql') {
    const rows = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  }

  return memoryStore.users.find((user) => user.email === email) || null;
}

async function findUserById(id) {
  if (storageMode === 'mysql') {
    const rows = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  return memoryStore.users.find((user) => user.id === id) || null;
}

async function createUser({ name, email, passwordHash }) {
  if (storageMode === 'mysql') {
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    return findUserById(result.insertId);
  }

  const user = {
    id: counters.users++,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  memoryStore.users.push(user);
  return user;
}

async function saveProfile({ userId, assessment, metrics, dietPlan, workoutPlan, progressLogs }) {
  if (storageMode === 'mysql') {
    const result = await db.query(
      `INSERT INTO fitness_profiles
      (user_id, assessment_json, metrics_json, diet_plan_json, workout_plan_json, progress_logs_json)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        JSON.stringify(assessment),
        JSON.stringify(metrics),
        JSON.stringify(dietPlan),
        JSON.stringify(workoutPlan),
        JSON.stringify(progressLogs),
      ]
    );

    const profileId = result.insertId;

    await db.query(
      'INSERT INTO diet_plans (user_id, profile_id, name, plan_json) VALUES (?, ?, ?, ?)',
      [userId, profileId, dietPlan.planName, JSON.stringify(dietPlan)]
    );
    await db.query(
      'INSERT INTO workout_plans (user_id, profile_id, name, plan_json) VALUES (?, ?, ?, ?)',
      [userId, profileId, workoutPlan.planName, JSON.stringify(workoutPlan)]
    );

    for (const log of progressLogs) {
      await db.query(
        `INSERT INTO progress_logs (user_id, profile_id, week_label, weight_kg, waist_cm, energy, adherence)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, profileId, log.week, log.weightKg, log.waistCm, log.energy, log.adherence]
      );
    }

    return findLatestProfileByUserId(userId);
  }

  const profile = {
    id: counters.profiles++,
    userId,
    assessmentJson: JSON.stringify(assessment),
    metricsJson: JSON.stringify(metrics),
    dietPlanJson: JSON.stringify(dietPlan),
    workoutPlanJson: JSON.stringify(workoutPlan),
    progressLogsJson: JSON.stringify(progressLogs),
    createdAt: new Date().toISOString(),
  };
  memoryStore.profiles.push(profile);
  return profile;
}

async function findLatestProfileByUserId(userId) {
  if (storageMode === 'mysql') {
    const rows = await db.query(
      'SELECT * FROM fitness_profiles WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  }

  return (
    [...memoryStore.profiles]
      .filter((profile) => profile.userId === userId)
      .sort((a, b) => b.id - a.id)[0] || null
  );
}

async function updateProgressLogs(profileId, progressLogs) {
  if (storageMode === 'mysql') {
    await db.query('UPDATE fitness_profiles SET progress_logs_json = ? WHERE id = ?', [
      JSON.stringify(progressLogs),
      profileId,
    ]);

    const rows = await db.query('SELECT * FROM fitness_profiles WHERE id = ? LIMIT 1', [profileId]);
    return rows[0];
  }

  const profile = memoryStore.profiles.find((entry) => entry.id === profileId);
  profile.progressLogsJson = JSON.stringify(progressLogs);
  return profile;
}

function getStorageMode() {
  return storageMode;
}

module.exports = {
  initializeStore,
  getStorageMode,
  store: {
    findUserByEmail,
    findUserById,
    createUser,
    saveProfile,
    findLatestProfileByUserId,
    updateProgressLogs,
  },
};
