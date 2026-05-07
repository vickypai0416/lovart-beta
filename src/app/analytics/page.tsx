'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, Clock, Star, 
  Image, AlertCircle, CheckCircle, 
  Download, RefreshCw 
} from 'lucide-react';

type SummaryData = {
  totalSessions: number;
  totalEvents: number;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalFeedbacks: number;
  averageRating: number;
  averageDuration: number;
  topModels: { model: string; count: number }[];
  topSizes: { size: string; count: number }[];
  workflowDistribution: { workflow: string; count: number }[];
};

type GenerationData = {
  id: string;
  prompt: string;
  displayPrompt?: string;
  size: string;
  quality: string;
  model: string;
  count: number;
  status: 'success' | 'failed' | 'pending';
  duration?: number;
  imageUrl?: string;
  error?: string;
  createdAt: string;
};

type FeedbackData = {
  id: string;
  generationId?: string;
  rating?: number;
  comment?: string;
  createdAt: string;
};

type EventStats = {
  events: { type: string; count: number }[];
  dailyStats: { date: string; count: number }[];
};

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [generations, setGenerations] = useState<GenerationData[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'generations' | 'feedbacks'>('summary');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, generationsRes, feedbacksRes, eventsRes] = await Promise.all([
        fetch('/api/analytics?endpoint=summary'),
        fetch('/api/analytics?endpoint=generations&pageSize=10'),
        fetch('/api/analytics?endpoint=feedbacks&pageSize=10'),
        fetch('/api/analytics?endpoint=events'),
      ]);

      const summaryData = await summaryRes.json();
      const generationsData = await generationsRes.json();
      const feedbacksData = await feedbacksRes.json();
      const eventsData = await eventsRes.json();

      if (summaryData.success) setSummary(summaryData.data);
      if (generationsData.success) setGenerations(generationsData.data.data);
      if (feedbacksData.success) setFeedbacks(feedbacksData.data.data);
      if (eventsData.success) setEventStats(eventsData.data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportData = async () => {
    try {
      const response = await fetch('/api/analytics?endpoint=generations&pageSize=1000');
      const result = await response.json();
      if (result.success) {
        const csv = [
          ['ID', 'Prompt', 'Size', 'Quality', 'Model', 'Status', 'Duration(ms)', 'Created At'],
          ...result.data.data.map((g: GenerationData) => [
            g.id,
            g.prompt.substring(0, 50) + (g.prompt.length > 50 ? '...' : ''),
            g.size,
            g.quality,
            g.model,
            g.status,
            g.duration || '',
            new Date(g.createdAt).toLocaleString(),
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generations-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">数据分析仪表盘</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const successRate = summary ? (summary.successfulGenerations / (summary.totalGenerations || 1) * 100).toFixed(1) : '0';
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据分析仪表盘</h1>
            <p className="text-gray-500 mt-1">查看用户使用情况和生图数据统计</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新数据
            </Button>
            <Button onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'summary' ? 'default' : 'outline'}
            onClick={() => setActiveTab('summary')}
          >
            数据概览
          </Button>
          <Button
            variant={activeTab === 'generations' ? 'default' : 'outline'}
            onClick={() => setActiveTab('generations')}
          >
            生成记录
          </Button>
          <Button
            variant={activeTab === 'feedbacks' ? 'default' : 'outline'}
            onClick={() => setActiveTab('feedbacks')}
          >
            用户反馈
          </Button>
        </div>

        {activeTab === 'summary' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">总会话数</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalSessions || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">总事件数</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalEvents || 0}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">生图总数</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalGenerations || 0}</p>
                    </div>
                    <Image className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">成功率</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{successRate}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">平均评分</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{summary?.averageRating || 0}</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">平均耗时</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.averageDuration || 0}ms</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Events Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>每日事件趋势</CardTitle>
                </CardHeader>
                <CardContent>
                  {eventStats?.dailyStats && eventStats.dailyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={eventStats.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                      暂无数据
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Workflow Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>工作流分布</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary?.workflowDistribution && summary.workflowDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={summary.workflowDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ workflow, percent }) => `${workflow} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          dataKey="count"
                        >
                          {summary.workflowDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                      暂无数据
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Models and Sizes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>热门模型</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary?.topModels && summary.topModels.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={summary.topModels}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="model" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      暂无数据
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>热门尺寸</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary?.topSizes && summary.topSizes.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={summary.topSizes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="size" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      暂无数据
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'generations' && (
          <Card>
            <CardHeader>
              <CardTitle>生成记录</CardTitle>
              <p className="text-sm text-gray-500">最近的图片生成记录</p>
            </CardHeader>
            <CardContent>
              {generations.length > 0 ? (
                <div className="space-y-4">
                  {generations.map((gen) => (
                    <div key={gen.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      {gen.imageUrl ? (
                        <img 
                          src={gen.imageUrl} 
                          alt="Generated" 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">{gen.prompt}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{gen.model}</span>
                          <span>{gen.size}</span>
                          <span>{gen.quality}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            gen.status === 'success' ? 'bg-green-100 text-green-700' :
                            gen.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {gen.status === 'success' ? '成功' : gen.status === 'failed' ? '失败' : '进行中'}
                          </span>
                        </div>
                        {gen.duration && (
                          <p className="text-xs text-gray-400 mt-1">耗时: {gen.duration}ms</p>
                        )}
                        {gen.error && (
                          <p className="text-xs text-red-500 mt-1">{gen.error}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(gen.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Image className="w-12 h-12 mb-4" />
                  <p>暂无生成记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'feedbacks' && (
          <Card>
            <CardHeader>
              <CardTitle>用户反馈</CardTitle>
              <p className="text-sm text-gray-500">用户对生成图片的评价和反馈</p>
            </CardHeader>
            <CardContent>
              {feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {feedback.rating !== undefined && (
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < feedback.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {feedback.comment && (
                        <p className="text-gray-700 mb-2">{feedback.comment}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Star className="w-12 h-12 mb-4" />
                  <p>暂无用户反馈</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}