import { Router } from "express";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessageChunk } from "@langchain/core/messages";
import { z } from "zod";
import { agentRuntime } from "../agents";
import { createLLMFromResolvedOptions, resolveLLMClientOptions } from "../llm/factory";
import { llmProviderSchema } from "../llm/providerSchema";
import {
  ThinkTagStreamFilter,
  diffAccumulatedText,
  extractMiniMaxRawStreamData,
  extractReasoningTextFromChunk,
  isMiniMaxCompatibleProvider,
} from "../llm/reasoning";
import { initSSE, writeSSEFrame } from "../llm/streaming";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ragServices } from "../services/rag";
import type { RagOwnerType } from "../services/rag/types";
import { serverT, type Locale } from "../i18n/serverMessages";

const router = Router();

const approvalResponseSchema = z.object({
  approvalId: z.string().trim().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(2000).optional(),
});

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().trim().min(1),
      }),
    )
    .min(1),
  systemPrompt: z.string().optional(),
  agentMode: z.boolean().optional(),
  provider: llmProviderSchema.optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(64).max(16384).optional(),
  enableSearch: z.boolean().optional(),
  enableRag: z.boolean().optional(),
  chatMode: z.enum(["standard", "agent"]).optional(),
  contextMode: z.enum(["global", "novel"]).optional(),
  sessionId: z.string().trim().optional(),
  runId: z.string().trim().optional(),
  approvalResponse: approvalResponseSchema.optional(),
  contextScope: z.enum(["novel", "world", "global"]).optional(),
  novelId: z.string().trim().optional(),
  worldId: z.string().trim().optional(),
  knowledgeDocumentIds: z.array(z.string().trim().min(1)).optional(),
});

router.use(authMiddleware);

function chunkToText(content: BaseMessageChunk["content"]): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("");
  }
  return "";
}

