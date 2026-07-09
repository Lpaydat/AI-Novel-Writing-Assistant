import type { ChapterRuntimePackage } from "@ai-novel/shared/types/chapterRuntime";
import type { AuditReport, ReplanRecommendation, ReplanResult, StoryPlan, StoryStateSnapshot } from "@ai-novel/shared/types/novel";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildReplanRecommendationFromAuditReports } from "../chapterPlanning.shared";
import i18n from "@/i18n";

function parseStringArray(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item ?? "").trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function buildPlanView(runtimePackage: ChapterRuntimePackage | null, chapterPlan: StoryPlan | null | undefined) {
  if (runtimePackage?.context.plan) {
    return runtimePackage.context.plan;
  }
  if (!chapterPlan) {
    return null;
  }
  return {
    id: chapterPlan.id,
    chapterId: chapterPlan.chapterId ?? null,
    planRole: chapterPlan.planRole ?? null,
    phaseLabel: chapterPlan.phaseLabel ?? null,
    title: chapterPlan.title,
    objective: chapterPlan.objective,
    participants: parseStringArray(chapterPlan.participantsJson),
    reveals: parseStringArray(chapterPlan.revealsJson),
    riskNotes: parseStringArray(chapterPlan.riskNotesJson),
    mustAdvance: parseStringArray(chapterPlan.mustAdvanceJson),
    mustPreserve: parseStringArray(chapterPlan.mustPreserveJson),
    sourceIssueIds: parseStringArray(chapterPlan.sourceIssueIdsJson),
    replannedFromPlanId: chapterPlan.replannedFromPlanId ?? null,
    hookTarget: chapterPlan.hookTarget ?? null,
    rawPlanJson: chapterPlan.rawPlanJson ?? null,
    scenes: chapterPlan.scenes ?? [],
    createdAt: chapterPlan.createdAt,
    updatedAt: chapterPlan.updatedAt,
  };
}

function buildStateView(runtimePackage: ChapterRuntimePackage | null, stateSnapshot: StoryStateSnapshot | null | undefined) {
  if (runtimePackage?.context.stateSnapshot) {
    return runtimePackage.context.stateSnapshot;
  }
  if (!stateSnapshot) {
    return null;
  }
  return stateSnapshot;
}

function buildOpenConflictView(runtimePackage: ChapterRuntimePackage | null) {
  return runtimePackage?.context.openConflicts ?? [];
}

function buildAuditView(runtimePackage: ChapterRuntimePackage | null, auditReports: AuditReport[] | undefined) {
  if (runtimePackage?.audit) {
    return runtimePackage.audit;
  }
  const reports = auditReports ?? [];
  const openIssues = reports.flatMap((report) => report.issues).filter((issue) => issue.status === "open");
  const reportScores = reports
    .map((report) => report.overallScore ?? null)
    .filter((score): score is number => typeof score === "number");
  const overall = reportScores.length > 0
    ? Math.round(reportScores.reduce((sum, score) => sum + score, 0) / reportScores.length)
    : 0;
  return {
    score: {
      coherence: overall,
      repetition: overall,
      pacing: overall,
      voice: overall,
      engagement: overall,
      overall,
    },
    reports,
    openIssues,
    hasBlockingIssues: openIssues.some((issue) => issue.severity === "high" || issue.severity === "critical"),
  };
}

function buildReplanSummary(
  runtimePackage: ChapterRuntimePackage | null,
  auditReports: AuditReport[] | undefined,
  replanRecommendation?: ReplanRecommendation | null,
) {
  if (runtimePackage?.replanRecommendation) {
    return runtimePackage.replanRecommendation;
  }
  if (replanRecommendation) {
    return replanRecommendation;
  }
  return buildReplanRecommendationFromAuditReports(auditReports);
}

function buildTriggerLabel(triggerType: string): string {
  switch (triggerType) {
    case "manual":
      return "Manual";
    case "auto_milestone":
      return "Auto milestone";
    case "before_pipeline":
      return "Before pipeline";
    default:
      return triggerType.replace(/_/g, " ");
  }
}

