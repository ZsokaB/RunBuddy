export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString || typeof dateTimeString !== "string") {
    return "Invalid Date";
  }

  const formattedString = dateTimeString.replace(" ", "T");

  const date = new Date(formattedString);

  if (isNaN(date)) {
    return "Invalid Date";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year}. - ${hours}:${minutes}`;
};
