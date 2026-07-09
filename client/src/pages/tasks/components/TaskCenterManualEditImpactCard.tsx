import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useMutation } from "@tanstack/react-query";
import type { DirectorManualEditImpact, DirectorManualEditImpactLevel } from "@ai-novel/shared/types/directorRuntime";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import { getDirectorManualEditImpact } from "@/api/novelDirector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface TaskCenterManualEditImpactCardProps {
  task: UnifiedTaskDetail;
}

function formatImpactLevelKey(level: DirectorManualEditImpactLevel): string {
  if (level === "none") {
    return "impact.levelNone";
  }
  if (level === "low") {
    return "impact.levelLow";
  }
  if (level === "medium") {
    return "impact.levelMedium";
  }
  return "impact.levelHigh";
}

function impactVariant(level: DirectorManualEditImpactLevel): "default" | "outline" | "secondary" | "destructive" {
  if (level === "high") {
    return "destructive";
  }
  if (level === "medium") {
    return "secondary";
  }
  if (level === "low") {
    return "default";
  }
  return "outline";
}

function renderImpactResult(impact: DirectorManualEditImpact, t: TFunction) {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant={impactVariant(impact.impactLevel)}>{t(formatImpactLevelKey(impact.impactLevel))}</Badge>
        <Badge variant={impact.safeToContinue ? "default" : "secondary"}>
          {impact.safeToContinue ? t("impact.safeToContinue") : t("impact.handleImpactFirst")}
        </Badge>
        {impact.requiresApproval ? <Badge variant="outline">{t("impact.requiresApproval")}</Badge> : null}
      </div>
      <div className="text-sm leading-6 text-muted-foreground">{impact.summary}</div>
      {impact.changedChapters.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">{t("impact.affectedChapters")}</div>
          {impact.changedChapters.slice(0, 4).map((chapter) => (
            <div key={chapter.chapterId} className="rounded-md border bg-background px-3 py-2 text-xs">
              {t("impact.chapterLine", { order: chapter.order, title: chapter.title })}
            </div>
          ))}
        </div>
      ) : null}
      {impact.minimalRepairPath.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">{t("impact.repairPath")}</div>
          {impact.minimalRepairPath.map((step, index) => (
            <div key={`${step.action}:${index}`} className="rounded-md border bg-muted/20 px-3 py-2 text-xs leading-5">
              <div className="font-medium text-foreground">{step.label}</div>
              <div className="mt-1 text-muted-foreground">{step.reason}</div>
            </div>
          ))}
        </div>
      ) : null}
      {impact.riskNotes.length > 0 ? (
        <div className="text-xs leading-5 text-muted-foreground">
          {t("impact.riskNotesLabel")}{impact.riskNotes.join(t("impact.riskSeparator"))}
        </div>
      ) : null}
    </div>
  );
}

export default function TaskCenterManualEditImpactCard({
  task,
}: TaskCenterManualEditImpactCardProps) {
  const { t } = useTranslation("tasks");
  const canAnalyze = task.kind === "novel_workflow"
    && task.meta.lane === "auto_director"
    && task.sourceResource?.type === "novel";
  const mutation = useMutation({
    mutationFn: () => getDirectorManualEditImpact(task.ownerId, {
      workflowTaskId: task.id,
      ai: true,
    }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("impact.toast.checkFailed"));
    },
  });

  useEffect(() => {
    mutation.reset();
  }, [mutation, task.id]);

  if (!canAnalyze) {
    return null;
  }

  const impact = mutation.data?.data?.impact ?? null;
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium">{t("impact.title")}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("impact.subtitle")}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? t("impact.checking") : t("impact.check")}
        </Button>
      </div>
      {impact ? renderImpactResult(impact, t) : null}
    </div>
  );
}