function buildWordControlModeLabel(mode: "prompt_only" | "balanced" | "hybrid" | string): string {
  switch (mode) {
    case "prompt_only":
      return i18n.t("runtime.wordControlMode.promptOnly", { ns: "novelsEditA" });
    case "balanced":
      return i18n.t("runtime.wordControlMode.balanced", { ns: "novelsEditA" });
    case "hybrid":
      return i18n.t("runtime.wordControlMode.hybrid", { ns: "novelsEditA" });
    default:
      return mode;
  }
}

function formatVariance(value: number): string {
  const percentage = Math.round(value * 100);
  return `${percentage > 0 ? "+" : ""}${percentage}%`;
}

function SeverityBadge({ severity }: { severity: string }) {
  const variant = severity === "critical" || severity === "high" ? "default" : "secondary";
  return <Badge variant={variant}>{severity}</Badge>;
}

export function ChapterRuntimeLengthCard(props: {
  runtimePackage: ChapterRuntimePackage | null;
}) {
  const { t } = useTranslation("novelsEditA");
  const lengthControl = props.runtimePackage?.lengthControl ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("runtime.length.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {lengthControl ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{t("runtime.length.controlMode")}</div>
                <div className="mt-1 font-medium">{buildWordControlModeLabel(lengthControl.wordControlMode)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {lengthControl.closingPhaseTriggered ? t("runtime.length.closingTriggered") : t("runtime.length.normalProgress")}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{t("runtime.length.targetAndResult")}</div>
                <div className="mt-1 font-medium">{t("runtime.length.wordCountRatio", { final: lengthControl.finalWordCount, target: lengthControl.targetWordCount })}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("runtime.length.variance", { variance: formatVariance(lengthControl.variance) })}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{t("runtime.length.budgetRange")}</div>
                <div className="mt-1 font-medium">{t("runtime.length.budgetRangeValue", { min: lengthControl.softMinWordCount, max: lengthControl.softMaxWordCount })}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("runtime.length.hardCap", { value: lengthControl.hardMaxWordCount })}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{t("runtime.length.execSignal")}</div>
                <div className="mt-1 font-medium">{t("runtime.length.hardStops", { count: lengthControl.hardStopsTriggered })}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  scene {lengthControl.generatedSceneCount}/{lengthControl.plannedSceneCount}
                </div>
              </div>
            </div>

            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">{t("runtime.length.repairPathTitle")}</div>
              <div className="mt-1">
                {lengthControl.lengthRepairPath.length > 0
                  ? lengthControl.lengthRepairPath.join(" -> ")
                  : t("runtime.length.noExtraRepair")}
              </div>
              <div className="mt-1">
                {lengthControl.overlengthRepairApplied ? t("runtime.length.overlengthApplied") : t("runtime.length.noOverlength")}
              </div>
            </div>

            {lengthControl.sceneResults.length > 0 ? (
              <div className="space-y-2">
                {lengthControl.sceneResults.map((scene, index) => (
                  <div key={`${scene.sceneIndex}-${index}`} className="rounded-md border p-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Scene {scene.sceneIndex}</Badge>
                      <Badge variant="secondary">{t("runtime.length.sceneWordCount", { count: scene.actualWordCount })}</Badge>
                      <Badge variant="outline">{buildWordControlModeLabel(scene.wordControlMode)}</Badge>
                      <Badge variant={scene.sceneStatus === "compressed" ? "default" : "outline"}>{scene.sceneStatus}</Badge>
                    </div>
                    <div className="mt-2 text-muted-foreground">
                      {t("runtime.length.sceneRounds", { rounds: scene.roundCount, hardStops: scene.hardStopCount })}
                      {scene.closingPhaseTriggered ? t("runtime.length.withClosing") : ""}
                    </div>
                    {scene.roundResults.length > 0 ? (
                      <div className="mt-2 space-y-1 rounded-md border bg-muted/15 p-2">
                        {scene.roundResults.map((round) => (
                          <div key={`${scene.sceneIndex}-${round.roundIndex}`} className="text-muted-foreground">
                            {t("runtime.length.roundResult", {
                              index: round.roundIndex,
                              suggested: round.suggestedWordCount ?? "-",
                              actual: round.actualWordCount,
                              finalLabel: round.isFinalRound ? t("runtime.length.finalRound") : t("runtime.length.middleRound"),
                              stopLabel: round.hardStopTriggered ? t("runtime.length.hardStopTriggered") : t("runtime.length.naturalEnd"),
                              trimSuffix: round.trimmedAtSentenceBoundary ? t("runtime.length.trimmedSuffix") : "",
                            })}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-muted-foreground">{t("runtime.length.empty")}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChapterRuntimeContextCard(props: {
  runtimePackage: ChapterRuntimePackage | null;
  chapterPlan?: StoryPlan | null;
  stateSnapshot?: StoryStateSnapshot | null;
}) {
  const { t } = useTranslation("novelsEditA");
  const plan = buildPlanView(props.runtimePackage, props.chapterPlan);
  const stateSnapshot = buildStateView(props.runtimePackage, props.stateSnapshot);
  const openConflicts = buildOpenConflictView(props.runtimePackage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("runtime.context.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1">
          <div className="font-medium">{t("runtime.context.planSection")}</div>
          {plan ? (
            <>
              <div className="text-muted-foreground">{plan.title}</div>
              <div>{plan.objective}</div>
              {(plan.planRole || plan.phaseLabel) ? (
                <div className="text-xs text-muted-foreground">
                  {[plan.planRole ? t("common.duty", { value: plan.planRole }) : "", plan.phaseLabel ? t("runtime.context.phase", { value: plan.phaseLabel }) : ""].filter(Boolean).join(" | ")}
                </div>
              ) : null}
              {plan.participants.length > 0 ? (
                <div className="text-xs text-muted-foreground">{t("runtime.context.participants", { value: plan.participants.join(t("common.sepPause")) })}</div>
              ) : null}
              {plan.mustAdvance.length > 0 ? (
                <div className="text-xs text-muted-foreground">{t("runtime.context.mustAdvance", { value: plan.mustAdvance.join(t("common.sepSemicolon")) })}</div>
              ) : null}
              {plan.mustPreserve.length > 0 ? (
                <div className="text-xs text-muted-foreground">{t("runtime.context.mustPreserve", { value: plan.mustPreserve.join(t("common.sepSemicolon")) })}</div>
              ) : null}
              {plan.replannedFromPlanId ? (
                <div className="text-xs text-muted-foreground">{t("runtime.context.fromReplan")}</div>
              ) : null}
              {plan.sourceIssueIds.length > 0 ? (
                <div className="text-xs text-muted-foreground">{t("runtime.context.referencedIssues", { count: plan.sourceIssueIds.length })}</div>
              ) : null}
              {plan.scenes.length > 0 ? (
                <div className="space-y-1 rounded-md border p-2 text-xs">
                  {plan.scenes.slice(0, 4).map((scene) => (
                    <div key={scene.id}>
                      <div className="font-medium">{scene.sortOrder}. {scene.title}</div>
                      <div className="text-muted-foreground">
                        {[scene.objective, scene.conflict, scene.reveal, scene.emotionBeat].filter(Boolean).join(" | ") || t("runtime.context.noSupplement")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-muted-foreground">{t("runtime.context.noPlan")}</div>
          )}
        </div>

        <div className="space-y-1">
          <div className="font-medium">{t("runtime.context.snapshotSection")}</div>
          {stateSnapshot ? (
            <>
              <div>{stateSnapshot.summary || t("runtime.context.noSummary")}</div>
              {stateSnapshot.characterStates.length > 0 ? (
                <div className="rounded-md border p-2 text-xs">
                  {stateSnapshot.characterStates.slice(0, 4).map((item) => (
                    <div key={item.characterId} className="text-muted-foreground">
                      {item.summary || item.emotion || item.currentGoal || item.characterId}
                    </div>
                  ))}
                </div>
              ) : null}
              {stateSnapshot.informationStates.length > 0 ? (
                <div className="text-xs text-muted-foreground">
                  {t("runtime.context.knowledgeStates", { value: stateSnapshot.informationStates.slice(0, 3).map((item) => item.fact).join(t("common.sepSemicolon")) })}
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-muted-foreground">{t("runtime.context.noSnapshot")}</div>
          )}
        </div>

        <div className="space-y-1">
          <div className="font-medium">{t("runtime.context.conflictSection")}</div>
          {openConflicts.length > 0 ? (
            <div className="space-y-2">
              {openConflicts.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-md border p-2 text-xs">
                  <div className="mb-1 flex items-center gap-2">
                    <SeverityBadge severity={item.severity} />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div>{item.summary}</div>
                  {typeof item.lastSeenChapterOrder === "number" ? (
                    <div className="mt-1 text-muted-foreground">{t("runtime.context.lastSeen", { order: item.lastSeenChapterOrder })}</div>
                  ) : null}
                  {item.resolutionHint ? (
                    <div className="mt-1 text-muted-foreground">{t("common.suggestion", { value: item.resolutionHint })}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">{t("runtime.context.noConflict")}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChapterRuntimeAuditCard(props: {
  runtimePackage: ChapterRuntimePackage | null;
  auditReports?: AuditReport[];
  replanRecommendation?: ReplanRecommendation | null;
  onReplan?: () => void;
  isReplanning?: boolean;
  lastReplanResult?: ReplanResult | null;
}) {
  const { t } = useTranslation("novelsEditA");
  const audit = buildAuditView(props.runtimePackage, props.auditReports);
  const replanSummary = buildReplanSummary(
    props.runtimePackage,
    props.auditReports,
    props.replanRecommendation,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("runtime.audit.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="font-medium">{t("runtime.audit.totalScore", { score: audit.score.overall })}</div>
          <Badge variant={audit.hasBlockingIssues ? "default" : "outline"}>
            {audit.hasBlockingIssues ? t("runtime.audit.needsAction") : t("runtime.audit.canContinue")}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("runtime.audit.reportSummary", { reports: audit.reports.length, issues: audit.openIssues.length })}
        </div>
        {replanSummary ? (
          <div className="rounded-md border p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">
                {t("runtime.audit.followupPlan")}{replanSummary.recommended ? t("runtime.audit.suggestAdjust") : t("runtime.audit.noAdjust")}
              </div>
              {typeof props.onReplan === "function" ? (
                <Button
                  size="sm"
                  variant={replanSummary.recommended ? "default" : "outline"}
                  onClick={props.onReplan}
                  disabled={props.isReplanning}
                >
                  {props.isReplanning ? t("runtime.audit.replanning") : replanSummary.recommended ? t("runtime.audit.runReplan") : t("runtime.audit.viewReplan")}
                </Button>
              ) : null}
            </div>
            <div className="text-muted-foreground">{replanSummary.reason}</div>
            {replanSummary.blockingIssueIds.length > 0 ? (
              <div className="mt-1 text-muted-foreground">
                {t("runtime.audit.highRiskIssues", { count: replanSummary.blockingIssueIds.length })}
              </div>
            ) : null}
          </div>
        ) : null}
        {props.lastReplanResult ? (
          <div className="rounded-md border bg-muted/20 p-2 text-xs">
            <div className="font-medium">{t("runtime.audit.lastReplan")}</div>
            <div className="mt-1 text-muted-foreground">
              {t("runtime.audit.affectedChapters", { value: props.lastReplanResult.affectedChapterOrders.join(", ") || t("common.none") })}
            </div>
            <div className="text-muted-foreground">
              {t("runtime.audit.adjustWindow", { size: props.lastReplanResult.windowSize, trigger: buildTriggerLabel(props.lastReplanResult.triggerType) })}
            </div>
            {props.lastReplanResult.sourceIssueIds.length > 0 ? (
              <div className="text-muted-foreground">
                {t("runtime.audit.sourceIssues", { count: props.lastReplanResult.sourceIssueIds.length })}
              </div>
            ) : null}
          </div>
        ) : null}
        {audit.openIssues.length > 0 ? (
          <div className="space-y-2">
            {audit.openIssues.slice(0, 6).map((issue) => (
              <div key={issue.id} className="rounded-md border p-2 text-xs">
                <div className="mb-1 flex items-center gap-2">
                  <SeverityBadge severity={issue.severity} />
                  <span className="font-medium">{issue.code}</span>
                </div>
                <div>{issue.description}</div>
                <div className="mt-1 text-muted-foreground">{t("common.evidence", { value: issue.evidence })}</div>
                <div className="mt-1 text-muted-foreground">{t("common.suggestion", { value: issue.fixSuggestion })}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">{t("runtime.audit.noIssues")}</div>
        )}
      </CardContent>
    </Card>
  );
}
