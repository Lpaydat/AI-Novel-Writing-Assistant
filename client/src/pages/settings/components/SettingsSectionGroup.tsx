import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

export type SettingsSectionStatus = "required" | "enhancement" | "advanced" | "maintenance";

// Locale-aware: values are `settingsComponents` namespace translation keys.
const STATUS_LABEL_KEYS: Record<SettingsSectionStatus, string> = {
  required: "shared.statusRequired",
  enhancement: "shared.statusEnhancement",
  advanced: "shared.statusAdvanced",
  maintenance: "shared.statusMaintenance",
};

export default function SettingsSectionGroup(props: {
  title: string;
  description: string;
  status: SettingsSectionStatus;
  children: ReactNode;
}) {
  const { t } = useTranslation("settingsComponents");
  const { title, description, status, children } = props;

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
            <Badge variant="outline">{t(STATUS_LABEL_KEYS[status])}</Badge>
          </div>
          <p className={`text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {description}
          </p>
        </div>
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}
