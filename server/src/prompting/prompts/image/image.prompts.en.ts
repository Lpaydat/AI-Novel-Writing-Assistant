import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import type {
  CharacterImagePromptOptimizeInput,
  ImageGenerationPromptAssistInput,
  NovelCoverBriefPromptInput,
  NovelCoverPromptOptimizeInput,
} from "./image.prompts";
import { imageGenerationPromptAssistOutputSchema, novelCoverBriefSchema } from "./image.prompts";

/**
 * English variants of the image-prompt family:
 * `image.generation_prompt.assist`, `image.character.prompt_optimize`,
 * `image.novel_cover.brief`, and `image.novel_cover.prompt_optimize`.
 *
 * Domain-aware rewrites for English-language serialized fiction. Each variant
 * reuses its zh anchor's outputSchema where applicable (JSON shape is
 * language-independent) and input type. Registered alongside the zh anchors; the
 * runner swaps to a variant only when `options.locale === "en"`.
 *
 * Note: some of these prompts still honor `input.outputLanguage` to decide the
 * language of the *generated* image prompt; the en variant only changes the
 * language of the instructions themselves.
 */

export const imageGenerationPromptAssistPromptEn: PromptAsset<
  ImageGenerationPromptAssistInput,
  z.infer<typeof imageGenerationPromptAssistOutputSchema>
> = {
  id: "image.generation_prompt.assist",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  repairPolicy: {
    maxAttempts: 1,
  },
  outputSchema: imageGenerationPromptAssistOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are an image-generation prompt assistant, serving beginner authors who do not understand prompt engineering.",
      "You help the user understand or optimize the prompt about to be sent to the image model, before the image is actually generated.",
      "",
      "Output only valid JSON — no Markdown, code blocks, or extra explanations.",
      "",
      "General rules:",
      "1. You must respect the original prompt's character identity, scene, composition, art style, reference-image purpose, and hard constraints; do not change the core settings on your own.",
      "2. When explaining, break a complex prompt into a user-understandable picture goal, character/scene constraints, the role of reference images, and model caveats.",
      "3. When optimizing, only make the prompt clearer, more controllable, and better suited to the image model; do not delete key constraints such as gender lock, identity lock, strong face-shape override, speech-bubble rules, or no-text / no-watermark.",
      "4. If reference images already exist, the optimized result must make clear that these references are used to keep consistency; do not let the model copy the reference camera angle unless the original prompt already asked to copy it.",
      "5. Treat the negative prompt only as a risk and constraint reference; do not mix the negative prompt into optimizedPrompt unless the original prompt itself already contains negative constraints.",
      "6. When action=optimize and the user has provided optimization requirements, adjust the prompt following the user's own wording first; if the user's request would break the core settings or key constraints, keep the key constraints and explain this in risks or changes.",
      "",
      "Output fields:",
      "- summary: a one-sentence summary in English.",
      "- details: 2-8 key points in English.",
      "- risks: at most 5 risks or caveats in English; empty array if none.",
      "- optimizedPrompt: provided only when action=optimize; can be filled directly back into the positive prompt.",
      "- changes: only when action=optimize, describe which improvements were made.",
    ].join("\n")),
    new HumanMessage([
      `Action: ${input.action === "optimize" ? "Optimize the current positive prompt" : "Explain the current positive prompt"}`,
      `Entry title: ${input.title?.trim() || "Not provided"}`,
      `Entry kind: ${input.kind?.trim() || "Not provided"}`,
      `Image provider: ${input.provider?.trim() || "Not provided"}`,
      `Image size: ${input.size?.trim() || "Not provided"}`,
      "",
      "Reference material:",
      input.referenceImages.length
        ? input.referenceImages.map((item, index) => `${index + 1}. ${item.kind}: ${item.label}`).join("\n")
        : "No reference material",
      "",
      "Current positive prompt:",
      input.prompt,
      "",
      "Current negative prompt:",
      input.negativePrompt?.trim() || "None",
      "",
      "User's optimization requirements:",
      input.action === "optimize" ? input.optimizationInstruction?.trim() || "Not provided" : "Not applicable",
    ].join("\n")),
  ],
};

export const imageCharacterPromptOptimizePromptEn: PromptAsset<
  CharacterImagePromptOptimizeInput,
  string
