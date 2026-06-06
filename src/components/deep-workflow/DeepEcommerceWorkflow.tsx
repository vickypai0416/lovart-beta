'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Image as ImageIcon,
  Palette,
  Users,
  Calendar,
  ShoppingBag,
  FileText,
  Download,
  Copy,
  Eye,
  Loader2,
  Wand2,
  X,
  ZoomIn,
} from 'lucide-react';
import type {
  ProductAnalysis,
  DesignBible,
  GeneratedPrompt,
  DeepWorkflowState,
} from '@/lib/deep-workflow/types';
import {
  PLATFORMS,
  HOLIDAYS,
  AUDIENCES,
  VISUAL_STYLES,
  COLOR_SCHEMES,
  EMOTIONS,
} from '@/lib/deep-workflow/types';

const STEPS = [
  { id: 1, title: '上传产品', description: 'Upload Product' },
  { id: 2, title: '确认分析', description: 'Confirm Analysis' },
  { id: 3, title: '偏好设置', description: 'Preferences' },
  { id: 4, title: '设计方案', description: 'Design Bible' },
  { id: 5, title: '生成方案', description: 'Listing Blueprint' },
  { id: 6, title: '查看Prompt', description: 'Generated Prompts' },
];

// Generated Image Card Component
interface GeneratedImageCardProps {
  prompt: GeneratedPrompt;
  referenceImage: string | null;
}

