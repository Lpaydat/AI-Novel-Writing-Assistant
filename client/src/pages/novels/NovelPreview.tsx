import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Chapter, ChapterStatus } from "@ai-novel/shared/types/novel";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Check, Copy, Edit3, FileText, ListTree } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getNovelChapters, getNovelDetail } from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import { formatLocaleNumber } from "@/i18n/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function countWords(content: string | null | undefined): number {
  const text = content?.trim() ?? "";
  if (!text) {
    return 0;
  }

  const cjkMatches = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const wordMatches = text
    .replace(/[\u3400-\u9fff]/g, " ")
    .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;
  return cjkMatches + wordMatches;
}

function formatCount(value: number): string {
  return formatLocaleNumber(value);
}

function chapterStatusKey(status?: ChapterStatus | null): string {
  switch (status) {
    case "completed":
      return "previewStatus.completed";
    case "pending_review":
      return "previewStatus.pendingReview";
    case "needs_repair":
      return "previewStatus.needsRepair";
    case "generating":
      return "previewStatus.generating";
    case "pending_generation":
      return "previewStatus.pendingGeneration";
    case "unplanned":
      return "previewStatus.unplanned";
    default:
      return "previewStatus.unmarked";
  }
}

function normalizeChapterText(content: string | null | undefined): string {
  return content?.trim() ?? "";
}

async function writeTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Some desktop webviews and local browser contexts deny Clipboard API writes.
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    const copied = document.execCommand("copy");
    if (!copied) {
      throw new Error("copy command rejected");
    }
  } finally {
    document.body.removeChild(textArea);
  }
}

