import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

// Per-user limits for anything that spends money on a third-party API.
// Token buckets allow a short burst (capacity) and then refill at `rate`.
export const rateLimiter = new RateLimiter(components.rateLimiter, {
    chatMessage: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 6 },
    voiceTurn: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },
    callStart: { kind: "token bucket", rate: 20, period: HOUR, capacity: 5 },
    tts: { kind: "token bucket", rate: 40, period: MINUTE, capacity: 12 },
    stt: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 6 },
});
