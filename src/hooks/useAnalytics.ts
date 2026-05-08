'use client';

import { useEffect, useCallback, useState } from 'react';

// 获取或创建会话ID（仅在客户端调用）
function getSessionIdClient(): string {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics_session_id', sessionId);
  }
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

export function useAnalytics() {
  // 使用 useState 初始化，但使用 useEffect 确保只在客户端执行
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 只在客户端初始化 sessionId
    waitForSessionId(setSessionId).then(() => {
      setIsInitialized(true);
    });
  }, []);

  // 追踪事件
  const trackEvent = useCallback(async (type: string, payload: Record<string, unknown> = {}) => {
    if (!sessionId) return;
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_event',
          sessionId,
          type,
          payload,
        }),
      });
    } catch (error) {
      console.warn('[Analytics] Failed to track event:', error);
    }
  }, [sessionId]);

  // 追踪工作流切换
  const trackWorkflowSwitch = useCallback((workflow: string) => {
    trackEvent('workflow_switch', { workflow });
  }, [trackEvent]);

  // 追踪图片生成请求（确保 sessionId 已初始化）
  const trackGeneration = useCallback(async (data: {
    prompt: string;
    displayPrompt?: string;
    size: string;
    quality: string;
    model: string;
    count: number;
  }) => {
    // 如果 sessionId 还未初始化，等待初始化完成
    if (!sessionId) {
      console.log('[Analytics] Waiting for sessionId...');
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          const id = localStorage.getItem('analytics_session_id');
          if (id) {
            clearInterval(interval);
            setSessionId(id);
            resolve(id);
          }
        }, 50);
      });
    }
    
    // 再次检查 sessionId
    if (!sessionId) {
      console.warn('[Analytics] sessionId not available');
      return null;
    }

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_generation',
          sessionId,
          ...data,
        }),
      });
      const result = await response.json();
      if (result.success && result.generation) {
        return result.generation.id;
      }
    } catch (error) {
      console.warn('[Analytics] Failed to track generation:', error);
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
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_generation',
          id,
          updates,
        }),
      });
    } catch (error) {
      console.warn('[Analytics] Failed to update generation:', error);
    }
  }, []);

  // 提交反馈
  const submitFeedback = useCallback(async (data: {
    generationId?: string;
    rating?: number;
    comment?: string;
  }) => {
    if (!sessionId) return;
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_feedback',
          sessionId,
          ...data,
        }),
      });
    } catch (error) {
      console.warn('[Analytics] Failed to submit feedback:', error);
    }
  }, [sessionId]);

  // 页面加载时追踪页面浏览
  useEffect(() => {
    if (sessionId) {
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
    trackGeneration,
    updateGeneration,
    submitFeedback,
  };
}