router.post("/", validate({ body: chatSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof chatSchema>;
    // Creative Hub chat bypasses the prompt registry (it is the one approved
    // Prompt-Governance exception). Localize it via the server message catalog
    // (serverT), driven by req.locale (F2 Accept-Language middleware). zh
    // branch byte-identical to pre-i18n (Risk A); en is a domain-aware rewrite.
    const locale: Locale = req.locale ?? "zh";
    const shouldUseAgentMode = body.chatMode === "agent" || body.agentMode === true;
    if (shouldUseAgentMode) {
      const disposeHeartbeat = initSSE(res);
      let fullContent = "";
      const callbacks = {
        onReasoning: (content: string) => writeSSEFrame(res, { type: "reasoning", content }),
        onToolCall: (payload: { runId: string; stepId: string; toolName: string; inputSummary: string }) =>
          writeSSEFrame(res, { type: "tool_call", ...payload }),
        onToolResult: (payload: {
          runId: string;
          stepId: string;
          toolName: string;
          outputSummary: string;
          success: boolean;
        }) => writeSSEFrame(res, { type: "tool_result", ...payload }),
        onApprovalRequired: (payload: {
          runId: string;
          approvalId: string;
          summary: string;
          targetType: string;
          targetId: string;
        }) => writeSSEFrame(res, { type: "approval_required", ...payload }),
        onApprovalResolved: (payload: { runId: string; approvalId: string; action: "approved" | "rejected"; note?: string }) =>
          writeSSEFrame(res, { type: "approval_resolved", ...payload }),
        onRunStatus: (payload: {
          runId: string;
          status: "queued" | "running" | "waiting_approval" | "succeeded" | "failed" | "cancelled";
          message?: string;
        }) => writeSSEFrame(res, { type: "run_status", ...payload }),
      };
      try {
        const latestUserMessage = [...body.messages].reverse().find((item) => item.role === "user")?.content?.trim();
        const contextMode = body.contextMode ?? (body.novelId ? "novel" : "global");
        if (contextMode === "novel" && !body.novelId) {
          throw new Error(serverT("chat.error.novelModeRequiresNovelId", locale));
        }
        if (body.approvalResponse && !body.runId) {
          throw new Error(serverT("chat.error.approvalRequiresRunId", locale));
        }
        const result = body.approvalResponse && body.runId
          ? await agentRuntime.resolveApproval({
            runId: body.runId,
            approvalId: body.approvalResponse.approvalId,
            action: body.approvalResponse.action,
            note: body.approvalResponse.note,
          }, callbacks)
          : await agentRuntime.start({
            runId: body.runId,
            sessionId: body.sessionId?.trim() || `chat_session_${Date.now()}`,
            goal: latestUserMessage ?? serverT("chat.fallback.goal", locale),
            messages: body.messages.slice(-20),
            contextMode,
            novelId: contextMode === "novel" ? body.novelId : undefined,
            provider: body.provider,
            model: body.model,
            temperature: body.temperature,
            maxTokens: body.maxTokens,
          }, callbacks);
        fullContent = result.assistantOutput.trim();
        if (fullContent) {
          writeSSEFrame(res, { type: "chunk", content: fullContent });
        }
        writeSSEFrame(res, { type: "done", fullContent });
      } catch (error) {
        writeSSEFrame(res, {
          type: "error",
          error: error instanceof Error ? error.message : "Agent run failed.",
        });
      } finally {
        disposeHeartbeat();
        if (!res.writableEnded) {
          res.end();
        }
      }
      return;
    }

    const resolvedLLM = await resolveLLMClientOptions(body.provider ?? "deepseek", {
      model: body.model,
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens,
    });
    const llm = createLLMFromResolvedOptions(resolvedLLM);

    const recentMessages = body.messages.slice(-20);
    const systemPrompt =
      body.systemPrompt ?? serverT("chat.systemPrompt.base", locale);

    const finalSystemPrompt =
      body.agentMode
        ? `${systemPrompt}\n\n${serverT("chat.systemPrompt.agentMode", locale)}`
        : systemPrompt;

    const searchHint = body.enableSearch
      ? serverT("chat.systemPrompt.searchHint", locale)
      : "";

    const latestUserMessage = [...recentMessages]
      .reverse()
      .find((item) => item.role === "user")
      ?.content
      ?.trim();
    const shouldEnableRag = body.enableRag
      ?? (Array.isArray(body.knowledgeDocumentIds) && body.knowledgeDocumentIds.length > 0);
    const scope = body.contextScope ?? "global";
    const ownerTypes: RagOwnerType[] | undefined = scope === "novel"
      ? ["novel", "chapter", "bible", "chapter_summary", "consistency_fact", "character", "character_timeline"]
      : scope === "world"
        ? ["world", "world_library_item"]
        : undefined;
    let ragContext = "";
    if (shouldEnableRag && latestUserMessage) {
      try {
        ragContext = await ragServices.hybridRetrievalService.buildContextBlock(latestUserMessage, {
          novelId: scope === "novel" ? body.novelId : undefined,
          worldId: scope === "world" ? body.worldId : undefined,
          ownerTypes,
          knowledgeDocumentIds: body.knowledgeDocumentIds,
        });
      } catch {
        ragContext = "";
      }
    }
    const ragHint = ragContext
      ? serverT("chat.systemPrompt.ragHint", locale, { context: ragContext })
      : "";

    const messages = [
      new SystemMessage(finalSystemPrompt + searchHint + ragHint),
      ...recentMessages.map((item) => {
        if (item.role === "assistant") {
          return new AIMessage(item.content);
        }
        if (item.role === "system") {
          return new SystemMessage(item.content);
        }
        return new HumanMessage(item.content);
      }),
    ];

    const stream = await llm.stream(messages);
    const disposeHeartbeat = initSSE(res);
    let fullContent = "";
    const isMiniMaxStream = isMiniMaxCompatibleProvider(
      resolvedLLM.provider,
      resolvedLLM.baseURL,
      resolvedLLM.model,
    );
    const thinkFilter = isMiniMaxStream ? new ThinkTagStreamFilter() : null;
    let miniMaxContentBuffer = "";
    let miniMaxReasoningBuffer = "";

    try {
      for await (const chunk of stream) {
        if (res.writableEnded) {
          break;
        }

        let reasoningContent = "";
        let text = chunkToText(chunk.content);

        if (isMiniMaxStream) {
          const rawResponse = (chunk.additional_kwargs as { __raw_response?: unknown } | undefined)
            ?.__raw_response;
          const rawStreamData = extractMiniMaxRawStreamData(rawResponse);

          const normalizedContent = diffAccumulatedText(miniMaxContentBuffer, rawStreamData.contentBuffer);
          miniMaxContentBuffer = normalizedContent.nextBuffer;
          if (normalizedContent.delta) {
            text = normalizedContent.delta;
          }

          const normalizedReasoning = diffAccumulatedText(miniMaxReasoningBuffer, rawStreamData.reasoningBuffer);
          miniMaxReasoningBuffer = normalizedReasoning.nextBuffer;
          reasoningContent = normalizedReasoning.delta;
        }

        if (!reasoningContent) {
          reasoningContent = extractReasoningTextFromChunk(chunk);
        }
        if (reasoningContent && resolvedLLM.reasoningEnabled) {
          writeSSEFrame(res, { type: "reasoning", content: reasoningContent });
        }

        const filteredChunk = thinkFilter ? thinkFilter.push(text) : { text, reasoning: "" };
        if (filteredChunk.reasoning && resolvedLLM.reasoningEnabled) {
          writeSSEFrame(res, { type: "reasoning", content: filteredChunk.reasoning });
        }

        if (!filteredChunk.text) {
          continue;
        }
        fullContent += filteredChunk.text;
        writeSSEFrame(res, { type: "chunk", content: filteredChunk.text });
      }

      if (thinkFilter) {
        const flushedChunk = thinkFilter.flush();
        if (flushedChunk.reasoning && resolvedLLM.reasoningEnabled) {
          writeSSEFrame(res, { type: "reasoning", content: flushedChunk.reasoning });
        }
        if (flushedChunk.text) {
          fullContent += flushedChunk.text;
          writeSSEFrame(res, { type: "chunk", content: flushedChunk.text });
        }
      }

      writeSSEFrame(res, { type: "done", fullContent });
    } catch (error) {
      writeSSEFrame(res, {
        type: "error",
        error: error instanceof Error ? error.message : serverT("chat.error.streamFailed", locale),
      });
    } finally {
      disposeHeartbeat();
      if (!res.writableEnded) {
        res.end();
      }
    }
  } catch (error) {
    next(error);
  }
});

router.get("/history", (req, res) => {
  const locale: Locale = req.locale ?? "zh";
  res.status(200).json({
    success: true,
    data: [],
    message: serverT("chat.history.emptyLegacyResponse", locale),
  } satisfies ApiResponse<unknown[]>);
});

export default router;
