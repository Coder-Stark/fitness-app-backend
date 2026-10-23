// The keys below match fitnessProfile.constants.js (goals, levels, workout types, equipment)

export const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };
export const EQUIPMENT_RANK = { none: 0, basic: 1, full_gym: 2 };
export const INTENSITY_STEPS = ["low", "moderate", "high"];

// The order exercises are shown in: warm-up style work first, stretching last
export const TYPE_ORDER = [
  "cardio",
  "hiit",
  "functional",
  "strength",
  "pilates",
  "yoga",
  "stretching",
];

export const GOAL_LABELS = {
  weight_loss: "Weight loss",
  muscle_gain: "Muscle gain",
  endurance: "Endurance",
  flexibility: "Flexibility",
  general_fitness: "General fitness",
  stress_relief: "Stress relief",
};

export const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const INTENSITY_LABELS = { low: "Low", moderate: "Moderate", high: "High" };

export const TYPE_LABELS = {
  strength: "Strength",
  cardio: "Cardio",
  yoga: "Yoga",
  hiit: "HIIT",
  pilates: "Pilates",
  functional: "Functional",
  stretching: "Stretching",
};

export const EQUIPMENT_REASONS = {
  none: "No equipment, so every exercise is bodyweight only.",
  basic: "Basic equipment (dumbbells, bands): machines and barbells were left out.",
  full_gym: "Full gym access, so every exercise is available.",
};

export const GOAL_FOCUS = {
  weight_loss: "Burn calories and build a sustainable routine",
  muscle_gain: "Build strength and muscle",
  endurance: "Build stamina and heart fitness",
  flexibility: "Improve mobility and flexibility",
  general_fitness: "Balanced all-round fitness",
  stress_relief: "Release stress and move gently",
};

export const BASE_SETS = { beginner: 2, intermediate: 3, advanced: 4 };
export const WEEKLY_SESSIONS = { beginner: 2, intermediate: 3, advanced: 4 };

export const REPS_BY_GOAL = {
  weight_loss: "12-15",
  muscle_gain: "8-12",
  endurance: "15-20",
  flexibility: "10-12",
  general_fitness: "10-15",
  stress_relief: "10-12",
};

// Minutes for timed exercises, by workout type and intensity
export const TIMED_MINUTES = {
  cardio: { low: 10, moderate: 15, high: 20 },
  hiit: { low: 3, moderate: 4, high: 5 },
  yoga: { low: 8, moderate: 10, high: 12 },
  stretching: { low: 4, moderate: 5, high: 6 },
  default: { low: 2, moderate: 3, high: 4 },
};

// Words in the customer's health notes that point to a body area
export const HEALTH_AREAS = {
  knee: /\b(knee|knees|acl|meniscus)\b/,
  back: /\b(back|spine|spinal|sciatica|slipped disc|herniated disc)\b/,
  shoulder: /\b(shoulder|shoulders|rotator)\b/,
  wrist: /\b(wrist|wrists|carpal)\b/,
};

// stresses = body areas the exercise loads. impact = "high" means jumping or pounding.
// equipment and minLevel are the minimum needed to do it.
const exercise = (
  name,
  type,
  equipment,
  minLevel,
  goals,
  stresses = [],
  { impact = "low", kind = "reps" } = {}
) => ({ name, type, equipment, minLevel, goals, stresses, impact, kind });

