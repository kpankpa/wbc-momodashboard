import { RateLimiterMemory } from "rate-limiter-flexible";

const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15,
  blockDuration: 60 * 15,
});

const webhookLimiter = new RateLimiterMemory({
  points: 120,
  duration: 60,
});

export async function consumeLoginAttempt(key: string) {
  try {
    await loginLimiter.consume(key);
    return { allowed: true as const };
  } catch {
    return {
      allowed: false as const,
      message: "Too many login attempts. Try again in 15 minutes.",
    };
  }
}

export async function resetLoginAttempts(key: string) {
  await loginLimiter.delete(key);
}

export async function consumeWebhookAttempt(key: string) {
  try {
    await webhookLimiter.consume(key);
    return { allowed: true as const };
  } catch {
    return { allowed: false as const };
  }
}
