/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as calls from "../calls.js";
import type * as chat from "../chat.js";
import type * as counsellors from "../counsellors.js";
import type * as http from "../http.js";
import type * as lib_llm from "../lib/llm.js";
import type * as lib_prompts from "../lib/prompts.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_users from "../lib/users.js";
import type * as limits from "../limits.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  calls: typeof calls;
  chat: typeof chat;
  counsellors: typeof counsellors;
  http: typeof http;
  "lib/llm": typeof lib_llm;
  "lib/prompts": typeof lib_prompts;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/users": typeof lib_users;
  limits: typeof limits;
  user: typeof user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
