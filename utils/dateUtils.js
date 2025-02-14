export const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || typeof dateTimeString !== 'string') {
        return "Invalid Date";
    }

    // Replace space with T to create a valid ISO 8601 format
    const formattedString = dateTimeString.replace(" ", "T");

    const date = new Date(formattedString);
    
    // Check if the date is valid
    if (isNaN(date)) {
        return "Invalid Date";
    }

    const day = String(date.getDate()).padStart(2, '0');  // Ensure two digits for day
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-indexed, so add 1
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');  // Ensure two digits for hours
    const minutes = String(date.getMinutes()).padStart(2, '0');  // Ensure two digits for minutes

    return `${day}.${month}.${year}. - ${hours}:${minutes}`;
};
