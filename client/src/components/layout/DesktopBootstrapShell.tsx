import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  checkForDesktopUpdates,
  copyDesktopLogPath,
  openDesktopLogsDirectory,
  restartDesktopApp,
  quitAndInstallDesktopUpdate,
  type DesktopBootstrapSnapshot,
  type DesktopUpdaterSnapshot,
  useDesktopUpdater,
} from "@/lib/desktop";
import { cn } from "@/lib/utils";
import DesktopBrandMark from "./DesktopBrandMark";

interface DesktopBootstrapShellProps {
  snapshot: DesktopBootstrapSnapshot;
  overlay?: boolean;
}

function resolveStateLabel(snapshot: DesktopBootstrapSnapshot): string {
  switch (snapshot.state) {
    case "launching":
      return i18n.t("bootstrap.state.launching", { ns: "componentsLayout" });
    case "starting-server":
      return i18n.t("bootstrap.state.startingServer", { ns: "componentsLayout" });
    case "loading-ui":
      return i18n.t("bootstrap.state.loadingUi", { ns: "componentsLayout" });
    case "ready":
      return i18n.t("bootstrap.state.ready", { ns: "componentsLayout" });
    case "error":
      return i18n.t("bootstrap.state.error", { ns: "componentsLayout" });
    default:
      return snapshot.state;
  }
}

function resolveStageLabel(snapshot: DesktopBootstrapSnapshot): string {
  switch (snapshot.stage) {
    case "launching":
      return i18n.t("bootstrap.stage.launching", { ns: "componentsLayout" });
    case "app-ready":
      return i18n.t("bootstrap.stage.appReady", { ns: "componentsLayout" });
    case "splash-shown":
      return i18n.t("bootstrap.stage.splashShown", { ns: "componentsLayout" });
    case "server-starting":
      return i18n.t("bootstrap.stage.serverStarting", { ns: "componentsLayout" });
    case "server-healthy":
      return i18n.t("bootstrap.stage.serverHealthy", { ns: "componentsLayout" });
    case "renderer-ready":
      return i18n.t("bootstrap.stage.rendererReady", { ns: "componentsLayout" });
    case "main-window-shown":
      return i18n.t("bootstrap.stage.mainWindowShown", { ns: "componentsLayout" });
    case "error":
      return i18n.t("bootstrap.stage.error", { ns: "componentsLayout" });
    default:
      return snapshot.stage;
  }
}

function resolveProgressHint(snapshot: DesktopBootstrapSnapshot): string {
  switch (snapshot.state) {
    case "launching":
      return i18n.t("bootstrap.progressHint.launching", { ns: "componentsLayout" });
    case "starting-server":
      return i18n.t("bootstrap.progressHint.startingServer", { ns: "componentsLayout" });
    case "loading-ui":
      return i18n.t("bootstrap.progressHint.loadingUi", { ns: "componentsLayout" });
    case "ready":
      return i18n.t("bootstrap.progressHint.ready", { ns: "componentsLayout" });
    case "error":
      return i18n.t("bootstrap.progressHint.error", { ns: "componentsLayout" });
    default:
      return snapshot.detail;
  }
}

function resolveUpdaterStatusLabel(status: DesktopUpdaterSnapshot["status"]): string {
  switch (status) {
    case "disabled":
      return i18n.t("bootstrap.updaterStatus.disabled", { ns: "componentsLayout" });
    case "idle":
      return i18n.t("bootstrap.updaterStatus.idle", { ns: "componentsLayout" });
    case "checking":
      return i18n.t("bootstrap.updaterStatus.checking", { ns: "componentsLayout" });
    case "update-available":
      return i18n.t("bootstrap.updaterStatus.updateAvailable", { ns: "componentsLayout" });
    case "downloading":
      return i18n.t("bootstrap.updaterStatus.downloading", { ns: "componentsLayout" });
    case "downloaded":
      return i18n.t("bootstrap.updaterStatus.downloaded", { ns: "componentsLayout" });
    case "not-available":
      return i18n.t("bootstrap.updaterStatus.notAvailable", { ns: "componentsLayout" });
    case "error":
      return i18n.t("bootstrap.updaterStatus.error", { ns: "componentsLayout" });
    default:
      return status;
  }
}

