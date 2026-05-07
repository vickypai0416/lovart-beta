'use client';

import { useEffect, useCallback, useState } from 'react';

// 获取或创建会话ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

export function useAnalytics() {
  const [sessionId] = useState(getSessionId);

  // 追踪事件
  const trackEvent = useCallback(async (type: string, payload: Record<string, unknown> = {}) => {
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

  // 追踪图片生成请求
  const trackGeneration = useCallback(async (data: {
    prompt: string;
    displayPrompt?: string;
    size: string;
    quality: string;
    model: string;
    count: number;
  }) => {
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
    trackEvent('page_view', {
      path: window.location.pathname,
      referrer: document.referrer,
    });
  }, [trackEvent]);

  return {
    sessionId,
    trackEvent,
    trackWorkflowSwitch,
    trackGeneration,
    updateGeneration,
    submitFeedback,
  };
}