export const PRODUCTION_URL = "https://elementseven.net";

export function appUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000")
  );
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Element Seven <orders@elementseven.net>";
}

export function authSecret(): string {
  return process.env.AUTH_SECRET ?? "e7-insecure-dev-secret";
}