function resolveUpdaterHint(updater: DesktopUpdaterSnapshot, bootstrapState: DesktopBootstrapSnapshot["state"]): string {
  if (!updater.isSupported) {
    if (updater.isPortable) {
      return i18n.t("bootstrap.updaterHint.portable", { ns: "componentsLayout" });
    }

    if (!updater.isPackaged) {
      return i18n.t("bootstrap.updaterHint.dev", { ns: "componentsLayout" });
    }

    return updater.message;
  }

  switch (updater.status) {
    case "idle":
      return bootstrapState === "error"
        ? i18n.t("bootstrap.updaterHint.idleError", { ns: "componentsLayout" })
        : i18n.t("bootstrap.updaterHint.idleDefault", { ns: "componentsLayout" });
    case "checking":
      return i18n.t("bootstrap.updaterHint.checking", { ns: "componentsLayout" });
    case "update-available":
      return i18n.t("bootstrap.updaterHint.updateAvailable", {
        ns: "componentsLayout",
        version: updater.availableVersion ?? i18n.t("bootstrap.updaterHint.versionFallback", { ns: "componentsLayout" }),
      });
    case "downloading":
      return i18n.t("bootstrap.updaterHint.downloading", { ns: "componentsLayout" });
    case "downloaded":
      return i18n.t("bootstrap.updaterHint.downloaded", { ns: "componentsLayout" });
    case "not-available":
      return i18n.t("bootstrap.updaterHint.notAvailable", { ns: "componentsLayout" });
    case "error":
      return updater.message || i18n.t("bootstrap.updaterHint.error", { ns: "componentsLayout" });
    default:
      return updater.message;
  }
}

