export {};

type Locale = "zh" | "en";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
      /** Resolved locale for this request, from the Accept-Language header (zh default). */
      locale?: Locale;
    }
  }
}
