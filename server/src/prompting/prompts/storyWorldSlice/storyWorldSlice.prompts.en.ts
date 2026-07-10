import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { WorldStructuredData } from "@ai-novel/shared/types/world";
import type { PromptAsset } from "../../core/promptTypes";
import { resolveCommercialTags } from "../../../services/novel/bookFraming";
import { storyWorldSliceRawPayloadSchema } from "./storyWorldSlice.promptSchemas";
import type { StoryWorldSlicePromptInput } from "./storyWorldSlice.prompts";

/**
 * English variant of `storyWorldSlice.generate@v1`.
 *
 * Domain-aware rewrite for English-language novels — NOT a literal string swap
 * of the zh anchor. Reuses the zh anchor's `outputSchema` (a generic JSON record;
 * the concrete shape is enforced by the prompt text) and input type. Registered
 * alongside the zh anchor; the runner swaps to this variant only when
 * `options.locale === "en"`.
 *
 * The book-framing summary is rebuilt locally with English labels (rather than
 * calling the zh `buildBookFramingSummary`) so the rendered prose stays English;
 * commercial-tag parsing is reused from the shared service.
 */

function buildBookFramingSummary(source: StoryWorldSlicePromptInput["novel"]): string {
  const commercialTags = resolveCommercialTags(source);
  return [
    source.targetAudience?.trim() ? `Target readers: ${source.targetAudience.trim()}` : "",
    commercialTags.length > 0 ? `Core commercial tags: ${commercialTags.join(", ")}` : "",
    source.bookSellingPoint?.trim() ? `Book's core selling point: ${source.bookSellingPoint.trim()}` : "",
    source.competingFeel?.trim() ? `Comparable feel / familiar reading experience: ${source.competingFeel.trim()}` : "",
    source.first30ChapterPromise?.trim() ? `First-30-chapter promise: ${source.first30ChapterPromise.trim()}` : "",
  ].filter(Boolean).join("\n");
}

function formatRules(structure: WorldStructuredData): string {
  if (structure.rules.axioms.length === 0) {
    return "No explicit rules yet.";
  }
  return structure.rules.axioms
    .map((rule) => [
      `- [${rule.id}] ${rule.name}`,
      rule.summary && `Summary: ${rule.summary}`,
      rule.cost && `Cost: ${rule.cost}`,
      rule.boundary && `Boundary: ${rule.boundary}`,
      rule.enforcement && `Enforcement consequence: ${rule.enforcement}`,
    ].filter(Boolean).join(" | "))
    .join("\n");
}

function formatForces(structure: WorldStructuredData): string {
  if (structure.forces.length === 0) {
    return "No explicit forces yet.";
  }
  return structure.forces
    .map((force) => [
      `- [${force.id}] ${force.name}`,
      force.type && `Type: ${force.type}`,
      force.summary && `Overview: ${force.summary}`,
      force.currentObjective && `Current objective: ${force.currentObjective}`,
      force.pressure && `Pressure method: ${force.pressure}`,
      force.narrativeRole && `Narrative role: ${force.narrativeRole}`,
    ].filter(Boolean).join(" | "))
    .join("\n");
}

function formatLocations(structure: WorldStructuredData): string {
  if (structure.locations.length === 0) {
    return "No explicit locations yet.";
  }
  return structure.locations
    .map((location) => [
      `- [${location.id}] ${location.name}`,
      location.terrain && `Terrain: ${location.terrain}`,
      location.summary && `Overview: ${location.summary}`,
      location.narrativeFunction && `Narrative function: ${location.narrativeFunction}`,
      location.risk && `Risk: ${location.risk}`,
      location.entryConstraint && `Entry constraint: ${location.entryConstraint}`,
      location.exitCost && `Exit cost: ${location.exitCost}`,
    ].filter(Boolean).join(" | "))
    .join("\n");
}

