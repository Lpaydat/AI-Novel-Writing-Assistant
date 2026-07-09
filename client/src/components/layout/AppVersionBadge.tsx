import { useTranslation } from "react-i18next";
import { APP_VERSION } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AppVersionBadgeProps {
  className?: string;
}

function formatAppVersion(version: string): string {
  const trimmed = version.trim();
  if (!trimmed || trimmed === "0.0.0") {
    return "v0.0.0";
  }
  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
}

export default function AppVersionBadge({ className }: AppVersionBadgeProps) {
  const { t } = useTranslation("componentsLayout");
  const versionLabel = formatAppVersion(APP_VERSION);

  return (
    <span
      className={cn(
        "shrink-0 rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground",
        className,
      )}
      title={t("versionBadge.title", { version: versionLabel })}
      aria-label={t("versionBadge.title", { version: versionLabel })}
    >
      {versionLabel}
    </span>
  );
}
