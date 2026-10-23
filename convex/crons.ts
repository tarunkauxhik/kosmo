import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Ends calls left open by a closed tab or dropped connection (see calls.endStale).
crons.interval("end stale calls", { minutes: 5 }, internal.calls.endStale, {});

export default crons;
