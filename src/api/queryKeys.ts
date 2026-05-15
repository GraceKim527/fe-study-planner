export const queryKeys = {
  courses: ["courses"] as const,
  planner: (weekStart: string) => ["planner", weekStart] as const,
};
