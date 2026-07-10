import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import {
  comicEpisodeOutlineOutputSchema,
  comicPanelScriptOutputSchema,
  type ComicEpisodeOutlineOutput,
  type ComicEpisodeOutlinePromptInput,
  type ComicPanelScriptOutput,
  type ComicPanelScriptPromptInput,
} from "./comic.prompts";

/**
 * English variants of the `comic.*` prompts (episodeOutline / panelScript).
 *
 * Domain-aware rewrites for English-language webtoon production — NOT literal
 * string swaps of the zh anchors. Each variant reuses its zh anchor's
 * `outputSchema` (JSON shape is language-independent) and input type. Registered
 * alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 *
 * Note on kept tokens: the four-panel `beat` schema enum values (起/承/转/合)
 * are downstream schema contracts the model must echo verbatim, so they stay
 * unchanged in the four_koma format instruction and example.
 */

export const comicEpisodeOutlinePromptEn: PromptAsset<
  ComicEpisodeOutlinePromptInput,
  ComicEpisodeOutlineOutput
> = {
  id: "comic.episodeOutline",
  version: "v1",
  taskType: "outline_planning",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 7000 },
  outputSchema: comicEpisodeOutlineOutputSchema,
  render(input) {
    return [
      new SystemMessage(
        `You are a professional comic (webtoon / motion-comic) content planner, skilled at adapting novels and original stories into episodically released vertical-scroll comics.
Per-episode goal: 30-80 panels, a hook at the open, suspense / a cliffhanger at the close, and a complete emotional arc.
Art style reference: ${input.stylePreset ?? "full-color Korean webtoon"}.`,
      ),
      new HumanMessage(
        `Plan the episode outline for episodes ${input.startOrder}-${input.endOrder} of the comic project "${input.title}".

## Content synopsis
${input.synopsis}

## Plot beat digest
${input.beatsDigest}

## Constraints
- Cliffhanger/paywall episode numbers (isPaywalled=true): ${input.paywallOrders.length > 0 ? input.paywallOrders.join(", ") : "none"}
- Opening hook type library (pick hookType from this):
${input.hookLibrary}

## Output format
Return an episodes array; each item contains: order / title / synopsis / hookType / cliffhanger / isPaywalled / sourceChapterStart / sourceChapterEnd.
Sort ascending by order, keep the plot continuous, and concentrate suspense around isPaywalled episodes.`,
      ),
    ];
  },
};

export const comicPanelScriptPromptEn: PromptAsset<
  ComicPanelScriptPromptInput,
  ComicPanelScriptOutput
