type FetchLike = typeof fetch;

type FetchTextWithRetryOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  fetchImpl?: FetchLike;
  sleep?: (milliseconds: number) => Promise<void>;
};

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export async function fetchTextWithRetry(
  input: string | URL,
  init: Omit<RequestInit, "signal"> = {},
  options: FetchTextWithRetryOptions = {},
) {
  const timeoutMs = Math.max(1, options.timeoutMs ?? 9_000);
  const maxAttempts = Math.min(2, Math.max(1, options.maxAttempts ?? 2));
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 150);
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(input, { ...init, signal: controller.signal });
      const text = await response.text();
      if (attempt < maxAttempts && RETRYABLE_STATUS.has(response.status)) {
        await sleep(baseDelayMs * attempt);
        continue;
      }
      return { response, text, attempts: attempt };
    } catch (error) {
      if (attempt >= maxAttempts) throw error;
      await sleep(baseDelayMs * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("요청을 완료하지 못했습니다.");
}
