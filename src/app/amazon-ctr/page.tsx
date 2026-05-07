'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  X,
  Image as ImageIcon,
  Upload,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Gift,
  Heart,
  Palette,
  Eye,
  Download,
} from 'lucide-react';

interface ProductAnalysis {
  productType: string;
  productName: string;
  keyFeatures: string[];
  material: string;
  color: string;
  style: string;
  usageScenarios: string[];
  targetAudience: string;
  emotionalKeywords: string[];
  customizationOptions: string[];
}

interface GeneratedImage {
  index: number;
  type: string;
  purpose: string;
  prompt: string;
  url: string;
  size: string;
}

interface ComplianceIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  recommendation: string;
}

interface ComplianceResult {
  isValid: boolean;
  issues: ComplianceIssue[];
  specType: string;
}

type SceneType = 'father' | 'mother' | 'christmas' | 'birthday' | 'wedding' | 'anniversary' | 'graduation' | 'valentines' | 'everyday';

const SCENE_OPTIONS: { value: SceneType; label: string; icon: string }[] = [
  { value: 'father', label: '父亲节', icon: '🎁' },
  { value: 'mother', label: '母亲节', icon: '💐' },
  { value: 'christmas', label: '圣诞节', icon: '🎄' },
  { value: 'birthday', label: '生日', icon: '🎂' },
  { value: 'wedding', label: '婚礼', icon: '💍' },
  { value: 'anniversary', label: '纪念日', icon: '❤️' },
  { value: 'graduation', label: '毕业季', icon: '🎓' },
  { value: 'valentines', label: '情人节', icon: '💕' },
  { value: 'everyday', label: '日常', icon: '🌟' },
];

const IMAGE_TYPES = {
  main: '主图',
  customization: '定制说明',
  emotional: '情绪场景',
  detail: '产品细节',
  gift: '送礼场景',
  closing: '情绪收尾',
};

