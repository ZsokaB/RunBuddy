export const calculatePace = (distance, duration) => {
  if (!distance || !duration) return null;
  return duration / distance;
};


export const formatPace = (paceInSeconds) => {
  if (paceInSeconds === null) return "N/A";

  const hours = Math.floor(paceInSeconds / 3600);
  const minutes = Math.floor((paceInSeconds % 3600) / 60);
  const seconds = Math.round(paceInSeconds % 60);

  const formattedPace = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');

  return formattedPace;
};