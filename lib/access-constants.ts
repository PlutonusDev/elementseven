export const SMOKING_STATUS_LABELS: Record<string, string> = {
  DAILY: "Yes, daily",
  OCCASIONALLY: "Yes, occasionally",
  FORMER: "I used to, but quit",
  NEVER: "No, never",
};

export const QUIT_AIDS = [
  "Nicotine patches",
  "Nicotine gum",
  "Lozenges",
  "Prescription medication",
  "Cold turkey",
  "Hypnotherapy or counselling",
  "None of these",
] as const;
