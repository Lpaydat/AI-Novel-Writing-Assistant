export type MobilePrimaryNavKey = "home" | "novels" | "creation" | "tasks" | "more";

export interface MobileNavItem {
  key: string;
  label: string;
  to: string;
  group: MobilePrimaryNavKey;
}

export interface MobileNavGroup {
  title: string;
  items: MobileNavItem[];
}

export interface MobileRoutePattern {
  key: string;
  pattern: RegExp;
  title: string;
  group: MobilePrimaryNavKey;
}

export const MOBILE_ROUTE_PATTERNS: MobileRoutePattern[] = [
  { key: "home", pattern: /^\/$/, title: "mobileNav.title.home", group: "home" },
  { key: "help", pattern: /^\/help\/?$/, title: "mobileNav.title.help", group: "more" },
  { key: "novels", pattern: /^\/novels\/?$/, title: "mobileNav.title.novels", group: "novels" },
  { key: "novel-create", pattern: /^\/novels\/create\/?$/, title: "mobileNav.title.novelCreate", group: "novels" },
  { key: "novel-preview", pattern: /^\/novels\/[^/]+\/preview\/?$/, title: "mobileNav.title.novelPreview", group: "novels" },
  { key: "novel-edit", pattern: /^\/novels\/[^/]+\/edit\/?$/, title: "mobileNav.title.novelEdit", group: "novels" },
  { key: "chapter-edit", pattern: /^\/novels\/[^/]+\/chapters\/[^/]+\/?$/, title: "mobileNav.title.chapterEdit", group: "novels" },
  { key: "drama", pattern: /^\/drama\/?$/, title: "mobileNav.title.drama", group: "creation" },
  { key: "creative-hub", pattern: /^\/creative-hub\/?$/, title: "mobileNav.title.creativeHub", group: "creation" },
  { key: "chat-legacy", pattern: /^\/chat-legacy\/?$/, title: "mobileNav.title.chatLegacy", group: "creation" },
  { key: "book-analysis", pattern: /^\/book-analysis\/?$/, title: "mobileNav.title.bookAnalysis", group: "creation" },
  { key: "tasks", pattern: /^\/tasks\/?$/, title: "mobileNav.title.tasks", group: "tasks" },
  { key: "auto-director-follow-ups", pattern: /^\/auto-director\/follow-ups\/?$/, title: "mobileNav.title.autoDirectorFollowUps", group: "tasks" },
  { key: "knowledge", pattern: /^\/knowledge\/?$/, title: "mobileNav.title.knowledge", group: "more" },
  { key: "genres", pattern: /^\/genres\/?$/, title: "mobileNav.title.genres", group: "more" },
  { key: "story-modes", pattern: /^\/story-modes\/?$/, title: "mobileNav.title.storyModes", group: "more" },
  { key: "titles", pattern: /^\/titles\/?$/, title: "mobileNav.title.titles", group: "more" },
  { key: "prompt-workbench", pattern: /^\/prompt-workbench\/?$/, title: "mobileNav.title.promptWorkbench", group: "more" },
  { key: "model-routes", pattern: /^\/settings\/model-routes\/?$/, title: "mobileNav.title.modelRoutes", group: "more" },
  { key: "settings", pattern: /^\/settings\/?$/, title: "mobileNav.title.settings", group: "more" },
  { key: "worlds", pattern: /^\/worlds\/?$/, title: "mobileNav.title.worlds", group: "more" },
  { key: "world-generator", pattern: /^\/worlds\/generator\/?$/, title: "mobileNav.title.worldGenerator", group: "more" },
  { key: "world-workspace", pattern: /^\/worlds\/[^/]+\/workspace\/?$/, title: "mobileNav.title.worldWorkspace", group: "more" },
  { key: "style-engine", pattern: /^\/style-engine\/?$/, title: "mobileNav.title.styleEngine", group: "more" },
  { key: "anti-ai-rules", pattern: /^\/anti-ai-rules\/?$/, title: "mobileNav.title.antiAiRules", group: "more" },
  { key: "base-characters", pattern: /^\/base-characters\/?$/, title: "mobileNav.title.baseCharacters", group: "more" },
];

const primaryNavItems: MobileNavItem[] = [
  { key: "home", label: "mobileNav.primary.home", to: "/", group: "home" },
  { key: "novels", label: "mobileNav.primary.novels", to: "/novels", group: "novels" },
  { key: "creation", label: "mobileNav.primary.creation", to: "/creative-hub", group: "creation" },
  { key: "tasks", label: "mobileNav.primary.tasks", to: "/tasks", group: "tasks" },
  { key: "more", label: "mobileNav.primary.more", to: "", group: "more" },
];

const moreNavGroups: MobileNavGroup[] = [
  {
    title: "mobileNav.group.assist",
    items: [
      { key: "help", label: "mobileNav.item.help", to: "/help", group: "more" },
      { key: "drama", label: "mobileNav.item.drama", to: "/drama", group: "creation" },
      { key: "book-analysis", label: "mobileNav.item.bookAnalysis", to: "/book-analysis", group: "creation" },
      { key: "auto-director-follow-ups", label: "mobileNav.item.autoDirectorFollowUps", to: "/auto-director/follow-ups", group: "tasks" },
      { key: "chat-legacy", label: "mobileNav.item.chatLegacy", to: "/chat-legacy", group: "creation" },
    ],
  },
  {
    title: "mobileNav.group.assets",
    items: [
      { key: "knowledge", label: "mobileNav.item.knowledge", to: "/knowledge", group: "more" },
      { key: "genres", label: "mobileNav.item.genres", to: "/genres", group: "more" },
      { key: "story-modes", label: "mobileNav.item.storyModes", to: "/story-modes", group: "more" },
      { key: "titles", label: "mobileNav.item.titles", to: "/titles", group: "more" },
      { key: "style-engine", label: "mobileNav.item.styleEngine", to: "/style-engine", group: "more" },
      { key: "anti-ai-rules", label: "mobileNav.item.antiAiRules", to: "/anti-ai-rules", group: "more" },
      { key: "base-characters", label: "mobileNav.item.baseCharacters", to: "/base-characters", group: "more" },
    ],
  },
  {
    title: "mobileNav.group.worldsSystem",
    items: [
      { key: "worlds", label: "mobileNav.item.worlds", to: "/worlds", group: "more" },
      { key: "world-generator", label: "mobileNav.item.worldGenerator", to: "/worlds/generator", group: "more" },
      { key: "prompt-workbench", label: "mobileNav.item.promptWorkbench", to: "/prompt-workbench", group: "more" },
      { key: "model-routes", label: "mobileNav.item.modelRoutes", to: "/settings/model-routes", group: "more" },
      { key: "settings", label: "mobileNav.item.settings", to: "/settings", group: "more" },
    ],
  },
];

export function getMobilePrimaryNavItems(): MobileNavItem[] {
  return primaryNavItems;
}

export function getMobileMoreNavGroups(): MobileNavGroup[] {
  return moreNavGroups;
}

export function getMobileRoutePattern(pathname: string): MobileRoutePattern | undefined {
  return MOBILE_ROUTE_PATTERNS.find((route) => route.pattern.test(pathname));
}

export function getMobilePageTitle(pathname: string): string {
  return getMobileRoutePattern(pathname)?.title ?? "mobileNav.title.fallback";
}

export function getMobileNavGroupForPath(pathname: string): MobilePrimaryNavKey {
  return getMobileRoutePattern(pathname)?.group ?? "more";
}

export function getMobileRouteClassName(pathname: string): string {
  return `mobile-route-${getMobileRoutePattern(pathname)?.key ?? "more"}`;
}
