import { recommendationConfig as config } from "./recommendation.config.js";
import {
  BASE_SETS,
  EQUIPMENT_RANK,
  EQUIPMENT_REASONS,
  EXERCISES,
  GOAL_FOCUS,
  GOAL_LABELS,
  HEALTH_AREAS,
  INTENSITY_LABELS,
  INTENSITY_STEPS,
  LEVEL_LABELS,
  LEVEL_RANK,
  REPS_BY_GOAL,
  TIMED_MINUTES,
  TYPE_LABELS,
  TYPE_ORDER,
  WEEKLY_SESSIONS,
} from "./recommendation.catalog.js";

const byName = (a, b) => a.localeCompare(b, "en");

const normalize = (text) =>
  text.toLowerCase().replace(/[-–]/g, " ").replace(/\s+/g, " ").trim();

// "Push ups" and "push-ups" match, and so do "Brisk walk" and "Brisk walk warm-up"
function sameExercise(a, b) {
  if (a.length < 4 || b.length < 4) return false;
  return a === b || a.includes(b) || b.includes(a);
}

const average = (values) =>
  values.length === 0
    ? null
    : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;

function detectAreas(healthNotes) {
  const text = healthNotes.toLowerCase();
  return Object.entries(HEALTH_AREAS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([area]) => area);
}

const labelList = (labels, values) => values.map((value) => labels[value] ?? value).join(", ");

