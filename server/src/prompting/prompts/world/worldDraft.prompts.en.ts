import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import {
  worldDraftGenerationSchema,
  worldRefineAlternativeListSchema,
  worldSkeletonSchema,
} from "./worldDraft.prompts";
import type {
  WorldDraftGenerationPromptInput,
  WorldDraftRefineAlternativesPromptInput,
  WorldDraftRefinePromptInput,
  WorldSkeletonGenerationPromptInput,
} from "./worldDraft.prompts";

/**
 * English variants of the `world.draft.*` / `world.skeleton.*` prompt family.
 *
 * Domain-aware rewrites for English-language fiction worldbuilding — NOT literal
 * string swaps of the zh anchors. Each variant reuses its zh anchor's
 * `outputSchema` (the world graph JSON shape is language-independent) and the
 * same input type. Registered alongside the zh anchors; the runner swaps to a
 * variant only when `options.locale === "en"`.
 */

function buildWorldDraftRequirementsEn(input: WorldDraftGenerationPromptInput): string[] {
  const requirements: string[] = [
    "description: 2-4 sentences capturing how the world runs + the reading feel. Must convey \"how this world works + what the reader experiences\"; no filler.",
    "background: state the world's starting point, era/stage, and the current opening situation; it must support the plot taking off.",
    "conflicts: distill the world-level structural conflicts (long-standing tensions), not single events.",
  ];

  if (input.dimensions.geography) {
    requirements.push("geography: terrain structure, regional layout, and key locations — must show how space shapes conflict and action.");
  }

  if (input.dimensions.culture) {
    requirements.push("cultures: social texture and values — must explain character behavior and choice logic.");
    requirements.push("politics: power structure and governance — must show control and opposition.");
    requirements.push("races: ethnic or class divisions — must show difference and resource distribution.");
    requirements.push("religions: belief or spiritual order — must show mechanisms that constrain or shape behavior.");
    requirements.push("factions: major forces and camp layout — usable for building conflict and alliance.");
  }

  if (input.dimensions.magicSystem) {
    requirements.push("magicSystem: power source, usage, limits, and cost — must show the price and boundary of gaining power.");
  }

  if (input.dimensions.technology) {
    requirements.push("technology: tech level and key technologies — must show how they reshape social structure.");
    requirements.push("economy: resource and wealth flow — must show survival pressure or competition.");
  }

  if (input.dimensions.history) {
    requirements.push("history: key turning points — must explain why the world is the way it is now.");
  }

  return requirements;
}

function formatBlueprintEn(input: WorldSkeletonGenerationPromptInput): string {
  const blueprint = input.blueprint;
  if (!blueprint) {
    return "none";
  }
  const propertyLines = blueprint.propertySelections.map((item) =>
    [
      item.name,
      item.choiceLabel && `choice: ${item.choiceLabel}`,
      item.description,
      item.detail && `detail: ${item.detail}`,
    ].filter(Boolean).join(" | "),
  );
  return [
    blueprint.classicElements.length > 0 ? `classic elements: ${blueprint.classicElements.join(", ")}` : "",
    propertyLines.length > 0 ? `user-selected properties:\n${propertyLines.map((item, index) => `${index + 1}. ${item}`).join("\n")}` : "",
  ].filter(Boolean).join("\n") || "none";
}

function formatReferenceContextEn(input: WorldSkeletonGenerationPromptInput): string {
  const context = input.referenceContext;
  if (!context) {
    return "none";
  }
  return [
    `reference mode: ${context.mode}`,
    context.preserveElements.length > 0 ? `must preserve: ${context.preserveElements.join(", ")}` : "",
    context.allowedChanges.length > 0 ? `may adapt: ${context.allowedChanges.join(", ")}` : "",
    context.forbiddenElements.length > 0 ? `must not deviate from: ${context.forbiddenElements.join(", ")}` : "",
    context.anchors.length > 0
      ? `reference anchors:\n${context.anchors.map((item, index) => `${index + 1}. ${item.label}: ${item.content}`).join("\n")}`
      : "",
  ].filter(Boolean).join("\n") || "none";
}

export const worldSkeletonGenerationPromptEn: PromptAsset<
  WorldSkeletonGenerationPromptInput,
  typeof worldSkeletonSchema._output
