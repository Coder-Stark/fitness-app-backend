export const recommendationConfig = Object.freeze({
  recentRecordsLimit: 5, // newest session records read for the plan
  varietyLookbackSessions: 2, // exercises from this many recent sessions rank lower
  varietyPenalty: 2,
  maxPerType: 2, // at most this many exercises of one workout type in a plan
  exercisesByIntensity: Object.freeze({ low: 4, moderate: 5, high: 6 }),
  highImpactAgeLimit: 50, // from this age, high-impact exercises are left out
  weeklyCapAge: 55, // from this age, sessions per week are capped at 3
  progression: Object.freeze({
    minCompletedSessions: 3,
    minRatings: 2,
    ratingWindow: 3, // the newest ratings that are averaged
    minAverageRating: 4,
    maxSets: 4,
  }),
  ease: Object.freeze({ maxLastRating: 2 }),
});