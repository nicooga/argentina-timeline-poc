import { describe, expect, it, vi } from "vitest";
import { HttpAiService } from "./HttpAiService";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const conversationWire = {
  timeline_id: "argentina-history",
  user_id: "dev-user",
  messages: [
    {
      id: "m1",
      timeline_id: "argentina-history",
      user_id: "dev-user",
      role: "assistant",
      content: "Conviene crear un plan.",
      created_at: "2026-05-10T12:00:00Z",
      message_type: "plan_proposal",
      proposed_changes: [],
    },
  ],
};

const planWire = {
  id: "plan-1",
  timeline_id: "argentina-history",
  status: "draft",
  proposed_changes: [
    {
      type: "create_period",
      target_id: null,
      data: { id: "p1", title: "P1", start: "1900-01-01", end: "1901-01-01" },
      rationale: "Add period",
    },
  ],
  created_at: "2026-05-10T12:01:00Z",
  steps: [
    {
      id: "step-1",
      order: 0,
      step_type: "generate_periods",
      description: "Generate periods",
      status: "pending",
      attempt_count: 0,
      proposed_changes: [
        {
          type: "create_event",
          target_id: null,
          data: { id: "e1", title: "E1", date: "1900-01-01", lanes: ["politico"], items: [] },
          rationale: "Add event",
        },
      ],
    },
  ],
};

describe("HttpAiService", () => {
  it("parses message_type and proposed changes", async () => {
    const fetcher = vi.fn(async () => jsonResponse(conversationWire));
    const service = new HttpAiService("http://api.test", fetcher);

    const conversation = await service.getConversation("argentina-history");

    expect(conversation.messages[0]).toMatchObject({
      id: "m1",
      messageType: "plan_proposal",
      proposedChanges: [],
    });
  });

  it("calls execution plan endpoints", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/execution-plans")) return jsonResponse([]);
      if (url.endsWith("/start-plan")) return jsonResponse(planWire, 201);
      if (url.endsWith("/execute")) return jsonResponse(null, 202);
      if (url.endsWith("/proposed-changes")) {
        return jsonResponse({
          plan_id: "plan-1",
          status: "completed",
          operations: [
            {
              type: "create_event",
              target_id: null,
              data: { id: "e2", title: "E2", date: "1900-01-01", lanes: ["politico"], items: [] },
              rationale: "Add event",
            },
          ],
        });
      }
      if (url.endsWith("/refine")) return jsonResponse(null, 202);
      return jsonResponse({ ...planWire, status: "completed" });
    });
    const service = new HttpAiService("http://api.test", fetcher);

    await expect(service.listPlans("argentina-history")).resolves.toEqual([]);
    await expect(service.startPlan("argentina-history", "m1")).resolves.toMatchObject({
      id: "plan-1",
      proposedChanges: [{ type: "create_period" }],
      steps: [{ stepType: "generate_periods" }],
    });
    await service.executePlan("argentina-history", "plan-1");
    await expect(service.getPlan("argentina-history", "plan-1")).resolves.toMatchObject({
      status: "completed",
      steps: [{ proposedChanges: [{ type: "create_event" }] }],
    });
    await expect(
      service.getProposedChanges("argentina-history", "plan-1")
    ).resolves.toMatchObject({ operations: [{ type: "create_event" }] });
    await service.refinePlan("argentina-history", "plan-1", "Más contexto");

    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/timelines/argentina-history/ai-conversation/start-plan",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ source_message_id: "m1" }),
      })
    );
  });

  it("treats start-plan 409 as an existing usable draft", async () => {
    const fetcher = vi.fn(async () => jsonResponse(planWire, 409));
    const service = new HttpAiService("http://api.test", fetcher);

    await expect(service.startPlan("argentina-history", "m1")).resolves.toMatchObject({
      id: "plan-1",
      status: "draft",
    });
  });
});