> = {
  id: "comic.panelScript",
  version: "v1",
  taskType: "chapter_drafting",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 9000 },
  outputSchema: comicPanelScriptOutputSchema,
  render(input) {
    const panelTarget = input.targetPanelCount ?? 45;
    const characterList = input.characters
      .map((c) => `- ${c.name}: ${c.visualAnchor ?? "(no visual description yet)"}`)
      .join("\n");

    // Character asset inventory: grouped by character so the model understands "who has what".
    const assetsByChar = new Map<string, typeof input.characterAssets>();
    for (const asset of input.characterAssets ?? []) {
      if (!assetsByChar.has(asset.characterName)) assetsByChar.set(asset.characterName, []);
      assetsByChar.get(asset.characterName)!.push(asset);
    }
    const assetSection = assetsByChar.size > 0
      ? Array.from(assetsByChar.entries()).map(([charName, assets]) => {
          const lines = assets!.map((a) => {
            const desc = a.description ? `(${a.description})` : "";
            return `  - [${a.assetType}] ${a.name}${desc}`;
          });
          return `${charName}:\n${lines.join("\n")}`;
        }).join("\n")
      : null;
    const stylePrefix = input.stylePromptKeywords
      ?? (input.stylePreset ? `${input.stylePreset} style` : "webtoon style, vibrant colors, clean lines");

    // Existing scene inventory (cross-episode reuse: same location keeps the same name).
    const existingSceneSection = (input.existingScenes?.length ?? 0) > 0
      ? input.existingScenes!
          .map((s) => `- ${s.name} (${s.sceneType})${s.summary ? `: ${s.summary}` : ""}`)
          .join("\n")
      : null;

    const is4koma = input.comicFormat === "4koma";
    const densityMode = input.densityMode ?? "balanced";
    const densityRuleMap: Record<NonNullable<ComicPanelScriptPromptInput["densityMode"]>, string> = {
      relaxed:
        "Information density mode: relaxed. Prioritize emotional reactions, single actions, and clear negative space; most panels hold only 1 visual focus, 0-1 lines of dialogue, and 1-2 characters, with sparse complex backgrounds. Every 5-8 panels, place one low-density emotional breather.",
      balanced:
        "Information density mode: balanced. Most panels carry 1 action or emotional turn, 1-2 characters, and 1-2 lines of dialogue; key conflict panels may raise background detail and character count, but do not pack panels full back-to-back.",
      compact:
        "Information density mode: compact. More plot progression and same-frame information is allowed, but each panel may still have only one primary visual focus; high-density panels carry at most 3 lines of dialogue and 2-4 characters, and avoid more than 3 high-density panels in a row.",
    };
    const visualPromptRule = is4koma
      ? `9. visualPrompt MUST begin with the style prefix "${stylePrefix}", then explicitly describe each sub-panel's content following the four-panel structure, in the format:
   Panel1:[起] <panel content>. Panel2:[承] <panel content>. Panel3:[转] <panel content>. Panel4:[合] <panel content>.
   Each sub-panel description is independent; the shot / emotion / content must differ clearly — do not repeat similar frames. The four panels combined should carry more than 3x the information of a single panel.`
      : `9. visualPrompt MUST begin with the fixed style prefix "${stylePrefix}", then describe the visual content (characters on screen, costumes, expressions, scene, composition), with no bubble text`;

    return [
      new SystemMessage(
        `You are a seasoned comic storyboard artist focused on vertical-scroll webtoons.
Responsibility: first identify this episode's scenes (a "scene bible"), then break the outline into a panel-by-panel storyboard script of about ${panelTarget} panels.

[Step 1: Identify scenes] (at most 8)
- For each scene provide: name (location name), sceneType (interior/exterior/landscape/abstract/other), palette (main color palette), keyElements (landmarks/furniture/terrain); optional materials, ambiance (lighting mood), layout (spatial structure)
- Group continuous spaces (e.g. "bamboo-grove outskirts -> deep in the bamboo grove") into one scene where possible; avoid fragmenting into one scene per panel
- If "existing project scenes" are provided, when the same location appears in this episode you MUST **reuse the exact same name** — do not create a near-synonym name

[Step 2: Panel-by-panel storyboard], where each panel's sceneRef MUST be one of the names from the scenes list above
Rules:
1. Each panel focuses on a single action/emotion; vary the shot language (establishing/close_up/action/reaction/transition)
2. Each bubble's text <= 30 characters, at most 3 bubbles per panel; use a cloud bubble for inner thoughts and caption for narration
2b. The dialogues[].text field may contain only the spoken line itself — never add "X said", "X spoke", the speaker's name, colons, quotation marks, or any narrative prefix. Put the speaker in the speaker field; bubble ownership is decided automatically by speaker
3. anchorHint sets the bubble position (top-left/top-right/bottom-center, etc.), keeping clear of the subject
4. characterRefs MUST be an array of objects: { name, costume, expression, lighting?, props? }
5. expression may only be neutral/happy/angry/sad/surprised/cold; choose it from the panel's dialogue emotion, action, and shot intent — do not fall back on a fixed word
6. costume defaults to "default"; when the plot clearly changes an outfit, fill in the matching costume name from the character asset library (e.g. "battle armor")
6b. props is an array of prop/weapon names the panel's characters hold/use; it MUST come from the character asset library; omit it if none
7. densityLevel must be low/medium/high: low = emotional reaction or negative space, medium = normal progression, high = scene establishment / conflict eruption / multiple characters in frame
8. focus states this panel's primary visual focus in one sentence; do not write a vague summary
${visualPromptRule}
10. ${densityRuleMap[densityMode]}
11. Art style: ${input.stylePreset ?? "full-color Korean webtoon"}`,
      ),
      new HumanMessage(
        `Comic project: ${input.projectTitle}
This episode: Episode ${input.episodeOrder} "${input.episodeTitle}"

## This episode's plot outline
${input.episodeSynopsis}

${input.sourceText ? `## This episode's source text (dialogue source)\n${input.sourceText.slice(0, 3000)}\n` : ""}## Characters on screen
${characterList}

${assetSection ? `## Character available assets (costumes/weapons/props, etc.)\nReference them in characterRefs as the plot requires: put costume names in costume, and prop/weapon names in props\n${assetSection}\n` : ""}${existingSceneSection ? `## Existing project scenes (reuse the same name for the same location; do not create near-synonym names)\n${existingSceneSection}\n` : ""}${input.factDigest ? `## Cross-episode consistency facts (follow strictly)\n${input.factDigest}\n` : ""}
${input.scriptPromptInstruction ? `## Additional paneling requirements for this run\n${input.scriptPromptInstruction}\n` : ""}
## Task
First identify this episode's scenes (<= 8), then generate a full panel script of about ${panelTarget} panels, returning { scenes, panels }.
Each panel contains: order / panelType / densityLevel / focus / action / sceneRef / dialogues / characterRefs / visualPrompt / layoutData.
scenes example: [{ "name": "Sect Grand Hall", "sceneType": "interior", "palette": "dark gold and vermilion", "keyElements": "coiled-dragon stone pillars, floating plaque, bronze incense burner", "ambiance": "dim candlelight", "layout": "deep symmetry, raised dais at center" }].
characterRefs example: [{ "name": "Shen Jianxin", "costume": "battle armor", "expression": "cold", "lighting": "side_lit", "props": ["Moonlight Blade"] }].
In four-panel mode, layoutData example: { "layout": "four_koma", "subPanels": [{ "order": 1, "beat": "起", "visualPrompt": "..." }] }.
Keep the plot coherent, the shot language varied, the dialogue tight, and leave a cliffhanger on the last panel.`,
      ),
    ];
  },
};
