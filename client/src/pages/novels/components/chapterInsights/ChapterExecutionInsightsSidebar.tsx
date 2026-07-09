import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChapterExecutionInsightsSidebarProps } from "./chapterInsights.types";
import CharacterDynamicsPanel from "./CharacterDynamicsPanel";
import ChapterExecutionOverviewPanel from "./ChapterExecutionOverviewPanel";
import ResourceRiskPanel from "./ResourceRiskPanel";
import TimelinePanel from "./TimelinePanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobileViewport } from "@/components/layout/mobile/useIsMobileViewport";

function DesktopSidebar(props: ChapterExecutionInsightsSidebarProps) {
  const { t } = useTranslation("novelsChapterInsights");
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "character" | "resources">("overview");

  useEffect(() => {
    setActiveTab("overview");
  }, [props.selectedChapter?.id]);

  return (
    <Card className="h-full overflow-hidden border-border/70 xl:flex xl:min-h-0 xl:flex-col">
      <CardHeader className="gap-3 border-b bg-gradient-to-b from-muted/30 via-background to-background pb-4 xl:shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{t("sidebar.title")}</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">{t("sidebar.subtitle")}</p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {props.selectedChapter
              ? t("common.chapterLabel", { order: props.selectedChapter.order })
              : t("sidebar.noChapter")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 p-0 xl:flex-1 xl:overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "timeline" | "character" | "resources")} className="xl:flex xl:h-full xl:min-h-0 xl:flex-col">
          <div className="shrink-0 border-b px-4 py-3">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/50 p-1.5">
              <TabsTrigger value="overview" className="rounded-lg px-2 py-2 text-xs">{t("common.chapterOverview")}</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg px-2 py-2 text-xs">{t("common.timeline")}</TabsTrigger>
              <TabsTrigger value="character" className="rounded-lg px-2 py-2 text-xs">{t("common.characterDynamics")}</TabsTrigger>
              <TabsTrigger value="resources" className="rounded-lg px-2 py-2 text-xs">{t("sidebar.tabResources")}</TabsTrigger>
            </TabsList>
          </div>
          <div className="min-h-0 xl:flex-1 xl:overflow-y-auto xl:px-4 xl:pb-4 xl:pt-4">
            <TabsContent value="overview" className="mt-0">
              <ChapterExecutionOverviewPanel
                selectedChapter={props.selectedChapter}
                chapterPlan={props.chapterPlan}
                chapterQualityReport={props.chapterQualityReport}
                chapterRuntimePackage={props.chapterRuntimePackage}
                reviewResult={props.reviewResult}
                openAuditIssues={props.openAuditIssues}
              />
            </TabsContent>
            <TabsContent value="timeline" className="mt-0">
              <TimelinePanel
                selectedChapter={props.selectedChapter}
                chapterTimeline={props.chapterTimeline}
                isLoadingChapterTimeline={props.isLoadingChapterTimeline}
                chapterRuntimePackage={props.chapterRuntimePackage}
              />
            </TabsContent>
            <TabsContent value="character" className="mt-0">
              <CharacterDynamicsPanel latestStateSnapshot={props.latestStateSnapshot} chapterStateSnapshot={props.chapterStateSnapshot} />
            </TabsContent>
            <TabsContent value="resources" className="mt-0">
              <ResourceRiskPanel {...props} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MobileSidebar(props: ChapterExecutionInsightsSidebarProps) {
  const { t } = useTranslation("novelsChapterInsights");
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/70 bg-background p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{t("sidebar.title")}</div>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">{t("sidebar.subtitle")}</div>
          </div>
          <Badge variant="outline">
            {props.selectedChapter
              ? t("common.chapterLabel", { order: props.selectedChapter.order })
              : t("sidebar.noChapter")}
          </Badge>
        </div>
      </div>

      <details className="group rounded-xl border border-border/70 bg-background p-3" open>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">{t("common.chapterOverview")}</div>
            <Badge variant="secondary">{t("sidebar.badgePriority")}</Badge>
          </div>
        </summary>
        <div className="pt-3">
          <ChapterExecutionOverviewPanel
            selectedChapter={props.selectedChapter}
            chapterPlan={props.chapterPlan}
            chapterQualityReport={props.chapterQualityReport}
            chapterRuntimePackage={props.chapterRuntimePackage}
            reviewResult={props.reviewResult}
            openAuditIssues={props.openAuditIssues}
          />
        </div>
      </details>

      <details className="group rounded-xl border border-border/70 bg-background p-3" open>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">{t("common.timeline")}</div>
            <Badge variant="secondary">{t("sidebar.badgeDefault")}</Badge>
          </div>
        </summary>
        <div className="pt-3">
          <TimelinePanel
            selectedChapter={props.selectedChapter}
            chapterTimeline={props.chapterTimeline}
            isLoadingChapterTimeline={props.isLoadingChapterTimeline}
            chapterRuntimePackage={props.chapterRuntimePackage}
          />
        </div>
      </details>

      <details className="group rounded-xl border border-border/70 bg-background p-3">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">{t("common.characterDynamics")}</div>
            <Badge variant="outline">{t("sidebar.badgeExpand")}</Badge>
          </div>
        </summary>
        <div className="pt-3">
          <CharacterDynamicsPanel latestStateSnapshot={props.latestStateSnapshot} chapterStateSnapshot={props.chapterStateSnapshot} />
        </div>
      </details>

      <details className="group rounded-xl border border-border/70 bg-background p-3">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">{t("common.resourcesAndRisks")}</div>
            <Badge variant="outline">{t("sidebar.badgeExpand")}</Badge>
          </div>
        </summary>
        <div className="pt-3">
          <ResourceRiskPanel {...props} />
        </div>
      </details>
    </div>
  );
}

export default function ChapterExecutionInsightsSidebar(props: ChapterExecutionInsightsSidebarProps) {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport) {
    return <MobileSidebar {...props} />;
  }

  return <DesktopSidebar {...props} />;
}
