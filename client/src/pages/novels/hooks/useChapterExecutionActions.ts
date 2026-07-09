import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Chapter, ReviewIssue } from "@ai-novel/shared/types/novel";
import { updateNovelChapter } from "@/api/novel";
import { generateChapterExecutionContract } from "@/api/novel/chapters";
import { generateNovelChapterSummary } from "@/api/novelChapterSummary";
import {
  buildRepairIssue,
  resolveTargetWordCount,
  type ChapterExecutionStrategy,
} from "../chapterExecution.utils";
import { syncNovelWorkflowStageSilently } from "../novelWorkflow.client";
import i18n from "@/i18n";

interface UseChapterExecutionActionsArgs {
  novelId: string;
  selectedChapterId: string;
  selectedChapter?: Chapter;
  strategy: ChapterExecutionStrategy;
  reviewIssues: ReviewIssue[];
  onGenerateChapter: () => void;
  onReviewChapter: (kind: "continuity" | "character_consistency" | "pacing") => void;
  onStartRepair: (issues: ReviewIssue[]) => void;
  onMessage: (message: string) => void;
  isGeneratingChapter: boolean;
  isRepairingChapter: boolean;
  invalidateNovelDetail: () => Promise<void>;
}

type ExecutionContractActionKind = "taskSheet" | "sceneCards" | null;
type RepairActionKind =
  | "autoRepair"
  | "expand"
  | "compress"
  | "strengthenConflict"
  | "enhanceEmotion"
  | "unifyStyle"
  | "addDialogue"
  | "addDescription"
  | null;
type GenerationActionKind = "rewrite" | null;

