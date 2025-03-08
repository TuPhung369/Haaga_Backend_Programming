// src/hooks/useApi.ts
import { useState, useCallback } from "react";

// Generic hook for API calls with built-in error handling
export function useApi<T, P = unknown>(apiFunction: (params: P) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // The execute function will call the API and handle loading states
  const execute = useCallback(
    async (
      params: P
    ): Promise<{ success: boolean; data?: T; error?: unknown }> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(params);
        setData(result);
        setLoading(false);
        return { success: true, data: result };
      } catch (err: unknown) {
        setError(err);
        setLoading(false);

        // The global interceptor already showed notifications for handled errors
        // We just need to return the error for field-level handling
        return { success: false, error: err };
      }
    },
    [apiFunction]
  );

  return { data, loading, error, execute };
}

// Usage example:
// const MyComponent = () => {
//   const { execute: register, loading } = useApi(registerUser);
//
//   const handleSubmit = async (formData) => {
//     const { success, error } = await register(formData);
//     if (success) {
//       // Handle success
//     } else if (error?.field) {
//       // Handle field-specific errors
//     }
//   };
// };



