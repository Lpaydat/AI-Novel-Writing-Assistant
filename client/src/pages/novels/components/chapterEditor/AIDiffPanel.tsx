import { useTranslation } from "react-i18next";
import type { ChapterEditorCandidate } from "@ai-novel/shared/types/novel";
import { Button } from "@/components/ui/button";
import type { ChapterEditorSessionState } from "./chapterEditorTypes";

interface AIDiffPanelProps {
  session: ChapterEditorSessionState;
  activeCandidate: ChapterEditorCandidate | null;
  isApplying: boolean;
  onSelectCandidate: (candidateId: string) => void;
  onChangeViewMode: (mode: "inline" | "block") => void;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
}

export default function AIDiffPanel(props: AIDiffPanelProps) {
  const { t } = useTranslation("novelsChapterEditor");
  const {
    session,
    activeCandidate,
    isApplying,
    onSelectCandidate,
    onChangeViewMode,
    onAccept,
    onReject,
    onRegenerate,
  } = props;

  const isIdle = session.status === "idle";
  const statusText = isIdle
    ? t("diffPanel.status.idle")
    : session.status === "loading"
      ? t("diffPanel.status.loading")
      : session.status === "error"
        ? session.errorMessage || t("diffPanel.status.generateFailed")
        : session.requestLabel || t("diffPanel.status.review");

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm xl:min-h-0">
      <div className="shrink-0 space-y-3 border-b border-border/70 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-foreground">{t("diffPanel.title")}</div>
            <div className="text-xs text-muted-foreground">{statusText}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={session.viewMode === "block" ? "default" : "outline"}
              onClick={() => onChangeViewMode("block")}
              disabled={isIdle}
            >
              {t("diffPanel.viewMode.block")}
            </Button>
            <Button
              size="sm"
              variant={session.viewMode === "inline" ? "default" : "outline"}
              onClick={() => onChangeViewMode("inline")}
              disabled={isIdle}
            >
              {t("diffPanel.viewMode.inline")}
            </Button>
          </div>
        </div>

        {session.status === "ready" ? (
          <div className="flex flex-wrap gap-2">
            {(session.candidates ?? []).map((candidate) => (
              <Button
                key={candidate.id}
                size="sm"
                variant={candidate.id === session.activeCandidateId ? "default" : "outline"}
                onClick={() => onSelectCandidate(candidate.id)}
              >
                {candidate.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {isIdle ? (
          <>
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm leading-6 text-muted-foreground">
              {t("diffPanel.idle.hint")}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
              <div className="text-sm font-medium text-foreground">{t("diffPanel.idle.waitingTitle")}</div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("diffPanel.idle.waitingBody")}
              </div>
            </div>
          </>
        ) : null}

        {session.status === "loading" ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
            {t("diffPanel.loadingBody")}
          </div>
        ) : null}

        {session.status === "error" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            {session.errorMessage || t("diffPanel.errorFallback")}
          </div>
        ) : null}

        {session.status === "ready" && activeCandidate ? (
          <>
            <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-foreground">{activeCandidate.label}</div>
                {activeCandidate.semanticTags && activeCandidate.semanticTags.length > 0 ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    {activeCandidate.semanticTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              {activeCandidate.summary ? (
                <div className="text-sm leading-6 text-muted-foreground">{activeCandidate.summary}</div>
              ) : null}
            </div>

            {session.viewMode === "block" ? (
              <div className="rounded-2xl border border-border/70 bg-muted/10 p-3 text-sm leading-6 text-muted-foreground">
                {t("diffPanel.blockPreviewNote")}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-muted/10 p-3 text-sm leading-6 text-muted-foreground">
                {t("diffPanel.inlinePreviewNote")}
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-border/70 px-4 py-4">
        <Button size="sm" variant="outline" onClick={onReject} disabled={isIdle || session.status === "loading" || isApplying}>
          {t("diffPanel.rejectAll")}
        </Button>
        <Button size="sm" variant="outline" onClick={onRegenerate} disabled={isIdle || session.status === "loading" || isApplying}>
          {t("diffPanel.regenerate")}
        </Button>
        <Button size="sm" onClick={onAccept} disabled={session.status !== "ready" || !activeCandidate || isApplying}>
          {isApplying ? t("diffPanel.applying") : t("diffPanel.acceptAll")}
        </Button>
      </div>
    </div>
  );
}
