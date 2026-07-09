import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Character } from "@ai-novel/shared/types/novel";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  confirmCharacterCandidate,
  getCharacterCandidates,
  getCharacterDynamicsOverview,
  mergeCharacterCandidate,
  rebuildCharacterDynamics,
  updateCharacterDynamicState,
} from "@/api/novelCharacterDynamics";
import { queryKeys } from "@/api/queryKeys";

type DynamicsView = "overview" | "candidates" | "relations" | "duties";

interface CharacterDynamicsSectionProps {
  novelId: string;
  selectedCharacter?: Character;
  selectedCharacterId: string;
  onSelectedCharacterChange: (id: string) => void;
}

function riskTone(risk: "none" | "info" | "warn" | "high"): string {
  switch (risk) {
    case "high":
      return "border-rose-300/70 bg-rose-50 text-rose-700";
    case "warn":
      return "border-amber-300/70 bg-amber-50 text-amber-700";
    case "info":
      return "border-sky-300/70 bg-sky-50 text-sky-700";
    default:
      return "border-border/70 bg-background text-muted-foreground";
  }
}

export default function CharacterDynamicsSection(props: CharacterDynamicsSectionProps) {
  const { t } = useTranslation("novelsEditA");
  const { novelId, selectedCharacter, selectedCharacterId, onSelectedCharacterChange } = props;
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<DynamicsView>("overview");
  const [manualState, setManualState] = useState({
    currentState: "",
    currentGoal: "",
    factionLabel: "",
    stanceLabel: "",
    summary: "",
  });

  useEffect(() => {
    setManualState({
      currentState: selectedCharacter?.currentState ?? "",
      currentGoal: selectedCharacter?.currentGoal ?? "",
      factionLabel: "",
      stanceLabel: "",
      summary: "",
    });
  }, [selectedCharacter?.id, selectedCharacter?.currentGoal, selectedCharacter?.currentState]);

  const overviewQuery = useQuery({
    queryKey: queryKeys.novels.characterDynamicsOverview(novelId),
    queryFn: () => getCharacterDynamicsOverview(novelId),
    enabled: Boolean(novelId),
  });

  const candidatesQuery = useQuery({
    queryKey: queryKeys.novels.characterCandidates(novelId),
    queryFn: () => getCharacterCandidates(novelId),
    enabled: Boolean(novelId),
  });

  const overview = overviewQuery.data?.data ?? null;
  const candidates = candidatesQuery.data?.data ?? [];
  const pendingCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.status === "pending"),
    [candidates],
  );
  const assignmentsByCharacterId = useMemo(
    () => new Map((overview?.assignments ?? []).map((assignment) => [assignment.characterId, assignment])),
    [overview?.assignments],
  );
  const selectedOverviewCharacter = useMemo(
    () => overview?.characters.find((item) => item.characterId === selectedCharacterId) ?? null,
    [overview?.characters, selectedCharacterId],
  );

  const invalidateDynamics = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.novels.detail(novelId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.novels.characterRelations(novelId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.novels.characterDynamicsOverview(novelId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.novels.characterCandidates(novelId) }),
    ]);
  };

  const rebuildMutation = useMutation({
    mutationFn: () => rebuildCharacterDynamics(novelId),
    onSuccess: async () => {
      await invalidateDynamics();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (candidateId: string) => confirmCharacterCandidate(novelId, candidateId),
    onSuccess: async (response) => {
      const characterId = response.data?.characterId ?? "";
      if (characterId) {
        onSelectedCharacterChange(characterId);
      }
      await invalidateDynamics();
    },
  });

  const mergeMutation = useMutation({
    mutationFn: (candidateId: string) => mergeCharacterCandidate(novelId, candidateId, {
      characterId: selectedCharacterId,
    }),
    onSuccess: async () => {
      await invalidateDynamics();
    },
  });

  const manualStateMutation = useMutation({
    mutationFn: () => {
      if (!selectedCharacterId) {
        throw new Error(t("dynamics.selectCharacterError"));
      }
      return updateCharacterDynamicState(novelId, selectedCharacterId, {
        currentState: manualState.currentState.trim() || undefined,
        currentGoal: manualState.currentGoal.trim() || undefined,
        factionLabel: manualState.factionLabel.trim() || undefined,
        stanceLabel: manualState.stanceLabel.trim() || undefined,
        summary: manualState.summary.trim() || undefined,
        decisionNote: manualState.summary.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await invalidateDynamics();
    },
  });

  return (
    <Card className="border-border/70">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("dynamics.title")}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {t("dynamics.subtitle")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{overview?.currentVolume?.title ?? t("dynamics.noCurrentVolume")}</Badge>
            <Badge variant="outline">{t("dynamics.pendingCandidates", { count: overview?.pendingCandidateCount ?? pendingCandidates.length })}</Badge>
            <AiButton
              variant="outline"
              size="sm"
              onClick={() => rebuildMutation.mutate()}
              disabled={rebuildMutation.isPending}
            >
              {rebuildMutation.isPending ? t("dynamics.rebuilding") : t("dynamics.rebuild")}
            </AiButton>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["overview", "candidates", "relations", "duties"] as DynamicsView[]).map((view) => (
            <Button
              key={view}
              type="button"
              size="sm"
              variant={activeView === view ? "default" : "outline"}
              onClick={() => setActiveView(view)}
            >
              {{
                overview: t("dynamics.view.overview"),
                candidates: t("dynamics.view.candidates"),
                relations: t("dynamics.view.relations"),
                duties: t("dynamics.view.duties"),
              }[view]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {overviewQuery.isLoading ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            {t("dynamics.loading")}
          </div>
        ) : null}

        {activeView === "overview" && overview ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              {overview.summary}
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {overview.characters.map((item) => (
                <button
                  key={item.characterId}
                  type="button"
                  onClick={() => onSelectedCharacterChange(item.characterId)}
                  className="rounded-2xl border border-border/70 p-4 text-left transition hover:border-primary/40 hover:bg-muted/20"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.role}</div>
                    </div>
                    <Badge className={riskTone(item.absenceRisk)} variant="outline">
                      {item.absenceRisk === "none" ? t("dynamics.stable") : t("dynamics.risk", { value: item.absenceRisk })}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div>{t("dynamics.volumeDuty", { value: item.volumeResponsibility ?? t("dynamics.notAssigned") })}</div>
                    <div>{t("dynamics.plannedChapters", { value: item.plannedChapterOrders.join(t("common.sepPause")) || t("common.undefined") })}</div>
                    <div>{t("dynamics.lastAppearanceCount", { last: item.lastAppearanceChapterOrder ?? t("common.none"), count: item.appearanceCount })}</div>
                    {item.factionLabel ? <div>{t("dynamics.faction", { value: item.factionLabel })}{item.stanceLabel ? t("dynamics.stanceSuffix", { value: item.stanceLabel }) : ""}</div> : null}
                  </div>
                </button>
              ))}
            </div>

            {selectedCharacter ? (
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="mb-3 text-sm font-medium">{t("dynamics.manualTitle")}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder={t("dynamics.currentStatePlaceholder")}
                    value={manualState.currentState}
                    onChange={(event) => setManualState((prev) => ({ ...prev, currentState: event.target.value }))}
                  />
                  <Input
                    placeholder={t("dynamics.currentGoalPlaceholder")}
                    value={manualState.currentGoal}
                    onChange={(event) => setManualState((prev) => ({ ...prev, currentGoal: event.target.value }))}
                  />
                  <Input
                    placeholder={t("dynamics.factionPlaceholder")}
                    value={manualState.factionLabel}
                    onChange={(event) => setManualState((prev) => ({ ...prev, factionLabel: event.target.value }))}
                  />
                  <Input
                    placeholder={t("dynamics.stancePlaceholder")}
                    value={manualState.stanceLabel}
                    onChange={(event) => setManualState((prev) => ({ ...prev, stanceLabel: event.target.value }))}
                  />
                </div>
                <textarea
                  className="mt-3 min-h-[88px] w-full rounded-xl border bg-background p-3 text-sm"
                  placeholder={t("dynamics.summaryPlaceholder")}
                  value={manualState.summary}
                  onChange={(event) => setManualState((prev) => ({ ...prev, summary: event.target.value }))}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => manualStateMutation.mutate()}
                    disabled={manualStateMutation.isPending || !selectedCharacterId}
                  >
                    {manualStateMutation.isPending ? t("common.saving") : t("dynamics.saveState")}
                  </Button>
                  {selectedOverviewCharacter?.volumeResponsibility ? (
                    <Badge variant="outline">{t("dynamics.currentVolumeDuty", { value: selectedOverviewCharacter.volumeResponsibility })}</Badge>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeView === "candidates" ? (
          pendingCandidates.length > 0 ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {pendingCandidates.map((candidate) => (
                <div key={candidate.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{candidate.proposedName}</div>
                      <div className="text-xs text-muted-foreground">
                        {candidate.proposedRole || t("dynamics.noRoleTag")}{typeof candidate.sourceChapterOrder === "number" ? t("dynamics.sourceChapterSuffix", { order: candidate.sourceChapterOrder }) : ""}
                      </div>
                    </div>
                    <Badge variant="outline">{typeof candidate.confidence === "number" ? t("dynamics.confidence", { percent: Math.round(candidate.confidence * 100) }) : t("dynamics.toConfirm")}</Badge>
                  </div>
                  {candidate.summary ? <div className="mt-3 text-sm text-muted-foreground">{candidate.summary}</div> : null}
                  {candidate.evidence.length > 0 ? (
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {candidate.evidence.map((evidence, index) => (
                        <div key={`${candidate.id}-${index}`}>{t("common.evidence", { value: evidence })}</div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => confirmMutation.mutate(candidate.id)}
                      disabled={confirmMutation.isPending}
                    >
                      {confirmMutation.isPending ? t("dynamics.confirming") : t("dynamics.confirmAsNew")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => mergeMutation.mutate(candidate.id)}
                      disabled={mergeMutation.isPending || !selectedCharacterId}
                    >
                      {mergeMutation.isPending ? t("dynamics.merging") : selectedCharacterId ? t("dynamics.mergeIntoFocus") : t("dynamics.selectExisting")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              {t("dynamics.noCandidates")}
            </div>
          )
        ) : null}

        {activeView === "relations" ? (
          overview?.relations?.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {overview.relations.map((relation) => (
                <div key={relation.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{relation.sourceCharacterName}{" -> "}{relation.targetCharacterName}</div>
                    <Badge variant="outline">{relation.stageLabel}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">{relation.stageSummary}</div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {relation.volumeTitle ? <div>{t("dynamics.volume", { value: relation.volumeTitle })}</div> : null}
                    {typeof relation.chapterOrder === "number" ? <div>{t("dynamics.lastAdvanceChapter", { order: relation.chapterOrder })}</div> : null}
                    {relation.nextTurnPoint ? <div>{t("dynamics.nextStageTrigger", { value: relation.nextTurnPoint })}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              {t("dynamics.noRelations")}
            </div>
          )
        ) : null}

        {activeView === "duties" ? (
          overview?.characters?.length ? (
            <div className="space-y-3">
              {overview.characters.map((item) => {
                const assignment = assignmentsByCharacterId.get(item.characterId);
                return (
                  <div key={item.characterId} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{assignment?.roleLabel || item.role}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {assignment?.isCore ? <Badge variant="secondary">{t("dynamics.volumeCore")}</Badge> : null}
                        <Badge className={riskTone(item.absenceRisk)} variant="outline">
                          {item.absenceRisk === "none" ? t("dynamics.noAbsenceRisk") : t("dynamics.absenceSpan", { span: item.absenceSpan })}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <div>{t("dynamics.responsibility", { value: assignment?.responsibility ?? t("dynamics.unassigned") })}</div>
                      <div>{t("dynamics.appearanceExpectation", { value: assignment?.appearanceExpectation ?? t("common.undefined") })}</div>
                      <div>{t("dynamics.plannedChaptersShort", { value: assignment?.plannedChapterOrders.join(t("common.sepPause")) || t("common.undefined") })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              {t("dynamics.noDuties")}
            </div>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
