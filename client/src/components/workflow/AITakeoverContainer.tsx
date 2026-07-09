import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WorkflowProgressBar, {
  normalizeProgressPercent,
  type WorkflowProgressTone,
} from "./WorkflowProgressBar";

export type AITakeoverMode = "loading" | "running" | "waiting" | "action_required" | "failed";

export interface AITakeoverAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "destructive";
  disabled?: boolean;
}

export interface AITakeoverContainerProps {
  mode: AITakeoverMode;
  title: string;
  description: string;
  progress?: number | null;
  currentAction?: string | null;
  checkpointLabel?: string | null;
  taskId?: string | null;
  actions?: AITakeoverAction[];
  children?: ReactNode;
}

function modeLabel(mode: AITakeoverMode): string {
  switch (mode) {
    case "loading":
      return i18n.t("takeover.mode.loading", { ns: "componentsMisc" });
    case "running":
      return i18n.t("takeover.mode.running", { ns: "componentsMisc" });
    case "waiting":
      return i18n.t("takeover.mode.waiting", { ns: "componentsMisc" });
    case "action_required":
      return i18n.t("takeover.mode.actionRequired", { ns: "componentsMisc" });
    case "failed":
    default:
      return i18n.t("takeover.mode.failed", { ns: "componentsMisc" });
  }
}

function shellClass(mode: AITakeoverMode): string {
  switch (mode) {
    case "loading":
      return "bg-slate-50/80";
    case "failed":
      return "bg-destructive/5";
    case "action_required":
      return "bg-orange-50/80";
    case "waiting":
      return "bg-amber-50/80";
    case "running":
    default:
      return "bg-sky-50/80";
  }
}

function progressShellClass(mode: AITakeoverMode): string {
  switch (mode) {
    case "loading":
      return "bg-background/70";
    case "failed":
      return "bg-background/65";
    case "action_required":
      return "bg-background/65";
    case "waiting":
      return "bg-background/65";
    case "running":
    default:
      return "bg-background/70";
  }
}

function progressTone(mode: AITakeoverMode): WorkflowProgressTone {
  switch (mode) {
    case "loading":
      return "loading";
    case "failed":
      return "failed";
    case "waiting":
    case "action_required":
      return "waiting";
    case "running":
    default:
      return "running";
  }
}

function progressStatusLabel(mode: AITakeoverMode): string | null {
  switch (mode) {
    case "running":
      return i18n.t("takeover.status.running", { ns: "componentsMisc" });
    case "waiting":
      return i18n.t("takeover.status.waiting", { ns: "componentsMisc" });
    case "action_required":
      return i18n.t("takeover.status.actionRequired", { ns: "componentsMisc" });
    case "failed":
      return i18n.t("takeover.status.failed", { ns: "componentsMisc" });
    default:
      return null;
  }
}

function badgeVariant(mode: AITakeoverMode): "default" | "secondary" | "destructive" {
  if (mode === "failed") {
    return "destructive";
  }
  if (mode === "loading" || mode === "waiting" || mode === "action_required") {
    return "secondary";
  }
  return "default";
}

export default function AITakeoverContainer({
  mode,
  title,
  description,
  progress,
  currentAction,
  checkpointLabel,
  taskId,
  actions = [],
  children,
}: AITakeoverContainerProps) {
  const { t } = useTranslation("componentsMisc");
  const resolvedProgress = typeof progress === "number" ? normalizeProgressPercent(progress) : null;

  return (
    <div className="space-y-4">
      <div className={cn("rounded-2xl px-4 py-3", shellClass(mode))}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <Badge variant={badgeVariant(mode)}>{modeLabel(mode)}</Badge>
            {taskId ? <Badge variant="outline">{t("takeover.taskBadge", { id: taskId.slice(0, 8) })}</Badge> : null}
          </div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant={action.variant ?? (mode === "running" ? "outline" : "default")}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {resolvedProgress !== null ? (
        <div className={cn("mt-3 rounded-xl px-3 py-2", progressShellClass(mode))}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              {mode === "running" ? (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
              ) : null}
              <span className="font-medium text-foreground">{t("takeover.progressLabel")}</span>
              {progressStatusLabel(mode) ? (
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                  {progressStatusLabel(mode)}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 tabular-nums text-muted-foreground">{resolvedProgress}%</span>
          </div>

          <WorkflowProgressBar progress={resolvedProgress} tone={progressTone(mode)} className="mt-3" />

          {currentAction ? (
            <div
              className={cn(
                "mt-2 text-sm",
                mode === "running"
                  ? "text-foreground"
                  : "text-foreground",
              )}
            >
              {currentAction}
            </div>
          ) : null}
          {checkpointLabel ? (
            <div className="mt-2 text-xs text-muted-foreground">{t("takeover.lastCheckpoint", { label: checkpointLabel })}</div>
          ) : null}
        </div>
      ) : null}
      </div>

      {children ? <div>{children}</div> : null}
    </div>
  );
}