// A pure function: the same profile and history always give the same plan.
// profile = the saved assessment, recentRecords = newest session records first.
export function buildRecommendation({ profile, completedCount, recentRecords, now = new Date() }) {
  const { preferences } = profile;
  const [primaryGoal, ...otherGoals] = profile.goals;
  const { progression, ease } = config;

  // 1. What the history says
  const ratings = recentRecords
    .filter((record) => record.customerFeedback)
    .map((record) => record.customerFeedback.rating);
  const lastRating = ratings[0] ?? null;
  const recentAverage = average(ratings.slice(0, progression.ratingWindow));

  let trend = "steady";
  if (lastRating !== null && lastRating <= ease.maxLastRating) {
    trend = "ease";
  } else if (
    completedCount >= progression.minCompletedSessions &&
    ratings.length >= progression.minRatings &&
    recentAverage >= progression.minAverageRating
  ) {
    trend = "progress";
  }

  let intensity = preferences.intensity;
  if (trend === "ease") {
    intensity = INTENSITY_STEPS[Math.max(0, INTENSITY_STEPS.indexOf(intensity) - 1)];
  }

  const baseSets = BASE_SETS[profile.level];
  const sets = trend === "progress" ? Math.min(progression.maxSets, baseSets + 1) : baseSets;

  // 2. What the customer can safely do
  const areas = detectAreas(preferences.healthNotes ?? "");
  const avoidHighImpact = profile.age >= config.highImpactAgeLimit;
  const levelRank = LEVEL_RANK[profile.level];
  const equipmentRank = EQUIPMENT_RANK[preferences.equipment];

  const eligible = EXERCISES.filter(
    (item) =>
      EQUIPMENT_RANK[item.equipment] <= equipmentRank &&
      LEVEL_RANK[item.minLevel] <= levelRank &&
      !item.stresses.some((area) => areas.includes(area)) &&
      !(avoidHighImpact && item.impact === "high")
  );

  // 3. Rank by goals, preferences and variety
  const recentNames = recentRecords
    .slice(0, config.varietyLookbackSessions)
    .flatMap((record) => record.trainerNotes?.exercises ?? [])
    .map((item) => normalize(item.name));

  const isRecent = (item) => {
    const name = normalize(item.name);
    return recentNames.some((recent) => sameExercise(name, recent));
  };

  function scoreOf(item) {
    let score = 0;
    if (item.goals.includes(primaryGoal)) score += 3;
    else if (otherGoals.some((goal) => item.goals.includes(goal))) score += 1;

    if (preferences.workoutTypes.includes(item.type)) score += 2;

    if (item.type === "hiit") {
      if (intensity === "low") score -= 3;
      if (intensity === "high") score += 1;
    }
    if (isRecent(item)) score -= config.varietyPenalty;
    return score;
  }

  const ranked = eligible
    .map((item) => ({ exercise: item, score: scoreOf(item) }))
    .sort((a, b) => b.score - a.score || byName(a.exercise.name, b.exercise.name));

  // 4. Pick the best, with at most a few of one workout type
  const target = config.exercisesByIntensity[intensity];
  const countByType = {};
  const picked = [];

  for (const entry of ranked) {
    if (picked.length >= target) break;
    const count = countByType[entry.exercise.type] ?? 0;
    if (count >= config.maxPerType) continue;
    countByType[entry.exercise.type] = count + 1;
    picked.push(entry);
  }

  picked.sort(
    (a, b) =>
      TYPE_ORDER.indexOf(a.exercise.type) - TYPE_ORDER.indexOf(b.exercise.type) ||
      b.score - a.score ||
      byName(a.exercise.name, b.exercise.name)
  );

  // 5. Say how much of each
  const reps = REPS_BY_GOAL[primaryGoal];
  const prescribe = (item) => {
    if (item.kind === "timed") {
      const minutes = (TIMED_MINUTES[item.type] ?? TIMED_MINUTES.default)[intensity];
      return `${minutes} min`;
    }
    return `${sets} sets × ${reps} reps`;
  };

  let sessionsPerWeek = WEEKLY_SESSIONS[profile.level];
  if (intensity === "low") sessionsPerWeek = Math.max(2, sessionsPerWeek - 1);
  if (profile.age >= config.weeklyCapAge) sessionsPerWeek = Math.min(sessionsPerWeek, 3);

  // 6. Explain the choices
  const reasons = [
    `Main goal: ${GOAL_LABELS[primaryGoal]}${
      otherGoals.length > 0 ? ` (also: ${labelList(GOAL_LABELS, otherGoals)})` : ""
    }.`,
    `Level: ${LEVEL_LABELS[profile.level]}, so ${baseSets} sets per exercise.`,
    EQUIPMENT_REASONS[preferences.equipment],
  ];

  const matchedTypes = preferences.workoutTypes.filter((type) =>
    picked.some((entry) => entry.exercise.type === type)
  );
  if (matchedTypes.length > 0) {
    reasons.push(
      `Your preferred workout types (${labelList(TYPE_LABELS, matchedTypes)}) are ranked higher.`
    );
  }

  const eased = intensity !== preferences.intensity;
  reasons.push(
    `Preferred intensity: ${INTENSITY_LABELS[preferences.intensity]}${
      eased ? `, eased to ${INTENSITY_LABELS[intensity]} after your last rating` : ""
    }, so ${target} exercises.`
  );

  reasons.push(
    completedCount === 0
      ? "No completed sessions yet, so this plan is based on your assessment only."
      : `Based on your assessment and ${completedCount} completed ${
          completedCount === 1 ? "session" : "sessions"
        }.`
  );

  if (eligible.some(isRecent)) {
    reasons.push("Exercises you did recently rank lower so your sessions stay varied.");
  }
  if (trend === "ease") {
    reasons.push(
      `Your last session was rated ${lastRating} out of 5, so this plan is a little lighter. Tell your trainer what felt off.`
    );
  }
  if (trend === "progress") {
    reasons.push(
      sets > baseSets
        ? `Your recent ratings are high (average ${recentAverage}), so each exercise has ${sets} sets, one more than usual.`
        : `Your recent ratings are high (average ${recentAverage}). You are already at the maximum of ${sets} sets.`
    );
  }

  const cautions = areas.map((area) => `Exercises that load your ${area} were left out.`);
  if ((preferences.healthNotes ?? "").trim()) {
    cautions.push("Your trainer can see your health notes. Stop and tell them if anything hurts.");
  }
  if (avoidHighImpact) cautions.push("High-impact exercises were left out.");

  const latestNotes = recentRecords.find((record) => record.trainerNotes);

  return {
    source: "rules",
    generatedAt: now.toISOString(),
    focus: GOAL_FOCUS[primaryGoal],
    intensity,
    sessionsPerWeek,
    setsPerExercise: sets,
    exercises: picked.map(({ exercise: item }) => ({
      name: item.name,
      type: item.type,
      prescription: prescribe(item),
    })),
    trainerSuggestion: latestNotes
      ? {
          text: latestNotes.trainerNotes.suggestedNextWorkout,
          fromSession: latestNotes.sessionDate,
        }
      : null,
    reasons,
    cautions,
    basedOn: {
      assessmentUpdatedAt: profile.updatedAt,
      completedSessions: completedCount,
      recordsReviewed: recentRecords.length,
      averageRating: average(ratings),
      lastSessionDate: recentRecords[0]?.sessionDate ?? null,
    },
  };
}