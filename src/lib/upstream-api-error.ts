export type UpstreamApiError = {
  message: string;
  requestId?: string;
  status: number;
};

export function parseUpstreamApiError(status: number, rawText: string): UpstreamApiError {
  let message = rawText;
  let requestId: string | undefined;

  try {
    const parsed = JSON.parse(rawText) as {
      error?: { message?: string };
      message?: string;
    };
    message = parsed?.error?.message || parsed?.message || rawText;
  } catch {
    // keep raw text
  }

  const idMatch = message.match(/request id:\s*(\S+)/i);
  if (idMatch) {
    requestId = idMatch[1];
  }

  return {
    message: message.trim() || `HTTP ${status}`,
    requestId,
    status,
  };
}

export function isRateLimitError(status: number, message: string): boolean {
  if (status === 429) return true;
  const normalized = message.toLowerCase();
  return normalized.includes('429') || normalized.includes('负载已饱和') || normalized.includes('rate limit');
}