export function useChapterExecutionActions({
  novelId,
  selectedChapterId,
  selectedChapter,
  strategy,
  reviewIssues,
  onGenerateChapter,
  onReviewChapter,
  onStartRepair,
  onMessage,
  isGeneratingChapter,
  isRepairingChapter,
  invalidateNovelDetail,
}: UseChapterExecutionActionsArgs) {
  const [executionContractActionKind, setExecutionContractActionKind] = useState<ExecutionContractActionKind>(null);
  const [repairActionKind, setRepairActionKind] = useState<RepairActionKind>(null);
  const [generationActionKind, setGenerationActionKind] = useState<GenerationActionKind>(null);

  const patchChapterMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateNovelChapter>[2]) => updateNovelChapter(novelId, selectedChapterId, payload),
    onSuccess: async () => {
      await invalidateNovelDetail();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("chapterExec.patchFailed", { ns: "novelsHooks" });
      onMessage(message);
    },
  });

  const summarizeChapterMutation = useMutation({
    mutationFn: () => generateNovelChapterSummary(novelId, selectedChapterId),
    onSuccess: async () => {
      await invalidateNovelDetail();
      await syncNovelWorkflowStageSilently({
        novelId,
        stage: "chapter_execution",
        itemLabel: "章节摘要已生成",
        chapterId: selectedChapterId || undefined,
        status: "waiting_approval",
      });
      onMessage(i18n.t("chapterExec.summaryGenerated", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("chapterExec.summaryFailed", { ns: "novelsHooks" });
      onMessage(message);
    },
  });

  const generateExecutionContractMutation = useMutation({
    mutationFn: () => generateChapterExecutionContract(novelId, selectedChapterId),
    onSuccess: async () => {
      await invalidateNovelDetail();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("chapterExec.contractFailed", { ns: "novelsHooks" });
      onMessage(message);
    },
    onSettled: () => {
      setExecutionContractActionKind(null);
    },
  });

  useEffect(() => {
    if (!isRepairingChapter) {
      setRepairActionKind(null);
    }
  }, [isRepairingChapter]);

  useEffect(() => {
    if (!isGeneratingChapter) {
      setGenerationActionKind(null);
    }
  }, [isGeneratingChapter]);

  const ensureChapter = (): Chapter | null => {
    if (!selectedChapterId || !selectedChapter) {
      onMessage(i18n.t("common.selectChapterFirst", { ns: "novelsHooks" }));
      return null;
    }
    return selectedChapter;
  };

  const applyStrategy = () => {
    const chapter = ensureChapter();
    if (!chapter) {
      return;
    }
    const targetWordCount = resolveTargetWordCount(strategy);
    const revealLevel = Math.max(0, Math.min(100, Math.round(strategy.conflictLevel * 0.75)));
    patchChapterMutation.mutate({
      targetWordCount,
      conflictLevel: strategy.conflictLevel,
      revealLevel,
      chapterStatus: "pending_generation",
    });
    void syncNovelWorkflowStageSilently({
      novelId,
      stage: "chapter_execution",
      itemLabel: "章节执行策略已应用",
      chapterId: chapter.id,
      status: "waiting_approval",
    });
    onMessage(i18n.t("chapterExec.strategyApplied", { ns: "novelsHooks" }));
  };

  const rewriteChapter = () => {
    const chapter = ensureChapter();
    if (!chapter) {
      return;
    }
    setGenerationActionKind("rewrite");
    patchChapterMutation.mutate({
      content: "",
      chapterStatus: "pending_generation",
      repairHistory: `${chapter.repairHistory ?? ""}\n[rewrite] ${new Date().toISOString()}`.trim(),
    });
    void syncNovelWorkflowStageSilently({
      novelId,
      stage: "chapter_execution",
      itemLabel: "本章已重置并准备重写",
      chapterId: chapter.id,
      status: "waiting_approval",
    });
    onGenerateChapter();
    onMessage(i18n.t("chapterExec.rewriteTriggered", { ns: "novelsHooks" }));
  };

  const expandChapter = () => {
    if (!ensureChapter()) {
      return;
    }
    setRepairActionKind("expand");
    onStartRepair([
      buildRepairIssue("engagement", "在不改动主线事件的前提下扩写场景细节和情绪反应，适度拉长文本。", "用户要求扩写章节"),
    ]);
    onMessage(i18n.t("chapterExec.expandSubmitted", { ns: "novelsHooks" }));
  };

  const compressChapter = () => {
    if (!ensureChapter()) {
      return;
    }
    setRepairActionKind("compress");
    onStartRepair([
      buildRepairIssue("repetition", "压缩重复表达，保留关键事件与冲突节点，控制篇幅更紧凑。", "用户要求压缩章节"),
    ]);
    onMessage(i18n.t("chapterExec.compressSubmitted", { ns: "novelsHooks" }));
  };

  const summarizeChapter = () => {
    if (!ensureChapter()) {
      return;
    }
    summarizeChapterMutation.mutate();
  };

  const generateTaskSheet = () => {
    if (!ensureChapter()) {
      return;
    }
    setExecutionContractActionKind("taskSheet");
    generateExecutionContractMutation.mutate(undefined, {
      onSuccess: async (response) => {
        await invalidateNovelDetail();
        const chapterId = response.data?.id ?? selectedChapterId;
        void syncNovelWorkflowStageSilently({
          novelId,
          stage: "chapter_execution",
          itemLabel: "章节任务单已刷新",
          chapterId,
          status: "waiting_approval",
        });
        onMessage(i18n.t("chapterExec.taskSheetRefreshed", { ns: "novelsHooks" }));
      },
    });
  };

  const generateSceneCards = () => {
    if (!ensureChapter()) {
      return;
    }
    setExecutionContractActionKind("sceneCards");
    generateExecutionContractMutation.mutate(undefined, {
      onSuccess: async (response) => {
        await invalidateNovelDetail();
        const chapterId = response.data?.id ?? selectedChapterId;
        void syncNovelWorkflowStageSilently({
          novelId,
          stage: "chapter_execution",
          itemLabel: "场景拆解已生成",
          chapterId,
          status: "waiting_approval",
        });
        onMessage(i18n.t("chapterExec.sceneCardsGenerated", { ns: "novelsHooks" }));
      },
    });
  };

  const checkContinuity = () => {
    if (!ensureChapter()) {
      return;
    }
    onReviewChapter("continuity");
    onMessage(i18n.t("chapterExec.continuityChecked", { ns: "novelsHooks" }));
  };

  const checkCharacterConsistency = () => {
    if (!ensureChapter()) {
      return;
    }
    onReviewChapter("character_consistency");
    onMessage(i18n.t("chapterExec.characterConsistencyChecked", { ns: "novelsHooks" }));
  };

  const checkPacing = () => {
    if (!ensureChapter()) {
      return;
    }
    onReviewChapter("pacing");
    onMessage(i18n.t("chapterExec.pacingChecked", { ns: "novelsHooks" }));
  };

  const autoRepair = () => {
    if (!ensureChapter()) {
      return;
    }
    setRepairActionKind("autoRepair");
    const issues = reviewIssues.length > 0
      ? reviewIssues
      : [buildRepairIssue("coherence", "修复章节逻辑与叙事衔接问题，补足关键动机和因果。", "自动修复默认规则")];
    onStartRepair(issues);
    onMessage(i18n.t("chapterExec.autoRepairTriggered", { ns: "novelsHooks" }));
  };

  const strengthenConflict = () => {
    if (!ensureChapter()) {
      return;
    }
    setRepairActionKind("strengthenConflict");
    onStartRepair([
      buildRepairIssue("pacing", "提升对抗密度，让冲突更早出现并持续施压。", "用户要求强化冲突"),
    ]);
    onMessage(i18n.t("chapterExec.conflictStrengthened", { ns: "novelsHooks" }));
  };

  const enhanceEmotion = () => {
    if (!ensureChapter()) {
      return;
    }
    setRepairActionKind("enhanceEmotion");
    onStartRepair([
      buildRepairIssue("engagement", "增强角色情绪层次与张力，突出内外部情感变化。", "用户要求增强情绪"),
    ]);
    onMessage(i18n.t("chapterExec.emotionEnhanced", { ns: "novelsHooks" }));
  };

  const unifyStyle = () => {
    if (!ensureChapter()) {
      return;
    }
    setRepairActionKind("unifyStyle");
    onStartRepair([
      buildRepairIssue("voice", "统一叙事语气与措辞，保持文风稳定。", "用户要求提升文风一致性"),
    ]);
    onMessage(i18n.t("chapterExec.styleUnified", { ns: "novelsHooks" }));
  };

  const addDialogue = () => {
    if (!ensureChapter()) {
      return;
    }
    setRepairActionKind("addDialogue");
    onStartRepair([
      buildRepairIssue("voice", "增加推动情节的有效对话，减少空泛叙述。", "用户要求增加对话推进"),
    ]);
    onMessage(i18n.t("chapterExec.dialogueEnhanced", { ns: "novelsHooks" }));
  };

  const addDescription = () => {
    if (!ensureChapter()) {
      return;
    }
    setRepairActionKind("addDescription");
    onStartRepair([
      buildRepairIssue("engagement", "补充环境与动作描写，提升画面感与临场感。", "用户要求增加描写"),
    ]);
    onMessage(i18n.t("chapterExec.descriptionEnhanced", { ns: "novelsHooks" }));
  };

  return {
    isPatchingChapter: patchChapterMutation.isPending,
    isGeneratingExecutionContract: generateExecutionContractMutation.isPending,
    isGeneratingTaskSheet: generateExecutionContractMutation.isPending && executionContractActionKind === "taskSheet",
    isGeneratingSceneCards: generateExecutionContractMutation.isPending && executionContractActionKind === "sceneCards",
    isSummarizingChapter: summarizeChapterMutation.isPending,
    repairActionKind,
    generationActionKind,
    applyStrategy,
    rewriteChapter,
    expandChapter,
    compressChapter,
    summarizeChapter,
    generateTaskSheet,
    generateSceneCards,
    checkContinuity,
    checkCharacterConsistency,
    checkPacing,
    autoRepair,
    strengthenConflict,
    enhanceEmotion,
    unifyStyle,
    addDialogue,
    addDescription,
  };
}
