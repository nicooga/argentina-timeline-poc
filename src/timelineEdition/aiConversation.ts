export type TimelineChangeType =
  | "create_event"
  | "update_event"
  | "delete_event"
  | "create_period"
  | "update_period"
  | "delete_period";

export type TimelineChange = {
  type: TimelineChangeType;
  target_id: string | null;
  data: Record<string, unknown> | null;
  rationale: string;
};

export type AiMessageType = "response" | "plan_proposal";

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  proposedChanges: TimelineChange[];
  messageType: AiMessageType;
};

export type AiConversation = {
  timelineId: string;
  messages: AiMessage[];
};

export type ExecutionPlanStatus =
  | "draft"
  | "executing"
  | "completed"
  | "refining"
  | "failed";

export type ExecutionPlanStepStatus =
  | "pending"
  | "executing"
  | "completed"
  | "failed";

export type ExecutionPlanStepType =
  | "generate_periods"
  | "review_periods"
  | "generate_events_by_category"
  | "review_events";

export type ExecutionPlanStep = {
  id: string;
  order: number;
  stepType: ExecutionPlanStepType;
  description: string;
  status: ExecutionPlanStepStatus;
  attemptCount: number;
  proposedChanges: TimelineChange[];
};

export type ExecutionPlan = {
  id: string;
  timelineId: string;
  status: ExecutionPlanStatus;
  proposedChanges: TimelineChange[];
  steps: ExecutionPlanStep[];
  createdAt: Date;
};

export type ExecutionPlanSummary = {
  id: string;
  timelineId: string;
  status: ExecutionPlanStatus;
  sourceMessageId: string;
  createdAt: Date;
};

export type PlanProposedChanges = {
  planId: string;
  status: ExecutionPlanStatus;
  operations: TimelineChange[];
};
