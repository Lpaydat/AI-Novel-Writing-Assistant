import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Upload, FileText, X } from "lucide-react";
import type { KnowledgeDocumentStatus, KnowledgeDocumentSummary } from "@ai-novel/shared/types/knowledge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OpenInCreativeHubButton from "@/components/creativeHub/OpenInCreativeHubButton";
import SelectField from "@/components/common/SelectField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppDialogContent, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { RagJobSummary } from "@/api/knowledge";
import {
  formatRagJobMeta,
  formatStatus,
  getRagJobProgressPercent,
  getRagJobProgressWidth,
} from "./knowledgeRagUi";

interface KnowledgeDocumentsTabProps {
  uploadTitle: string;
  onUploadTitleChange: (value: string) => void;
  uploadBusy: boolean;
  onUploadFile: (file: File) => Promise<void>;
  keyword: string;
  onKeywordChange: (value: string) => void;
  status: KnowledgeDocumentStatus | "";
  onStatusChange: (value: KnowledgeDocumentStatus | "") => void;
  documents: KnowledgeDocumentSummary[];
  latestKnowledgeDocumentJobs: Map<string, RagJobSummary>;
  onSelectDocument: (id: string) => void;
  onOpenRecallTest: (id: string) => void;
  onReindexDocument: (id: string) => void;
  onUpdateStatus: (id: string, status: KnowledgeDocumentStatus) => void;
}

