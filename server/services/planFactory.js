const {
  calculateAssessment,
  roundToNearest,
  caloriesToMacroCalories,
} = require('./fitnessEngine');

const BUDGET_FOOD_VARIANTS = {
  'Low Budget': {
    carbs: ['poha', 'roti', 'rice', 'oats', 'banana'],
    proteinVeg: ['paneer', 'curd', 'moong dal', 'soy chunks', 'milk'],
    proteinNonVeg: ['eggs', 'chicken breast', 'curd', 'fish curry', 'milk'],
    fats: ['peanuts', 'ghee', 'almonds'],
  },
  'Medium Budget': {
    carbs: ['idli', 'multigrain bread', 'basmati rice', 'sweet potato', 'fruit bowl'],
    proteinVeg: ['paneer bhurji', 'hung curd', 'tofu', 'dal makhani', 'whey'],
    proteinNonVeg: ['egg bhurji', 'chicken tikka', 'greek yogurt', 'fish', 'whey'],
    fats: ['mixed nuts', 'peanut butter', 'olive oil'],
  },
  'Premium Budget': {
    carbs: ['sourdough toast', 'quinoa', 'brown rice', 'granola', 'berries'],
    proteinVeg: ['tofu scramble', 'greek yogurt', 'tempeh', 'low-fat paneer', 'whey isolate'],
    proteinNonVeg: ['egg white omelette', 'chicken breast', 'salmon', 'greek yogurt', 'whey isolate'],
    fats: ['avocado', 'almond butter', 'chia seeds'],
  },
};

