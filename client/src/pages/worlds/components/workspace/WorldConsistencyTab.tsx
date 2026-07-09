import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WorldConsistencyIssue, WorldConsistencyReport } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  localizeConsistencyField,
  localizeConsistencyIssueDetail,
  localizeConsistencyIssueMessage,
  localizeConsistencyIssueTitle,
  localizeConsistencySeverity,
  localizeConsistencySource,
  localizeConsistencyStatus,
} from "../../worldConsistencyUi";

interface WorldConsistencyTabProps {
  report: WorldConsistencyReport | null;
  issues: WorldConsistencyIssue[];
  checkPending: boolean;
  onCheck: () => void;
  onPatchIssue: (payload: { issueId: string; status: "open" | "resolved" | "ignored" }) => void;
}

export default function WorldConsistencyTab(props: WorldConsistencyTabProps) {
  const { report, issues, checkPending, onCheck, onPatchIssue } = props;
  const { t } = useTranslation("worldsComponentsB");
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const openIssues = useMemo(() => issues.filter((issue) => issue.status === "open"), [issues]);
  const activeIssue = useMemo(() => {
    if (issues.length === 0) {
      return null;
    }
    return issues.find((issue) => issue.id === activeIssueId)
      ?? openIssues[0]
      ?? issues[0];
  }, [activeIssueId, issues, openIssues]);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warnCount = issues.filter((issue) => issue.severity === "warn").length;
  const resolvedCount = issues.filter((issue) => issue.status === "resolved").length;
  const ignoredCount = issues.filter((issue) => issue.status === "ignored").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("consistency.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium">{t("consistency.title")}</div>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("consistency.desc")}
            </div>
          </div>
          <Button onClick={onCheck} disabled={checkPending}>
            {checkPending ? t("consistency.checking") : t("consistency.run")}
          </Button>
        </div>

        {report ? (
          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground">{t("consistency.statusLabel")}</div>
              <div className="mt-1 font-semibold">{localizeConsistencyStatus(report.status)}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground">{t("consistency.scoreLabel")}</div>
              <div className="mt-1 font-semibold">{report.score}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground">{t("consistency.pendingLabel")}</div>
              <div className="mt-1 font-semibold">{openIssues.length}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground">{t("consistency.errorWarnLabel")}</div>
              <div className="mt-1 font-semibold">{errorCount}/{warnCount}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground">{t("consistency.handledLabel")}</div>
              <div className="mt-1 font-semibold">{resolvedCount + ignoredCount}</div>
            </div>
            <div className="rounded-md border p-3 text-sm md:col-span-5">
              <div className="text-xs text-muted-foreground">{t("consistency.summaryLabel")}</div>
              <div className="mt-1 font-medium">{report.summary}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {t("consistency.generatedAt", { time: report.generatedAt ? new Date(report.generatedAt).toLocaleString() : t("consistency.unknownTime") })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t("consistency.emptyReport")}
          </div>
        )}

        {issues.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">{t("consistency.issueListTitle")}</div>
              {issues.map((issue) => {
                const selected = activeIssue?.id === issue.id;
                return (
                  <button
                    key={issue.id}
                    type="button"
                    className={[
                      "w-full rounded-md border p-2 text-left text-sm transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-border/70 bg-background hover:bg-muted/40",
                    ].join(" ")}
                    onClick={() => setActiveIssueId(issue.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {localizeConsistencyIssueTitle(issue.code)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {localizeConsistencyStatus(issue.status)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {localizeConsistencySeverity(issue.severity)} · {localizeConsistencyField(issue.targetField)}
                    </div>
                  </button>
                );
              })}
            </div>

            {activeIssue ? (
              <div className="rounded-md border p-3 space-y-3">
                <div>
                  <div className="font-medium">
                    [{localizeConsistencySeverity(activeIssue.severity)}] {localizeConsistencyIssueTitle(activeIssue.code)}
                  </div>
                  <div className="mt-2 text-sm">{localizeConsistencyIssueMessage(activeIssue)}</div>
                </div>
                <div className="rounded-md border border-dashed p-3 text-sm leading-6 text-muted-foreground">
                  {localizeConsistencyIssueDetail(activeIssue) ?? t("consistency.detailFallback")}
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="rounded-md border p-3 text-xs">
                    <div className="text-muted-foreground">{t("consistency.sourceLabel")}</div>
                    <div className="mt-1 font-medium text-foreground">{localizeConsistencySource(activeIssue.source)}</div>
                  </div>
                  <div className="rounded-md border p-3 text-xs">
                    <div className="text-muted-foreground">{t("consistency.affectedLabel")}</div>
                    <div className="mt-1 font-medium text-foreground">{localizeConsistencyField(activeIssue.targetField)}</div>
                  </div>
                  <div className="rounded-md border p-3 text-xs">
                    <div className="text-muted-foreground">{t("consistency.handleStatusLabel")}</div>
                    <div className="mt-1 font-medium text-foreground">{localizeConsistencyStatus(activeIssue.status)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onPatchIssue({ issueId: activeIssue.id, status: "resolved" })}
                    disabled={activeIssue.status === "resolved"}
                  >
                    {t("consistency.markResolved")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPatchIssue({ issueId: activeIssue.id, status: "ignored" })}
                    disabled={activeIssue.status === "ignored"}
                  >
                    {t("consistency.ignore")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            {t("consistency.noIssues")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
