export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ANALYTICS: "/analytics",
  TRACK: "/track",
  COMPLAINTS: "/complaints",
  ADMIN: "/admin",
  MY_TASKS: "/my-tasks",
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
