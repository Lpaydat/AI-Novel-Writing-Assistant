import type { RecoverableTaskSummary } from "@ai-novel/shared/types/task";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import i18n from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AppDialogContent,
  Dialog,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useTaskRecovery } from "./TaskRecoveryContext";

function formatTaskKind(kind: RecoverableTaskSummary["kind"]): string {
  if (kind === "novel_workflow") {
    return i18n.t("taskRecovery.kind.novelWorkflow", { ns: "componentsLayout" });
  }
  if (kind === "novel_pipeline") {
    return i18n.t("taskRecovery.kind.novelPipeline", { ns: "componentsLayout" });
  }
  if (kind === "book_analysis") {
    return i18n.t("taskRecovery.kind.bookAnalysis", { ns: "componentsLayout" });
  }
  if (kind === "style_extraction") {
    return i18n.t("taskRecovery.kind.styleExtraction", { ns: "componentsLayout" });
  }
  return i18n.t("taskRecovery.kind.image", { ns: "componentsLayout" });
}

export default function TaskRecoveryDialog() {
  const { t } = useTranslation("componentsLayout");
  const {
    items,
    isOpen,
    busyTaskId,
    isResumeSinglePending,
    isResumeAllPending,
    closeDialog,
    resumeSingle,
    resumeAll,
  } = useTaskRecovery();

  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => { if (!nextOpen) closeDialog(); }}>
      <AppDialogContent
        title={t("taskRecovery.dialogTitle")}
        description={t("taskRecovery.dialogDescription")}
        footer={(
          <>
            <Button variant="outline" onClick={closeDialog}>
              {t("taskRecovery.later")}
            </Button>
            <Button onClick={resumeAll} disabled={isResumeSinglePending || isResumeAllPending}>
              {isResumeAllPending ? t("taskRecovery.resumeAllPending") : t("taskRecovery.resumeAll")}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={`${item.kind}-${item.id}`}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{formatTaskKind(item.kind)}</Badge>
                      <Badge variant={item.status === "running" ? "default" : "secondary"}>
                        {item.status === "running" ? t("taskRecovery.runningInterrupted") : t("taskRecovery.queuedInterrupted")}
                      </Badge>
                    </div>
                    <div className="text-base font-semibold">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{t("taskRecovery.ownerLabel")}{item.ownerLabel}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => resumeSingle({ kind: item.kind, id: item.id })}
                      disabled={isResumeAllPending || (isResumeSinglePending && busyTaskId !== item.id)}
                    >
                      {isResumeSinglePending && busyTaskId === item.id ? t("taskRecovery.resumeSinglePending") : t("taskRecovery.resumeSingle")}
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={item.sourceRoute} onClick={closeDialog}>{t("taskRecovery.openLocation")}</Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  {item.currentStage ? <div>{t("taskRecovery.currentStage")}{item.currentStage}</div> : null}
                  {item.currentItemLabel ? <div>{t("taskRecovery.interruptedAt")}{item.currentItemLabel}</div> : null}
                  {item.resumeAction ? <div>{t("taskRecovery.suggestedAction")}{item.resumeAction}</div> : null}
                  {item.recoveryHint ? <div>{t("taskRecovery.recoveryHint")}{item.recoveryHint}</div> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AppDialogContent>
    </Dialog>
  );
}
