'use client';

import { useEffect, useCallback, useState } from 'react';

// 获取或创建会话ID（仅在客户端调用）
function getSessionIdClient(): string {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics_session_id', sessionId);
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
    if (!sessionId) {
      console.warn('[Analytics] trackEvent: sessionId not available');
      return;
    }
    console.log('[Analytics] trackEvent called:', type, payload);
    try {
      const response = await fetch('/api/track', {
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
      const result = await response.json();
      console.log('[Analytics] trackEvent response:', result);
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
    
    // 如果 sessionId 还未初始化，等待初始化完成
    if (!sessionId) {
      console.log('[Analytics] trackMessage: sessionId not available, waiting...');
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          const id = localStorage.getItem('analytics_session_id');
          if (id) {
            console.log('[Analytics] trackMessage: got sessionId from localStorage:', id);
            clearInterval(interval);
            setSessionId(id);
            resolve(id);
          }
        }, 50);
      });
    }
    
    if (!sessionId) {
      console.error('[Analytics] trackMessage: sessionId still not available after waiting');
      return null;
    }

    console.log('[Analytics] trackMessage: sending to API, sessionId:', sessionId);

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_message',
          sessionId,
          ...data,
        }),
      });
      const result = await response.json();
      console.log('[Analytics] trackMessage API response:', result);
      if (result.success && result.message) {
        console.log('[Analytics] trackMessage succeeded, message ID:', result.message.id);
        return result.message.id;
      } else {
        console.error('[Analytics] trackMessage failed:', result.error);
      }
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
  }) => {
    console.log('[Analytics] trackGeneration called with data:', data);
    
    // 如果 sessionId 还未初始化，等待初始化完成
    if (!sessionId) {
      console.log('[Analytics] trackGeneration: sessionId not available, waiting...');
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          const id = localStorage.getItem('analytics_session_id');
          if (id) {
            console.log('[Analytics] trackGeneration: got sessionId from localStorage:', id);
            clearInterval(interval);
            setSessionId(id);
            resolve(id);
          }
        }, 50);
      });
    }
    
    // 再次检查 sessionId
    if (!sessionId) {
      console.error('[Analytics] trackGeneration: sessionId not available');
      return null;
    }

    console.log('[Analytics] trackGeneration: sending to API, sessionId:', sessionId);

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
      console.log('[Analytics] trackGeneration API response:', result);
      if (result.success && result.generation) {
        console.log('[Analytics] trackGeneration succeeded, generation ID:', result.generation.id);
        return result.generation.id;
      } else {
        console.error('[Analytics] trackGeneration failed:', result.error);
      }
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
      const response = await fetch('/api/track', {
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
      const result = await response.json();
      console.log('[Analytics] updateGeneration response:', result);
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
    if (!sessionId) {
      console.warn('[Analytics] submitFeedback: sessionId not available');
      return;
    }
    console.log('[Analytics] submitFeedback called:', data);
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
