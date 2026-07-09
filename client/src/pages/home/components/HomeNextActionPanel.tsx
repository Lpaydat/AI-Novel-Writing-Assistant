import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpenText, Loader2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getWorkflowBadge } from "@/lib/novelWorkflowTaskUi";
import {
  DIRECTOR_CREATE_LINK,
  formatHomeDate,
  type HomeNextAction,
  MANUAL_CREATE_LINK,
  type HomeNovelItem,
} from "../homeViewModel";
import { toneBorderClass, toneSurfaceClass, toneTextClass } from "./homeTone";

export type RenderNovelPrimaryAction = (
  novel: HomeNovelItem,
  options?: {
    size?: "default" | "sm" | "lg";
    stopPropagation?: boolean;
  },
) => ReactNode;

export function HomeNextActionPanel(props: {
  action: HomeNextAction;
  primaryNovel: HomeNovelItem | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  renderNovelPrimaryAction: RenderNovelPrimaryAction;
}) {
  const { t } = useTranslation("homeDashboard");
  if (props.loading) {
    return (
      <Card className="home-next-action-panel overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("nextActionPanel.loading")}
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (props.error) {
    return (
      <Card className="home-next-action-panel border-destructive/35">
        <CardContent className="space-y-4 p-6">
          <Badge variant="destructive">{t("nextActionPanel.errorBadge")}</Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">{t("nextActionPanel.errorTitle")}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("nextActionPanel.errorDescription")}
            </p>
          </div>
          <Button onClick={props.onRetry}>{t("nextActionPanel.reload")}</Button>
        </CardContent>
      </Card>
    );
  }

  if (props.action.kind === "starter" || !props.primaryNovel) {
    return (
      <Card className={cn("home-next-action-panel overflow-hidden", toneBorderClass(props.action.tone), toneSurfaceClass(props.action.tone))}>
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0 space-y-4">
            <Badge variant="outline" className={toneTextClass(props.action.tone)}>
              {props.action.eyebrow}
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">{props.action.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{props.action.description}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-3 text-sm leading-6 text-muted-foreground">
              {props.action.reason}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-64 lg:grid-cols-1">
            <Button asChild size="lg">
              <Link to={DIRECTOR_CREATE_LINK}>
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("cta.openWithDirector")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={MANUAL_CREATE_LINK}>{t("cta.createManually")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/help">{t("cta.onboarding")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const novel = props.primaryNovel;
  const task = novel.latestAutoDirectorTask ?? null;
  const workflowBadge = getWorkflowBadge(task);

  return (
    <Card className={cn("home-next-action-panel overflow-hidden", toneBorderClass(props.action.tone), toneSurfaceClass(props.action.tone))}>
      <CardContent className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={toneTextClass(props.action.tone)}>
              {props.action.eyebrow}
            </Badge>
            {workflowBadge ? (
              <Badge variant={workflowBadge.variant}>{workflowBadge.label}</Badge>
            ) : null}
            <Badge variant={novel.status === "published" ? "default" : "secondary"}>
              {novel.status === "published" ? t("badge.published") : t("badge.draft")}
            </Badge>
            <Badge variant="outline">{novel.writingMode === "continuation" ? t("badge.continuation") : t("badge.original")}</Badge>
          </div>

          <div>
            <h1 className="break-words text-2xl font-semibold tracking-normal sm:text-3xl">
              {props.action.title}
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{props.action.description}</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
            <div className="rounded-lg border bg-background/80 p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <ArrowRight className={cn("h-4 w-4", toneTextClass(props.action.tone))} aria-hidden="true" />
                {t("nextActionPanel.reasonLabel")}
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{props.action.reason}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-background/70 p-3">
                <div>{t("fact.chapters")}</div>
                <div className="mt-1 text-base font-semibold text-foreground">{novel._count.chapters}</div>
              </div>
              <div className="rounded-lg border bg-background/70 p-3">
                <div>{t("fact.characters")}</div>
                <div className="mt-1 text-base font-semibold text-foreground">{novel._count.characters}</div>
              </div>
              <div className="rounded-lg border bg-background/70 p-3">
                <div>{t("fact.world")}</div>
                <div className="mt-1 truncate text-base font-semibold text-foreground">{novel.world?.name ?? t("fact.worldUnbound")}</div>
              </div>
              <div className="rounded-lg border bg-background/70 p-3">
                <div>{t("fact.updated")}</div>
                <div className="mt-1 truncate text-base font-semibold text-foreground">{formatHomeDate(novel.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3 rounded-lg border bg-background/85 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpenText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t("nextActionPanel.currentProject")}
          </div>
          <div>
            <div className="line-clamp-2 text-lg font-semibold">{novel.title}</div>
            {task?.currentStage ? (
              <p className="mt-2 text-xs text-muted-foreground">{t("nextActionPanel.stage", { stage: task.currentStage })}</p>
            ) : null}
            {task?.lastHealthyStage ? (
              <p className="mt-1 text-xs text-muted-foreground">{t("nextActionPanel.lastHealthyStage", { stage: task.lastHealthyStage })}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            {props.renderNovelPrimaryAction(novel, { size: "lg" })}
            {task ? (
              <Button asChild size="lg" variant="outline">
                <Link to={`/novels/${novel.id}/edit?directorTaskId=${task.id}&taskPanel=1`}>
                  {t("card.executionDetail")}
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline">
                <Link to={`/novels/${novel.id}/edit`}>{t("card.openProject")}</Link>
              </Button>
            )}
          </div>
        </aside>
      </CardContent>
    </Card>
  );
}
