import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AUTO_DIRECTOR_PAUSE_NOTIFICATION_SETTINGS_EVENT,
  type BrowserNotificationPermissionState,
  getBrowserNotificationPermission,
  isAutoDirectorPauseNotificationEnabled,
  requestBrowserNotificationPermission,
  setAutoDirectorPauseNotificationEnabled,
} from "@/lib/autoDirectorPauseNotifications";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

function permissionLabelKey(permission: BrowserNotificationPermissionState): string {
  switch (permission) {
    case "granted":
      return "notification.permission.granted";
    case "denied":
      return "notification.permission.denied";
    case "default":
      return "notification.permission.default";
    case "unsupported":
      return "notification.permission.unsupported";
  }
}

export function AutoDirectorBrowserNotificationSettingsCard(props: {
  onActionResult: (message: string) => void;
}) {
  const { onActionResult } = props;
  const { t } = useTranslation("settings");
  const [enabled, setEnabled] = useState(() => isAutoDirectorPauseNotificationEnabled());
  const [permission, setPermission] = useState<BrowserNotificationPermissionState>(() => getBrowserNotificationPermission());

  const refreshState = () => {
    setEnabled(isAutoDirectorPauseNotificationEnabled());
    setPermission(getBrowserNotificationPermission());
  };

  useEffect(() => {
    const handleSettingsChange = () => refreshState();
    window.addEventListener(AUTO_DIRECTOR_PAUSE_NOTIFICATION_SETTINGS_EVENT, handleSettingsChange);
    window.addEventListener("storage", handleSettingsChange);
    return () => {
      window.removeEventListener(AUTO_DIRECTOR_PAUSE_NOTIFICATION_SETTINGS_EVENT, handleSettingsChange);
      window.removeEventListener("storage", handleSettingsChange);
    };
  }, []);

  const handleEnable = async () => {
    let nextPermission = getBrowserNotificationPermission();
    if (nextPermission === "unsupported") {
      setAutoDirectorPauseNotificationEnabled(false);
      refreshState();
      onActionResult(t("notification.result.unsupported"));
      return;
    }
    if (nextPermission === "default") {
      nextPermission = await requestBrowserNotificationPermission();
    }
    if (nextPermission !== "granted") {
      setAutoDirectorPauseNotificationEnabled(false);
      refreshState();
      onActionResult(t("notification.result.denied"));
      return;
    }
    setAutoDirectorPauseNotificationEnabled(true);
    refreshState();
    onActionResult(t("notification.result.enabled"));
  };

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      setAutoDirectorPauseNotificationEnabled(false);
      refreshState();
      onActionResult(t("notification.result.disabled"));
      return;
    }
    void handleEnable();
  };

  const permissionLabel = t(permissionLabelKey(permission));
  const canRequestPermission = permission === "default";

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="space-y-1.5">
        <div className="flex min-w-0 items-start gap-3">
          <BellRing className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 space-y-1.5">
            <CardTitle>{t("notification.title")}</CardTitle>
            <CardDescription className={AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}>
              {t("notification.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex min-w-0 items-center justify-between gap-4 rounded-md border bg-muted/10 p-3">
          <div className="min-w-0 space-y-1">
            <div className="text-sm font-medium">{t("notification.desktopLabel")}</div>
            <div className={`${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText} text-xs text-muted-foreground`}>
              {t("notification.desktopHint")}
            </div>
          </div>
          <Switch
            checked={enabled && permission === "granted"}
            onCheckedChange={handleToggle}
            disabled={permission === "unsupported"}
            aria-label={t("notification.toggleAria")}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="text-sm font-medium">{t("notification.permissionLabel", { status: permissionLabel })}</div>
            <div className={`${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText} text-xs text-muted-foreground`}>
              {t("notification.permissionHint")}
            </div>
          </div>
          {canRequestPermission ? (
            <Button
              type="button"
              variant="outline"
              className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
              onClick={() => void handleEnable()}
            >
              {t("notification.requestButton")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
