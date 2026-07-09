import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import {
  analyzeDramaSourceSupplement,
  type DramaProjectDetail,
  type DramaSourceSupplementGuidance,
} from "@/api/drama";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

function safeJson<T>(input: string | null | undefined, fallback: T): T {
  if (!input) {
    return fallback;
  }
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

function compactText(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }
  if (input == null) {
    return "";
  }
  return JSON.stringify(input, null, 2);
}

function SourceQualityChecklist(props: {
  synopsisReady: boolean;
  beatCount: number;
  characterCount: number;
  factCount: number;
}) {
  const { t } = useTranslation("drama");
  const checks = [
    {
      label: t("source.checkSynopsis"),
      ready: props.synopsisReady,
      detail: props.synopsisReady ? t("source.synopsisReady") : t("source.synopsisMissing"),
    },
    {
      label: t("source.beatsLabel"),
      ready: props.beatCount >= 8,
      detail: props.beatCount >= 8 ? t("source.beatCount", { count: props.beatCount }) : t("source.beatCountLow", { count: props.beatCount }),
    },
    {
      label: t("source.checkCharacters"),
      ready: props.characterCount >= 2,
      detail: props.characterCount >= 2 ? t("source.characterCount", { count: props.characterCount }) : t("source.characterInsufficient"),
    },
    {
      label: t("source.factsLabel"),
      ready: props.factCount > 0,
      detail: props.factCount > 0 ? t("source.factCount", { count: props.factCount }) : t("source.factMissing"),
    },
  ];

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg">{t("source.checklistTitle")}</CardTitle>
        <CardDescription>{t("source.checklistDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {checks.map((check) => (
          <div key={check.label} className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{check.label}</span>
              <Badge variant={check.ready ? "default" : "secondary"}>{check.ready ? t("source.ready") : t("source.needSupplement")}</Badge>
            </div>
            <div className="mt-1 text-muted-foreground">{check.detail}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function readinessLabelKey(readiness: DramaSourceSupplementGuidance["readiness"]): string {
  const labels: Record<DramaSourceSupplementGuidance["readiness"], string> = {
    ready: "source.readinessReady",
    needs_supplement: "source.readinessSupplement",
    needs_rebuild: "source.readinessRebuild",
  };
  return labels[readiness];
}

function nextActionLabelKey(nextAction: DramaSourceSupplementGuidance["nextAction"]): string {
  const labels: Record<DramaSourceSupplementGuidance["nextAction"], string> = {
    continue: "source.actionContinue",
    supplement_notes: "source.actionSupplement",
    rebuild_source_bundle: "source.actionRebuild",
  };
  return labels[nextAction];
}

function SourceSupplementPanel({ project }: { project: DramaProjectDetail }) {
  const { t } = useTranslation("drama");
  const [userSupplement, setUserSupplement] = useState("");
  const [guidance, setGuidance] = useState<DramaSourceSupplementGuidance | null>(null);
  const mutation = useMutation({
    mutationFn: () => analyzeDramaSourceSupplement(project.id, {
      userSupplement: userSupplement.trim() || undefined,
    }),
    onSuccess: (response) => {
      if (response.data) {
        setGuidance(response.data);
        toast.success(t("source.supplementGenerated"));
      }
    },
  });

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="text-lg">{t("source.supplementTitle")}</CardTitle>
          <CardDescription>{t("source.supplementDesc")}</CardDescription>
        </div>
        <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? t("source.analyzing") : t("source.generateSupplement")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">{t("source.optionalNotesLabel")}</span>
          <textarea
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={userSupplement}
            placeholder={t("source.notesPlaceholder")}
            onChange={(event) => setUserSupplement(event.target.value)}
          />
        </label>
        {guidance ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={guidance.readiness === "ready" ? "default" : "secondary"}>
                {t(readinessLabelKey(guidance.readiness))}
              </Badge>
              <Badge variant="outline">{t(nextActionLabelKey(guidance.nextAction))}</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{guidance.summary}</p>
            {guidance.missingItems.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2">
                {guidance.missingItems.map((item, index) => (
                  <div key={`${item.area}-${index}`} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{item.problem}</div>
                    <div className="mt-1 text-muted-foreground">{item.impact}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="space-y-2">
              {guidance.questions.map((question, index) => (
                <div key={`${question.priority}-${index}`} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{question.priority}</Badge>
                    <span className="font-medium">{question.question}</span>
                  </div>
                  <div className="mt-1 text-muted-foreground">{question.guidance}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DramaSourcePanel({ project }: { project: DramaProjectDetail }) {
  const { t } = useTranslation("drama");
  const bundle = project.sourceBundle;
  const beats = safeJson<Array<Record<string, unknown>>>(bundle?.beats, []);
  const facts = safeJson<Array<{ text?: string; category?: string }>>(bundle?.hardFacts, []);
  const characters = project.characters ?? [];

  if (!bundle) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        {t("source.notAssembled")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SourceQualityChecklist
        synopsisReady={Boolean(bundle.synopsis?.trim())}
        beatCount={beats.length}
        characterCount={characters.length}
        factCount={facts.length}
      />
      <SourceSupplementPanel project={project} />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">{t("source.storyMaterialTitle")}</CardTitle>
            <CardDescription>{t("source.storyMaterialDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <section className="space-y-2">
              <h3 className="text-sm font-medium">{t("source.synopsis")}</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{bundle.synopsis || t("source.synopsisEmpty")}</p>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-medium">{t("source.worldNotes")}</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{bundle.worldNotes || t("source.worldNotesEmpty")}</p>
            </section>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg">{t("source.beatsLabel")}</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[360px] space-y-2 overflow-auto">
              {beats.length > 0 ? beats.slice(0, 24).map((beat, index) => (
                <div key={index} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{compactText(beat.title || beat.summary || t("source.beatFallback", { index: index + 1 }))}</div>
                  <div className="mt-1 text-muted-foreground">{compactText(beat.summary || beat.description || beat)}</div>
                </div>
              )) : <div className="text-sm text-muted-foreground">{t("source.beatsEmpty")}</div>}
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg">{t("source.factsLabel")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {facts.length > 0 ? facts.slice(0, 12).map((fact, index) => (
                <div key={index} className="rounded-md border px-3 py-2 text-sm">
                  {fact.text || compactText(fact)}
                </div>
              )) : <div className="text-sm text-muted-foreground">{t("source.factsEmpty")}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
