export const calculatePace = (distanceMeters, durationSeconds) => {
  if (!distanceMeters || !durationSeconds) return null;

  const distanceKm = distanceMeters / 1000;

  return durationSeconds / distanceKm;
};

export const formatPace = (paceInSeconds) => {
  if (paceInSeconds === null) return "N/A";

  const hours = Math.floor(paceInSeconds / 3600);
  const minutes = Math.floor((paceInSeconds % 3600) / 60);
  const seconds = Math.round(paceInSeconds % 60);

  const formattedPace = [
    hours > 0 ? String(hours).padStart(2, "0") : null,
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ]
    .filter(Boolean)
    .join(":");

  return formattedPace;
};

export const calculateCaloriesWithMET = (
  distanceMeters,
  weightKg,
  paceSecondsPerKm
) => {
  const distanceKm = distanceMeters / 1000;

  const paceKmPerMin = 1 / (paceSecondsPerKm / 60);

  const paceKmPerHour = paceKmPerMin * 60;

  const metValue =
    paceKmPerHour <= 6
      ? 6.0
      : paceKmPerHour <= 8
      ? 8.0
      : paceKmPerHour <= 10
      ? 10.0
      : 12.8;

  const timeHours = distanceKm / paceKmPerHour;

  const caloriesBurned = metValue * weightKg * timeHours;

  return Math.round(caloriesBurned);
};
