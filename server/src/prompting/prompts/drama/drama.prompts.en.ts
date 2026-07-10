import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import {
  dramaComplianceOutputSchema,
  dramaEpisodeOutlineOutputSchema,
  dramaQualityOutputSchema,
  dramaScriptOutputSchema,
  dramaSourceBundleOutputSchema,
  dramaSourceSupplementOutputSchema,
  dramaStoryboardOutputSchema,
  dramaStrategyOutputSchema,
  dramaTrackRecommendationOutputSchema,
  dramaVideoPromptOutputSchema,
  type DramaComplianceOutput,
  type DramaCompliancePromptInput,
  type DramaEpisodeOutlineOutput,
  type DramaEpisodeOutlinePromptInput,
  type DramaOriginalSourcePromptInput,
  type DramaQualityOutput,
  type DramaQualityPromptInput,
  type DramaScriptOutput,
  type DramaScriptPromptInput,
  type DramaSourceBundleOutput,
  type DramaSourceSupplementOutput,
  type DramaSourceSupplementPromptInput,
  type DramaStoryboardOutput,
  type DramaStrategyOutput,
  type DramaStrategyPromptInput,
  type DramaTextImportSourcePromptInput,
  type DramaTrackRecommendationOutput,
  type DramaTrackRecommendationPromptInput,
  type DramaVideoPromptOutput,
} from "./drama.prompts";

/**
 * English variants of the `drama.*` micro-drama prompts (source bundling, track
 * recommendation, strategy, episode outline/script/quality/compliance/repair,
 * storyboard, and video prompt).
 *
 * Domain-aware rewrites for English-language vertical-screen paid micro-dramas —
 * NOT literal string swaps of the zh anchors. Each variant reuses its zh
 * anchor's `outputSchema` (JSON shape is language-independent) and input type.
 * Registered alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 */

export const dramaTrackRecommendationPromptEn: PromptAsset<
  DramaTrackRecommendationPromptInput,
  DramaTrackRecommendationOutput
> = {
  id: "drama.track.recommendation",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 5000 },
  outputSchema: dramaTrackRecommendationOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a vertical-screen paid micro-drama concept planner. You help first-time creators choose the micro-drama track that best fits their story material.",
      "Base your judgment on the story's core conflict, the protagonist's situation, how satisfying payoffs are delivered, and the rules of paid micro-drama tracks.",
      "You may only choose recommendedTrack and alternatives.track from the given track catalog.",
      "Output only JSON conforming to the schema — no Markdown.",
    ].join("\n")),
    new HumanMessage([
      `[Project name] ${input.title}`,
      `[Content source] ${input.sourceType}`,
      `[Theme note] ${input.theme || "Not provided"}`,
      `[Target episode count] ${input.targetEpisodes}`,
      "",
      `[Track catalog]\n${input.trackCatalog}`,
      "",
      `[Story material]\n${input.sourceDigest}`,
      "",
      "Recommend the single best-fitting micro-drama track, and provide the fit signals, risks, and alternative tracks.",
    ].join("\n")),
  ],
};

export const dramaSourceSupplementPromptEn: PromptAsset<
  DramaSourceSupplementPromptInput,
  DramaSourceSupplementOutput
> = {
  id: "drama.source.supplement",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 7000 },
  outputSchema: dramaSourceSupplementOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a vertical-screen micro-drama material-diagnosis assistant. You judge whether the SourceBundle is complete enough to enter strategy, episode-breakdown, and script generation.",
      "Your output must help first-time creators fill in the most critical missing information. Every question must be specific, easy to answer, and able to directly improve downstream generation.",
      "Do not label ordinary minor flaws as blockers; only recommend rebuild_source_bundle when the material is severely insufficient or the content bundle needs to be rebuilt.",
      "Output only JSON conforming to the schema — no Markdown.",
    ].join("\n")),
    new HumanMessage([
      `[Project] ${input.projectTitle}`,
      `[Source] ${input.sourceType}`,
      `[Target episode count] ${input.targetEpisodes}`,
      `[Quality snapshot]\n${input.qualitySnapshot}`,
      "",
      `[Synopsis]\n${input.synopsis || "Empty"}`,
      `[Beats digest]\n${input.beatsDigest || "Empty"}`,
      `[Characters digest]\n${input.charactersDigest || "Empty"}`,
      `[Hard facts]\n${input.factsDigest || "Empty"}`,
      input.userSupplement ? `[User supplement]\n${input.userSupplement}` : "",
      "",
      "Output the material-readiness diagnosis, the gaps, the follow-up questions, and the next-step recommendation.",
    ].filter(Boolean).join("\n")),
  ],
};