export const EXERCISES = [
  exercise("Bodyweight squats", "strength", "none", "beginner", ["weight_loss", "muscle_gain", "general_fitness", "endurance"], ["knee"]),
  exercise("Push-ups", "strength", "none", "beginner", ["muscle_gain", "general_fitness", "weight_loss"], ["shoulder", "wrist"]),
  exercise("Glute bridges", "strength", "none", "beginner", ["muscle_gain", "general_fitness", "weight_loss"]),
  exercise("Reverse lunges", "strength", "none", "beginner", ["muscle_gain", "weight_loss", "general_fitness"], ["knee"]),
  exercise("Dumbbell goblet squat", "strength", "basic", "beginner", ["muscle_gain", "weight_loss", "general_fitness"], ["knee"]),
  exercise("Dumbbell rows", "strength", "basic", "beginner", ["muscle_gain", "general_fitness"], ["back"]),
  exercise("Dumbbell shoulder press", "strength", "basic", "intermediate", ["muscle_gain"], ["shoulder"]),
  exercise("Romanian deadlift", "strength", "basic", "intermediate", ["muscle_gain", "general_fitness"], ["back"]),
  exercise("Lat pulldown", "strength", "full_gym", "beginner", ["muscle_gain", "general_fitness"], ["shoulder"]),
  exercise("Bench press", "strength", "full_gym", "intermediate", ["muscle_gain"], ["shoulder"]),
  exercise("Barbell back squat", "strength", "full_gym", "intermediate", ["muscle_gain"], ["knee", "back"]),

  exercise("Brisk walk", "cardio", "none", "beginner", ["weight_loss", "endurance", "general_fitness", "stress_relief"], [], { kind: "timed" }),
  exercise("Stationary bike", "cardio", "full_gym", "beginner", ["endurance", "weight_loss", "general_fitness"], [], { kind: "timed" }),
  exercise("Rowing machine", "cardio", "full_gym", "beginner", ["endurance", "weight_loss", "general_fitness"], ["back"], { kind: "timed" }),
  exercise("Skipping rope", "cardio", "basic", "intermediate", ["weight_loss", "endurance"], ["knee"], { impact: "high", kind: "timed" }),

  exercise("Jumping jacks", "hiit", "none", "beginner", ["weight_loss", "endurance"], [], { impact: "high", kind: "timed" }),
  exercise("Mountain climbers", "hiit", "none", "beginner", ["weight_loss", "endurance", "general_fitness"], ["wrist", "shoulder"], { kind: "timed" }),
  exercise("Burpees", "hiit", "none", "intermediate", ["weight_loss", "endurance"], ["knee", "back", "wrist", "shoulder"], { impact: "high" }),
  exercise("Kettlebell swings", "hiit", "basic", "intermediate", ["weight_loss", "muscle_gain", "endurance"], ["back"], { impact: "high" }),

  exercise("Sun salutation flow", "yoga", "none", "beginner", ["flexibility", "stress_relief", "general_fitness"], ["wrist", "shoulder"], { kind: "timed" }),
  exercise("Cat-cow and child's pose", "yoga", "none", "beginner", ["flexibility", "stress_relief"], [], { kind: "timed" }),
  exercise("Warrior sequence", "yoga", "none", "beginner", ["flexibility", "general_fitness", "stress_relief"], ["knee"], { kind: "timed" }),

  exercise("Dead bug", "pilates", "none", "beginner", ["general_fitness", "muscle_gain"]),
  exercise("Bird dog", "pilates", "none", "beginner", ["general_fitness", "flexibility", "stress_relief"]),

  exercise("Plank", "functional", "none", "beginner", ["general_fitness", "muscle_gain", "weight_loss"], ["shoulder", "wrist"], { kind: "timed" }),
  exercise("Step-ups", "functional", "none", "beginner", ["weight_loss", "muscle_gain", "general_fitness", "endurance"], ["knee"]),
  exercise("Farmer's carry", "functional", "basic", "beginner", ["muscle_gain", "general_fitness", "endurance"], [], { kind: "timed" }),

  exercise("Hamstring stretch", "stretching", "none", "beginner", ["flexibility", "general_fitness", "stress_relief"], [], { kind: "timed" }),
  exercise("Hip flexor stretch", "stretching", "none", "beginner", ["flexibility", "general_fitness", "stress_relief"], ["knee"], { kind: "timed" }),
  exercise("Seated spinal twist", "stretching", "none", "beginner", ["flexibility", "stress_relief"], [], { kind: "timed" }),
];