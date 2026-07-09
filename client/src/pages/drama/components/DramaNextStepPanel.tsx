import {
  CheckCircle2,
  Download,
  Layers3,
  ListVideo,
  RefreshCw,
  Sparkles,
  Video,
  Wand2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DramaEpisode, DramaProjectDetail, DramaShot, DramaVideoPrompt } from "@/api/drama";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type NextStepKind =
  | "source"
  | "strategy"
  | "outline"
  | "script"
  | "review"
  | "repair"
  | "storyboard"
  | "videoPrompt"
  | "providerTask"
  | "export";

interface NextStep {
  kind: NextStepKind;
  titleKey: string;
  descriptionKey: string;
  buttonKey: string;
  tab: "source" | "strategy" | "episodes" | "visual" | "export";
  icon: "source" | "strategy" | "outline" | "script" | "review" | "repair" | "video" | "export";
  episodeOrder?: number;
  shot?: DramaShot;
  videoPrompt?: DramaVideoPrompt;
}

function firstEpisodeWithoutScript(episodes: DramaEpisode[]): DramaEpisode | undefined {
  return episodes.find((episode) => !episode.content?.trim());
}

function firstEpisodeWithoutReview(episodes: DramaEpisode[]): DramaEpisode | undefined {
  return episodes.find((episode) =>
    Boolean(episode.content?.trim()) && !["reviewed", "needs_repair", "approved"].includes(episode.status)
  );
}

function firstRepairableEpisode(episodes: DramaEpisode[]): DramaEpisode | undefined {
  return episodes.find((episode) => episode.status === "needs_repair");
}

function firstEpisodeWithoutStoryboard(episodes: DramaEpisode[]): DramaEpisode | undefined {
  return episodes.find((episode) => Boolean(episode.content?.trim()) && (episode.storyboards?.length ?? 0) === 0);
}

function firstShotWithoutVideoPrompt(episodes: DramaEpisode[], videoPrompts: DramaVideoPrompt[]): {
  episode: DramaEpisode;
  shot: DramaShot;
} | undefined {
  const promptedShotIds = new Set(videoPrompts.filter(isActiveVideoPrompt).map((prompt) => prompt.shotId).filter(Boolean));
  for (const episode of episodes) {
    for (const storyboard of episode.storyboards ?? []) {
      for (const shot of storyboard.shots ?? []) {
        if (!promptedShotIds.has(shot.id)) {
          return { episode, shot };
        }
      }
    }
  }
  return undefined;
}

function firstPromptWithoutProviderTask(videoPrompts: DramaVideoPrompt[]): DramaVideoPrompt | undefined {
  return videoPrompts.find((prompt) => isActiveVideoPrompt(prompt) && !prompt.providerTaskId);
}

function isActiveVideoPrompt(prompt: DramaVideoPrompt): boolean {
  return prompt.status !== "superseded";
}

function buildNextStep(project: DramaProjectDetail): NextStep {
  const episodes = project.episodes ?? [];
  const videoPrompts = (project.videoPrompts ?? []).filter(isActiveVideoPrompt);
  const repairable = firstRepairableEpisode(episodes);
  const unreviewed = firstEpisodeWithoutReview(episodes);
  const unscripted = firstEpisodeWithoutScript(episodes);
  const unstagedStoryboard = firstEpisodeWithoutStoryboard(episodes);
  const shotWithoutPrompt = firstShotWithoutVideoPrompt(episodes, videoPrompts);
  const promptWithoutTask = firstPromptWithoutProviderTask(videoPrompts);

  if (!project.sourceBundle) {
    return {
      kind: "source",
      titleKey: "nextStep.sourceTitle",
      descriptionKey: "nextStep.sourceDesc",
      buttonKey: "common.assembleSource",
      tab: "source",
      icon: "source",
    };
  }
  if (!project.strategy) {
    return {
      kind: "strategy",
      titleKey: "nextStep.strategyTitle",
      descriptionKey: "nextStep.strategyDesc",
      buttonKey: "common.generateStrategy",
      tab: "strategy",
      icon: "strategy",
    };
  }
  if (episodes.length === 0) {
    return {
      kind: "outline",
      titleKey: "nextStep.outlineTitle",
      descriptionKey: "nextStep.outlineDesc",
      buttonKey: "common.generateFirst12",
      tab: "episodes",
      icon: "outline",
    };
  }
  if (unscripted) {
    return {
      kind: "script",
      titleKey: "nextStep.scriptTitle",
      descriptionKey: "nextStep.scriptDesc",
      buttonKey: "common.generateScript",
      tab: "episodes",
      icon: "script",
      episodeOrder: unscripted.order,
    };
  }
  if (repairable) {
    return {
      kind: "repair",
      titleKey: "nextStep.repairTitle",
      descriptionKey: "nextStep.repairDesc",
      buttonKey: "nextStep.repairButton",
      tab: "episodes",
      icon: "repair",
      episodeOrder: repairable.order,
    };
  }
  if (unreviewed) {
    return {
      kind: "review",
      titleKey: "nextStep.reviewTitle",
      descriptionKey: "nextStep.reviewDesc",
      buttonKey: "common.qualityCheck",
      tab: "episodes",
      icon: "review",
      episodeOrder: unreviewed.order,
    };
  }
  if (unstagedStoryboard) {
    return {
      kind: "storyboard",
      titleKey: "nextStep.storyboardTitle",
      descriptionKey: "nextStep.storyboardDesc",
      buttonKey: "common.generateStoryboard",
      tab: "visual",
      icon: "video",
      episodeOrder: unstagedStoryboard.order,
    };
  }
  if (shotWithoutPrompt) {
    return {
      kind: "videoPrompt",
      titleKey: "nextStep.videoPromptTitle",
      descriptionKey: "nextStep.videoPromptDesc",
      buttonKey: "nextStep.videoPromptButton",
      tab: "visual",
      icon: "video",
      episodeOrder: shotWithoutPrompt.episode.order,
      shot: shotWithoutPrompt.shot,
    };
  }
  if (promptWithoutTask) {
    return {
      kind: "providerTask",
      titleKey: "nextStep.providerTaskTitle",
      descriptionKey: "nextStep.providerTaskDesc",
      buttonKey: "common.createVideoTask",
      tab: "visual",
      icon: "video",
      videoPrompt: promptWithoutTask,
    };
  }
  return {
    kind: "export",
    titleKey: "nextStep.exportTitle",
    descriptionKey: "nextStep.exportDesc",
    buttonKey: "common.exportMarkdown",
    tab: "export",
    icon: "export",
  };
}

