const ACTIVITY_MULTIPLIERS = {
  Sedentary: 1.2,
  'Lightly Active': 1.375,
  Active: 1.55,
  Athlete: 1.725,
};

const GOAL_CALORIE_ADJUSTMENTS = {
  'Fat Loss': -450,
  'Lean Muscle Gain': 180,
  'Muscle Building': 320,
  'Body Recomposition': -120,
};

const GOAL_PROTEIN_MULTIPLIERS = {
  'Fat Loss': 2.2,
  'Lean Muscle Gain': 1.9,
  'Muscle Building': 2.0,
  'Body Recomposition': 2.1,
};

function roundToNearest(value, increment = 1) {
  return Math.round(value / increment) * increment;
}

function caloriesToMacroCalories(proteinGrams, carbGrams, fatGrams) {
  return {
    proteinCalories: proteinGrams * 4,
    carbCalories: carbGrams * 4,
    fatCalories: fatGrams * 9,
  };
}

function calculateAssessment(rawAssessment) {
  const assessment = {
    ...rawAssessment,
    age: Number(rawAssessment.age),
    heightCm: Number(rawAssessment.heightCm),
    weightKg: Number(rawAssessment.weightKg),
  };

  const heightM = assessment.heightCm / 100;
  const bmi = Number((assessment.weightKg / (heightM * heightM)).toFixed(1));
  const bmr =
    assessment.gender === 'Male'
      ? 10 * assessment.weightKg + 6.25 * assessment.heightCm - 5 * assessment.age + 5
      : 10 * assessment.weightKg + 6.25 * assessment.heightCm - 5 * assessment.age - 161;

  const maintenanceCalories = roundToNearest(
    bmr * (ACTIVITY_MULTIPLIERS[assessment.activityLevel] || 1.2),
    5
  );
  const recommendedCalories = roundToNearest(
    maintenanceCalories + (GOAL_CALORIE_ADJUSTMENTS[assessment.goal] || 0),
    5
  );
  const proteinGrams = roundToNearest(
    assessment.weightKg * (GOAL_PROTEIN_MULTIPLIERS[assessment.goal] || 1.8)
  );
  const fatGrams = roundToNearest(assessment.weightKg * 0.8);
  const carbCalories = recommendedCalories - proteinGrams * 4 - fatGrams * 9;
  const carbGrams = roundToNearest(Math.max(120, carbCalories / 4));

  return {
    age: assessment.age,
    heightCm: assessment.heightCm,
    weightKg: assessment.weightKg,
    bmi,
    maintenanceCalories,
    recommendedCalories,
    proteinGrams,
    fatGrams,
    carbGrams,
    waistEstimateCm: Number((assessment.heightCm * 0.45).toFixed(1)),
    hydrationLiters: Number((assessment.weightKg * 0.035).toFixed(1)),
  };
}

module.exports = {
  calculateAssessment,
  roundToNearest,
  caloriesToMacroCalories,
};
