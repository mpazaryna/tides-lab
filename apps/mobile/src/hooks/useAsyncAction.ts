import { useState, useCallback } from "react";
import { loggingService } from "@/services";

export type AsyncActionState<T = void> = {
  isLoading: boolean;
  error: string | null;
  data?: T;
};

export type AsyncActionOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  logContext?: string;
  logData?: Record<string, any>;
};

export function useAsyncAction<T = void>(
  action: (...args: any[]) => Promise<T>,
  options: AsyncActionOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(...args);

        if (options.logContext) {
          loggingService.info(options.logContext, "Action success", {
            ...options.logData,
            args,
          });
        }

        options.onSuccess?.();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Action failed";
        setError(errorMessage);

        if (options.logContext) {
          loggingService.error(options.logContext, "Action failed", {
            error: err,
            ...options.logData,
            args,
          });
        }

        options.onError?.(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [action, options]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    execute,
    isLoading,
    error,
    clearError,
  };
}
