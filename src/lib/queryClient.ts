import { QueryClient, QueryFunction } from "@tanstack/react-query";



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function withBase(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  return `${API_BASE_URL || ""}${path}`;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<any> {
  const headers: Record<string, string> = {};

  if (data) headers["Content-Type"] = "application/json";

  const res = await fetch(withBase(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  // Gracefully handle empty responses
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = Array.isArray(queryKey)
      ? String(queryKey[0])
      : String(queryKey);

    const res = await fetch(withBase(path), {
      headers: {},
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    // Gracefully handle empty responses
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
