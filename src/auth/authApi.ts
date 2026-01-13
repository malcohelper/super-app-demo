import Toast from "react-native-toast-message";

/**
 * Auth API Service
 * Handles authentication operations with backend
 */

const API_BASE_URL = "https://super-app-case.web.app/api";

export interface LoginResponse {
  uid: string;
  email: string;
  displayName: string;
  token: string;
  role: string;
  permissions: string[];
}

export interface SignupResponse {
  uid: string;
  email: string;
  displayName: string;
  token: string;
  role: string;
  permissions: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | { code: string; message: string; details?: any };
}

/**
 * Show error toast notification
 */
export const showErrorToast = (message: string) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: message,
    position: "top",
    visibilityTime: 4000,
  });
};

/**
 * Login with email and password
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    console.log("[AuthAPI] Attempting login for:", email);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("[AuthAPI] Response status:", response.status);
    const result: ApiResponse<LoginResponse> = await response.json();
    console.log("[AuthAPI] Response data:", JSON.stringify(result));

    if (!result.success || !result.data) {
      // Handle error object format from API
      let errorMessage = "Login failed";
      if (result.error) {
        if (typeof result.error === "string") {
          errorMessage = result.error;
        } else if (result.error.message) {
          errorMessage = result.error.message;
        }
      }
      showErrorToast(errorMessage);
      // Mark error as already handled to avoid duplicate toast
      const error = new Error(errorMessage);
      (error as any).handled = true;
      throw error;
    }

    return result.data;
  } catch (error) {
    console.error("[AuthAPI] Login error:", error);
    if (error instanceof Error) {
      console.error("[AuthAPI] Error message:", error.message);
      console.error("[AuthAPI] Error stack:", error.stack);
      // Only show network error toast if not already handled
      if (!(error as any).handled) {
        const errorMsg = error.message || "";
        // Network errors or JSON parse errors
        if (
          errorMsg.includes("JSON") ||
          errorMsg.includes("Network") ||
          errorMsg.includes("Failed to fetch")
        ) {
          showErrorToast("Network error. Please check your connection.");
        } else {
          showErrorToast(errorMsg || "An unexpected error occurred");
        }
      }
      throw error;
    }
    console.error("[AuthAPI] Unknown error type:", typeof error);
    showErrorToast("An unexpected error occurred");
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Signup with email, password and optional display name
 */
export const signup = async (
  email: string,
  password: string,
  displayName?: string
): Promise<SignupResponse> => {
  try {
    console.log("[AuthAPI] Attempting signup for:", email);
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        ...(displayName && { displayName }),
      }),
    });

    console.log("[AuthAPI] Response status:", response.status);
    const result: ApiResponse<SignupResponse> = await response.json();
    console.log("[AuthAPI] Response data:", JSON.stringify(result));

    if (!result.success || !result.data) {
      // Handle error object format from API
      let errorMessage = "Signup failed";
      if (result.error) {
        if (typeof result.error === "string") {
          errorMessage = result.error;
        } else if (result.error.message) {
          errorMessage = result.error.message;
        }
      }
      showErrorToast(errorMessage);
      // Mark error as already handled to avoid duplicate toast
      const error = new Error(errorMessage);
      (error as any).handled = true;
      throw error;
    }

    return result.data;
  } catch (error) {
    console.error("[AuthAPI] Signup error:", error);
    if (error instanceof Error) {
      console.error("[AuthAPI] Error message:", error.message);
      // Only show network error toast if not already handled
      if (!(error as any).handled) {
        const errorMsg = error.message || "";
        // Network errors or JSON parse errors
        if (
          errorMsg.includes("JSON") ||
          errorMsg.includes("Network") ||
          errorMsg.includes("Failed to fetch")
        ) {
          showErrorToast("Network error. Please check your connection.");
        } else {
          showErrorToast(errorMsg || "An unexpected error occurred");
        }
      }
      throw error;
    }
    console.error("[AuthAPI] Unknown error type:", typeof error);
    showErrorToast("An unexpected error occurred");
    throw new Error("An unexpected error occurred");
  }
};
