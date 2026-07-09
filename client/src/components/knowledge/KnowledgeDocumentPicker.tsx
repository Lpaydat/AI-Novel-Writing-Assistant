import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { KnowledgeDocumentStatus } from "@ai-novel/shared/types/knowledge";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { listKnowledgeDocuments } from "@/api/knowledge";
import { queryKeys } from "@/api/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface KnowledgeDocumentPickerProps {
  selectedIds: string[] | null;
  onChange: (next: string[] | null) => void;
  title?: string;
  description?: string;
  allowAuto?: boolean;
  queryStatus?: KnowledgeDocumentStatus;
}

function formatDocumentKind(kind: "user_upload" | "analysis_published"): string {
  return kind === "analysis_published"
    ? i18n.t("knowledgePicker.kind.analysisPublished", { ns: "componentsMisc" })
    : i18n.t("knowledgePicker.kind.userUpload", { ns: "componentsMisc" });
}

export default function KnowledgeDocumentPicker(props: KnowledgeDocumentPickerProps) {
  const { t } = useTranslation("componentsMisc");
  const [keyword, setKeyword] = useState("");

  const documentsQuery = useQuery({
    queryKey: queryKeys.knowledge.documents(props.queryStatus ?? "default"),
    queryFn: () => listKnowledgeDocuments(props.queryStatus ? { status: props.queryStatus } : undefined),
  });

  const visibleDocuments = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const documents = documentsQuery.data?.data ?? [];
    if (!term) {
      return documents;
    }
    return documents.filter((item) =>
      item.title.toLowerCase().includes(term) || item.fileName.toLowerCase().includes(term));
  }, [documentsQuery.data?.data, keyword]);

  const selectedIds = props.selectedIds ?? [];
  const isAuto = props.allowAuto && props.selectedIds === null;

  return (
    <div className="space-y-3 rounded-md border p-3">
      {props.title ? <div className="text-sm font-medium">{props.title}</div> : null}
      {props.description ? <div className="text-xs text-muted-foreground">{props.description}</div> : null}

      {props.allowAuto ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-md border px-3 py-1 text-sm ${isAuto ? "bg-accent" : ""}`}
            onClick={() => props.onChange(null)}
          >
            {t("knowledgePicker.auto")}
          </button>
          <button
            type="button"
            className={`rounded-md border px-3 py-1 text-sm ${!isAuto ? "bg-accent" : ""}`}
            onClick={() => props.onChange(selectedIds)}
          >
            {t("knowledgePicker.custom")}
          </button>
        </div>
      ) : null}

      {isAuto ? (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {t("knowledgePicker.autoRuleHint")}
        </div>
      ) : (
        <>
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("knowledgePicker.searchPlaceholder")}
          />
          <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-2">
            {documentsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">{t("knowledgePicker.loading")}</div>
            ) : null}
            {visibleDocuments.length === 0 && !documentsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">{t("knowledgePicker.noDocuments")}</div>
            ) : null}
            {visibleDocuments.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <label key={item.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      if (props.selectedIds === null && props.allowAuto) {
                        props.onChange(event.target.checked ? [item.id] : []);
                        return;
                      }
                      const nextIds = event.target.checked
                        ? [...selectedIds, item.id]
                        : selectedIds.filter((id) => id !== item.id);
                      props.onChange(nextIds);
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant={item.kind === "analysis_published" ? "secondary" : "outline"}>
                        {formatDocumentKind(item.kind)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.fileName} | v{item.activeVersionNumber} | {item.latestIndexStatus}
                    </div>
                    {item.kind === "analysis_published" && item.sourceAnalysisId ? (
                      <Link
                        to={`/book-analysis?analysisId=${item.sourceAnalysisId}`}
                        className="text-xs text-primary hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {t("knowledgePicker.viewSource")}
                      </Link>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("knowledgePicker.selectedCount", { selected: selectedIds.length })}
          </div>
        </>
      )}
    </div>
  );
}