> = {
  id: "image.character.prompt_optimize",
  version: "v1",
  taskType: "planner",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  render: (input) => [
    new SystemMessage([
      "You are a character-portrait image-prompt optimizer, serving beginner authors who do not know prompt engineering.",
      "Your task is to turn the user's existing character description into a single high-quality positive prompt ready to send straight to an image model.",
      "",
      "Output only the final prompt itself — no explanations, titles, comments, code blocks, parameter notes, or multiple alternative versions.",
      "Do not output a negative prompt, and do not output a 'Prompt:' prefix.",
      "",
      "Optimization principles:",
      "1. Prioritize keeping the character facts the user has explicitly given; do not quietly change the character's core setting.",
      "2. You may organize character role, appearance, temperament, mood, clothing, pose, camera, lighting, composition, and background environment to suit image generation better.",
      "3. If information is insufficient, make only low-risk completions; do not invent details that would change the character's setting.",
      "4. The output must be better suited to character-portrait image generation, not a novel intro, character biography, or analytical prose.",
      "5. If a style preset is given, blend it naturally into the prompt rather than explaining it separately.",
      "",
      "Language requirement:",
      input.outputLanguage === "en"
        ? "The final prompt must be written primarily in English; character proper nouns may keep their original form."
        : "The final prompt must be written in Simplified Chinese.",
      "",
      "Quality requirements:",
      "1. Let the model directly grasp the character's appearance, temperament, and visual focus.",
      "2. Phrasing must be specific, tight, and visualizable; avoid empty words, analytical tone, and repetitive stacking.",
      "3. Do not output list numbering, and do not explain what you did.",
    ].join("\n")),
    new HumanMessage([
      "Based on the following character information, output a single final image-generation prompt:",
      "",
      `Character name: ${input.characterName}`,
      `Character role: ${input.role}`,
      `Personality traits: ${input.personality}`,
      `Appearance & build: ${input.appearance ?? "Not provided"}`,
      `Background: ${input.background}`,
      `Style preset: ${input.stylePreset?.trim() || "Not provided"}`,
      "",
      "User's current description:",
      input.sourcePrompt,
    ].join("\n")),
  ],
};

export const imageNovelCoverBriefPromptEn: PromptAsset<
  NovelCoverBriefPromptInput,
  z.infer<typeof novelCoverBriefSchema>
