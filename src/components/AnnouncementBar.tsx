'use client';

import React, { useState, useEffect } from 'react';
import { X, Info, Sparkles, Bot, LayoutGrid, Wand2, Calculator, Gem, Grid3X3, Crown } from 'lucide-react';

// 工作流类型
export type WorkflowType = 'chat' | 'image-generator' | 'product-detail' | 'ecommerce' | 'prompt-analyzer' | 'toolbox' | 'apiplus' | 'vip-chat';

// 公告配置
interface AnnouncementConfig {
  icon: React.ElementType;
  title: string;
  description: string;
  tips?: string[];
}

const ANNOUNCEMENTS: Record<WorkflowType, AnnouncementConfig> = {
  'chat': {
    icon: Bot,
    title: '快速九宫格',
    description: '输入商品图+产品信息（名称、应用节日场景、受众人群），AI自动生成9张亚马逊Listing图片。有模板可以自行修改。',
    tips: ['支持批量生成', '自动翻译提示词'],
  },
  'image-generator': {
    icon: Sparkles,
    title: '图片生成',
    description: '写出自己的需求描述进行生图，服务器储存有限无法设置上下文记忆。',
    tips: ['支持图生图', '可生成多张'],
  },
  'product-detail': {
    icon: Grid3X3,
    title: '详情页套图',
    description: '一键生成6张标准电商详情页图片：主图、场景图、卖点图、细节图、尺寸图、生活图。',
    tips: ['6张标准套图', '自动提示词生成', '批量下载'],
  },
  'ecommerce': {
    icon: LayoutGrid,
    title: '商品图套图',
    description: '深度工作流，分析产品并生成完整的6张Listing图片。',
    tips: ['智能产品分析', '自动配色方案', '生成6张标准图片'],
  },
  'prompt-analyzer': {
    icon: Wand2,
    title: '提示词分析助手',
    description: '分析并优化AI提示词，生成更好的图片。（旧版、已停用，可作为参考学习）',
    tips: ['提示词优化', '场景建议', '风格推荐'],
  },
  'toolbox': {
    icon: Calculator,
    title: '批量样机替换',
    description: '批量将产品图案应用到样机图上，支持镂空设计。',
    tips: ['批量生成', '支持镂空/铁艺', '单张重新生成'],
  },
  'apiplus': {
    icon: Gem,
    title: 'APIPLUS',
    description: '第三方API服务集成平台。（测试官方连接使用）',
    tips: ['外部服务', 'API集成'],
  },
  'vip-chat': {
    icon: Crown,
    title: 'GPT Image 2 VIP',
    description: '对话式生图：纯文生图、上传参考图改图、基于已生成图片多轮迭代。默认返回 URL。',
    tips: ['文生图', '参考图改图', '多轮迭代'],
  },
};

interface AnnouncementBarProps {
  currentWorkflow: WorkflowType;
}

export default function AnnouncementBar({ currentWorkflow }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // 切换工作流时重新显示
  useEffect(() => {
    setIsVisible(true);
    setIsDismissed(false);
  }, [currentWorkflow]);

  // 如果用户关闭过，不再显示（当前会话）
  if (isDismissed || !isVisible) {
    return null;
  }

  const config = ANNOUNCEMENTS[currentWorkflow];
  const Icon = config.icon;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {config.title}
            </h3>
            <span className="text-xs text-gray-400">|</span>
            <p className="text-sm text-gray-600">
              {config.description}
            </p>
          </div>
          
          {config.tips && config.tips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {config.tips.map((tip, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 text-xs bg-white text-gray-600 rounded border border-gray-200"
                >
                  {tip}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            setIsVisible(false);
            setIsDismissed(true);
          }}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
