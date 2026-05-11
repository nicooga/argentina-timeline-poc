import type { TimelineRecord } from "./TimelineRepo";
import { timelineFromJson } from "./timelineSerialization";
import type {
  AiConversation,
  AiMessage,
  ExecutionPlan,
  ExecutionPlanStep,
  ExecutionPlanSummary,
  PlanProposedChanges,
  TimelineChange,
} from "./aiConversation";

type Fetcher = typeof fetch;
const defaultFetcher: Fetcher = (input, init) => globalThis.fetch(input, init);

type TimelineChangeWire = {
  type: string;
  target_id: string | null;
  data: Record<string, unknown> | null;
  rationale: string;
};

type AiMessageWire = {
  id: string;
  timeline_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  proposed_changes: TimelineChangeWire[];
  message_type?: "response" | "plan_proposal";
};

type AiConversationWire = {
  timeline_id: string;
  user_id: string;
  messages: AiMessageWire[];
};

type TimelineWire = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  snapshot: unknown;
};

type ExecutionPlanStepWire = {
  id: string;
  order: number;
  step_type: ExecutionPlanStep["stepType"];
  description: string;
  status: ExecutionPlanStep["status"];
  attempt_count: number;
  proposed_changes?: TimelineChangeWire[];
};

type ExecutionPlanWire = {
  id: string;
  timeline_id: string;
  status: ExecutionPlan["status"];
  steps: ExecutionPlanStepWire[];
  created_at: string;
};

type ExecutionPlanSummaryWire = {
  id: string;
  timeline_id: string;
  status: ExecutionPlanSummary["status"];
  source_message_id: string;
  created_at: string;
};

type ProposedChangesWire = {
  plan_id: string;
  status: PlanProposedChanges["status"];
  operations: TimelineChangeWire[];
};

export class AiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: unknown
  ) {
    super(message);
    this.name = "AiApiError";
  }
}

export class HttpAiService {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly fetcher: Fetcher = defaultFetcher
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async getConversation(timelineId: string): Promise<AiConversation> {
    const wire = await this.request<AiConversationWire>(
      `/timelines/${encodeURIComponent(timelineId)}/ai-conversation`
    );
    return conversationFromWire(wire);
  }

  async sendMessage(timelineId: string, content: string): Promise<AiConversation> {
    const wire = await this.request<AiConversationWire>(
      `/timelines/${encodeURIComponent(timelineId)}/ai-conversation/messages`,
      { method: "POST", body: JSON.stringify({ content }) }
    );
    return conversationFromWire(wire);
  }

  async applyOperations(
    timelineId: string,
    changes: TimelineChange[]
  ): Promise<TimelineRecord> {
    const wire = await this.request<TimelineWire>(
      `/timelines/${encodeURIComponent(timelineId)}/operations`,
      { method: "POST", body: JSON.stringify({ changes }) }
    );
    return {
      id: wire.id,
      title: wire.title,
      description: wire.description,
      createdAt: new Date(wire.created_at),
      updatedAt: new Date(wire.updated_at),
      timeline: timelineFromJson(wire.snapshot),
    };
  }

  async listPlans(timelineId: string): Promise<ExecutionPlanSummary[]> {
    const wire = await this.request<ExecutionPlanSummaryWire[]>(
      `/timelines/${encodeURIComponent(timelineId)}/execution-plans`
    );
    return wire.map(planSummaryFromWire);
  }

  async startPlan(
    timelineId: string,
    sourceMessageId: string
  ): Promise<ExecutionPlan> {
    try {
      const wire = await this.request<ExecutionPlanWire>(
        `/timelines/${encodeURIComponent(timelineId)}/ai-conversation/start-plan`,
        {
          method: "POST",
          body: JSON.stringify({ source_message_id: sourceMessageId }),
        }
      );
      return planFromWire(wire);
    } catch (error) {
      if (error instanceof AiApiError && error.status === 409 && error.detail) {
        return planFromWire(error.detail as ExecutionPlanWire);
      }
      throw error;
    }
  }

  async executePlan(timelineId: string, planId: string): Promise<void> {
    await this.request<unknown>(
      `/timelines/${encodeURIComponent(timelineId)}/execution-plans/${encodeURIComponent(planId)}/execute`,
      { method: "POST" }
    );
  }

  async getPlan(timelineId: string, planId: string): Promise<ExecutionPlan> {
    const wire = await this.request<ExecutionPlanWire>(
      `/timelines/${encodeURIComponent(timelineId)}/execution-plans/${encodeURIComponent(planId)}`
    );
    return planFromWire(wire);
  }

  async getProposedChanges(
    timelineId: string,
    planId: string
  ): Promise<PlanProposedChanges> {
    const wire = await this.request<ProposedChangesWire>(
      `/timelines/${encodeURIComponent(timelineId)}/execution-plans/${encodeURIComponent(planId)}/proposed-changes`
    );
    return {
      planId: wire.plan_id,
      status: wire.status,
      operations: wire.operations.map(changeFromWire),
    };
  }

  async refinePlan(
    timelineId: string,
    planId: string,
    userPrompt: string | null
  ): Promise<void> {
    await this.request<unknown>(
      `/timelines/${encodeURIComponent(timelineId)}/execution-plans/${encodeURIComponent(planId)}/refine`,
      {
        method: "POST",
        body: JSON.stringify({ user_prompt: userPrompt }),
      }
    );
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body == null ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new AiApiError(
        `AI API request failed with ${response.status}`,
        response.status,
        payload
      );
    }
    return payload as T;
  }
}

function messageFromWire(wire: AiMessageWire): AiMessage {
  return {
    id: wire.id,
    role: wire.role,
    content: wire.content,
    createdAt: new Date(wire.created_at),
    proposedChanges: wire.proposed_changes.map(changeFromWire),
    messageType: wire.message_type ?? "response",
  };
}

function conversationFromWire(wire: AiConversationWire): AiConversation {
  return {
    timelineId: wire.timeline_id,
    messages: wire.messages.map(messageFromWire),
  };
}

function changeFromWire(wire: TimelineChangeWire): TimelineChange {
  return {
    type: wire.type as TimelineChange["type"],
    target_id: wire.target_id,
    data: wire.data,
    rationale: wire.rationale,
  };
}

function stepFromWire(wire: ExecutionPlanStepWire): ExecutionPlanStep {
  return {
    id: wire.id,
    order: wire.order,
    stepType: wire.step_type,
    description: wire.description,
    status: wire.status,
    attemptCount: wire.attempt_count,
    proposedChanges: (wire.proposed_changes ?? []).map(changeFromWire),
  };
}

function planFromWire(wire: ExecutionPlanWire): ExecutionPlan {
  return {
    id: wire.id,
    timelineId: wire.timeline_id,
    status: wire.status,
    steps: wire.steps.map(stepFromWire),
    createdAt: new Date(wire.created_at),
  };
}

function planSummaryFromWire(wire: ExecutionPlanSummaryWire): ExecutionPlanSummary {
  return {
    id: wire.id,
    timelineId: wire.timeline_id,
    status: wire.status,
    sourceMessageId: wire.source_message_id,
    createdAt: new Date(wire.created_at),
  };
}