> = {
  id: "world.skeleton.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 0 },
  semanticRetryPolicy: { maxAttempts: 1 },
  outputSchema: worldSkeletonSchema,
  render: (input) => {
    const counts = input.options.counts;
    return [
      new SystemMessage([
        "You are a fiction world-skeleton generator serving beginner authors who do not understand setting engineering.",
        "Your task is NOT to fill in a field form, but to produce a structured world sample directly usable for novel writing.",
        "",
        "Output only one valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
        "",
        "The output object must contain and only contain: concept, structuredData, bindingSupport, storyEntrySuggestions, assessment.",
        "",
        "Global hard rules:",
        "1. All field values must be in English.",
        "2. Generate strictly around the user's world intent, genre, template, reference constraints, and selected properties.",
        "3. Do not write novel plot outlines into the world setting; the setting provides only rules, forces, locations, relations, and book-entry points.",
        "4. Do not output vague tags such as \"faction strife\", \"complex society\", \"many locations\" — state how it works, who controls it, and where conflict happens.",
        "5. structuredData is the primary content source; legacy background/geography/factions fields do not appear in this output.",
        "6. factions are abstract camps, routes, or stances; forces are concrete organizations, agencies, companies, secret societies, regime departments, or action agents.",
        "7. forces must NOT be character lists, relationship lines, temporary plot-character groups, abstract social pressure, value tags, life phenomena, or pure crowd-of-a-place.",
        "8. For urban/realistic/workplace/romance genres, forces should prefer: companies/departments/leadership, landlords or agencies, matchmaking-resource circles, family-interest blocs, freelance-gig circles, community/property/school/hospital/agency groups that can act.",
        "9. Character relations, exes, love interests, affair partners, a protagonist's individual roommates, etc., belong in storyEntrySuggestions or narrative-entry notes, never as a force.",
        "10. Every force must meet four conditions: a stable name, resources or power, a current objective, and the ability to pressure characters or locations; otherwise do not emit it into forces.",
        "11. locations must be map-drawable: each location must give 0-100 x/y coordinates, directionHint, terrain, riskLevel, controllingForceIds.",
        "12. relations.forceRelations must describe concrete interest, control, competition, or conflict relations between specific forces — not one-way emotional influence like \"workplace affects the life circle\".",
        "13. relations.locationConnections must describe routes, borders, pollution spread, or action paths between locations.",
        "14. storyEntrySuggestions must be directly usable as novel-opening directions and must reference already-generated location ids and force ids.",
        "",
        "Quantity hard constraints:",
        `1. Core rules rules.axioms must be exactly ${counts.rules}.`,
        `2. Camps factions must be exactly ${counts.factionGroups}.`,
        `3. Concrete forces must be exactly ${counts.forces}.`,
        `4. Key locations must be exactly ${counts.locations}.`,
        `5. Force relations forceRelations at least ${Math.max(1, counts.conflicts)}.`,
        `6. Story entries storyEntrySuggestions must be exactly ${counts.storyEntrySuggestions}.`,
        "",
        "Graph field requirements:",
        "1. force.type uses an English type, e.g.: company, department, family bloc, community group, agency, school, hospital, government body, secret organization, religious power, tech power, neutral power.",
        "2. force.role states the force's narrative role in the graph, e.g.: suppressor, investigator, pollution source, concealer, trader.",
        "3. force.resources states contestable resources; do not leave empty.",
        "4. location.type uses an English type, e.g.: continent, country, city, border, restricted zone, ruin, base, rift.",
        "5. location.directionHint may only be north/south/east/west/center/northeast/northwest/southeast/southwest.",
        "6. locationConnections.connectionType uses English, e.g.: road, sea route, border line, underground passage, teleport path, pollution-spread path.",
        "",
        "Completeness-assessment requirements:",
        "1. completenessScore reflects whether the current world is ready to start writing a novel.",
        "2. readyForNovelUse is true only when rules, forces, locations, relations, and story entries are all clear enough.",
        "3. missingParts lists only real gaps; output an empty array if there are none.",
      ].join("\n")),
      new HumanMessage([
        `World intent: ${input.idea}`,
        `World type: ${input.worldType || "custom"}`,
        `Template: ${input.template || "custom"}`,
        `Scale preset: ${input.options.preset}`,
        "",
        "User-selected blueprint:",
        formatBlueprintEn(input),
        "",
        "Reference constraints:",
        formatReferenceContextEn(input),
        "",
        "Generate the complete world-skeleton JSON.",
      ].join("\n")),
    ];
  },
};

export const worldDraftGenerationPromptEn: PromptAsset<
  WorldDraftGenerationPromptInput,
  typeof worldDraftGenerationSchema._output