export const dramaSourceOriginalBundlePromptEn: PromptAsset<
  DramaOriginalSourcePromptInput,
  DramaSourceBundleOutput
> = {
  id: "drama.source.original_bundle",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 5000 },
  outputSchema: dramaSourceBundleOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a vertical-screen paid micro-drama planner. You turn an original idea into a standardized content bundle ready to enter the micro-drama production pipeline.",
      "Use structured understanding to fill in the mainline, characters, key beats, and hard facts.",
      "Output only JSON conforming to the schema — no Markdown.",
    ].join("\n")),
    new HumanMessage([
      `[Title] ${input.title}`,
      `[Idea] ${input.inspiration}`,
      `[Track] ${input.track || "Unspecified — you decide based on the micro-drama market"}`,
      `[Theme] ${input.theme || "Unspecified"}`,
      `[Target episode count] ${input.targetEpisodes}`,
      "",
      "Generate the SourceBundle: synopsis, beats, characters, worldNotes, hardFacts.",
      "Express beats as 12-24 high-density plot beats; do not write them as long-form chapters.",
    ].join("\n")),
  ],
};

export const dramaSourceTextBundlePromptEn: PromptAsset<
  DramaTextImportSourcePromptInput,
  DramaSourceBundleOutput
> = {
  id: "drama.source.text_bundle",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 9000 },
  outputSchema: dramaSourceBundleOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a vertical-screen micro-drama adaptation planner. You parse imported text into a source-agnostic SourceBundle.",
      "Preserve the core characters, conflicts, twists, hard facts, and adaptable beats; avoid verbatim retelling.",
      "Output only JSON conforming to the schema — no Markdown.",
    ].join("\n")),
    new HumanMessage([
      `[Title] ${input.title}`,
      `[Track] ${input.track || "Unspecified"}`,
      `[Theme] ${input.theme || "Unspecified"}`,
      `[Target episode count] ${input.targetEpisodes}`,
      "",
      `[Imported text]\n${input.rawText.slice(0, 24000)}`,
      "",
      "Output the SourceBundle. Organize beats along the plot's progression into beats usable for micro-drama episode breakdown.",
    ].join("\n")),
  ],
};

export const dramaStrategyPromptEn: PromptAsset<
  DramaStrategyPromptInput,
  DramaStrategyOutput
> = {
  id: "drama.strategy",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 4000 },
  outputSchema: dramaStrategyOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a top vertical-screen paid micro-drama showrunner, skilled at adapting a story into a micro-drama with high completion rates and high paid conversion.",
      "Your task is to produce this micro-drama's adaptation strategy, grounded in the content synopsis and the track's rules.",
      "Output only strict JSON conforming to the schema — no Markdown, explanations, or code blocks.",
    ].join("\n")),
    new HumanMessage([
      `[Content synopsis]\n${input.synopsis}`,
      "",
      `[Track] ${input.trackLabel}: ${input.trackDescription}`,
      `[This track's payoff rhythm] ${input.rhythmNote}`,
      `[This track's preferred hooks] ${input.preferredHooks}`,
      `[Track taboos] ${input.taboos}`,
      `[Total episodes] ${input.targetEpisodes}`,
      `[Free lead-in] first ${input.freeEpisodes} episodes`,
      `[First paywall point] episode ${input.firstPaywallAt}`,
      "",
      "Output the adaptation-strategy JSON for this vertical-screen paid micro-drama.",
      "paywallPlan.firstPaywallAt must fall between episodes 8-15; set the first paywall point in light of the material.",
      "paywallPlan.intensityCurve must break the free lead-in, the pre-paywall build-up of pent-up frustration, the strong first-paywall cliffhanger, and the subsequent recurring paywall cliffhangers into executable episode ranges.",
    ].join("\n")),
  ],
};

