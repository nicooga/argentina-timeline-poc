import { describe, expect, it } from "vitest";
import { HttpAiService } from "./HttpAiService";
import { applyChangesLocally } from "./applyChangesLocally";
import { timelineFromJson } from "./timelineSerialization";
import type { ExecutionPlan, TimelineChange } from "./aiConversation";

const E2E_API_BASE_URL = (
  process.env.TIMELINES_E2E_API_BASE_URL ??
  process.env.VITE_TIMELINES_API_BASE_URL ??
  ""
).trim();

const LARGE_HISTORY_REQUEST = "Generame un timeline completo de la Revolución Rusa";
const REFINE_PROMPT = "Asegurate de incluir el rol de Lenin y Trotsky";
const POLL_TIMEOUT_MS = 12 * 60 * 1000;
const POLL_INTERVAL_MS = 2500;

type TimelineWire = {
  id: string;
  snapshot: unknown;
};

function e2eDescribe(name: string, fn: () => void) {
  const runnable = E2E_API_BASE_URL.length > 0 && E2E_API_BASE_URL !== "local";
  return runnable ? describe(name, fn) : describe.skip(name, fn);
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const baseUrl = E2E_API_BASE_URL.replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body == null ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  expect(response.ok, JSON.stringify(body)).toBe(true);
  return body as T;
}

async function createEmptyTimeline(): Promise<TimelineWire> {
  return apiRequest<TimelineWire>("/timelines", {
    method: "POST",
    body: JSON.stringify({
      title: `Revolución Rusa Frontend E2E ${Date.now()}`,
      snapshot: { events: [], periods: [] },
    }),
  });
}

async function waitForPlanCompletion(
  service: HttpAiService,
  timelineId: string,
  planId: string
): Promise<ExecutionPlan> {
  const startedAt = Date.now();
  let latest: ExecutionPlan | null = null;

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    latest = await service.getPlan(timelineId, planId);
    if (latest.status === "completed") return latest;
    if (latest.status === "failed") {
      throw new Error(formatFailedPlan(latest));
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Plan ${planId} did not complete in ${POLL_TIMEOUT_MS}ms.\n` +
      (latest ? formatPlanSteps(latest) : "No plan status was fetched.")
  );
}

function assertCompletedWithAllStepsRun(plan: ExecutionPlan) {
  expect(plan.status).toBe("completed");
  const stepTypes = new Set(plan.steps.map((step) => step.stepType));
  expect(stepTypes.has("generate_events_by_category")).toBe(true);
  expect(stepTypes.has("review_events")).toBe(true);
  expect(plan.steps.filter((step) => step.status !== "completed")).toEqual([]);
}

function assertHasPeriodAndEventProposals(changes: TimelineChange[]) {
  expect(changes.length).toBeGreaterThan(0);
  const types = new Set(changes.map((change) => change.type));
  expect(types.has("create_period")).toBe(true);
  expect(types.has("create_event")).toBe(true);
  expect(changes.filter((change) => !change.rationale)).toEqual([]);
}

function formatFailedPlan(plan: ExecutionPlan): string {
  return `Plan ${plan.id} failed.\n${formatPlanSteps(plan)}`;
}

function formatPlanSteps(plan: ExecutionPlan): string {
  return plan.steps
    .map(
      (step) =>
        `  [${step.status.padEnd(10)}] ${step.stepType} (attempts: ${step.attemptCount})`
    )
    .join("\n");
}

e2eDescribe("execution plan e2e", () => {
  it(
    "drives the full plan flow through the frontend client",
    async () => {
      const baseUrl = E2E_API_BASE_URL.replace(/\/+$/, "");
      const service = new HttpAiService(baseUrl);
      const timelineRecord = await createEmptyTimeline();
      const initialTimeline = timelineFromJson(timelineRecord.snapshot);

      const conversation = await service.sendMessage(
        timelineRecord.id,
        LARGE_HISTORY_REQUEST
      );
      const proposal = [...conversation.messages]
        .reverse()
        .find((message) => message.role === "assistant");

      expect(proposal?.messageType).toBe("plan_proposal");
      expect(proposal?.proposedChanges).toEqual([]);

      const draft = await service.startPlan(timelineRecord.id, proposal!.id);
      expect(draft.status).toBe("draft");
      expect(draft.steps.some((step) => step.stepType === "generate_periods")).toBe(true);
      expect(draft.steps.some((step) => step.stepType === "review_periods")).toBe(true);

      await service.executePlan(timelineRecord.id, draft.id);
      const completedPlan = await waitForPlanCompletion(
        service,
        timelineRecord.id,
        draft.id
      );
      assertCompletedWithAllStepsRun(completedPlan);

      const proposed = await service.getProposedChanges(timelineRecord.id, draft.id);
      assertHasPeriodAndEventProposals(proposed.operations);

      const preview = applyChangesLocally(initialTimeline, proposed.operations);
      expect(preview.timeline.periods.length).toBeGreaterThan(0);
      expect(preview.timeline.events.length).toBeGreaterThan(0);

      await service.refinePlan(timelineRecord.id, draft.id, REFINE_PROMPT);
      const refinedPlan = await waitForPlanCompletion(
        service,
        timelineRecord.id,
        draft.id
      );
      assertCompletedWithAllStepsRun(refinedPlan);

      const refinedProposed = await service.getProposedChanges(
        timelineRecord.id,
        draft.id
      );
      assertHasPeriodAndEventProposals(refinedProposed.operations);

      const applied = await service.applyOperations(
        timelineRecord.id,
        refinedProposed.operations
      );
      expect(applied.timeline.periods.length).toBeGreaterThan(0);
      expect(applied.timeline.events.length).toBeGreaterThan(0);
    },
    POLL_TIMEOUT_MS + 60_000
  );
});
