import { useTranslation } from "react-i18next";
import type { TaskKind, TaskStatus } from "@ai-novel/shared/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TaskSortMode } from "../taskCenterUtils";
import SelectControl from "@/components/common/SelectControl";

interface TaskCenterFilterPanelProps {
  kind: TaskKind | "";
  status: TaskStatus | "";
  keyword: string;
  onlyAnomaly: boolean;
  sortMode: TaskSortMode;
  onKindChange: (value: TaskKind | "") => void;
  onStatusChange: (value: TaskStatus | "") => void;
  onKeywordChange: (value: string) => void;
  onOnlyAnomalyChange: (value: boolean) => void;
  onSortModeChange: (value: TaskSortMode) => void;
}

export default function TaskCenterFilterPanel({
  kind,
  status,
  keyword,
  onlyAnomaly,
  sortMode,
  onKindChange,
  onStatusChange,
  onKeywordChange,
  onOnlyAnomalyChange,
  onSortModeChange,
}: TaskCenterFilterPanelProps) {
  const { t } = useTranslation("tasks");
  return (
    <Card className="task-filter-card">
      <CardHeader className="task-filter-header">
        <CardTitle className="text-base">{t("filter.title")}</CardTitle>
      </CardHeader>
      <CardContent className="task-filter-controls grid min-w-0 grid-cols-3 gap-2 xl:grid-cols-1">
        <SelectControl
          className="task-filter-kind col-start-1 row-start-1 w-full rounded-md border bg-background px-2 py-2 text-sm xl:col-auto xl:row-auto"
          value={kind}
          onChange={(event) => onKindChange(event.target.value as TaskKind | "")}
        >
          <option value="">{t("filter.kindAll")}</option>
          <option value="book_analysis">{t("kind.bookAnalysis")}</option>
          <option value="novel_workflow">{t("kind.novelWorkflow")}</option>
          <option value="novel_pipeline">{t("kind.novelPipeline")}</option>
          <option value="knowledge_document">{t("kind.knowledgeDocument")}</option>
          <option value="image_generation">{t("kind.imageGeneration")}</option>
          <option value="style_extraction">{t("kind.styleExtraction")}</option>
          <option value="agent_run">{t("kind.agentRun")}</option>
        </SelectControl>
        <SelectControl
          className="task-filter-status col-start-2 row-start-1 w-full rounded-md border bg-background px-2 py-2 text-sm xl:col-auto xl:row-auto"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as TaskStatus | "")}
        >
          <option value="">{t("filter.statusAll")}</option>
          <option value="queued">{t("status.queued")}</option>
          <option value="running">{t("status.running")}</option>
          <option value="waiting_approval">{t("status.waitingApproval")}</option>
          <option value="failed">{t("status.failed")}</option>
          <option value="cancelled">{t("status.cancelled")}</option>
          <option value="succeeded">{t("status.succeeded")}</option>
        </SelectControl>
        <label className="task-filter-pill col-start-3 row-start-1 flex items-center gap-1.5 rounded-md border bg-muted/30 px-1.5 py-2 text-xs text-muted-foreground sm:gap-2 sm:px-2 sm:text-sm xl:col-auto xl:row-auto">
          <input
            type="checkbox"
            checked={onlyAnomaly}
            onChange={(event) => onOnlyAnomalyChange(event.target.checked)}
          />
          {t("filter.onlyAnomaly")}
        </label>
        <Input
          className="task-filter-keyword col-span-2 col-start-1 row-start-2 h-10 px-2 xl:col-auto xl:row-auto"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={t("filter.keywordPlaceholder")}
        />
        <SelectControl
          className="task-filter-sort col-start-3 row-start-2 w-full rounded-md border bg-background px-2 py-2 text-sm xl:col-auto xl:row-auto"
          value={sortMode}
          onChange={(event) => onSortModeChange(event.target.value as TaskSortMode)}
        >
          <option value="updated_desc">{t("filter.sortUpdatedDesc")}</option>
          <option value="updated_asc">{t("filter.sortUpdatedAsc")}</option>
          <option value="heartbeat_desc">{t("filter.sortHeartbeatDesc")}</option>
          <option value="heartbeat_asc">{t("filter.sortHeartbeatAsc")}</option>
          <option value="default">{t("filter.sortDefault")}</option>
        </SelectControl>
      </CardContent>
    </Card>
  );
}