export const dramaEpisodeOutlinePromptEn: PromptAsset<
  DramaEpisodeOutlinePromptInput,
  DramaEpisodeOutlineOutput
> = {
  id: "drama.episodeOutline",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 8000 },
  outputSchema: dramaEpisodeOutlineOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a top vertical-screen paid micro-drama screenwriter. You cut a story into an episode structure with strong hooks and strong cliffhangers.",
      "Every episode must include a golden-3-seconds hook, a main hook type, a core conflict, an end-of-episode cliffhanger, an emotion net value, and source mapping.",
      "Output only strict JSON conforming to the schema — no Markdown, explanations, or code blocks.",
    ].join("\n")),
    new HumanMessage([
      `[Content synopsis]\n${input.synopsis}`,
      `[Adaptation strategy]\n${input.strategyJson}`,
      `[Track] ${input.trackLabel}`,
      `[Hook library]\n${input.hookLibrary}`,
      `[Content beats digest]\n${input.beatsDigest}`,
      `[This generation range] starting at episode ${input.startOrder}, ${input.count} episodes in total`,
      `[Paywall cliffhanger episode numbers] ${input.paywallEpisodes || "None"}`,
      `[Paywall cliffhanger plan]\n${input.paywallPlanDigest}`,
      "",
      "Output the episode-outline JSON for this range.",
      "If this range contains the first paywall episode, the episode just before it should form a stage-level low point, and the first paywall episode's ending must reach the strong-cliffhanger target set in the plan.",
    ].join("\n")),
  ],
};

export const dramaEpisodeScriptPromptEn: PromptAsset<DramaScriptPromptInput, DramaScriptOutput> = {
  id: "drama.episode.script",
  version: "v1",
  taskType: "chapter_drafting",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 9000 },
  outputSchema: dramaScriptOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a vertical-screen paid micro-drama script writer. The output must be shootable, dialogue-dense, and fast to advance conflict.",
      "The script must include character names, action cues, and dialogue; do not write long novelistic passages of interior monologue.",
      "The opening 3 seconds must carry conflict / suspense / contrast, and the ending must have a strong cliffhanger.",
      "Output only JSON conforming to the schema.",
    ].join("\n")),
    new HumanMessage([
      `[Project] ${input.projectTitle}`,
      `[Strategy]\n${input.strategyJson}`,
      `[This episode's outline]\n${input.episodeJson}`,
      `[Characters]\n${input.charactersDigest}`,
      `[Fact ledger]\n${input.factsDigest}`,
      `[Prior-episodes digest]\n${input.previousDigest}`,
      `[Source beats]\n${input.sourceDigest}`,
      "",
      "Generate the micro-drama script JSON for this episode.",
    ].join("\n")),
  ],
};

export const dramaEpisodeQualityPromptEn: PromptAsset<DramaQualityPromptInput, DramaQualityOutput> = {
  id: "drama.episode.quality",
  version: "v1",
  taskType: "chapter_review",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 7000 },
  outputSchema: dramaQualityOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are the vertical-screen paid micro-drama quality gate. You check whether the script is fit for high completion rates and paid conversion.",
      "Focus on the golden 3 seconds, information density, paywall cliffhangers, the emotion curve, duration, fact consistency, and character consistency.",
      "For local quality issues, give repairable suggestions; only mark blocked when there is no usable content or a severe fact conflict.",
      "Output only JSON conforming to the schema.",
    ].join("\n")),
    new HumanMessage([
      `[This episode's outline]\n${input.episodeJson}`,
      `[Script]\n${input.content}`,
      `[Strategy]\n${input.strategyJson}`,
      `[Paywall cliffhanger plan]\n${input.paywallPlanDigest}`,
      `[Adjacent-episode rhythm]\n${input.episodeRhythmDigest}`,
      `[Fact ledger]\n${input.factsDigest}`,
      `[Characters]\n${input.charactersDigest}`,
      "",
      "Output the quality-assessment JSON. For paywall episodes, focus on whether the ending cliffhanger reaches the planned intensity; for the episode just before the first paywall, judge whether it carries the pent-up-frustration low-point function.",
    ].join("\n")),
  ],
};

