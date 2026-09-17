export type SubscriptionPlan = "free" | "plus";

export const FREE_SUBSCRIPTION_FEATURES = [
  "2 active projects",
  "Core teamwork tools",
  "1 AI Project Plan generation per project",
  "1 AI Task Allocation per project",
  "1 AI workload suggestion per project",
  "Manual plan and task editing",
  "Framework library",
  "1 custom framework",
  "Progress and evidence tracking",
  "Basic contribution insights",
  "Basic gamification",
] as const;

export const PLUS_SUBSCRIPTION_FEATURES = [
  "Unlimited active projects",
  "30 AI Actions per month",
  "Regenerate project plans and task allocations",
  "AI workload balancing",
  "AI task reassignment suggestions",
  "AI task breakdown",
  "AI deadline adjustment suggestions",
  "Unlimited custom frameworks",
  "Detailed contribution insights",
  "Full gamification",
  "Contribution report export",
  "Full project history",
] as const;

export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    heading: "Two active projects.",
    price: "0₫",
    cadence: "",
    description: "Plan tasks, assign owners and review evidence.",
    features: FREE_SUBSCRIPTION_FEATURES,
  },
  plus: {
    name: "MayLamDi+",
    heading: "30 AI actions a month.",
    price: "39K₫",
    cadence: "/ month",
    semesterPrice: "or 99K₫ / semester",
    description: "Regenerate plans, rebalance workloads and export contribution reports.",
    features: PLUS_SUBSCRIPTION_FEATURES,
  },
} as const;

export const SUBSCRIPTION_COMPARISON_ROWS = [
  {
    label: "Core teamwork",
    detail: "Project rooms, tracking, frameworks, evidence, and basic gamification",
    free: "Included",
    plus: "Included",
  },
  {
    label: "AI project setup",
    detail: "Draft project plan, task allocation, and workload suggestion",
    free: "1× per project",
    plus: "Included",
  },
  {
    label: "Extended AI support",
    detail: "Regenerate, balance, reassign, break down, and adjust deadlines",
    free: "—",
    plus: "30 actions / month",
  },
  {
    label: "Project access",
    detail: "Number of active projects",
    free: "Up to 2",
    plus: "Unlimited",
  },
  {
    label: "Insights & history",
    detail: "Contribution insights, report export, and project history",
    free: "Basic",
    plus: "Detailed + full history",
  },
  {
    label: "Price",
    detail: "Monthly cost",
    free: SUBSCRIPTION_PLANS.free.price,
    plus: `${SUBSCRIPTION_PLANS.plus.price} / month`,
  },
] as const;

export function normalizeSubscriptionPlan(
  tier: "free" | "plus" | "pro" | undefined,
): SubscriptionPlan {
  return tier === "plus" || tier === "pro" ? "plus" : "free";
}

export function getSubscriptionPlanLabel(plan: SubscriptionPlan) {
  return plan === "plus" ? "MayLamDi+" : "Free";
}

export function getSubscriptionNavLabel(plan: SubscriptionPlan) {
  return plan === "plus" ? "PLUS" : "FREE";
}