const WORKOUT_SPLITS = {
  Beginner: {
    monday: {
      title: 'Chest + Triceps',
      exercises: [
        ['Machine Chest Press', '3', '10-12', '75 sec'],
        ['Incline Dumbbell Press', '3', '10-12', '75 sec'],
        ['Cable Fly', '2', '12-15', '60 sec'],
        ['Rope Pushdown', '3', '12-15', '60 sec'],
        ['Bench Dips', '2', '10-12', '60 sec'],
      ],
    },
    tuesday: {
      title: 'Back + Biceps',
      exercises: [
        ['Lat Pulldown', '3', '10-12', '75 sec'],
        ['Seated Cable Row', '3', '10-12', '75 sec'],
        ['Chest Supported Row', '2', '12', '60 sec'],
        ['EZ Bar Curl', '3', '10-12', '60 sec'],
        ['Hammer Curl', '2', '12', '60 sec'],
      ],
    },
    wednesday: {
      title: 'Legs',
      exercises: [
        ['Goblet Squat', '3', '10-12', '75 sec'],
        ['Leg Press', '3', '10-12', '75 sec'],
        ['Romanian Deadlift', '3', '10-12', '75 sec'],
        ['Walking Lunges', '2', '12/leg', '60 sec'],
        ['Standing Calf Raise', '3', '15', '45 sec'],
      ],
    },
    thursday: {
      title: 'Shoulders + Core',
      exercises: [
        ['Seated Dumbbell Press', '3', '10-12', '75 sec'],
        ['Lateral Raise', '3', '12-15', '45 sec'],
        ['Rear Delt Fly', '2', '12-15', '45 sec'],
        ['Plank', '3', '40 sec', '30 sec'],
        ['Dead Bug', '2', '12/side', '30 sec'],
      ],
    },
    friday: {
      title: 'Chest + Back',
      exercises: [
        ['Incline Machine Press', '3', '10-12', '75 sec'],
        ['Single Arm Row', '3', '10/side', '60 sec'],
        ['Push-Up', '2', 'AMRAP', '45 sec'],
        ['Straight Arm Pulldown', '2', '12-15', '45 sec'],
        ['Face Pull', '2', '15', '45 sec'],
      ],
    },
    saturday: {
      title: 'Arms + Abs',
      exercises: [
        ['Cable Curl', '3', '12', '45 sec'],
        ['Overhead Triceps Extension', '3', '12', '45 sec'],
        ['Reverse Curl', '2', '12', '45 sec'],
        ['Hanging Knee Raise', '3', '12', '45 sec'],
        ['Russian Twist', '2', '20', '30 sec'],
      ],
    },
    sunday: {
      title: 'Rest + Cardio',
      exercises: [
        ['Incline Walk', '1', '25 min', 'Steady'],
        ['Mobility Flow', '1', '15 min', 'Controlled'],
      ],
    },
  },
  Intermediate: {
    monday: {
      title: 'Chest + Triceps',
      exercises: [
        ['Barbell Bench Press', '4', '6-8', '90 sec'],
        ['Incline Dumbbell Press', '4', '8-10', '75 sec'],
        ['Weighted Dips', '3', '8-10', '75 sec'],
        ['Cable Fly', '3', '12-15', '45 sec'],
        ['Skull Crusher', '3', '10-12', '60 sec'],
      ],
    },
    tuesday: {
      title: 'Back + Biceps',
      exercises: [
        ['Weighted Pull-Up', '4', '6-8', '90 sec'],
        ['Barbell Row', '4', '8-10', '90 sec'],
        ['Single Arm Dumbbell Row', '3', '10/side', '60 sec'],
        ['Preacher Curl', '3', '10-12', '60 sec'],
        ['Incline Curl', '2', '12', '45 sec'],
      ],
    },
    wednesday: {
      title: 'Legs',
      exercises: [
        ['Back Squat', '4', '6-8', '90 sec'],
        ['Romanian Deadlift', '4', '8-10', '90 sec'],
        ['Bulgarian Split Squat', '3', '10/leg', '60 sec'],
        ['Leg Extension', '2', '15', '45 sec'],
        ['Seated Calf Raise', '4', '15', '45 sec'],
      ],
    },
    thursday: {
      title: 'Shoulders',
      exercises: [
        ['Standing Overhead Press', '4', '6-8', '90 sec'],
        ['Machine Shoulder Press', '3', '10-12', '75 sec'],
        ['Lateral Raise', '4', '12-15', '45 sec'],
        ['Rear Delt Cable Fly', '3', '12-15', '45 sec'],
        ['Farmer Carry', '3', '30 m', '45 sec'],
      ],
    },
    friday: {
      title: 'Chest + Back',
      exercises: [
        ['Incline Barbell Press', '4', '8-10', '90 sec'],
        ['Chest Supported T-Bar Row', '4', '8-10', '75 sec'],
        ['Pec Deck', '3', '12-15', '45 sec'],
        ['Wide Grip Pulldown', '3', '10-12', '60 sec'],
        ['Face Pull', '3', '15', '45 sec'],
      ],
    },
    saturday: {
      title: 'Arms + Abs',
      exercises: [
        ['Close Grip Bench Press', '3', '8-10', '75 sec'],
        ['Barbell Curl', '3', '8-10', '60 sec'],
        ['Cable Pushdown', '3', '12', '45 sec'],
        ['Cable Curl Drop Set', '2', '12 + drop', '45 sec'],
        ['Cable Crunch', '3', '15', '30 sec'],
        ['Hanging Leg Raise', '3', '12', '30 sec'],
      ],
    },
    sunday: {
      title: 'Rest + Cardio',
      exercises: [
        ['Cycling', '1', '30 min', 'Moderate'],
        ['Stretch Session', '1', '15 min', 'Controlled'],
      ],
    },
  },
  Advanced: {
    monday: {
      title: 'Chest + Triceps',
      exercises: [
        ['Competition Bench Press', '5', '4-6', '120 sec'],
        ['Incline Smith Press', '4', '8-10', '90 sec'],
        ['Weighted Dips', '4', '8-10', '75 sec'],
        ['Deficit Push-Up', '3', 'AMRAP', '60 sec'],
        ['Overhead Rope Extension', '3', '12-15', '45 sec'],
      ],
    },
    tuesday: {
      title: 'Back + Biceps',
      exercises: [
        ['Weighted Pull-Up', '5', '4-6', '120 sec'],
        ['Pendlay Row', '4', '6-8', '90 sec'],
        ['Meadows Row', '3', '10/side', '75 sec'],
        ['Lat Prayer Pulldown', '3', '12-15', '45 sec'],
        ['Spider Curl', '3', '10-12', '45 sec'],
      ],
    },
    wednesday: {
      title: 'Legs',
      exercises: [
        ['Back Squat', '5', '4-6', '120 sec'],
        ['Romanian Deadlift', '4', '6-8', '90 sec'],
        ['Hack Squat', '3', '10-12', '75 sec'],
        ['Walking Lunge', '3', '12/leg', '60 sec'],
        ['Standing Calf Raise', '5', '12-15', '45 sec'],
      ],
    },
    thursday: {
      title: 'Shoulders',
      exercises: [
        ['Push Press', '5', '4-6', '120 sec'],
        ['Seated Dumbbell Press', '4', '8-10', '90 sec'],
        ['Cable Y-Raise', '3', '12-15', '45 sec'],
        ['Rear Delt Row', '3', '12', '45 sec'],
        ['Ab Wheel Rollout', '3', '12', '30 sec'],
      ],
    },
    friday: {
      title: 'Chest + Back',
      exercises: [
        ['Incline Dumbbell Press', '4', '8-10', '90 sec'],
        ['Chest Supported Row', '4', '8-10', '75 sec'],
        ['Machine Fly Mechanical Drop Set', '3', '12 + 8 + 8', '60 sec'],
        ['Neutral Grip Pulldown', '3', '10-12', '60 sec'],
        ['Face Pull', '3', '15', '45 sec'],
      ],
    },
    saturday: {
      title: 'Arms + Abs',
      exercises: [
        ['EZ Bar Curl', '4', '8-10', '60 sec'],
        ['JM Press', '4', '8-10', '75 sec'],
        ['Hammer Curl', '3', '12', '45 sec'],
        ['Rope Pushdown', '3', '12-15', '45 sec'],
        ['Decline Sit-Up', '3', '15', '30 sec'],
        ['Cable Woodchop', '3', '12/side', '30 sec'],
      ],
    },
    sunday: {
      title: 'Rest + Cardio',
      exercises: [
        ['Zone 2 Cardio', '1', '35 min', 'Steady'],
        ['Mobility Reset', '1', '20 min', 'Controlled'],
      ],
    },
  },
};