export const dramaEpisodeCompliancePromptEn: PromptAsset<DramaCompliancePromptInput, DramaComplianceOutput> = {
  id: "drama.episode.compliance",
  version: "v1",
  taskType: "chapter_review",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 7000 },
  outputSchema: dramaComplianceOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are the vertical-screen micro-drama platform-compliance pre-checker. You catch high-frequency rejection risks before the script enters shooting or video generation.",
      "The review scope includes but is not limited to: excessive depiction of violence or gore, medical misinformation, promotion of feudal superstition, vulgar or borderline sexual content, instruction in illegal or criminal acts, absolutist wording banned by advertising law, content inappropriate for minors, and imitation of dangerous behavior.",
      "level=pass means no obvious platform-rejection risk was found; level=warn means you may continue but a rewrite is advised; level=block means it must be fixed before entering production.",
      "Output only JSON conforming to the schema — no Markdown.",
    ].join("\n")),
    new HumanMessage([
      `[This episode's outline]\n${input.episodeJson}`,
      `[Script]\n${input.content}`,
      `[Characters]\n${input.charactersDigest}`,
      `[Fact ledger]\n${input.factsDigest}`,
      "",
      "Output the platform-compliance pre-check report JSON. Each entry in items must give the rule it triggers, the original excerpt, and a revision suggestion aimed at the screenwriter.",
    ].join("\n")),
  ],
};

export const dramaEpisodeRepairPromptEn: PromptAsset<{
  content: string;
  repairInstruction: string;
  episodeJson: string;
}, DramaScriptOutput> = {
  id: "drama.episode.repair",
  version: "v1",
  taskType: "chapter_repair",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 8000 },
  outputSchema: dramaScriptOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a vertical-screen micro-drama script-repair writer. Rewrite this episode's script based on the explicit repair instruction.",
      "Keep this episode's outline goals unchanged while fixing the hook, cliffhanger, duration, fact, or character problems.",
      "Output only JSON conforming to the schema.",
    ].join("\n")),
    new HumanMessage([
      `[This episode's outline]\n${input.episodeJson}`,
      `[Repair instruction]\n${input.repairInstruction}`,
      `[Original script]\n${input.content}`,
    ].join("\n")),
  ],
};

export const dramaStoryboardPromptEn: PromptAsset<{
  content: string;
  charactersDigest: string;
}, DramaStoryboardOutput> = {
  id: "drama.storyboard",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 8000 },
  outputSchema: dramaStoryboardOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a vertical-screen micro-drama storyboard artist. Break the script into a shootable shot sequence, prioritizing close-ups, medium close-ups, strong facial expressions, and clear actions.",
      "Every shot must serve the advancement of conflict; avoid empty establishing shots and environmental padding.",
      "Output only JSON conforming to the schema.",
    ].join("\n")),
    new HumanMessage([
      `[Character visual anchors]\n${input.charactersDigest}`,
      `[Script]\n${input.content}`,
    ].join("\n")),
  ],
};

export const dramaVideoPromptPromptEn: PromptAsset<{
  shotJson: string;
  charactersDigest: string;
}, DramaVideoPromptOutput> = {
  id: "drama.video.prompt",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 4000 },
  outputSchema: dramaVideoPromptOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a vertical-screen AI-video prompt director. Turn a single micro-drama shot into a video-generation prompt.",
      "The prompt must preserve the character visual anchors, action, emotion, camera language, and 9:16 vertical framing.",
      "Output only JSON conforming to the schema.",
    ].join("\n")),
    new HumanMessage([
      `[Character visual anchors]\n${input.charactersDigest}`,
      `[Shot]\n${input.shotJson}`,
    ].join("\n")),
  ],
};
