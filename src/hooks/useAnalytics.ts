'use client';

import { useEffect, useCallback, useState } from 'react';
import { Analytics } from '@/lib/storage-keys';

// 获取或创建会话ID（仅在客户端调用）
function getSessionIdClient(): string {
  let sessionId = localStorage.getItem(Analytics.SESSION_ID);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(Analytics.SESSION_ID, sessionId);
    console.log('[Analytics] Created new session:', sessionId);
  }
  console.log('[Analytics] Got sessionId:', sessionId);
  return sessionId;
}

// 等待 sessionId 可用
async function waitForSessionId(setSessionId: (sessionId: string) => void): Promise<string> {
  return new Promise((resolve) => {
    const sessionId = getSessionIdClient();
    setSessionId(sessionId);
    resolve(sessionId);
  });
}

async function ensureSessionId(currentSessionId: string | null, setSessionId: (sessionId: string) => void): Promise<string | null> {
  if (currentSessionId) {
    return currentSessionId;
  }

  return new Promise((resolve) => {
    const existing = localStorage.getItem(Analytics.SESSION_ID);
    if (existing) {
      setSessionId(existing);
      resolve(existing);
      return;
    }

    const created = getSessionIdClient();
    setSessionId(created);
    resolve(created);
  });
}

export function useAnalytics() {
  // 使用 useState 初始化，但使用 useEffect 确保只在客户端执行
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('[Analytics] Initializing analytics hook...');
    // 只在客户端初始化 sessionId
    waitForSessionId(setSessionId).then((id) => {
      console.log('[Analytics] Session initialized:', id);
      setIsInitialized(true);
    }).catch((error) => {
      console.error('[Analytics] Failed to initialize session:', error);
    });
  }, []);

  // 追踪事件
  const trackEvent = useCallback(async (type: string, payload: Record<string, unknown> = {}) => {
    const resolvedSessionId = await ensureSessionId(sessionId, setSessionId);
    if (!resolvedSessionId) {
      console.warn('[Analytics] trackEvent: sessionId not available');
      return;
    }
    console.log('[Analytics] trackEvent called:', type, payload);
    try {
      /* /api/track 已删除；本地上报由 lib/analytics.ts 写入 localStorage */
      return;
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }, [sessionId]);

  // 追踪工作流切换
  const trackWorkflowSwitch = useCallback((workflow: string) => {
    console.log('[Analytics] trackWorkflowSwitch:', workflow);
    trackEvent('workflow_switch', { workflow });
  }, [trackEvent]);

  // 追踪用户消息（文本或图片）
  const trackMessage = useCallback(async (data: {
    content: string;
    model: string;
    hasImages?: boolean;
    imageCount?: number;
  }) => {
    console.log('[Analytics] trackMessage called with data:', data);
    const resolvedSessionId = await ensureSessionId(sessionId, setSessionId);
    if (!resolvedSessionId) {
      console.error('[Analytics] trackMessage: sessionId still not available after waiting');
      return null;
    }

    console.log('[Analytics] trackMessage: sending to API, sessionId:', resolvedSessionId);

    try {
      /* /api/track 已删除 */
      return null;
    } catch (error) {
      console.error('[Analytics] Failed to track message:', error);
    }
    return null;
  }, [sessionId]);

  // 追踪图片生成请求（确保 sessionId 已初始化）
  const trackGeneration = useCallback(async (data: {
    prompt: string;
    displayPrompt?: string;
    size: string;
    quality: string;
    model: string;
    count: number;
    clientRequestId?: string;
  }) => {
    console.log('[Analytics] trackGeneration called with data:', data);
    const resolvedSessionId = await ensureSessionId(sessionId, setSessionId);
    if (!resolvedSessionId) {
      console.error('[Analytics] trackGeneration: sessionId not available');
      return null;
    }

    console.log('[Analytics] trackGeneration: sending to API, sessionId:', resolvedSessionId);

    try {
      /* /api/track 已删除 */
      return null;
    } catch (error) {
      console.error('[Analytics] Failed to track generation:', error);
    }
    return null;
  }, [sessionId]);

  // 更新生成结果
  const updateGeneration = useCallback(async (id: string, updates: {
    status?: 'success' | 'failed' | 'pending';
    duration?: number;
    imageUrl?: string;
    error?: string;
  }) => {
    console.log('[Analytics] updateGeneration called:', id, updates);
    try {
      /* /api/track 已删除 */
    } catch (error) {
      console.error('[Analytics] Failed to update generation:', error);
    }
  }, []);

  // 提交反馈
  const submitFeedback = useCallback(async (data: {
    generationId?: string;
    rating?: number;
    comment?: string;
  }) => {
    const resolvedSessionId = await ensureSessionId(sessionId, setSessionId);
    if (!resolvedSessionId) {
      console.warn('[Analytics] submitFeedback: sessionId not available');
      return;
    }
    console.log('[Analytics] submitFeedback called:', data);
    try {
      /* /api/track 已删除 */
    } catch (error) {
      console.warn('[Analytics] Failed to submit feedback:', error);
    }
  }, [sessionId]);

  // 页面加载时追踪页面浏览
  useEffect(() => {
    if (sessionId) {
      console.log('[Analytics] Tracking page view:', window.location.pathname);
      trackEvent('page_view', {
        path: window.location.pathname,
        referrer: document.referrer,
      });
    }
  }, [trackEvent, sessionId]);

  return {
    sessionId,
    isInitialized,
    trackEvent,
    trackWorkflowSwitch,
    trackMessage,
    trackGeneration,
    updateGeneration,
    submitFeedback,
  };
}