function StepIcon({ icon }: { icon: NextStep["icon"] }) {
  const className = "h-4 w-4";
  if (icon === "source") return <Layers3 className={className} />;
  if (icon === "strategy") return <Sparkles className={className} />;
  if (icon === "outline") return <ListVideo className={className} />;
  if (icon === "script") return <Wand2 className={className} />;
  if (icon === "review") return <CheckCircle2 className={className} />;
  if (icon === "repair") return <RefreshCw className={className} />;
  if (icon === "video") return <Video className={className} />;
  return <Download className={className} />;
}

export function DramaNextStepPanel(props: {
  project: DramaProjectDetail;
  busy: boolean;
  onSetTab: (tab: NextStep["tab"]) => void;
  onSelectEpisode: (order: number) => void;
  onAssembleSource: () => void;
  onGenerateStrategy: () => void;
  onGenerateOutline: () => void;
  onGenerateScript: (order: number) => void;
  onReviewEpisode: (order: number) => void;
  onRepairEpisode: (order: number) => void;
  onGenerateStoryboard: (order: number) => void;
  onGenerateVideoPrompt: (shot: DramaShot) => void;
  onCreateProviderTask: (prompt: DramaVideoPrompt) => void;
  onExportMarkdown: () => void;
}) {
  const { t } = useTranslation("drama");
  const step = buildNextStep(props.project);
  const runStep = () => {
    props.onSetTab(step.tab);
    if (step.episodeOrder) {
      props.onSelectEpisode(step.episodeOrder);
    }
    if (step.kind === "source") props.onAssembleSource();
    if (step.kind === "strategy") props.onGenerateStrategy();
    if (step.kind === "outline") props.onGenerateOutline();
    if (step.kind === "script" && step.episodeOrder) props.onGenerateScript(step.episodeOrder);
    if (step.kind === "review" && step.episodeOrder) props.onReviewEpisode(step.episodeOrder);
    if (step.kind === "repair" && step.episodeOrder) props.onRepairEpisode(step.episodeOrder);
    if (step.kind === "storyboard" && step.episodeOrder) props.onGenerateStoryboard(step.episodeOrder);
    if (step.kind === "videoPrompt" && step.shot) props.onGenerateVideoPrompt(step.shot);
    if (step.kind === "providerTask" && step.videoPrompt) props.onCreateProviderTask(step.videoPrompt);
    if (step.kind === "export") props.onExportMarkdown();
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">{t(step.titleKey, { order: step.episodeOrder })}</CardTitle>
            <Badge variant="outline">{t("nextStep.episodesProject", { count: props.project.targetEpisodes })}</Badge>
          </div>
          <CardDescription>{t(step.descriptionKey)}</CardDescription>
        </div>
        <Button type="button" disabled={props.busy} onClick={runStep}>
          <StepIcon icon={step.icon} />
          {props.busy ? t("nextStep.processing") : t(step.buttonKey)}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span>{t("nextStep.sourceReadyLabel", { value: props.project.sourceBundle ? t("common.yes") : t("common.no") })}</span>
        <span>{t("nextStep.strategyStatus", { value: props.project.strategy ? t("common.generated") : t("common.notGenerated") })}</span>
        <span>{t("nextStep.episodesStat", { count: props.project.episodes?.length ?? 0 })}</span>
        <span>{t("nextStep.videoPromptsStat", { count: (props.project.videoPrompts ?? []).filter(isActiveVideoPrompt).length })}</span>
      </CardContent>
    </Card>
  );
}
