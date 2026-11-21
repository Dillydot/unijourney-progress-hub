// Must match the check constraint in the feedback migration.
export const feedbackCategories = ["bug", "idea", "data", "design", "other"] as const;
export type FeedbackCategory = (typeof feedbackCategories)[number];
