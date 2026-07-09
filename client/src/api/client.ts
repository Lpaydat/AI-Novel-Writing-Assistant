import axios, { AxiosError } from "axios";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import { API_BASE_URL, API_TIMEOUT_MS } from "@/lib/constants";
import { toast } from "@/components/ui/toast";
import i18n from "@/i18n";
import { getLocaleHeaders } from "@/i18n/localeHeaders";

export interface ApiHttpError extends Error {
  status?: number;
  details?: unknown;
}

declare module "axios" {
  interface AxiosRequestConfig {
    silentErrorStatuses?: number[];
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

// Locale-transport (F1<->F2 contract): stamp the active locale as a bare
// `Accept-Language` token (zh|en) on every request, read from localStorage so
// it always reflects the latest switch. See client/src/i18n/localeHeaders.ts.
apiClient.interceptors.request.use((config) => {
  config.headers.set("Accept-Language", getLocaleHeaders()["Accept-Language"]);
  return config;
});

const AUTO_DISMISS_SERVER_ERROR_TOAST = {
  duration: 4000,
  closeButton: false,
} as const;

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const backendError = error.response?.data?.error;
    const backendMessage = error.response?.data?.message;
    const silentErrorStatuses = error.config?.silentErrorStatuses ?? [];
    const genericServerErrorTitle = i18n.t("client.serverError", { ns: "api" });
    let title = backendError ?? error.message ?? i18n.t("client.requestFailed", { ns: "api" });
    let description = backendMessage && backendMessage !== backendError ? backendMessage : undefined;

    if (!status) {
      title = i18n.t("client.networkError", { ns: "api" });
      description = undefined;
    } else if (status >= 500) {
      title = backendError ?? genericServerErrorTitle;
      description = backendMessage && backendMessage !== title ? backendMessage : undefined;
    }

    if (!status || !silentErrorStatuses.includes(status)) {
      const isGenericServerErrorToast = title === genericServerErrorTitle;

      if (description) {
        toast.error(
          title,
          isGenericServerErrorToast
            ? {
                description,
                ...AUTO_DISMISS_SERVER_ERROR_TOAST,
              }
            : { description },
        );
      } else {
        toast.error(title, isGenericServerErrorToast ? AUTO_DISMISS_SERVER_ERROR_TOAST : undefined);
      }
    }

    const message = description ? `${title} ${description}` : title;

    const normalizedError = new Error(
      message,
    ) as ApiHttpError;
    normalizedError.status = status;
    normalizedError.details = error.response?.data;
    return Promise.reject(normalizedError);
  },
);
