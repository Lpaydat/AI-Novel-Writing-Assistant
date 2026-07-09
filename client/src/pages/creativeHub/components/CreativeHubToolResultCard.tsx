import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function ch(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, { ns: "creativeHub", ...options });
}

interface CreativeHubToolResultCardProps {
  toolName: string;
  summary: string;
  success: boolean;
  output?: Record<string, unknown>;
  errorCode?: string;
  onQuickAction?: (prompt: string) => void;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map((item) => asRecord(item)).filter((item) => Object.keys(item).length > 0)
    : [];
}

function itemLabel(item: Record<string, unknown>): string {
  const candidates = ["title", "name", "label", "summary", "content"];
  for (const key of candidates) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  if (typeof item.id === "string" && item.id.trim()) {
    return item.id.trim();
  }
  return ch("toolResult.unnamedItem");
}

function compactText(value: string, max = 140): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function formatNovelProjectStatus(value: unknown): string | null {
  switch (value) {
    case "in_progress":
      return ch("projectStatus.inProgress");
    case "not_started":
      return ch("stage.notStarted");
    case "completed":
      return ch("status.succeeded");
    case "rework":
      return ch("projectStatus.rework");
    case "blocked":
      return ch("projectStatus.blocked");
    default:
      return null;
  }
}

function renderActionButtons(actions: Array<{ label: string; prompt: string }>, onQuickAction?: (prompt: string) => void) {
  if (!onQuickAction || actions.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={`${action.label}-${action.prompt}`}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickAction(action.prompt)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function renderNovelList(output: Record<string, unknown>, onQuickAction?: (prompt: string) => void) {
  const total = typeof output.total === "number" ? output.total : null;
  const items = asRecordArray(output.items).slice(0, 8);
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-600">
        {ch("toolResult.foundNovels", { count: total ?? items.length })}
        {total != null && total > items.length ? ch("toolResult.showingFirst", { count: items.length }) : ""}
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const title = itemLabel(item);
          const chapterCount = typeof item.chapterCount === "number" ? item.chapterCount : null;
          const projectStatus = formatNovelProjectStatus(item.projectStatus);
          return (
            <div key={`${item.id ?? title}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-sm font-medium text-slate-900">{ch("common.bookTitle", { title })}</div>
              <div className="mt-1 text-xs text-slate-500">
                {chapterCount != null ? ch("toolResult.chapterCountUnit", { count: chapterCount }) : ch("toolResult.chapterUnknown")}
                {projectStatus ? ` · ${projectStatus}` : ""}
              </div>
              {onQuickAction ? (
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onQuickAction(ch("toolResult.prompt.setWorkspace", { title }))}
                  >
                    {ch("toolResult.setAsWorkspace")}
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderWorkspaceCard(
  output: Record<string, unknown>,
  variant: "created" | "selected",
  onQuickAction?: (prompt: string) => void,
) {
  const title = typeof output.title === "string" && output.title.trim() ? output.title.trim() : ch("toolResult.unnamedNovel");
  const chapterCount = typeof output.chapterCount === "number" ? output.chapterCount : 0;
  const actions = variant === "created"
    ? [
      { label: ch("toolResult.viewProgress"), prompt: ch("toolResult.prompt.currentChapter") },
      { label: ch("toolResult.designCh1"), prompt: ch("toolResult.prompt.planCh1") },
    ]
    : [
      { label: ch("toolResult.viewProgress"), prompt: ch("toolResult.prompt.currentChapter") },
      { label: ch("toolResult.viewFirstTwo"), prompt: ch("toolResult.prompt.firstTwoChapters") },
    ];
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
        <div className="text-sm font-medium text-slate-900">{ch("common.bookTitle", { title })}</div>
        <div className="mt-1 text-xs text-slate-600">
          {variant === "created" ? ch("toolResult.novelCreated") : ch("toolResult.workspaceSwitched")}
        </div>
        <div className="mt-2 text-xs text-slate-500">{ch("toolResult.currentChapterCount", { count: chapterCount })}</div>
      </div>
      {renderActionButtons(actions, onQuickAction)}
    </div>
  );
}

function renderWorldBindingCard(output: Record<string, unknown>, onQuickAction?: (prompt: string) => void) {
  const novelTitle = typeof output.novelTitle === "string" && output.novelTitle.trim()
    ? output.novelTitle.trim()
    : ch("toolResult.currentNovel");
  const worldName = typeof output.worldName === "string" && output.worldName.trim()
    ? output.worldName.trim()
    : ch("toolResult.unnamedWorld");
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-3">
        <div className="text-sm font-medium text-slate-900">{ch("common.bookTitle", { title: novelTitle })}</div>
        <div className="mt-1 text-xs text-slate-600">{ch("toolResult.worldBound", { name: worldName })}</div>
      </div>
      {renderActionButtons([
        { label: ch("toolResult.viewWorldRules"), prompt: ch("toolResult.prompt.worldRules") },
        { label: ch("toolResult.checkWorldConflict"), prompt: ch("toolResult.prompt.worldConflict") },
      ], onQuickAction)}
    </div>
  );
}

function renderProductionAssetCard(
  title: string,
  description: string,
  actions: Array<{ label: string; prompt: string }>,
  onQuickAction?: (prompt: string) => void,
) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-3">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-600">{description}</div>
      </div>
      {renderActionButtons(actions, onQuickAction)}
    </div>
  );
}

function renderProductionStatusCard(output: Record<string, unknown>, onQuickAction?: (prompt: string) => void) {
  const title = typeof output.title === "string" && output.title.trim() ? output.title.trim() : ch("toolResult.currentNovel");
  const currentStage = typeof output.currentStage === "string" ? output.currentStage.trim() : ch("toolResult.unknownStage");
  const chapterCount = typeof output.chapterCount === "number" ? output.chapterCount : 0;
  const targetChapterCount = typeof output.targetChapterCount === "number" ? output.targetChapterCount : null;
  const pipelineStatus = typeof output.pipelineStatus === "string" && output.pipelineStatus.trim()
    ? output.pipelineStatus.trim()
    : ch("status.notStarted");
  const assetStages = asRecordArray(output.assetStages);
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3">
        <div className="text-sm font-medium text-slate-900">{ch("common.bookTitle", { title })}</div>
        <div className="mt-1 text-xs text-slate-600">{ch("toolResult.currentStageColon", { stage: currentStage })}</div>
        <div className="mt-1 text-xs text-slate-600">
          {ch("toolResult.chapterCatalog", { value: targetChapterCount != null ? `${chapterCount}/${targetChapterCount}` : chapterCount })}
        </div>
        <div className="mt-1 text-xs text-slate-600">{ch("toolResult.fullWriting", { status: pipelineStatus })}</div>
        {typeof output.failureSummary === "string" && output.failureSummary.trim() ? (
          <div className="mt-2 text-xs leading-5 text-slate-600">{ch("toolResult.failureSummary", { summary: output.failureSummary.trim() })}</div>
        ) : null}
      </div>
      {assetStages.length > 0 ? (
        <div className="grid gap-2">
          {assetStages.slice(0, 8).map((stage) => (
            <div key={`${stage.key ?? stage.label}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-sm font-medium text-slate-900">{String(stage.label ?? stage.key ?? ch("toolResult.stageFallback"))}</div>
              <div className="mt-1 text-xs text-slate-500">{ch("toolResult.statusColon", { status: String(stage.status ?? "unknown") })}</div>
              {typeof stage.detail === "string" && stage.detail.trim() ? (
                <div className="mt-1 text-xs text-slate-600">{stage.detail.trim()}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {renderActionButtons([
        { label: ch("toolResult.continueFullGen"), prompt: ch("toolResult.prompt.continueGen") },
        { label: ch("toolResult.viewFullProgress"), prompt: ch("toolResult.prompt.fullProgress") },
      ], onQuickAction)}
    </div>
  );
}

function renderPipelineRunCard(
  toolName: "preview_pipeline_run" | "queue_pipeline_run",
  output: Record<string, unknown>,
  onQuickAction?: (prompt: string) => void,
) {
  const startOrder = typeof output.startOrder === "number" ? output.startOrder : null;
  const endOrder = typeof output.endOrder === "number" ? output.endOrder : null;
  const jobId = typeof output.jobId === "string" && output.jobId.trim() ? output.jobId.trim() : null;
  const scope = startOrder != null && endOrder != null
    ? startOrder === endOrder
      ? ch("toolResult.chapterN", { n: startOrder })
      : ch("toolResult.chapterRange", { start: startOrder, end: endOrder })
    : ch("toolResult.currentChapterRange");
  const title = toolName === "preview_pipeline_run" ? ch("toolResult.previewTitle") : ch("toolResult.taskTitle");
  const description = toolName === "preview_pipeline_run"
    ? ch("toolResult.previewDesc", { scope })
    : ch("toolResult.taskDesc", { scope, job: jobId ? ch("toolResult.taskJob", { jobId }) : "" });
  const actions = toolName === "preview_pipeline_run"
    ? [
      { label: ch("toolResult.viewFullProgress"), prompt: ch("toolResult.prompt.fullProgress") },
      { label: ch("toolResult.viewBlocker"), prompt: ch("toolResult.prompt.whyNotStarted") },
    ]
    : [
      { label: ch("toolResult.viewFullProgress"), prompt: ch("toolResult.prompt.fullProgress") },
      { label: ch("toolResult.viewTaskStatus"), prompt: ch("toolResult.prompt.listTaskStatus") },
    ];
  return renderProductionAssetCard(title, description, actions, onQuickAction);
}

function renderDiagnosticCard(output: Record<string, unknown>, onQuickAction?: (prompt: string) => void) {
  const failureSummary = typeof output.failureSummary === "string" ? output.failureSummary : "";
  const failureDetails = typeof output.failureDetails === "string" ? output.failureDetails : "";
  const recoveryHint = typeof output.recoveryHint === "string" ? output.recoveryHint : "";
  return (
    <div className="space-y-2">
      {failureSummary ? <div className="text-sm font-medium text-slate-900">{failureSummary}</div> : null}
      {failureDetails ? <div className="text-xs leading-5 text-slate-600">{ch("toolResult.detailColon", { value: failureDetails })}</div> : null}
      {recoveryHint ? <div className="text-xs leading-5 text-slate-600">{ch("toolResult.suggestColon", { value: recoveryHint })}</div> : null}
      {renderActionButtons([
        { label: ch("toolResult.continueDiagnose"), prompt: ch("toolResult.prompt.continueDiagnose") },
        { label: ch("toolResult.viewTaskStatus"), prompt: ch("toolResult.prompt.listTaskStatus") },
      ], onQuickAction)}
    </div>
  );
}

function renderListCard(
  output: Record<string, unknown>,
  emptyLabel: string,
  onQuickAction?: (prompt: string) => void,
) {
  const items = asRecordArray(output.items).slice(0, 6);
  if (items.length === 0) {
    return <div className="text-xs text-slate-500">{emptyLabel}</div>;
  }
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${item.id ?? itemLabel(item)}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-sm font-medium text-slate-900">{itemLabel(item)}</div>
            {"status" in item && typeof item.status === "string" ? (
              <div className="mt-1 text-xs text-slate-500">{ch("toolResult.statusColon", { status: item.status })}</div>
            ) : null}
          </div>
        ))}
      </div>
      {renderActionButtons([{ label: ch("toolResult.continueFilter"), prompt: ch("toolResult.prompt.refineList") }], onQuickAction)}
    </div>
  );
}

function renderChapterCard(output: Record<string, unknown>, onQuickAction?: (prompt: string) => void) {
  const title = typeof output.title === "string" && output.title.trim() ? output.title.trim() : "";
  const order = typeof output.order === "number" ? output.order : null;
  const content = typeof output.content === "string"
    ? output.content
    : typeof output.summary === "string"
      ? output.summary
      : "";
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-900">
        {order != null ? ch("toolResult.chapterOrder", { order }) : ch("toolResult.chapterContent")}
        {title ? ch("common.bookTitle", { title }) : ""}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
        {content || ch("toolResult.noChapterContent")}
      </div>
      {renderActionButtons([
        { label: ch("toolResult.continueSummary"), prompt: ch("toolResult.prompt.summarizeContent") },
        { label: ch("toolResult.checkConflict"), prompt: ch("toolResult.prompt.checkConflict") },
      ], onQuickAction)}
    </div>
  );
}