export default function AmazonCtrPage() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<SceneType>('everyday');
  const [isLoading, setIsLoading] = useState(false);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>([]);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'generated' | 'compliance'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserImage(event.target?.result as string);
      setGeneratedImages([]);
      setProductAnalysis(null);
      setComplianceResults([]);
      setStep('upload');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerate = async () => {
    if (!userImage) {
      alert('请先上传产品图片');
      return;
    }

    setIsLoading(true);
    setStep('analyzing');

    try {
      const response = await fetch('/api/ctr-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: userImage,
          scene: selectedScene,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProductAnalysis(result.productAnalysis);
        setGeneratedImages(result.generatedImages || []);
        setComplianceResults(result.complianceResults || []);
        setStep('generated');
      } else {
        alert(result.error || '生成失败');
        setStep('upload');
      }
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请重试');
      setStep('upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    for (const image of generatedImages) {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amazon-image-${image.index}-${image.type}.png`;
      a.click();
      URL.revokeObjectURL(url);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getComplianceStatusIcon = (result: ComplianceResult) => {
    if (result.isValid && result.issues.length === 0) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (result.issues.some(i => i.type === 'error')) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">亚马逊 CTR 视觉 Agent</h1>
              <p className="text-sm text-slate-500">AI 驱动的商品图生成工具</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {SCENE_OPTIONS.find(s => s.value === selectedScene)?.icon} {selectedScene}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-orange-500" />
                  上传产品图片
                </CardTitle>
                <CardDescription>上传您的产品图片，AI 将自动分析并生成 Listing 六图</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    userImage ? 'border-orange-500 bg-orange-50' : 'border-slate-300 hover:border-orange-500 hover:bg-orange-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {userImage ? (
                    <div className="relative">
                      <img
                        src={userImage}
                        alt="上传的产品图片"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserImage(null);
                          setGeneratedImages([]);
                          setProductAnalysis(null);
                          setStep('upload');
                        }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600">点击或拖拽上传产品图片</p>
                      <p className="text-sm text-slate-400">支持 JPG、PNG 格式，最大 10MB</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-500" />
                  选择场景
                </CardTitle>
                <CardDescription>选择目标节日或场景，优化图片风格</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {SCENE_OPTIONS.map((scene) => (
                    <button
                      key={scene.value}
                      onClick={() => setSelectedScene(scene.value)}
                      className={`p-3 rounded-lg text-center transition-all ${
                        selectedScene === scene.value
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{scene.icon}</div>
                      <div className="text-xs font-medium">{scene.label}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-orange-500" />
                  一键生成
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerate}
                  disabled={!userImage || isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      生成 Listing 六图
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  生成过程可能需要 1-2 分钟，请耐心等待
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {step === 'upload' && (
              <Card className="h-full flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700">准备开始</h3>
                  <p className="text-slate-500">上传产品图片并选择场景后，点击生成按钮</p>
                  <div className="flex justify-center gap-8 mt-8 text-sm">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-lg bg-orange-100 flex items-center justify-center mb-2">
                        <Eye className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-slate-600">智能分析</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-lg bg-orange-100 flex items-center justify-center mb-2">
                        <Palette className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-slate-600">专业生成</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-lg bg-orange-100 flex items-center justify-center mb-2">
                        <CheckCircle className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-slate-600">合规检测</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {step === 'analyzing' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-orange-500" />
                    AI 正在分析产品...
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">1/5 分析产品图片</span>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="w-1/5 h-full bg-orange-500 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">2/5 提取产品特征</span>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">3/5 生成视觉策略</span>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">4/5 生成图片</span>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">5/5 合规检测</span>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'generated' && productAnalysis && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-500" />
                      产品分析结果
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="text-sm text-slate-500 mb-1">产品类型</div>
                        <div className="font-semibold text-slate-900">{productAnalysis.productType}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="text-sm text-slate-500 mb-1">产品名称</div>
                        <div className="font-semibold text-slate-900">{productAnalysis.productName}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="text-sm text-slate-500 mb-1">材质</div>
                        <div className="font-semibold text-slate-900">{productAnalysis.material}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="text-sm text-slate-500 mb-1">颜色</div>
                        <div className="font-semibold text-slate-900">{productAnalysis.color}</div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-500 mb-2">关键特征</div>
                        <div className="flex flex-wrap gap-2">
                          {productAnalysis.keyFeatures.map((feature, index) => (
                            <span key={index} className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-2">情绪关键词</div>
                        <div className="flex flex-wrap gap-2">
                          {productAnalysis.emotionalKeywords.map((keyword, index) => (
                            <span key={index} className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      生成的 Listing 六图
                    </CardTitle>
                    <Button
                      onClick={handleDownloadAll}
                      disabled={generatedImages.length === 0}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载全部
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedImages.map((image, index) => (
                        <div key={index} className="space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-slate-200">
                            <img
                              src={image.url}
                              alt={image.purpose}
                              className="w-full aspect-square object-cover"
                              loading="lazy"
                            />
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                              {image.index}/{generatedImages.length}
                            </div>
                            <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded">
                              {IMAGE_TYPES[image.type as keyof typeof IMAGE_TYPES] || image.type}
                            </div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-slate-800">{image.purpose}</div>
                            <div className="text-xs text-slate-500 truncate">{image.size}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {generatedImages.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>暂无生成的图片</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-500" />
                      合规检测结果
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-80">
                      <div className="space-y-4">
                        {complianceResults.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getComplianceStatusIcon(result)}
                                <span className="font-medium text-slate-700">
                                  图片 {index + 1} - {IMAGE_TYPES[(generatedImages[index]?.type as keyof typeof IMAGE_TYPES)] || '未知'}
                                </span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                result.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {result.isValid ? '通过' : '未通过'}
                              </span>
                            </div>
                            {result.issues.length > 0 && (
                              <div className="space-y-2 mt-2">
                                {result.issues.map((issue, issueIndex) => (
                                  <div key={issueIndex} className={`flex items-start gap-2 text-sm ${
                                    issue.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                                  }`}>
                                    {issue.type === 'error' ? (
                                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                      <div>{issue.message}</div>
                                      <div className="text-xs opacity-70">{issue.recommendation}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    {complianceResults.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>暂无检测结果</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          亚马逊 CTR 视觉 Agent - AI 驱动的商品图生成工具
        </div>
      </footer>
    </div>
  );
}