function buildStoryWorldSlicePrompt(input: StoryWorldSlicePromptInput): { system: string; user: string } {
  const { novel, structure, bindingSupport, storyInput, overrides, builderMode } = input;
  const bookFramingSummary = buildBookFramingSummary(novel);
  return {
    system: [
      "You are a novel world-integration planner.",
      "Your task is NOT to recite the entire world encyclopedia, but to trim the upstream world settings down to \"the world settings this book will actually use\".",
      "You must prioritize keeping: the parts that genuinely affect this book's conflict, location scheduling, rule constraints, suspense sources, and pressure sources.",
      "When trimming, decide what world content to keep primarily around the target readers, core selling point, commercial tags, and first-30-chapter promise.",
      "Do not cram every world setting into the result. You must actively cut settings unrelated to the current story.",
      "If the user's story idea clearly conflicts with the world's boundaries or forbidden combinations, you must reflect that conflict risk in storyScopeBoundary and forbiddenCombinations.",
      "Output strict JSON only, with no explanation.",
      "activeElements may, in this first pass, only be distilled into narratively usable leads, rule fragments, location leads, or force leads — do not invent a new world model.",
      "activeForces, activeLocations, and appliedRules must all reference existing ids.",
      "recommendedEntryPoints, pressureSources, and conflictCandidates may be trimmed directly by combining bindingSupport with the current story intent.",
      "[Key constraint: prevent world settings from polluting the story text]",
      "coreWorldFrame, pressureSources, conflictCandidates, suggestedStoryAxes, recommendedEntryPoints,",
      "storyScopeBoundary, mysterySources, and all other free-text fields must be described in generic in-story narrative language,",
      "for example \"local power brokers\", \"a law-enforcement body\", \"trade rivals\", \"market-governing rules\",",
      "rather than lifting the world assets' proper names directly (the name field behind a force id, the name field behind a location id, etc.).",
      "Proper names may appear only in the id-reference fields of appliedRules/activeForces/activeLocations,",
      "and must not appear in the free-text fields above, to avoid world-specific vocabulary from another era or region polluting the current story-text generation.",
      "If the world source clearly mismatches the novel's story setting in era or region (e.g. a historical-war world vs a modern-city story),",
      "you must write an explicit mapping note in storyScopeBoundary: \"X in the world maps to Y in this book\",",
      "and list in forbiddenCombinations the original world-specific terms that should not be used directly.",
      "The JSON structure must be:",
      "{",
      '  "coreWorldFrame": "a summary of the stage this book will actually use",',
      '  "appliedRules": [{"id":"rule-id","whyItMatters":"why this rule genuinely affects this book"}],',
      '  "activeForces": [{"id":"force-id","roleInStory":"its role in this book","pressure":"what pressure this force puts on the protagonist / main line"}],',
      '  "activeLocations": [{"id":"location-id","storyUse":"what plot this location is suited to carry","risk":"what could go wrong here"}],',
      '  "activeElements": [{"id":"element-id","label":"element name","type":"rule|force|location|binding","summary":"one-sentence explanation"}],',
      '  "conflictCandidates": ["conflicts that can be developed directly"],',
      '  "pressureSources": ["main pressure sources"],',
      '  "mysterySources": ["questions suited to keep readers hooked"],',
      '  "suggestedStoryAxes": ["story axes recommended for focused progression"],',
      '  "recommendedEntryPoints": ["entry points suited for the opening"],',
      '  "forbiddenCombinations": ["combinations that should not co-occur or would clearly derail"],',
      '  "storyScopeBoundary": "what boundary this book should keep the story within"',
      "}",
    ].join("\n"),
    user: [
      `Novel title: ${novel.title}`,
      novel.description?.trim() ? `Novel synopsis: ${novel.description.trim()}` : "",
      bookFramingSummary ? `Book-level framing:\n${bookFramingSummary}` : "",
      storyInput.trim() ? `Current story idea: ${storyInput.trim()}` : "Current story idea: none; trim based on the novel's known synopsis and world settings.",
      `Current purpose: ${builderMode}`,
      novel.styleTone ? `Style tendency: ${novel.styleTone}` : "",
      novel.narrativePov ? `Narrative POV: ${novel.narrativePov}` : "",
      novel.pacePreference ? `Pacing preference: ${novel.pacePreference}` : "",
      novel.emotionIntensity ? `Emotional intensity: ${novel.emotionIntensity}` : "",
      `World overview: ${structure.profile.summary || structure.profile.identity || "none"}`,
      structure.profile.coreConflict ? `World core conflict: ${structure.profile.coreConflict}` : "",
      `Available rules:\n${formatRules(structure)}`,
      `Available forces:\n${formatForces(structure)}`,
      `Available locations:\n${formatLocations(structure)}`,
      bindingSupport.recommendedEntryPoints.length > 0
        ? `Entry points from binding suggestions:\n${bindingSupport.recommendedEntryPoints.map((item) => `- ${item}`).join("\n")}`
        : "",
      bindingSupport.highPressureForces.length > 0
        ? `High-pressure sources from binding suggestions:\n${bindingSupport.highPressureForces.map((item) => `- ${item}`).join("\n")}`
        : "",
      bindingSupport.compatibleConflicts.length > 0
        ? `Conflict candidates from binding suggestions:\n${bindingSupport.compatibleConflicts.map((item) => `- ${item}`).join("\n")}`
        : "",
      bindingSupport.forbiddenCombinations.length > 0
        ? `Forbidden combinations from binding suggestions:\n${bindingSupport.forbiddenCombinations.map((item) => `- ${item}`).join("\n")}`
        : "",
      `Novel-side mandatory keep items: ${JSON.stringify(overrides)}`,
      "Trim based on the parts this novel genuinely needs; do not copy the world wholesale.",
    ].filter(Boolean).join("\n\n"),
  };
}

export const storyWorldSlicePromptEn: PromptAsset<
  StoryWorldSlicePromptInput,
  z.infer<typeof storyWorldSliceRawPayloadSchema>
> = {
  id: "storyWorldSlice.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: storyWorldSliceRawPayloadSchema,
  render: (input) => {
    const prompt = buildStoryWorldSlicePrompt(input);
    return [
      new SystemMessage(prompt.system),
      new HumanMessage(prompt.user),
    ];
  },
};