export default function CreativeHubToolResultCard({
  toolName,
  summary,
  success,
  output,
  errorCode,
  onQuickAction,
}: CreativeHubToolResultCardProps) {
  const { t } = useTranslation("creativeHub");
  const [expanded, setExpanded] = useState(false);
  const payload = asRecord(output);
  const summaryText = compactText(summary, 160) || t("common.toolReturned");
  const cardContent = (() => {
    if (toolName === "list_novels") {
      return renderNovelList(payload, onQuickAction);
    }
    if (toolName === "create_novel") {
      return renderWorkspaceCard(payload, "created", onQuickAction);
    }
    if (toolName === "select_novel_workspace") {
      return renderWorkspaceCard(payload, "selected", onQuickAction);
    }
    if (toolName === "bind_world_to_novel") {
      return renderWorldBindingCard(payload, onQuickAction);
    }
    if (toolName === "generate_world_for_novel") {
      const worldName = typeof payload.worldName === "string" && payload.worldName.trim() ? payload.worldName.trim() : t("toolResult.unnamedWorld");
      return renderProductionAssetCard(
        t("toolResult.worldGenTitle"),
        t("toolResult.worldGenerated", { name: worldName }),
        [
          { label: t("toolResult.continueFullGen"), prompt: t("toolResult.prompt.continueGen") },
          { label: t("toolResult.viewProdProgress"), prompt: t("toolResult.prompt.fullProgress") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "generate_novel_characters") {
      const characterCount = typeof payload.characterCount === "number" ? payload.characterCount : 0;
      return renderProductionAssetCard(
        t("toolResult.charGenTitle"),
        t("toolResult.charGenDesc", { count: characterCount }),
        [
          { label: t("toolResult.continueFullGen"), prompt: t("toolResult.prompt.continueGen") },
          { label: t("toolResult.viewCharStatus"), prompt: t("toolResult.prompt.charStatus") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "generate_story_bible") {
      return renderProductionAssetCard(
        t("toolResult.bibleGenTitle"),
        typeof payload.mainPromise === "string" && payload.mainPromise.trim()
          ? payload.mainPromise.trim()
          : t("toolResult.bibleGenDesc"),
        [
          { label: t("toolResult.continueFullGen"), prompt: t("toolResult.prompt.continueGen") },
          { label: t("toolResult.viewFullProgress"), prompt: t("toolResult.prompt.fullProgress") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "generate_novel_outline") {
      return renderProductionAssetCard(
        t("toolResult.outlineGenTitle"),
        typeof payload.outline === "string" && payload.outline.trim()
          ? payload.outline.trim()
          : t("toolResult.outlineGenDesc"),
        [
          { label: t("toolResult.continueFullGen"), prompt: t("toolResult.prompt.continueGen") },
          { label: t("toolResult.viewFullProgress"), prompt: t("toolResult.prompt.fullProgress") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "generate_structured_outline") {
      const targetChapterCount = typeof payload.targetChapterCount === "number" ? payload.targetChapterCount : 0;
      return renderProductionAssetCard(
        t("toolResult.structOutlineTitle"),
        targetChapterCount > 0 ? t("toolResult.structOutlineDesc", { count: targetChapterCount }) : t("toolResult.structOutlineDescEmpty"),
        [
          { label: t("toolResult.syncChapters"), prompt: t("toolResult.prompt.continueGen") },
          { label: t("toolResult.viewFullProgress"), prompt: t("toolResult.prompt.fullProgress") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "sync_chapters_from_structured_outline") {
      const chapterCount = typeof payload.chapterCount === "number" ? payload.chapterCount : 0;
      return renderProductionAssetCard(
        t("toolResult.chaptersSyncedTitle"),
        chapterCount > 0 ? t("toolResult.chaptersSyncedDesc", { count: chapterCount }) : t("toolResult.chaptersSyncedDescEmpty"),
        [
          { label: t("toolResult.viewFullProgress"), prompt: t("toolResult.prompt.fullProgress") },
          { label: t("toolResult.startFullGen"), prompt: t("toolResult.prompt.continueGen") },
        ],
        onQuickAction,
      );
    }
    if (toolName === "start_full_novel_pipeline" || toolName === "get_novel_production_status") {
      return renderProductionStatusCard(payload, onQuickAction);
    }
    if (toolName === "preview_pipeline_run" || toolName === "queue_pipeline_run") {
      return renderPipelineRunCard(toolName, payload, onQuickAction);
    }
    if (
      toolName === "get_task_failure_reason"
      || toolName === "get_run_failure_reason"
      || toolName === "get_index_failure_reason"
      || toolName === "get_book_analysis_failure_reason"
      || toolName === "explain_generation_blocker"
      || toolName === "explain_world_conflict"
      || toolName === "failure_diagnostic"
    ) {
      return renderDiagnosticCard(payload, onQuickAction);
    }
    if (
      toolName === "list_worlds"
      || toolName === "list_tasks"
      || toolName === "list_knowledge_documents"
      || toolName === "list_book_analyses"
      || toolName === "list_writing_formulas"
      || toolName === "list_base_characters"
    ) {
      return renderListCard(payload, t("toolResult.noResults"), onQuickAction);
    }
    if (
      toolName === "get_chapter_content"
      || toolName === "get_chapter_content_by_order"
      || toolName === "summarize_chapter_range"
    ) {
      return renderChapterCard(payload, onQuickAction);
    }
    return null;
  })();

  if (!cardContent) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-medium text-slate-900">{summaryText}</div>
          <Badge variant={success ? "secondary" : "destructive"}>{success ? t("toolResult.parsedResult") : errorCode ?? t("status.failed")}</Badge>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-600 transition hover:bg-slate-100"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t("toolResult.collapseDetails") : t("toolResult.expandDetails")}
        </button>
      </div>
      {expanded ? (
        <div className="mt-3">{cardContent}</div>
      ) : (
        <div className="mt-2 text-xs text-slate-500">{t("toolResult.collapsedHint")}</div>
      )}
    </div>
  );
}