function createMeal(name, foods, calories, protein, carbs, fat) {
  return { name, foods, calories, protein, carbs, fat };
}

function createDietPlan(assessment, metrics) {
  const budgetTemplate = BUDGET_FOOD_VARIANTS[assessment.monthlyBudget];
  const proteinSources =
    assessment.dietPreference === 'Vegetarian'
      ? budgetTemplate.proteinVeg
      : budgetTemplate.proteinNonVeg;

  const totalCalories = metrics.recommendedCalories;
  const distribution = [
    ['Breakfast', 0.22],
    ['Mid Morning', 0.1],
    ['Lunch', 0.24],
    ['Pre Workout', 0.12],
    ['Post Workout', 0.12],
    ['Dinner', 0.2],
  ];

  const meals = distribution.map(([mealName, ratio], index) => {
    const mealCalories = roundToNearest(totalCalories * ratio, 5);
    const { proteinCalories, carbCalories, fatCalories } = caloriesToMacroCalories(
      metrics.proteinGrams * ratio,
      metrics.carbGrams * ratio,
      metrics.fatGrams * ratio
    );

    const mealFoods = [
      `${budgetTemplate.carbs[index % budgetTemplate.carbs.length]}`,
      `${proteinSources[index % proteinSources.length]}`,
      `${budgetTemplate.fats[index % budgetTemplate.fats.length]}`,
    ];

    return createMeal(
      mealName,
      mealFoods,
      mealCalories,
      Math.round(proteinCalories / 4),
      Math.round(carbCalories / 4),
      Math.round(fatCalories / 9)
    );
  });

  return {
    planName: `${assessment.dietPreference} ${assessment.goal} Plan`,
    summary: `Built for ${assessment.goal.toLowerCase()} with ${assessment.monthlyBudget.toLowerCase()} Indian food choices.`,
    meals,
    totals: {
      calories: totalCalories,
      protein: metrics.proteinGrams,
      carbs: metrics.carbGrams,
      fat: metrics.fatGrams,
    },
  };
}

function createWorkoutPlan(assessment) {
  const split = WORKOUT_SPLITS[assessment.experience];

  return {
    planName: `${assessment.experience} ${assessment.goal} Gym Split`,
    summary: `Seven-day split calibrated for a ${assessment.experience.toLowerCase()} lifter targeting ${assessment.goal.toLowerCase()}.`,
    days: Object.entries(split).map(([day, details]) => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      focus: details.title,
      exercises: details.exercises.map(([name, sets, reps, rest]) => ({
        name,
        sets,
        reps,
        rest,
      })),
    })),
  };
}

function createProgressProjection(assessment, metrics) {
  const changePerWeek =
    assessment.goal === 'Fat Loss' ? -0.4 : assessment.goal === 'Body Recomposition' ? -0.15 : 0.2;

  return Array.from({ length: 6 }, (_, index) => ({
    week: `Week ${index + 1}`,
    weightKg: Number((metrics.weightKg + changePerWeek * index).toFixed(1)),
    waistCm: Number((metrics.waistEstimateCm - 0.5 * index).toFixed(1)),
    energy: index < 2 ? 'Adapting' : 'Strong',
    adherence: index === 0 ? 'Kickoff' : 'On Track',
  }));
}

function createFitnessScore(assessment, metrics) {
  const bmiScore = metrics.bmi >= 18.5 && metrics.bmi <= 24.9 ? 36 : metrics.bmi < 30 ? 28 : 20;
  const activityScore =
    {
      Sedentary: 12,
      'Lightly Active': 18,
      Active: 24,
      Athlete: 28,
    }[assessment.activityLevel] || 12;
  const goalScore =
    {
      'Fat Loss': 18,
      'Lean Muscle Gain': 20,
      'Muscle Building': 22,
      'Body Recomposition': 24,
    }[assessment.goal] || 18;
  const experienceScore =
    {
      Beginner: 12,
      Intermediate: 16,
      Advanced: 20,
    }[assessment.experience] || 12;

  return Math.min(100, bmiScore + activityScore + goalScore + experienceScore);
}

module.exports = {
  calculateAssessment,
  createDietPlan,
  createWorkoutPlan,
  createProgressProjection,
  createFitnessScore,
};