export default function NovelPreview() {
  const { t } = useTranslation("novels");
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedChapterId, setCopiedChapterId] = useState<string | null>(null);
  const selectedChapterId = searchParams.get("chapterId") ?? "";

  const novelQuery = useQuery({
    queryKey: queryKeys.novels.detail(id),
    queryFn: () => getNovelDetail(id),
    enabled: Boolean(id),
  });

  const chaptersQuery = useQuery({
    queryKey: queryKeys.novels.chapters(id),
    queryFn: () => getNovelChapters(id),
    enabled: Boolean(id),
  });

  const novel = novelQuery.data?.data ?? null;
  const chapters = useMemo(
    () => [...(chaptersQuery.data?.data ?? [])].sort((a, b) => a.order - b.order),
    [chaptersQuery.data?.data],
  );
  const generatedChapters = useMemo(
    () => chapters.filter((chapter) => normalizeChapterText(chapter.content).length > 0),
    [chapters],
  );
  const activeChapter = useMemo(() => {
    return chapters.find((chapter) => chapter.id === selectedChapterId)
      ?? generatedChapters[0]
      ?? chapters[0]
      ?? null;
  }, [chapters, generatedChapters, selectedChapterId]);
  const activeContent = normalizeChapterText(activeChapter?.content);
  const totalWordCount = useMemo(
    () => chapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0),
    [chapters],
  );

  useEffect(() => {
    if (!activeChapter || selectedChapterId === activeChapter.id) {
      return;
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("chapterId", activeChapter.id);
      return next;
    }, { replace: true });
  }, [activeChapter, selectedChapterId, setSearchParams]);

  const selectChapter = (chapter: Chapter) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("chapterId", chapter.id);
      return next;
    });
  };

  const copyActiveChapter = async () => {
    if (!activeChapter || !activeContent) {
      toast.error(t("preview.noCopyContent"));
      return;
    }

    try {
      await writeTextToClipboard(activeContent);
      setCopiedChapterId(activeChapter.id);
      toast.success(t("preview.copySuccess"));
      window.setTimeout(() => {
        setCopiedChapterId((current) => (current === activeChapter.id ? null : current));
      }, 1600);
    } catch {
      toast.error(t("preview.copyError"));
    }
  };

  if (!id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("preview.missingNovelTitle")}</CardTitle>
          <CardDescription>{t("preview.missingNovelDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/novels">{t("preview.backToList")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isLoading = novelQuery.isPending || chaptersQuery.isPending;
  const isError = novelQuery.isError || chaptersQuery.isError;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground">
            <Link to="/novels">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("preview.backToList")}
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-semibold tracking-tight">
                {novel?.title ?? t("preview.defaultTitle")}
              </h1>
              {novel?.status ? (
                <Badge variant={novel.status === "published" ? "default" : "secondary"}>
                  {novel.status === "published" ? t("preview.published") : t("preview.draft")}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t("preview.intro")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/novels/${id}/edit`}>
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              {t("preview.openWorkspace")}
            </Link>
          </Button>
          {activeChapter ? (
            <Button asChild>
              <Link to={`/novels/${id}/chapters/${activeChapter.id}`}>
                <FileText className="h-4 w-4" aria-hidden="true" />
                {t("preview.editChapter")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-28 rounded bg-muted" />
              <div className="h-4 w-40 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 rounded-lg bg-muted" />
              ))}
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-7 w-1/2 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-4 rounded bg-muted" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("preview.loadFailedTitle")}</CardTitle>
            <CardDescription>{t("preview.loadFailedDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              void novelQuery.refetch();
              void chaptersQuery.refetch();
            }}
            >
              {t("preview.reload")}
            </Button>
          </CardContent>
        </Card>
      ) : chapters.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("preview.noChaptersTitle")}</CardTitle>
            <CardDescription>{t("preview.noChaptersDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={`/novels/${id}/edit`}>{t("preview.enterWorkspace")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="min-h-0 lg:h-[calc(100vh-13rem)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTree className="h-4 w-4" aria-hidden="true" />
                {t("preview.tocTitle")}
              </CardTitle>
              <CardDescription>
                {t("preview.tocSummary", {
                  generated: generatedChapters.length,
                  total: chapters.length,
                  words: formatCount(totalWordCount),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 space-y-2 overflow-y-auto pr-2 lg:max-h-[calc(100vh-20rem)]">
              {chapters.map((chapter) => {
                const chapterContent = normalizeChapterText(chapter.content);
                const isActive = activeChapter?.id === chapter.id;
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    className={cn(
                      "w-full rounded-lg border p-3 text-left text-sm transition hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring",
                      isActive ? "border-primary bg-primary/[0.06]" : "border-border bg-background",
                    )}
                    onClick={() => selectChapter(chapter)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">
                          {t("preview.chapterNumber", { order: chapter.order })}
                        </div>
                        <div className="mt-1 line-clamp-2 break-words text-muted-foreground">
                          {chapter.title || t("preview.untitledChapter")}
                        </div>
                      </div>
                      <Badge variant={chapterContent ? "outline" : "secondary"}>
                        {chapterContent ? t("preview.hasContent") : t("preview.noContent")}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{t(chapterStatusKey(chapter.chapterStatus))}</span>
                      <span>{t("preview.wordCount", { count: formatCount(countWords(chapter.content)) })}</span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="min-h-0 lg:h-[calc(100vh-13rem)]">
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BookOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="break-words">
                      {activeChapter
                        ? t("preview.activeChapterTitle", {
                          order: activeChapter.order,
                          title: activeChapter.title || t("preview.untitledChapter"),
                        })
                        : t("preview.selectChapter")}
                    </span>
                  </CardTitle>
                  {activeChapter ? (
                    <CardDescription className="mt-2">
                      {t(chapterStatusKey(activeChapter.chapterStatus))} · {t("preview.wordCount", { count: formatCount(countWords(activeChapter.content)) })}
                    </CardDescription>
                  ) : null}
                </div>
                {activeChapter ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyActiveChapter()}
                      disabled={!activeContent}
                    >
                      {copiedChapterId === activeChapter.id ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                      {copiedChapterId === activeChapter.id ? t("preview.copied") : t("preview.copyContent")}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/novels/${id}/chapters/${activeChapter.id}`}>
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        {t("preview.editChapter")}
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="min-h-0 overflow-y-auto p-0 lg:max-h-[calc(100vh-21rem)]">
              {activeContent ? (
                <article className="mx-auto max-w-3xl whitespace-pre-wrap px-5 py-6 text-base leading-8 text-slate-900 md:px-8">
                  {activeContent}
                </article>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
                  <div className="max-w-md space-y-3">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
                    <div className="text-lg font-medium">{t("preview.noChapterContentTitle")}</div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t("preview.noChapterContentDesc")}
                    </p>
                    {activeChapter ? (
                      <Button asChild>
                        <Link to={`/novels/${id}/chapters/${activeChapter.id}`}>{t("preview.editChapter")}</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
