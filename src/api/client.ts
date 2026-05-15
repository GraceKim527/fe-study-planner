import type { ZodType } from "zod";
import type { ApiErrorCode } from "@/types";
import { errorResponseSchema } from "./schemas";

// 알려진 에러 코드 외엔 "UNKNOWN"으로 normalize.
const KNOWN_CODES = new Set<ApiErrorCode>([
  "TIME_CONFLICT",
  "INVALID_TIME_RANGE",
  "INVALID_BLOCK",
]);

export type ApiErrorKind = ApiErrorCode | "INVALID_RESPONSE" | "NETWORK" | "UNKNOWN";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

interface RequestOptions<T> {
  method?: "GET" | "PUT" | "POST" | "DELETE";
  body?: unknown;
  schema: ZodType<T>;
  signal?: AbortSignal;
}

export async function request<T>(
  url: string,
  { method = "GET", body, schema, signal }: RequestOptions<T>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError("NETWORK", "네트워크 요청이 실패했습니다.");
  }

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const parsed = errorResponseSchema.safeParse(json);
    if (parsed.success) {
      const code = (KNOWN_CODES.has(parsed.data.code as ApiErrorCode)
        ? parsed.data.code
        : "UNKNOWN") as ApiErrorKind;
      throw new ApiError(code, parsed.data.message, res.status);
    }
    throw new ApiError("UNKNOWN", `요청이 실패했습니다. (${res.status})`, res.status);
  }

  const json = await res.json().catch(() => {
    throw new ApiError("INVALID_RESPONSE", "응답을 JSON으로 파싱할 수 없습니다.");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError("INVALID_RESPONSE", "응답 형식이 예상과 다릅니다.");
  }
  return parsed.data;
}
