import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, InsertUser } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function fetchUser(): Promise<User | null> {
  const response = await fetch('/api/user', {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser,
  retries: number = 3
): Promise<RequestResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method,
      headers: body ? { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status >= 500 && retries > 0) {
        // Retry with exponential backoff
        const delay = Math.min(1000 * (2 ** (3 - retries)), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return handleRequest(url, method, body, retries - 1);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        return { ok: false, message: errorData.message || "Authentication failed" };
      }

      const message = await response.text();
      return { ok: false, message: message || "Authentication failed" };
    }

    return { ok: true };
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return { ok: false, message: "Request timed out. Please try again." };
    }
    if (e.message.includes('NetworkError') && retries > 0) {
      // Retry network errors
      const delay = Math.min(1000 * (2 ** (3 - retries)), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return handleRequest(url, method, body, retries - 1);
    }
    return { ok: false, message: `Authentication error: ${e.message}` };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/login', 'POST', userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.message,
        });
      }
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast({
          variant: "destructive",
          title: "Logout failed",
          description: result.message,
        });
      }
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/register', 'POST', userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: result.message,
        });
      }
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}