> = {
  id: "world.draft.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 0 },
  semanticRetryPolicy: { maxAttempts: 1 },
  outputSchema: worldDraftGenerationSchema,
  render: (input) => {
    const requirements = buildWorldDraftRequirementsEn(input);

    return [
      new SystemMessage([
        "You are a long-form fiction worldbuilding assistant serving beginner authors who do not understand world construction.",
        "Your task is to organize the user's world inspiration into a \"world draft JSON\" ready to enter the next refinement stage.",
        "This is not prose-style world introduction or a vague concept showcase — it is a setting baseline that directly supports novel writing.",
        "",
        "Output only one valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
        "",
        "Allowed fields are only:",
        "description, background, geography, cultures, magicSystem, politics, races, religions, technology, conflicts, history, economy, factions, overviewSummary.",
        "Do not add fields, rename fields, or output content outside the fields.",
        "",
        "Global hard rules:",
        "1. All field values must be in English.",
        "2. Generate only from the user's world name, world type, complexity, and requirement description; do not spin off a different world.",
        "3. Prioritize completing the fields requested for refinement this round.",
        "4. No vague lyricism, no encyclopedic tone, no hollow phrases like \"very complex\", \"very grand\", \"full of tension\".",
        "5. Each field should answer \"how does this world concretely run, how does it affect characters, how does it support the plot\".",
        "6. If a field's information is insufficient, you may omit it, but do not omit fields explicitly requested for priority completion out of caution.",
        "7. Fields must be internally consistent — world rules, history, forces, and culture must not contradict each other.",
        "",
        "Generation principles:",
        "1. The world draft must serve novel writing, not just setting aesthetics.",
        "2. Prioritize hard settings that affect plot progression, character choice, resource competition, order, and conflict sources.",
        "3. Do not write specific plot beats, individual character motives, or emotional progression as world setting.",
        "4. For high-complexity worlds you may add layers; for low-complexity worlds prefer clear, stable, writable over forcibly sprawling.",
        "",
        "Field requirements:",
        "1. description: 2-4 sentences capturing the core way this world runs and the reading feel — must convey \"how it works + what the reader feels\".",
        "2. background: state the world's starting point, current era, and opening situation; it must support where the story begins.",
        "3. conflicts: distill the world's main structural conflicts — long-standing tensions, not single events.",
        "4. geography: if generated, must show how terrain, regional layout, and key locations shape conflict, flow, and action.",
        "5. cultures: if generated, must show how social texture, customs, and values shape behavior.",
        "6. politics: if generated, must show how power structure, governance, and main stances create control and opposition.",
        "7. races: if generated, must show main ethnic, class, or identity divisions; do not just list names.",
        "8. religions: if generated, must show how religion, belief, or an alternative spiritual order actually constrains society.",
        "9. magicSystem: if generated, must state power source, usage, limits, and cost — especially boundaries.",
        "10. technology: if generated, must state tech level, key technologies, and how they reshape social structure.",
        "11. economy: if generated, must state how resources, industry, or wealth flow, and show survival pressure or competition.",
        "12. history: if generated, must state key turning points and the cause of the current era — why the world is the way it is.",
        "13. factions: if generated, must show major forces, organizations, or camp layout and how they participate in world conflict.",
        "14. overviewSummary: if generated, a compressed summary of the whole draft for quick system reading; must not mechanically duplicate description.",
        "",
        "Quality requirements:",
        "1. The output should read like a world baseline ready for the next refinement step, not an inspiration jotting.",
        "2. Each field should be concrete enough to write a story from, not stay at abstract concepts.",
        "3. Prioritize real divergence points, pressure sources, and rule boundaries; do not get scattered by trivial details.",
      ].join("\n")),
      new HumanMessage([
        `World name: ${input.name}`,
        `World type: ${input.worldType}`,
        `Complexity: ${input.complexity}`,
        "",
        "User requirements:",
        input.description,
        "",
        "Fields to prioritize completing this round:",
        ...requirements.map((item, index) => `${index + 1}. ${item}`),
      ].join("\n")),
    ];
  },
};

