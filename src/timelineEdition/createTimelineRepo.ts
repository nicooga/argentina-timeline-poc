import { HttpTimelineRepo } from "./HttpTimelineRepo";
import { LocalStorageTimelineRepo } from "./LocalStorageTimelineRepo";
import type { TimelineRepo } from "./TimelineRepo";

const DEFAULT_API_BASE_URL = "https://ukpswhaxmg.us-east-1.awsapprunner.com";

export function createTimelineRepo(): TimelineRepo {
  const apiBaseUrl = import.meta.env.VITE_TIMELINES_API_BASE_URL as
    | string
    | undefined;
  if (apiBaseUrl === "local") return new LocalStorageTimelineRepo();
  return new HttpTimelineRepo(apiBaseUrl ?? DEFAULT_API_BASE_URL);
}
