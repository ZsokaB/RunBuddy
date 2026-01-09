import { Alert } from "react-native";

export const handleError = (error, context, showResponseMessage = false) => {
  let errorMessage = "An unexpected error occurred.";
  let errorTitle = "Error";

  if (error.response) {
    const { status, data } = error.response;
    if (status === 502) {
      errorTitle = "Server Error";
      errorMessage =
        "The server is temporarily unavailable. Please try again later.";
    } else if (status === 404) {
      errorTitle = "Not Found";
      errorMessage = "The requested resource could not be found.";
    } else if (status === 401) {
      errorTitle = "Unauthorized";
      errorMessage = "You are not authorized to view this resource.";
    } else if (status === 400) {
      errorTitle = "Bad request";
      errorMessage = "The request was not in a correct format";
    } else {
      errorMessage = data || "Please try again later.";
    }

    if (showResponseMessage && data != null && data != undefined) {
      errorMessage = data;
    }
  } else if (error.request) {
    errorTitle = "Network Error";
    errorMessage = "No response received from the server.";
  } else {
    errorTitle = "Unexpected Error";
    errorMessage = "An unexpected error occurred.";
  }

  const fullMessage = `${context} failed: ${errorMessage}`;
  Alert.alert(errorTitle, fullMessage);
};
