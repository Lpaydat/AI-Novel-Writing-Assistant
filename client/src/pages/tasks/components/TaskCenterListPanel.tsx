import { useTranslation } from "react-i18next";
import type { UnifiedTaskSummary } from "@ai-novel/shared/types/task";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCheckpoint,
  formatDate,
  formatKind,
  formatStatus,
  toStatusVariant,
} from "../taskCenterUtils";

interface TaskCenterListPanelProps {
  tasks: UnifiedTaskSummary[];
  selectedKind: string | null;
  selectedId: string | null;
  onSelectTask: (task: UnifiedTaskSummary) => void;
}

export default function TaskCenterListPanel({
  tasks,
  selectedKind,
  selectedId,
  onSelectTask,
}: TaskCenterListPanelProps) {
  const { t } = useTranslation("tasks");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("list.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => {
          const isSelected = task.kind === selectedKind && task.id === selectedId;
          return (
            <button
              key={`${task.kind}:${task.id}`}
              type="button"
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}
              onClick={() => onSelectTask(task)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{task.title}</div>
                <Badge variant={toStatusVariant(task.status)}>{formatStatus(task.status)}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatKind(task.kind)} | {t("list.progress", { percent: Math.round(task.progress * 100) })}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("list.stage", { value: task.currentStage ?? t("common.none") })} | {t("list.currentItem", { value: task.currentItemLabel ?? t("common.none") })}
              </div>
              {task.displayStatus || task.lastHealthyStage ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("list.status", { value: task.displayStatus ?? formatStatus(task.status) })} | {t("list.lastHealthyStage", { value: task.lastHealthyStage ?? t("common.none") })}
                </div>
              ) : null}
              {task.kind === "novel_workflow" ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("list.checkpoint", { value: formatCheckpoint(task.checkpointType, task.executionScopeLabel) })} | {t("list.suggestContinue", { value: task.resumeAction ?? task.nextActionLabel ?? t("list.continueMainFlow") })}
                </div>
              ) : null}
              {task.blockingReason ? (
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {t("list.reason", { value: task.blockingReason })}
                </div>
              ) : null}
              <div className="mt-1 text-xs text-muted-foreground">
                {t("list.lastHeartbeat", { value: formatDate(task.heartbeatAt) })} | {t("list.updatedAt", { value: formatDate(task.updatedAt) })}
              </div>
            </button>
          );
        })}
        {tasks.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {t("list.empty")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
