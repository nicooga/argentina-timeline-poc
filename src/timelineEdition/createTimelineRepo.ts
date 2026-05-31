import { HttpTimelineRepo } from "./HttpTimelineRepo";
import { InCodeTimelineRepo } from "./InCodeTimelineRepo";
import { LocalStorageTimelineRepo } from "./LocalStorageTimelineRepo";
import type { TimelineRepo } from "./TimelineRepo";

const DEFAULT_API_BASE_URL = "https://ukpswhaxmg.us-east-1.awsapprunner.com";

export function createTimelineRepo(): TimelineRepo {
  const apiBaseUrl = import.meta.env.VITE_TIMELINES_API_BASE_URL as
    | string
    | undefined;
  const base =
    apiBaseUrl === "local"
      ? new LocalStorageTimelineRepo()
      : new HttpTimelineRepo(apiBaseUrl ?? DEFAULT_API_BASE_URL);
  return new InCodeTimelineRepo(base);
}
