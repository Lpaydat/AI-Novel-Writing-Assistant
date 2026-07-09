import type { KeyboardEvent, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpenText } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkflowBadge } from "@/lib/novelWorkflowTaskUi";
import { cn } from "@/lib/utils";
import {
  formatHomeDate,
  getNovelLeadSummary,
  type HomeNovelItem,
} from "../homeViewModel";
import type { RenderNovelPrimaryAction } from "./HomeNextActionPanel";

export function HomeRecentNovels(props: {
  novels: HomeNovelItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onOpenNovel: (novelId: string) => void;
  onStopCardClick: (event: MouseEvent<HTMLElement>) => void;
  renderNovelPrimaryAction: RenderNovelPrimaryAction;
}) {
  const { t } = useTranslation("homeDashboard");
  return (
    <Card className="home-recent-novels">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg tracking-normal">
            <BookOpenText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            {t("recentNovels.title")}
          </CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to="/novels">{t("recentNovels.viewAll")}</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`home-loading-${index}`} className="space-y-3 rounded-lg border p-4">
                <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : props.error ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{t("recentNovels.error")}</div>
            <Button variant="outline" onClick={props.onRetry}>{t("recentNovels.reload")}</Button>
          </div>
        ) : props.novels.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {t("recentNovels.empty")}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {props.novels.map((novel) => (
              <RecentNovelCard
                key={novel.id}
                novel={novel}
                onOpenNovel={props.onOpenNovel}
                onStopCardClick={props.onStopCardClick}
                renderNovelPrimaryAction={props.renderNovelPrimaryAction}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentNovelCard(props: {
  novel: HomeNovelItem;
  onOpenNovel: (novelId: string) => void;
  onStopCardClick: (event: MouseEvent<HTMLElement>) => void;
  renderNovelPrimaryAction: RenderNovelPrimaryAction;
}) {
  const { t } = useTranslation("homeDashboard");
  const workflowTask = props.novel.latestAutoDirectorTask ?? null;
  const workflowBadge = getWorkflowBadge(workflowTask);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      props.onOpenNovel(props.novel.id);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      className="cursor-pointer rounded-lg border bg-background p-4 transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
      onClick={() => props.onOpenNovel(props.novel.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="line-clamp-1 text-lg font-semibold">{props.novel.title}</div>
            <div className="flex flex-wrap items-center gap-2">
              {workflowBadge ? (
                <Badge variant={workflowBadge.variant}>{workflowBadge.label}</Badge>
              ) : (
                <Badge variant="outline">{t("recentNovels.projectInfoBadge")}</Badge>
              )}
              {workflowTask ? (
                <Badge variant="outline">{t("badge.progress", { percent: Math.round(workflowTask.progress * 100) })}</Badge>
              ) : null}
            </div>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {getNovelLeadSummary(props.novel)}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <Fact label={t("fact.chapters")} value={String(props.novel._count.chapters)} />
          <Fact label={t("fact.characters")} value={String(props.novel._count.characters)} />
          <Fact label={t("fact.world")} value={props.novel.world?.name ?? t("fact.worldUnbound")} />
          <Fact label={t("fact.updated")} value={formatHomeDate(props.novel.updatedAt)} />
        </div>

        <div className="flex flex-wrap gap-2">
          {props.renderNovelPrimaryAction(props.novel, { stopPropagation: true })}
          {workflowTask ? (
            <Button asChild size="sm" variant="outline">
              <Link
                to={`/novels/${props.novel.id}/edit?directorTaskId=${workflowTask.id}&taskPanel=1`}
                onClick={props.onStopCardClick}
              >
                {t("card.executionDetail")}
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to={`/novels/${props.novel.id}/edit`} onClick={props.onStopCardClick}>
                {t("card.openProject")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact(props: {
  label: string;
  value: string;
}) {
  const { t } = useTranslation("homeDashboard");
  return (
    <div className="min-w-0 rounded-md border bg-muted/20 px-2 py-1.5">
      <div>{props.label}</div>
      <div className={cn("mt-0.5 truncate font-medium text-foreground", props.value === t("fact.worldUnbound") ? "text-amber-700" : "")}>
        {props.value}
      </div>
    </div>
  );
}
