import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { KnowledgeDocumentDetail, KnowledgeRecallTestResult } from "@ai-novel/shared/types/knowledge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppDialogContent, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatStatus } from "./knowledgeRagUi";

const PREVIEW_CHAR_LIMIT = 3000;
const EXPAND_WARN_THRESHOLD = 100_000;

function VersionContentPreview({ content }: { content: string }) {
  const { t } = useTranslation("knowledge");
  const [expanded, setExpanded] = useState(false);
  const truncated = content.length > PREVIEW_CHAR_LIMIT && !expanded;
  const displayText = truncated ? content.slice(0, PREVIEW_CHAR_LIMIT) : content;
  const isLarge = content.length > EXPAND_WARN_THRESHOLD;

  const handleExpand = () => {
    if (!expanded && isLarge) {
      if (!window.confirm(t("detailDialog.expandConfirm", { chars: content.length.toLocaleString() }))) {
        return;
      }
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="mt-3">
      <pre className="max-h-64 w-full max-w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-muted/40 p-3 text-xs">
        {displayText}
        {truncated ? "…" : null}
      </pre>
      {content.length > PREVIEW_CHAR_LIMIT ? (
        <button
          type="button"
          className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={handleExpand}
        >
          {expanded
            ? t("detailDialog.collapse", { chars: content.length.toLocaleString() })
            : t("detailDialog.expand", {
                limit: PREVIEW_CHAR_LIMIT.toLocaleString(),
                chars: content.length.toLocaleString(),
              })}
        </button>
      ) : null}
    </div>
  );
}

interface KnowledgeDocumentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: KnowledgeDocumentDetail;
  selectedDocumentId: string;
  versionBusy: boolean;
  onUploadVersionFile: (file: File) => Promise<void>;
  onReindex: () => void;
  recallQuery: string;
  onRecallQueryChange: (value: string) => void;
  onRecallTest: () => void;
  recallPending: boolean;
  recallErrorMessage?: string | null;
  recallResult: KnowledgeRecallTestResult | null;
  onRestoreDocument: () => void;
  restorePending: boolean;
  onActivateVersion: (versionId: string) => void;
  activateVersionPending: boolean;
}

export default function KnowledgeDocumentDetailDialog({
  open,
  onOpenChange,
  document,
  selectedDocumentId,
  versionBusy,
  onUploadVersionFile,
  onReindex,
  recallQuery,
  onRecallQueryChange,
  onRecallTest,
  recallPending,
  recallErrorMessage,
  recallResult,
  onRestoreDocument,
  restorePending,
  onActivateVersion,
  activateVersionPending,
}: KnowledgeDocumentDetailDialogProps) {
  const { t } = useTranslation("knowledge");
  const isArchived = document?.status === "archived";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        className="max-w-4xl"
        title={document?.title ?? t("detailDialog.title")}
        bodyClassName="min-w-0 space-y-4"
      >
          <div className="flex flex-wrap gap-2">
            {isArchived ? (
              <Button variant="outline" onClick={onRestoreDocument} disabled={restorePending}>
                {restorePending ? t("detailDialog.restoring") : t("detailDialog.restore")}
              </Button>
            ) : (
              <input
                type="file"
                accept=".txt,text/plain"
                className="rounded-md border bg-background p-2 text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) {
                    return;
                  }
                  void onUploadVersionFile(file);
                }}
                disabled={versionBusy}
              />
            )}
            {selectedDocumentId && !isArchived ? (
              <Button variant="outline" onClick={onReindex}>
                {t("detailDialog.reindex")}
              </Button>
            ) : null}
          </div>

          {document ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{t("detailDialog.docStatusLabel")}{formatStatus(document.status)}</Badge>
                <Badge variant="outline">{t("detailDialog.indexStatusLabel")}{formatStatus(isArchived ? "idle" : (document.latestIndexStatus ?? "-"))}</Badge>
              </div>
              {document.latestIndexStatus === "failed" && document.latestIndexError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {t("detailDialog.indexErrorLabel")}{document.latestIndexError}
                </div>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>{t("detailDialog.recallTestTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isArchived ? (
                    <div className="text-sm text-muted-foreground">
                      {t("detailDialog.recallArchivedHint")}
                    </div>
                  ) : document.latestIndexStatus === "succeeded" ? (
                    <>
                      <div className="flex min-w-0 flex-col gap-2 md:flex-row">
                        <Input
                          value={recallQuery}
                          onChange={(event) => onRecallQueryChange(event.target.value)}
                          placeholder={t("detailDialog.recallPlaceholder")}
                        />
                        <Button
                          onClick={onRecallTest}
                          disabled={recallPending || !selectedDocumentId || !recallQuery.trim()}
                        >
                          {recallPending ? t("detailDialog.testing") : t("detailDialog.startTest")}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("detailDialog.recallHint")}
                      </div>
                      {recallErrorMessage ? (
                        <div className="text-sm text-destructive">{recallErrorMessage}</div>
                      ) : null}
                      {recallResult ? (
                        <div className="min-w-0 space-y-2 overflow-hidden">
                          {recallResult.hits.length === 0 ? (
                            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                              {t("detailDialog.recallNoHits")}
                            </div>
                          ) : (
                            recallResult.hits.map((hit, index) => (
                              <div key={hit.id} className="min-w-0 max-w-full overflow-hidden rounded-md border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="min-w-0 break-all font-medium">
                                    {t("detailDialog.hitLabel", { index: index + 1 })} | {hit.source === "reranked" ? t("detailDialog.sourceReranked") : hit.source === "vector" ? t("detailDialog.sourceVector") : t("detailDialog.sourceKeyword")} | {t("detailDialog.chunkLabel", { order: hit.chunkOrder + 1 })}
                                  </div>
                                  <Badge variant="outline">{t("detailDialog.scoreLabel", { score: hit.score.toFixed(4) })}</Badge>
                                </div>
                                {hit.title ? (
                                  <div className="mt-1 break-all text-xs text-muted-foreground">{hit.title}</div>
                                ) : null}
                                {hit.contextPrefix ? (
                                  <div className="mt-2 break-all rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                                    {hit.contextPrefix}
                                  </div>
                                ) : null}
                                <pre className="mt-3 max-h-52 w-full max-w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-muted/40 p-3 text-xs">
                                  {hit.chunkText}
                                </pre>
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {t("detailDialog.recallPendingIndexHint")}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="min-w-0 space-y-3">
                {document.versions.map((version) => (
                  <div key={version.id} className="min-w-0 max-w-full overflow-hidden rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">{t("detailDialog.versionLabel", { number: version.versionNumber })}</div>
                      {version.isActive ? <Badge>{t("detailDialog.currentActive")}</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("detailDialog.charCountLabel", { chars: version.charCount })} | {new Date(version.createdAt).toLocaleString()}
                    </div>
                    {!version.isActive && !isArchived ? (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onActivateVersion(version.id)}
                          disabled={activateVersionPending}
                        >
                          {t("detailDialog.switchToActive")}
                        </Button>
                      </div>
                    ) : null}
                    <VersionContentPreview content={version.content} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {t("detailDialog.loadingDetail")}
            </div>
          )}
      </AppDialogContent>
    </Dialog>
  );
}