export const worldDraftRefinePromptEn: PromptAsset<WorldDraftRefinePromptInput, string, string> = {
  id: "world.draft.refine",
  version: "v1",
  taskType: "repair",
  mode: "text",
  language: "en",
  contextPolicy: { maxTokensBudget: 0 },
  render: (input) => [
    new SystemMessage([
      "You are a worldbuilding polish editor.",
      "Your task is to make targeted rewrites and enhancements to a specified world field, making it clearer, more concrete, and more usable for novel writing.",
      "",
      "Output only the rewritten final body text — no Markdown, explanations, comments, revision notes, code blocks, or extra text.",
      "",
      "Global hard rules:",
      "1. Rewrite only the target field's content; do not expand into other fields.",
      "2. Keep the world's core facts, causal relationships, structural logic, and known constraints unchanged.",
      "3. Do not introduce new settings, rules, historical conclusions, or force relationships that conflict with the original.",
      "4. If the original information is thin, you may add low-risk reinforcement, but it must fit the field's responsibility — do not spin off a new setting.",
      "",
      input.refinementLevel === "deep"
        ? [
            "Current enhancement level: deep.",
            "Requirements:",
            "1. Without changing the core setting, clearly raise information density, logical linkage, and writability.",
            "2. Prioritize filling the key gaps of \"how this setting runs, how it constrains characters, how it supports conflict\".",
            "3. Larger rewrites are allowed, but the field's core meaning and direction must be preserved.",
          ].join("\n")
        : [
            "Current enhancement level: light.",
            "Requirements:",
            "1. Focus on expression polish, detail reinforcement, and clarification.",
            "2. Keep the original structure and main expression direction; avoid unnecessary large changes.",
            "3. Prioritize fixing stiff, vague, hollow, and repetitive problems.",
          ].join("\n"),
      "",
      "Rewrite goals:",
      "1. Make the text read like a finished setting entry, not a draft note or inspiration sentence.",
      "2. Make the content concrete; avoid hollow phrases like \"the world is complex\", \"many conflicts\", \"diverse cultures\".",
      "3. Make the field serve novel writing — show how it affects plot, characters, survival, order, or conflict.",
      "4. If the field naturally needs structural relations, supply causal or functional links, not isolated description.",
      "",
      "Expression requirements:",
      "1. Use English throughout.",
      "2. Output a single paragraph of text that can directly replace the current field.",
      "3. No lists, no bullet points, no headings.",
      "4. Keep the language steady, precise, and clear; avoid encyclopedic tone, manual tone, and vague lyricism.",
      "",
      "Self-check:",
      "1. Did you keep core facts consistent with the original field?",
      "2. Did you enhance writability rather than just swap synonyms?",
      "3. Did you avoid crossing into other fields' content?",
      "4. Did you output only the rewritten body text?",
    ].join("\n")),
    new HumanMessage([
      `World name: ${input.worldName}`,
      `Target field: ${input.attribute}`,
      "",
      "Current content:",
      input.currentValue,
      "",
      "Output the enhanced rewrite of this field directly.",
    ].join("\n")),
  ],
};

export const worldDraftRefineAlternativesPromptEn: PromptAsset<
  WorldDraftRefineAlternativesPromptInput,
  typeof worldRefineAlternativeListSchema._output
> = {
  id: "world.draft.refine_alternatives",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 0 },
  semanticRetryPolicy: { maxAttempts: 1 },
  outputSchema: worldRefineAlternativeListSchema,
  render: (input) => [
    new SystemMessage([
      "You are a worldbuilding field-rewrite candidate generator.",
      "Your task: based on the user's current field content, generate multiple candidate versions that can directly replace the original, for the user to pick from.",
      "",
      "Hard requirements:",
      "1. Output only a JSON array — no explanations, Markdown, code blocks, or any extra text.",
      "2. Each array element has the fixed shape: {\"title\":\"...\",\"content\":\"...\"}.",
      "3. You must output exactly the specified number of candidates.",
      "4. Each content must be a complete, usable rewrite of the field — not an outline, commentary, note, or half-finished draft.",
      "5. Different candidates must show clearly perceptible directional differences, not just word-order tweaks, synonym swaps, or light polish.",
      "6. All candidates must preserve the original's core facts, existing settings, causal relationships, and key constraints; do not invent important facts that change the world-setting direction.",
      "",
      "Candidate differences should prioritize one or a combination of:",
      " - Different expression tone: cold, epic, terse, heavy, mysterious, documentary, legendary",
      " - Different information order: summary-first, rules-first, background-first, core-conflict-first",
      " - Different emphasis: setting logic, conflict tension, historical weight, run mechanism, narrative writability",
      " - Different refinement depth: light distillation, structural reorganization, deep enhancement",
      "",
      "title should concisely capture this version's rewrite direction, letting the user tell it apart from the others at a glance.",
      "content should output the full rewritten body directly; do not include wording like \"version one\", \"rewrite as follows\", or \"explanation\".",
      "",
      "If the original is sparse, do not pad arbitrarily; preserve the original meaning and separate candidates by reorganizing expression, reinforcing logical links, and improving readability.",
    ].join("\n")),
    new HumanMessage([
      `World name: ${input.worldName}`,
      `Target field: ${input.attribute}`,
      `Refinement depth: ${input.refinementLevel}`,
      `Candidate count: ${input.count}`,
      "",
      "Current content:",
      input.currentValue,
    ].join("\n")),
  ],
};