export default function KnowledgeDocumentsTab({
  uploadTitle,
  onUploadTitleChange,
  uploadBusy,
  onUploadFile,
  keyword,
  onKeywordChange,
  status,
  onStatusChange,
  documents,
  latestKnowledgeDocumentJobs,
  onSelectDocument,
  onOpenRecallTest,
  onReindexDocument,
  onUpdateStatus,
}: KnowledgeDocumentsTabProps) {
  const { t } = useTranslation("knowledge");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "text/plain" || file.name.endsWith(".txt"))) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) setSelectedFile(file);
  }, []);

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    await handleUploadFile(selectedFile);
    setSelectedFile(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setUploadDialogOpen(open);
    if (!open) setSelectedFile(null);
  };
  const statusOptions = [
    { value: "", label: t("documentsTab.filterAllNonArchived") },
    { value: "enabled", label: t("documentsTab.filterEnabledOnly") },
    { value: "disabled", label: t("documentsTab.filterDisabledOnly") },
    { value: "archived", label: t("documentsTab.filterArchivedOnly") },
  ] as const;

  const confirmArchiveDocument = (document: KnowledgeDocumentSummary) => {
    const confirmed = window.confirm(
      t("documentsTab.archiveConfirm", { title: document.title }),
    );
    if (!confirmed) {
      return;
    }
    onUpdateStatus(document.id, "archived");
  };

  const handleUploadFile = async (file: File) => {
    await onUploadFile(file);
    setUploadDialogOpen(false);
  };

  const renderDocumentRow = (document: KnowledgeDocumentSummary) => {
    const documentJob = latestKnowledgeDocumentJobs.get(document.id);
    const displayIndexStatus = documentJob && (documentJob.status === "queued" || documentJob.status === "running")
      ? documentJob.status
      : document.status === "archived"
        ? "idle"
      : document.latestIndexStatus;

    return (
      <div key={document.id} className="rounded-md border p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="font-medium">{document.title}</div>
            <div className="text-xs text-muted-foreground">
              {document.fileName} | {t("documentsTab.versionCountLabel", { versions: document.versionCount })} | {t("documentsTab.currentVersionLabel", { version: document.activeVersionNumber })}
            </div>
            <div className="text-xs text-muted-foreground">{t("documentsTab.bookAnalysisCount", { analyses: document.bookAnalysisCount })}</div>
            {documentJob?.progress && (documentJob.status === "queued" || documentJob.status === "running") ? (
              <div className="mt-2 rounded-md border border-dashed p-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium">{documentJob.progress.label}</span>
                  <span>{getRagJobProgressPercent(documentJob)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: getRagJobProgressWidth(documentJob) }}
                  />
                </div>
                {documentJob.progress.detail ? (
                  <div className="mt-2 text-xs text-muted-foreground">{documentJob.progress.detail}</div>
                ) : null}
                <div className="mt-1 text-xs text-muted-foreground">{formatRagJobMeta(documentJob)}</div>
              </div>
            ) : null}
            {document.latestIndexStatus === "failed" && document.latestIndexError ? (
              <div className="text-xs text-destructive">{t("documentsTab.failureReasonLabel")}{document.latestIndexError}</div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={document.kind === "analysis_published" ? "secondary" : "outline"}>
              {document.kind === "analysis_published" ? t("documentsTab.kindAnalysisPublished") : t("documentsTab.kindUploaded")}
            </Badge>
            <Badge variant="outline">{formatStatus(document.status)}</Badge>
            <Badge variant="outline">{formatStatus(displayIndexStatus)}</Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => onSelectDocument(document.id)}>
            {t("documentsTab.viewVersions")}
          </Button>
          {document.status === "archived" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(document.id, "enabled")}
            >
              {t("documentsTab.restore")}
            </Button>
          ) : (
            <>
              <OpenInCreativeHubButton
                bindings={{ knowledgeDocumentIds: [document.id] }}
                label={t("documentsTab.continueInCreativeHub")}
              />
              <Button asChild size="sm" variant="outline">
                <Link to={`/book-analysis?documentId=${document.id}`}>{t("documentsTab.newBookAnalysis")}</Link>
              </Button>
              {document.kind === "analysis_published" && document.sourceAnalysisId ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/book-analysis?analysisId=${document.sourceAnalysisId}`}>{t("documentsTab.viewSourceAnalysis")}</Link>
                </Button>
              ) : null}
              {document.latestIndexStatus === "succeeded" ? (
                <Button size="sm" variant="outline" onClick={() => onOpenRecallTest(document.id)}>
                  {t("documentsTab.recallTest")}
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => onReindexDocument(document.id)}>
                {t("documentsTab.reindex")}
              </Button>
              {document.status === "enabled" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(document.id, "disabled")}
                >
                  {t("documentsTab.disable")}
                </Button>
              ) : document.status === "disabled" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(document.id, "enabled")}
                >
                  {t("documentsTab.enable")}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => confirmArchiveDocument(document)}
              >
                {t("documentsTab.archive")}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{t("documentsTab.listTitle")}</CardTitle>
          <Button type="button" size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t("documentsTab.uploadDocument")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_180px]">
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder={t("documentsTab.searchPlaceholder")}
            />
            <SelectField
              value={status}
              onValueChange={(value) => onStatusChange(value as KnowledgeDocumentStatus | "")}
              options={statusOptions.map((option) => ({ ...option }))}
              placeholder={t("documentsTab.filterStatusPlaceholder")}
              className="space-y-0"
              triggerClassName="h-10"
            />
          </div>
          <div className="space-y-3">
            {documents.map(renderDocumentRow)}
            {documents.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {t("documentsTab.emptyList")}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={handleDialogOpenChange}>
        <AppDialogContent
          className="max-w-lg"
          title={t("documentsTab.uploadDocument")}
          description={t("documentsTab.uploadDialogDescription")}
        >
          <div className="space-y-4">
            <Input
              value={uploadTitle}
              onChange={(event) => onUploadTitleChange(event.target.value)}
              placeholder={t("documentsTab.optionalTitlePlaceholder")}
            />

            {/* Drag-and-drop upload area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={[
                "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all",
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : selectedFile
                    ? "border-primary/40 bg-primary/5"
                    : "border-muted-foreground/25 bg-muted/30 hover:border-primary/40 hover:bg-muted/50 cursor-pointer",
              ].join(" ")}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadBusy}
              />

              {selectedFile ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className={[
                    "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    dragOver ? "bg-primary/15" : "bg-muted",
                  ].join(" ")}>
                    <Upload className={["h-6 w-6 transition-colors", dragOver ? "text-primary" : "text-muted-foreground"].join(" ")} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {dragOver ? t("documentsTab.dropHere") : t("documentsTab.dragHint")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("documentsTab.txtOnly")}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground leading-5">
                {t("documentsTab.sameTitleHint")}
              </p>
              <Button
                type="button"
                size="sm"
                disabled={!selectedFile || uploadBusy}
                onClick={() => void handleConfirmUpload()}
              >
                {uploadBusy ? t("documentsTab.uploading") : t("documentsTab.confirmUpload")}
              </Button>
            </div>
          </div>
        </AppDialogContent>
      </Dialog>
    </>
  );
}
