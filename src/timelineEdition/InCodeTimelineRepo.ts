import type { Timeline } from "../../types";
import { timelineHistoriaArgentina } from "../../timelineHistoriaArgentina";
import type {
  CreateTimelineInput,
  ReplaceTimelineInput,
  TimelineRecord,
  TimelineRepo,
  TimelineSummary,
} from "./TimelineRepo";

const FIXED_CREATED_AT = new Date("2026-01-01T00:00:00.000Z");
const EMPTY_TIMELINE: Timeline = { periods: [], events: [] };
const PLACEHOLDER_DESCRIPTION =
  "Línea del tiempo en preparación. Pronto agregaremos eventos y períodos.";

function placeholder(id: string, title: string): TimelineRecord {
  return {
    id,
    title,
    description: PLACEHOLDER_DESCRIPTION,
    createdAt: FIXED_CREATED_AT,
    updatedAt: FIXED_CREATED_AT,
    timeline: EMPTY_TIMELINE,
  };
}

const IN_CODE_RECORDS: Record<string, TimelineRecord> = {
  "historia-de-argentina": {
    id: "historia-de-argentina",
    title: "Historia de Argentina",
    description:
      "Independencia, organización del Estado y consolidación del país.",
    createdAt: FIXED_CREATED_AT,
    updatedAt: FIXED_CREATED_AT,
    timeline: timelineHistoriaArgentina,
  },
  "historia-del-peru": placeholder("historia-del-peru", "Historia del Perú"),
  "historia-de-chile": placeholder("historia-de-chile", "Historia de Chile"),
  "historia-del-uruguay": placeholder(
    "historia-del-uruguay",
    "Historia del Uruguay"
  ),
  "historia-del-paraguay": placeholder(
    "historia-del-paraguay",
    "Historia del Paraguay"
  ),
  "historia-del-ecuador": placeholder(
    "historia-del-ecuador",
    "Historia del Ecuador"
  ),
};

const IN_CODE_SUMMARIES: TimelineSummary[] = Object.values(IN_CODE_RECORDS).map(
  ({ timeline: _t, ...summary }) => summary
);

function titleFromSlug(slug: string): string {
  const cleaned = slug.replace(/^historia-(de|del)-/i, "");
  const country = cleaned
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  const article = /-del-/i.test(slug) ? "del" : "de";
  return country ? `Historia ${article} ${country}` : slug;
}

function synthesizePlaceholder(slug: string): TimelineRecord {
  return placeholder(slug, titleFromSlug(slug));
}

/**
 * Wrapper que provee timelines hardcodeadas como fallback del repo subyacente.
 * Si el backend tiene una timeline con el mismo id, gana el backend.
 */
export class InCodeTimelineRepo implements TimelineRepo {
  constructor(private readonly underlying: TimelineRepo) {}

  async list(): Promise<TimelineSummary[]> {
    const upstream = await this.underlying
      .list()
      .catch(() => [] as TimelineSummary[]);
    const seen = new Set(upstream.map((s) => s.id));
    const extras = IN_CODE_SUMMARIES.filter((s) => !seen.has(s.id));
    return [...upstream, ...extras];
  }

  async get(timelineId: string): Promise<TimelineRecord> {
    try {
      return await this.underlying.get(timelineId);
    } catch {
      return IN_CODE_RECORDS[timelineId] ?? synthesizePlaceholder(timelineId);
    }
  }

  create(input: CreateTimelineInput): Promise<TimelineRecord> {
    return this.underlying.create(input);
  }

  replace(
    timelineId: string,
    input: ReplaceTimelineInput
  ): Promise<TimelineRecord> {
    return this.underlying.replace(timelineId, input);
  }
}
