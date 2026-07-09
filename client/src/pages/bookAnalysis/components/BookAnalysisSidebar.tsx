import type {
  BookAnalysis,
  BookAnalysisStatus,
} from "@ai-novel/shared/types/bookAnalysis";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatStatus } from "../bookAnalysis.utils";
import SelectControl from "@/components/common/SelectControl";

interface BookAnalysisSidebarProps {
  keyword: string;
  status: BookAnalysisStatus | "";
  analyses: BookAnalysis[];
  selectedAnalysisId: string;
  onKeywordChange: (keyword: string) => void;
  onStatusChange: (status: BookAnalysisStatus | "") => void;
  onOpenAnalysis: (analysisId: string, documentId: string) => void;
  onOpenCreateDialog: () => void;
}

export default function BookAnalysisSidebar(props: BookAnalysisSidebarProps) {
  const {
    keyword,
    status,
    analyses,
    selectedAnalysisId,
    onKeywordChange,
    onStatusChange,
    onOpenAnalysis,
    onOpenCreateDialog,
  } = props;
  const { t } = useTranslation("bookAnalysisComponents");

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{t("sidebar.title")}</CardTitle>
          <Badge variant="outline">{analyses.length}</Badge>
        </div>
        <Button type="button" size="sm" className="w-full" onClick={onOpenCreateDialog}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("sidebar.create")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder={t("sidebar.searchPlaceholder")} />
        <SelectControl
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as BookAnalysisStatus | "")}
        >
          <option value="">{t("sidebar.statusAll")}</option>
          <option value="draft">{t("sidebar.statusDraft")}</option>
          <option value="queued">{t("sidebar.statusQueued")}</option>
          <option value="running">{t("sidebar.statusRunning")}</option>
          <option value="succeeded">{t("sidebar.statusSucceeded")}</option>
          <option value="failed">{t("sidebar.statusFailed")}</option>
          <option value="archived">{t("sidebar.statusArchived")}</option>
        </SelectControl>

        <div className="space-y-2">
          {analyses.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                item.id === selectedAnalysisId ? "border-primary bg-primary/5" : "hover:bg-muted/30"
              }`}
              onClick={() => onOpenAnalysis(item.id, item.documentId)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.title}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {item.documentTitle} | v{item.documentVersionNumber}
                  </div>
                  {item.sourceRange ? (
                    <div className="mt-1 truncate text-[11px] text-muted-foreground">{t("sidebar.rangeLabel", { label: item.sourceRange.label ?? t("sidebar.selectedChapters") })}</div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.publishedDocumentId && (
                    <Badge variant="secondary" className="text-[10px]">{t("sidebar.published")}</Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">{formatStatus(item.status)}</Badge>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {Math.round(item.progress * 100)}% | {formatDate(item.updatedAt)}
              </div>
              {item.lastError ? (
                <div className="mt-1 line-clamp-2 text-[11px] text-destructive">{item.lastError}</div>
              ) : null}
            </button>
          ))}

          {analyses.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
              {t("sidebar.empty")}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
