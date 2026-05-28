export type UpstreamApiError = {
  message: string;
  requestId?: string;
  status: number;
};

function stripHtml(rawText: string): string {
  return rawText
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

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
    message = /<[^>]+>/.test(rawText) ? stripHtml(rawText) : rawText;
  }

  if (status === 502 || /bad gateway/i.test(message)) {
    message = '上游图片生成服务暂时不可用或网关超时，请稍后重试';
  } else if (status === 503 || /service unavailable/i.test(message)) {
    message = '上游图片生成服务暂时繁忙，请稍后重试';
  } else if (status === 504 || /gateway timeout/i.test(message)) {
    message = '上游图片生成服务响应超时，请稍后重试';
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
