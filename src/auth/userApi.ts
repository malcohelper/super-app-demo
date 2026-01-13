import { showErrorToast } from "./authApi";

/**
 * User Profile API Service
 * Handles user profile operations with backend
 */

const API_BASE_URL = "https://super-app-case.web.app/api";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: string[];
}

export interface UpdateProfileData {
  displayName?: string;
  photoURL?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Get current user's profile
 */
export const getProfile = async (token: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result: ApiResponse<UserProfile> = await response.json();

    if (!result.success || !result.data) {
      const errorMessage = result.error || "Failed to fetch profile";
      showErrorToast(errorMessage);
      throw new Error(errorMessage);
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      const errorMsg = error.message || "";
      if (!errorMsg.includes("Failed to fetch profile")) {
        showErrorToast("Network error. Please check your connection.");
      }
      throw error;
    }
    showErrorToast("An unexpected error occurred");
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Update user's profile
 */
export const updateProfile = async (
  token: string,
  data: UpdateProfileData
): Promise<UserProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<UserProfile> = await response.json();

    if (!result.success || !result.data) {
      const errorMessage = result.error || "Failed to update profile";
      showErrorToast(errorMessage);
      throw new Error(errorMessage);
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      const errorMsg = error.message || "";
      if (!errorMsg.includes("Failed to update profile")) {
        showErrorToast("Network error. Please check your connection.");
      }
      throw error;
    }
    showErrorToast("An unexpected error occurred");
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Delete user's account
 */
export const deleteAccount = async (token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result: ApiResponse<null> = await response.json();

    if (!result.success) {
      const errorMessage = result.error || "Failed to delete account";
      showErrorToast(errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    if (error instanceof Error) {
      const errorMsg = error.message || "";
      if (!errorMsg.includes("Failed to delete account")) {
        showErrorToast("Network error. Please check your connection.");
      }
      throw error;
    }
    showErrorToast("An unexpected error occurred");
    throw new Error("An unexpected error occurred");
  }
};
