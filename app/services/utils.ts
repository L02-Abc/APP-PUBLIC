import analytics from '@react-native-firebase/analytics';
import * as Sentry from "@sentry/react-native";

export const logUserAction = (category: string, message: string, data?: object) => {
    Sentry.addBreadcrumb({
        category: category, // e.g., 'cart', 'auth', 'search'
        message: message,   // e.g., 'User filtered by "Lost Items"'
        level: "info",
        data: data,
    });
};