function formatSnapshotTime(value: string): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function DesktopBootstrapUpdatePanel({ snapshot }: { snapshot: DesktopBootstrapSnapshot }) {
  const { t } = useTranslation("componentsLayout");
  const updater = useDesktopUpdater();
  const didRequestStartupCheckRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);
  const isPromptingUpdate = updater.status === "update-available" || updater.status === "downloaded";
  const isCheckingOrDownloading = updater.status === "checking" || updater.status === "downloading";
  const showDownloadButton = updater.status === "update-available";
  const showInstallButton = updater.status === "downloaded";
  const showCheckButton = updater.isSupported && !showDownloadButton && !showInstallButton && updater.status !== "downloading";

  useEffect(() => {
    if (didRequestStartupCheckRef.current || !updater.isSupported) {
      return;
    }

    if (updater.lastCheckedAt || updater.status !== "idle") {
      return;
    }

    if (snapshot.state !== "launching" && snapshot.state !== "starting-server" && snapshot.state !== "error") {
      return;
    }

    didRequestStartupCheckRef.current = true;
    void checkForDesktopUpdates().catch(() => {
      didRequestStartupCheckRef.current = false;
    });
  }, [snapshot.state, updater.isSupported, updater.lastCheckedAt, updater.status]);

  const runUpdaterAction = async (action: "check" | "install") => {
    setIsBusy(true);
    try {
      if (action === "install") {
        await quitAndInstallDesktopUpdate();
      } else {
        await checkForDesktopUpdates();
      }
    } catch (error) {
      console.error("[desktop] updater action failed.", error);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl border p-5",
        isPromptingUpdate
          ? "border-amber-300/70 bg-amber-300/10"
          : "border-slate-800 bg-slate-900/70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{t("bootstrap.updatePanel.title")}</div>
        <Badge
          variant="outline"
          className={cn(
            "border-slate-600 bg-slate-950/60 text-slate-100",
            isPromptingUpdate ? "border-amber-300/80 bg-amber-300/15 text-amber-100" : null,
          )}
        >
          {resolveUpdaterStatusLabel(updater.status)}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <span>{t("bootstrap.updatePanel.currentVersion")}</span>
          <span className="font-medium text-slate-100">{updater.currentVersion}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>{t("bootstrap.updatePanel.availableVersion")}</span>
          <span className="font-medium text-slate-100">{updater.availableVersion ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-400">
          <span>{t("bootstrap.updatePanel.checkedAt")}</span>
          <span className="font-medium text-slate-200">{formatSnapshotTime(updater.lastCheckedAt ?? "")}</span>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-slate-300">
        {resolveUpdaterHint(updater, snapshot.state)}
        {typeof updater.progressPercent === "number" ? t("bootstrap.updatePanel.downloadProgress", { percent: Math.round(updater.progressPercent) }) : ""}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {showCheckButton ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white"
            disabled={isBusy || updater.status === "checking"}
            onClick={() => void runUpdaterAction("check")}
          >
            <RefreshCw className={cn("h-4 w-4", updater.status === "checking" ? "animate-spin" : null)} aria-hidden="true" />
            {updater.status === "checking" ? t("bootstrap.updatePanel.buttonChecking") : updater.status === "error" || updater.status === "not-available" ? t("bootstrap.updatePanel.buttonRecheck") : t("bootstrap.updatePanel.buttonCheck")}
          </Button>
        ) : null}
        {showDownloadButton ? (
          <Button
            type="button"
            size="sm"
            className="bg-amber-300 text-slate-950 hover:bg-amber-200"
            disabled={isBusy || isCheckingOrDownloading}
            onClick={() => void runUpdaterAction("check")}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("bootstrap.updatePanel.buttonDownload")}
          </Button>
        ) : null}
        {showInstallButton ? (
          <Button
            type="button"
            size="sm"
            className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            disabled={isBusy || !updater.canInstall}
            onClick={() => void runUpdaterAction("install")}
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            {t("bootstrap.updatePanel.buttonInstall")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function DesktopBootstrapShell({ snapshot, overlay = false }: DesktopBootstrapShellProps) {
  const { t } = useTranslation("componentsLayout");
  const surfaceClassName = overlay
    ? "bg-background/88 backdrop-blur-xl"
    : "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.16),transparent_38%),linear-gradient(145deg,#08101f_0%,#122033_55%,#101d2e_100%)]";

  return (
    <div className={cn("fixed inset-0 z-[90] flex items-center justify-center px-6 py-8", surfaceClassName)}>
      <div className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-slate-700/50 bg-slate-950/82 text-slate-50 shadow-[0_24px_90px_rgba(2,6,23,0.5)]">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6 border-b border-slate-800/80 px-8 py-8 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-4">
              <DesktopBrandMark className="h-20 w-20" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20">
                    {t("bootstrap.badge.desktopBeta")}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 bg-slate-900/70 text-slate-100">
                    {resolveStageLabel(snapshot)}
                  </Badge>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">{t("bootstrap.appTitle")}</h1>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">{snapshot.title}</h2>
              <p className="max-w-xl text-sm leading-7 text-slate-300">{snapshot.detail}</p>
            </div>

            <div className="space-y-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                {snapshot.state === "error" ? (
                  <span className="block h-full w-full rounded-full bg-rose-400" />
                ) : (
                  <span className="block h-full w-1/2 animate-[desktop-shell-progress_1.4s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,#76e5ff_0%,#f6b24c_100%)]" />
                )}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm leading-6 text-slate-300">
                {t("bootstrap.splashNote")}
              </div>
            </div>
          </section>

          <section className="space-y-5 px-8 py-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{t("bootstrap.progressCard.title")}</div>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span>{t("bootstrap.progressCard.statusLabel")}</span>
                  <span className="font-medium">{resolveStateLabel(snapshot)}</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-300">
                  {resolveProgressHint(snapshot)}
                </div>
                <div className="flex items-center justify-between gap-3 text-slate-400">
                  <span>{t("bootstrap.progressCard.updatedAtLabel")}</span>
                  <span className="font-medium text-slate-200">{formatSnapshotTime(snapshot.updatedAt)}</span>
                </div>
              </div>
            </div>

            <DesktopBootstrapUpdatePanel snapshot={snapshot} />

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{t("bootstrap.logs.title")}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300">
                {t("bootstrap.logs.description")}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="bg-slate-50 text-slate-950 hover:bg-white"
                  onClick={() => void openDesktopLogsDirectory()}
                >
                  {t("bootstrap.logs.openDir")}
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white"
                  onClick={() => void copyDesktopLogPath()}
                >
                  {t("bootstrap.logs.copyPath")}
                </Button>
                {snapshot.state === "error" && snapshot.canRetry ? (
                  <Button
                    className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    onClick={() => void restartDesktopApp()}
                  >
                    {t("bootstrap.logs.restart")}
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
