'use client';

import { MessageCircle, Sparkles, ShoppingBag } from 'lucide-react';

interface WorkflowSwitcherProps {
  currentWorkflow: string;
  onWorkflowChange: (workflow: string) => void;
}

const workflows = [
  {
    id: 'chat',
    name: '对话助手',
    description: '智能对话、图片识别',
    icon: MessageCircle,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'image-generator',
    name: '图片生成器',
    description: '文字生成图片',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'ecommerce',
    name: '电商商品图',
    description: '一键生成商品套图',
    icon: ShoppingBag,
    color: 'from-amber-500 to-orange-500',
  },
];

export default function WorkflowSwitcher({ currentWorkflow, onWorkflowChange }: WorkflowSwitcherProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
      {workflows.map((workflow) => {
        const Icon = workflow.icon;
        const isActive = currentWorkflow === workflow.id;

        return (
          <button
            key={workflow.id}
            onClick={() => onWorkflowChange(workflow.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive
                ? 'bg-white shadow-md text-gray-900'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }
            `}
          >
            <div
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                bg-gradient-to-br ${workflow.color}
              `}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                {workflow.name}
              </p>
              <p className="text-xs text-gray-500">{workflow.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}