> = {
  id: "image.novel_cover.brief",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: novelCoverBriefSchema,
  render: (input) => [
    new SystemMessage([
      "You are a novel-cover visual-planning assistant, serving beginner authors who do not understand visual planning or prompt engineering.",
      "Your task is to first organize the user's cover intent for this book into a stable, controllable, further-processable structured brief.",
      "",
      "Output only a single valid JSON object — no Markdown, no explanations, no comments, no extra text.",
      "",
      "The fields must be exactly:",
      "{\"visualHook\":\"...\",\"protagonistOrFocus\":\"...\",\"environmentAndMood\":\"...\",\"composition\":\"...\",\"visualMotifs\":[\"...\"],\"forbiddenElements\":[\"...\"]}",
      "",
      "Global rules:",
      "1. The target is the novel cover's key artwork, not poster copy, not a story synopsis, and not art critique.",
      "2. This stage only organizes visual intent; do not write it into a long prompt yet.",
      "3. You must prioritize the novel's known selling points and the visual focus the user currently wants to emphasize; do not reinvent the genre away from the original book.",
      "4. The artwork defaults to a text-free key image; forbiddenElements must explicitly restrict interfering elements such as title text, watermarks, and logos.",
      "5. The output must be specific and visualizable; avoid piling on vague adjectives.",
      "",
      "Field requirements:",
      "1. visualHook: State in one sentence the cover's most eye-catching visual hook.",
      "2. protagonistOrFocus: State the protagonist, the core object, or the main visual focus.",
      "3. environmentAndMood: State the environment, atmosphere, lighting, and emotional direction.",
      "4. composition: State the composition, camera distance, or how the subject is placed; default to a portrait cover.",
      "5. visualMotifs: Give 2-6 visual elements or symbols that can be used directly in the artwork.",
      "6. forbiddenElements: Give 2-6 interfering elements that must be avoided; this must include at least a requirement like readable text / watermark.",
      "",
      "Completion rules:",
      "1. When information is insufficient, make only low-risk completions; do not introduce big settings that would change the selling points.",
      "2. If the novel itself suits a 'motif cover' better than a character cover, the main focus may become an object, a scene, or the trace of an anomalous rule.",
      "3. If the user's current description conflicts with the novel's metadata, treat the user's current description as higher priority, but do not completely depart from the book's baseline positioning.",
    ].join("\n")),
    new HumanMessage([
      "Based on the following novel information and the user's current idea, organize the cover brief.",
      "",
      `Title: ${input.title}`,
      `One-line description: ${input.description ?? "Not provided"}`,
      `Target readers: ${input.targetAudience ?? "Not provided"}`,
      `Core selling point: ${input.bookSellingPoint ?? "Not provided"}`,
      `Reading feel: ${input.competingFeel ?? "Not provided"}`,
      `First-30-chapters payoff: ${input.first30ChapterPromise ?? "Not provided"}`,
      `Commercial tags: ${input.commercialTags.join(", ") || "Not provided"}`,
      `Genre base: ${input.genreLabel ?? "Not provided"}`,
      `Primary progression mode: ${input.primaryStoryModeLabel ?? "Not provided"}`,
      `Secondary progression mode: ${input.secondaryStoryModeLabel ?? "Not provided"}`,
      `World name: ${input.worldName ?? "Not provided"}`,
      `World atmosphere: ${input.worldSummary ?? "Not provided"}`,
      `Style keywords: ${input.styleTone ?? "Not provided"}`,
      `Narrative POV: ${input.narrativePovLabel ?? "Not provided"}`,
      `Pace preference: ${input.pacePreferenceLabel ?? "Not provided"}`,
      `Emotional intensity: ${input.emotionIntensityLabel ?? "Not provided"}`,
      `Style preset: ${input.stylePreset?.trim() || "Not provided"}`,
      "",
      "User's current description:",
      input.sourcePrompt,
    ].join("\n")),
  ],
};

export const imageNovelCoverPromptOptimizePromptEn: PromptAsset<
  NovelCoverPromptOptimizeInput,
  string
> = {
  id: "image.novel_cover.prompt_optimize",
  version: "v1",
  taskType: "planner",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  render: (input) => [
    new SystemMessage([
      "You are a novel-cover image-prompt optimizer, serving beginner authors who do not understand visual prompt engineering.",
      "Your task is to output a single final positive prompt ready to send straight to an image model, based on the structured brief and the user's current description.",
      "",
      "Output only the final prompt itself — no explanations, titles, comments, code blocks, parameter notes, or multiple alternative versions.",
      "Do not output a negative prompt, and do not output a 'Prompt:' prefix.",
      "",
      "Global requirements:",
      "1. The target is the novel cover's key artwork, not a poster layout draft; do not generate readable title text.",
      "2. The artwork should default to a portrait web-novel cover; the subject must be clear, highly recognizable, and graspable even as a thumbnail.",
      "3. You may strengthen lighting, composition, camera, material, atmosphere, and visual symbols, but you must not depart from the novel's core selling points.",
      "4. If a motif cover suits better, you may highlight the core object, space, or the trace of an anomalous rule, rather than forcing a character half-body portrait.",
      "5. If a style preset exists, it must be blended naturally into the prompt.",
      "",
      "Language requirement:",
      input.outputLanguage === "en"
        ? "The final prompt must be written primarily in English; the Chinese title and proper nouns may keep their original form."
        : "The final prompt must be written in Simplified Chinese.",
      "",
      "Quality requirements:",
      "1. Phrasing must be specific, tight, and visualizable.",
      "2. Do not write it as analytical explanation, and do not use list numbering.",
      "3. The model must directly know the subject, environment, atmosphere, composition, and taboos.",
    ].join("\n")),
    new HumanMessage([
      "Based on the following information, output the final cover image prompt:",
      "",
      `Title: ${input.title}`,
      `Style preset: ${input.stylePreset?.trim() || "Not provided"}`,
      "",
      "Structured brief:",
      JSON.stringify(input.structuredBrief, null, 2),
      "",
      "User's current description:",
      input.sourcePrompt,
    ].join("\n")),
  ],
};
