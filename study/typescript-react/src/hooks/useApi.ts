// src/hooks/useApi.ts
import { useState, useCallback } from "react";
import { ServiceError, handleServiceError } from "../services/baseService";

export function useApi<T, P = unknown>(apiFunction: (params: P) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);

  const execute = useCallback(
    async (
      params: P
    ): Promise<{ success: boolean; data?: T; error?: ServiceError }> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(params);
        setData(result);
        setLoading(false);
        return { success: true, data: result };
      } catch (err) {
        try {
          // Transform the error using our handler
          handleServiceError(err);
        } catch (transformedError) {
          // The error is now a ServiceError
          const serviceError = transformedError as ServiceError;

          // Only set the error state if it wasn't already handled by the interceptor
          if (!serviceError.isHandled) {
            setError(serviceError);
          }

          setLoading(false);
          return { success: false, error: serviceError };
        }

        // This should never execute due to the try/catch above, but TypeScript requires a return
        setLoading(false);
        return {
          success: false,
          error: new ServiceError("Unknown error occurred"),
        };
      }
    },
    [apiFunction]
  );

  return { data, loading, error, execute };
}

