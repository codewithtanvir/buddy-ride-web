import { format, formatDistanceToNow } from "date-fns";

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "No date set";

  try {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy 'at' hh:mm a");
  } catch (error) {
    return "Invalid date";
  }
};

export const formatTime = (dateString: string | null): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return format(date, "hh:mm a");
  } catch (error) {
    return "";
  }
};

export const getTimeAgo = (dateString: string | null): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return "";
  }
};