function GeneratedImageCard({ prompt, referenceImage }: GeneratedImageCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const generateImage = async () => {
    if (!referenceImage) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.prompt,
          referenceImage: referenceImage,
          size: '1024x1024',
          quality: 'high',
          n: 1,
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.url) {
        setGeneratedImage(result.url);
      } else {
        setError(result.error || '生成失败');
      }
    } catch (err) {
      setError('请求失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `listing-image-${prompt.index}-${prompt.type.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={!isGenerating && !generatedImage ? generateImage : undefined}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">
                {prompt.index}
              </span>
              <span className="truncate">{prompt.type}</span>
            </CardTitle>
            <Badge variant="outline" className="text-xs">{prompt.index}/6</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Image Preview Area */}
          <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden relative">
            {generatedImage ? (
              <div className="relative w-full h-full group/image">
                <img 
                  src={generatedImage} 
                  alt={`Generated ${prompt.type}`}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay with zoom icon */}
                <div 
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                >
                  <ZoomIn className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-xs">生成中...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center text-red-400 p-4 text-center">
                <span className="text-xs">{error}</span>
                <span className="text-[10px] mt-1">点击重试</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                <Wand2 className="w-8 h-8 mb-2" />
                <span className="text-xs">点击生成</span>
              </div>
            )}
          </div>
          
          {/* Prompt Preview */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700 truncate">{prompt.displayPrompt}</p>
            <p className="text-[10px] text-gray-400 line-clamp-2">{prompt.prompt}</p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(prompt.prompt);
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              复制
            </Button>
            {generatedImage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  查看
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    generateImage();
                  }}
                  disabled={isGenerating}
                  className={`flex-1 text-xs h-8 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 mr-1" />
                      重生成
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      {isModalOpen && generatedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            {/* Close button */}
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
            
            {/* Image */}
            <img
              src={generatedImage}
              alt={`Generated ${prompt.type}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Modal actions */}
            <div className="flex gap-4 mt-6">
              <Button
                variant="outline"
                className="bg-white text-black hover:bg-gray-100"
                onClick={downloadImage}
              >
                <Download className="w-4 h-4 mr-2" />
                下载图片
              </Button>
              <Button
                variant="outline"
                className="bg-white text-black hover:bg-gray-100"
                onClick={() => setIsModalOpen(false)}
              >
                关闭
              </Button>
            </div>
            
            {/* Image info */}
            <p className="text-white/60 text-sm mt-4">
              {prompt.type} - {prompt.displayPrompt}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function DeepEcommerceWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [state, setState] = useState<DeepWorkflowState>({
    step: 1,
    productImage: null,
    analysis: null,
    userPreferences: {
      platform: 'amazon_us',
      selectedHolidays: [],
      selectedAudiences: [],
      visualStyle: 'modern_premium',
      colorScheme: 'warm_beige',
      customColors: {
        primary: '#F5F1E8',
        secondary: '#D4C4A8',
        accent: '#8B7355',
        background: '#FFFFFF',
        text: '#333333',
      },
      emotion: 'heartwarming',
    },
    designBible: null,
    characterSceneBible: null,
    storyline: null,
    listingBlueprint: null,
    generatedPrompts: [],
    detailPageBlueprint: null,
  });

  // Step 1: Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setState(prev => ({ ...prev, productImage: imageUrl }));
    };
    reader.readAsDataURL(file);
  }, []);

  // Step 1: Analyze product
  const analyzeProduct = async () => {
    if (!state.productImage) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/deep-workflow/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: state.productImage }),
      });
      
      const result = await response.json();
      if (result.success) {
        setState(prev => ({ ...prev, analysis: result.analysis }));
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Generate Design Bible
  const generateDesignBible = async () => {
    if (!state.analysis) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/deep-workflow/design-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: state.analysis,
          platform: state.userPreferences.platform,
          selectedHolidays: state.userPreferences.selectedHolidays,
          selectedAudiences: state.userPreferences.selectedAudiences,
          visualStyle: state.userPreferences.visualStyle,
          colorScheme: state.userPreferences.colorScheme,
          customColors: state.userPreferences.colorScheme === 'custom' ? state.userPreferences.customColors : undefined,
          emotion: state.userPreferences.emotion,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setState(prev => ({ ...prev, designBible: result.designBible }));
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Design Bible generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5: Generate Listing Blueprint and Prompts
  const generatePrompts = async () => {
    if (!state.analysis || !state.designBible) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/deep-workflow/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: state.analysis,
          designBible: state.designBible,
          preferences: state.userPreferences,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setState(prev => ({
          ...prev,
          generatedPrompts: result.prompts,
          listingBlueprint: result.blueprint,
        }));
        setCurrentStep(6);
      }
    } catch (error) {
      console.error('Prompt generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">上传产品图片</h2>
              <p className="text-gray-500 mt-2">上传您的产品图片，AI将自动分析产品特征</p>
            </div>
            
            {!state.productImage ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('product-upload')?.click()}
              >
                <input
                  id="product-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">点击或拖拽上传图片</p>
                <p className="text-sm text-gray-400 mt-2">支持 JPG、PNG 格式</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-square max-w-md mx-auto rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={state.productImage}
                    alt="Product"
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setState(prev => ({ ...prev, productImage: null }))}
                  >
                    重新上传
                  </Button>
                  <Button
                    onClick={analyzeProduct}
                    disabled={isLoading}
                    className="bg-black hover:bg-gray-800"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        开始分析
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">确认分析结果</h2>
              <p className="text-gray-500 mt-2">请检查AI分析的产品信息是否正确</p>
            </div>
            
            {state.analysis && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">产品信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>产品名称</Label>
                      <Input
                        value={state.analysis.product_name}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          analysis: prev.analysis ? { ...prev.analysis, product_name: e.target.value } : null
                        }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>产品类型</Label>
                        <Input
                          value={state.analysis.product_type}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            analysis: prev.analysis ? { ...prev.analysis, product_type: e.target.value } : null
                          }))}
                          placeholder="如: Personalized Cutting Board"
                        />
                      </div>
                      <div>
                        <Label>材质</Label>
                        <Input
                          value={state.analysis.material}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            analysis: prev.analysis ? { ...prev.analysis, material: e.target.value } : null
                          }))}
                          placeholder="如: Wood, Leather, Metal"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>主要卖点</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {state.analysis.selling_points.map((point, i) => (
                          <Badge key={i} variant="secondary">{point}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>目标受众</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {state.analysis.target_audience.map((audience, i) => (
                          <Badge key={i} variant="outline">{audience}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>推荐节日</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {state.analysis.recommended_holidays.map((holiday, i) => (
                          <Badge key={i} className="bg-blue-100 text-blue-800">{holiday}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Product Dimensions */}
                    <div className="border-t pt-4 mt-4">
                      <Label className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">产品尺寸（可选）</span>
                        <span className="text-xs text-gray-400">用于更准确地展示产品大小</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">长度</Label>
                          <Input
                            placeholder="如: 20cm"
                            value={state.analysis.dimensions?.length || ''}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              analysis: prev.analysis ? {
                                ...prev.analysis,
                                dimensions: { ...prev.analysis.dimensions, length: e.target.value }
                              } : null
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">宽度</Label>
                          <Input
                            placeholder="如: 15cm"
                            value={state.analysis.dimensions?.width || ''}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              analysis: prev.analysis ? {
                                ...prev.analysis,
                                dimensions: { ...prev.analysis.dimensions, width: e.target.value }
                              } : null
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">高度</Label>
                          <Input
                            placeholder="如: 10cm"
                            value={state.analysis.dimensions?.height || ''}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              analysis: prev.analysis ? {
                                ...prev.analysis,
                                dimensions: { ...prev.analysis.dimensions, height: e.target.value }
                              } : null
                            }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <Label className="text-xs text-gray-500">直径（如适用）</Label>
                          <Input
                            placeholder="如: 8cm"
                            value={state.analysis.dimensions?.diameter || ''}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              analysis: prev.analysis ? {
                                ...prev.analysis,
                                dimensions: { ...prev.analysis.dimensions, diameter: e.target.value }
                              } : null
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">重量</Label>
                          <Input
                            placeholder="如: 500g"
                            value={state.analysis.dimensions?.weight || ''}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              analysis: prev.analysis ? {
                                ...prev.analysis,
                                dimensions: { ...prev.analysis.dimensions, weight: e.target.value }
                              } : null
                            }))}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label className="text-xs text-gray-500">其他尺寸说明</Label>
                        <Input
                          placeholder="如: 适合A4纸大小、可容纳15英寸笔记本等"
                          value={state.analysis.dimensions?.custom_size || ''}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            analysis: prev.analysis ? {
                              ...prev.analysis,
                              dimensions: { ...prev.analysis.dimensions, custom_size: e.target.value }
                            } : null
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    返回
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} className="bg-black hover:bg-gray-800">
                    确认并继续
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">设置偏好</h2>
              <p className="text-gray-500 mt-2">选择您的目标平台和风格偏好</p>
            </div>
            
            <div className="space-y-6">
              {/* Platform */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4" />
                  销售平台
                </Label>
                <Select
                  value={state.userPreferences.platform}
                  onValueChange={(value) => setState(prev => ({
                    ...prev,
                    userPreferences: { ...prev.userPreferences, platform: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex flex-col">
                          <span>{p.label}</span>
                          <span className="text-xs text-gray-400">{p.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Holidays */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  目标节日（多选）
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {HOLIDAYS.map((holiday) => (
                    <div key={holiday.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={holiday.value}
                        checked={state.userPreferences.selectedHolidays.includes(holiday.value)}
                        onCheckedChange={(checked) => {
                          setState(prev => ({
                            ...prev,
                            userPreferences: {
                              ...prev.userPreferences,
                              selectedHolidays: checked
                                ? [...prev.userPreferences.selectedHolidays, holiday.value]
                                : prev.userPreferences.selectedHolidays.filter(h => h !== holiday.value)
                            }
                          }));
                        }}
                      />
                      <Label htmlFor={holiday.value} className="text-sm cursor-pointer">
                        {holiday.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audiences */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  目标受众（多选）
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {AUDIENCES.map((audience) => (
                    <div key={audience.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={audience.value}
                        checked={state.userPreferences.selectedAudiences.includes(audience.value)}
                        onCheckedChange={(checked) => {
                          setState(prev => ({
                            ...prev,
                            userPreferences: {
                              ...prev.userPreferences,
                              selectedAudiences: checked
                                ? [...prev.userPreferences.selectedAudiences, audience.value]
                                : prev.userPreferences.selectedAudiences.filter(a => a !== audience.value)
                            }
                          }));
                        }}
                      />
                      <Label htmlFor={audience.value} className="text-sm cursor-pointer">
                        {audience.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Style */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4" />
                  视觉风格
                </Label>
                <Select
                  value={state.userPreferences.visualStyle}
                  onValueChange={(value) => setState(prev => ({
                    ...prev,
                    userPreferences: { ...prev.userPreferences, visualStyle: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择风格" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISUAL_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex flex-col">
                          <span>{s.label}</span>
                          <span className="text-xs text-gray-400">{s.description} · {s.impact}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Scheme */}
              <div>
                <Label className="flex items-center gap-2 mb-3">配色方案</Label>
                <div className="grid grid-cols-4 gap-3">
                  {COLOR_SCHEMES.map((scheme) => (
                    <div
                      key={scheme.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        state.userPreferences.colorScheme === scheme.value
                          ? 'border-black ring-2 ring-black ring-offset-2'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => setState(prev => ({
                        ...prev,
                        userPreferences: { ...prev.userPreferences, colorScheme: scheme.value }
                      }))}
                    >
                      <div className="flex gap-1 mb-2">
                        {scheme.isCustom ? (
                          <div className="w-6 h-6 rounded-full border border-gray-200 bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
                        ) : (
                          scheme.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: color }}
                            />
                          ))
                        )}
                      </div>
                      <p className="text-xs font-medium">{scheme.label}</p>
                    </div>
                  ))}
                </div>
                
                {/* Custom Color Picker */}
                {state.userPreferences.colorScheme === 'custom' && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <Label className="mb-3 block">自定义颜色</Label>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { key: 'primary', label: '主色' },
                        { key: 'secondary', label: '辅色' },
                        { key: 'accent', label: '强调色' },
                        { key: 'background', label: '背景色' },
                        { key: 'text', label: '文字色' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex flex-col items-center gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={state.userPreferences.customColors?.[key as keyof typeof state.userPreferences.customColors] || '#FFFFFF'}
                              onChange={(e) => setState(prev => ({
                                ...prev,
                                userPreferences: {
                                  ...prev.userPreferences,
                                  customColors: {
                                    ...prev.userPreferences.customColors,
                                    [key]: e.target.value,
                                  }
                                }
                              }))}
                              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                            />
                          </div>
                          <span className="text-xs text-gray-600">{label}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {state.userPreferences.customColors?.[key as keyof typeof state.userPreferences.customColors] || '#FFFFFF'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Emotion */}
              <div>
                <Label className="flex items-center gap-2 mb-3">情感基调</Label>
                <Select
                  value={state.userPreferences.emotion}
                  onValueChange={(value) => setState(prev => ({
                    ...prev,
                    userPreferences: { ...prev.userPreferences, emotion: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择情感基调" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        <div className="flex flex-col">
                          <span>{e.label}</span>
                          <span className="text-xs text-gray-400">{e.description} · {e.impact}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <Button
                onClick={generateDesignBible}
                disabled={isLoading}
                className="bg-black hover:bg-gray-800"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    生成设计方案...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成设计方案
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">设计方案</h2>
              <p className="text-gray-500 mt-2">AI为您生成的统一视觉设计规范</p>
            </div>
            
            {state.designBible && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      视觉风格
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">整体风格</Label>
                      <p className="font-medium">{state.designBible.visual_style}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">配色方案</Label>
                      <div className="flex gap-2 mt-2">
                        {Object.entries(state.designBible.color_palette).map(([key, color]) => (
                          <div key={key} className="flex flex-col items-center">
                            <div
                              className="w-10 h-10 rounded-lg border border-gray-200"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-gray-400 mt-1 capitalize">{key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">光线风格</Label>
                        <p className="text-sm">{state.designBible.lighting_style}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">相机风格</Label>
                        <p className="text-sm">{state.designBible.camera_style}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm text-gray-500">字体规范</Label>
                      <p className="text-sm mt-1">{state.designBible.font_style.family}</p>
                      <p className="text-xs text-gray-400">
                        标题: {state.designBible.font_style.headline_weight} / 
                        正文: {state.designBible.font_style.body_weight}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    返回修改
                  </Button>
                  <Button
                    onClick={generatePrompts}
                    disabled={isLoading}
                    className="bg-black hover:bg-gray-800"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        生成Listing方案...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        生成Listing方案
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Listing方案</h2>
              <p className="text-gray-500 mt-2">6张图片的完整方案规划</p>
            </div>
            
            {state.listingBlueprint && (
              <div className="space-y-4">
                {state.listingBlueprint.images.map((image) => (
                  <Card key={image.index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm">
                            {image.index}
                          </span>
                          {image.type}
                        </CardTitle>
                        <Badge variant="outline">{image.goal}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-500">标题文案</Label>
                        <p className="font-medium">{image.text_content.headline}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">副标题</Label>
                        <p className="text-sm">{image.text_content.subheadline}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">场景:</span> {image.scene}
                        </div>
                        <div>
                          <span className="text-gray-500">构图:</span> {image.composition}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setCurrentStep(4)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    返回
                  </Button>
                  <Button onClick={() => setCurrentStep(6)} className="bg-black hover:bg-gray-800">
                    查看Prompt
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">生成的Prompt</h2>
              <p className="text-gray-500 mt-2">点击卡片即可生成图片（使用参考图 + Prompt）</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {state.generatedPrompts.map((prompt) => (
                <GeneratedImageCard
                  key={prompt.index}
                  prompt={prompt}
                  referenceImage={state.productImage}
                />
              ))}
            </div>
            
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="outline" onClick={() => setCurrentStep(5)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <Button
                onClick={() => {
                  const allPrompts = state.generatedPrompts.map(p => 
                    `// Image ${p.index} - ${p.type}\n${p.prompt}`
                  ).join('\n\n');
                  navigator.clipboard.writeText(allPrompts);
                }}
                className="bg-black hover:bg-gray-800"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制全部Prompt
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Reset to start new task
                  setCurrentStep(1);
                  setState({
                    step: 1,
                    productImage: null,
                    analysis: null,
                    userPreferences: {
                      platform: 'amazon_us',
                      selectedHolidays: [],
                      selectedAudiences: [],
                      visualStyle: 'modern_premium',
                      colorScheme: 'warm_beige',
                      emotion: 'heartwarming',
                    },
                    designBible: null,
                    characterSceneBible: null,
                    storyline: null,
                    listingBlueprint: null,
                    generatedPrompts: [],
                    detailPageBlueprint: null,
                  });
                }}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                开启新任务
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Amazon Listing 深度工作流</h1>
          <p className="text-gray-500 mt-2">AI驱动的完整Listing图片方案生成系统</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      currentStep > step.id
                        ? 'bg-black text-white'
                        : currentStep === step.id
                        ? 'bg-black text-white ring-4 ring-gray-200'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
                    <p className={`text-xs font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-gray-400">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-full h-0.5 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-black' : 'bg-gray-200'
                    }`}
                    style={{ width: '40px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
