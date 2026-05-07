'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Line, Arrow, Transformer } from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowUpRight, Type, MousePointer, Square, Image as ImageIcon, Minus, Plus, RotateCcw, Download, Trash2, RotateCw, FlipHorizontal, FlipVertical, X, ZoomIn, Check, Edit3 } from 'lucide-react';

// 元素类型
type ToolMode = 'select' | 'draw' | 'arrow' | 'text';

interface CanvasElement {
  id: string;
  type: 'text' | 'rect' | 'image';
  x: number;
  y: number;
  draggable: boolean;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  // text
  text?: string;
  fontSize?: number;
  fill?: string;
  // rect
  width?: number;
  height?: number;
  // image
  image?: HTMLImageElement;
  imageSrc?: string;
}

// 持久化存储键名
const STORAGE_KEYS = {
  ELEMENTS: 'canvas_elements',
  LINES: 'canvas_lines',
  ARROWS: 'canvas_arrows',
  SCALE: 'canvas_scale',
  POSITION: 'canvas_position',
};

// 保存数据到 localStorage
const saveToStorage = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('保存到 localStorage 失败:', error);
  }
};

// 从 localStorage 读取数据
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.warn('从 localStorage 读取失败:', error);
    return defaultValue;
  }
};

interface DrawLine {
  id: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

interface ArrowElement {
  id: string;
  points: [number, number, number, number];
  stroke: string;
  strokeWidth: number;
}

interface InfiniteCanvasProps {
  generatedImageUrl?: string;
  generatedProductName?: string;
}

export default function InfiniteCanvas({ generatedImageUrl, generatedProductName }: InfiniteCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const savedScale = loadFromStorage(STORAGE_KEYS.SCALE, 1);
    const savedPosition = loadFromStorage(STORAGE_KEYS.POSITION, { x: 0, y: 0 });
    setScale(savedScale);
    setPosition(savedPosition);
  }, []);

  // 工具模式
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [lines, setLines] = useState<DrawLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<DrawLine | null>(null);

  const [arrows, setArrows] = useState<ArrowElement[]>([]);
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [currentArrow, setCurrentArrow] = useState<ArrowElement | null>(null);

  useEffect(() => {
    const savedElements = loadFromStorage<CanvasElement[]>(STORAGE_KEYS.ELEMENTS, []);
    const restoredElements = savedElements.map(el => {
      if (el.type === 'image' && el.imageSrc) {
        const img = new window.Image();
        if (el.imageSrc.startsWith('http')) {
          img.crossOrigin = 'anonymous';
        }
        img.src = el.imageSrc;
        return { ...el, image: img };
      }
      return el;
    });
    setElements(restoredElements);
    
    setLines(loadFromStorage<DrawLine[]>(STORAGE_KEYS.LINES, []));
    setArrows(loadFromStorage<ArrowElement[]>(STORAGE_KEYS.ARROWS, []));
  }, []);

  // 自动保存到 localStorage
  useEffect(() => {
    // 保存元素（不保存 image 对象，只保存 imageSrc）
    const elementsToSave = elements.map(el => {
      const { image, ...rest } = el;
      return rest;
    });
    saveToStorage(STORAGE_KEYS.ELEMENTS, elementsToSave);
  }, [elements]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.LINES, lines);
  }, [lines]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ARROWS, arrows);
  }, [arrows]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SCALE, scale);
  }, [scale]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.POSITION, position);
  }, [position]);

  // 绘制样式
  const [drawColor, setDrawColor] = useState('#FF4444');
  const [drawWidth, setDrawWidth] = useState(3);

  // 文字编辑
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');

  // Transformer 绑定选中元素
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      if (selectedId) {
        const stage = stageRef.current;
        // 尝试找到内部元素（图片、矩形等）
        let node = stage.findOne('#' + selectedId + '-inner');
        // 如果没有内部元素，尝试找到元素本身
        if (!node) {
          node = stage.findOne('#' + selectedId);
        }
        if (node) {
          transformerRef.current.nodes([node]);
          transformerRef.current.getLayer()?.batchDraw();
        } else {
          transformerRef.current.nodes([]);
        }
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedId, elements]);
  const textInputRef = useRef<HTMLInputElement>(null);

  // 获取选中元素
  const selectedElement = elements.find((el) => el.id === selectedId);

  // 清空画布（同时清除 localStorage）
  const clearCanvas = () => {
    if (confirm('确定要清空画布吗？所有内容将被删除且无法恢复。')) {
      setElements([]);
      setLines([]);
      setArrows([]);
      setSelectedId(null);
      // 清除 localStorage
      localStorage.removeItem(STORAGE_KEYS.ELEMENTS);
      localStorage.removeItem(STORAGE_KEYS.LINES);
      localStorage.removeItem(STORAGE_KEYS.ARROWS);
      console.log('画布已清空');
    }
  };

  // 初始化大小
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        if (w > 0 && h > 0) {
          setStageSize({ width: w, height: h });
        } else {
          // 如果容器尺寸为 0，使用默认值
          const defaultSize = { width: 800, height: 600 };
          setStageSize(defaultSize);
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    const observer = new ResizeObserver(() => {
      updateSize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateSize);
      observer.disconnect();
    };
  }, []);

  // 添加图片到画布
  const addImageToCanvas = useCallback(
    async (src: string) => {
      let imageSrc = src;

      if (src.startsWith('http')) {
        try {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
          const res = await fetch(proxyUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.dataUrl) {
              imageSrc = data.dataUrl;
            }
          }
        } catch (e) {
          console.warn('[Canvas] 代理图片失败，尝试直接加载:', e);
        }
      }

      const img = new window.Image();
      if (imageSrc.startsWith('http')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = imageSrc;
      img.onload = () => {
        const maxWidth = stageSize.width * 0.8;
        const maxHeight = stageSize.height * 0.8;
        let imgScale = 1;
        if (img.width > maxWidth || img.height > maxHeight) {
          imgScale = Math.min(maxWidth / img.width, maxHeight / img.height);
        }

        const scaledWidth = img.width * imgScale;
        const scaledHeight = img.height * imgScale;

        const newElement: CanvasElement = {
          id: `image-${Date.now()}`,
          type: 'image',
          x: (stageSize.width - scaledWidth) / 2,
          y: (stageSize.height - scaledHeight) / 2,
          image: img,
          imageSrc: imageSrc,
          draggable: true,
          width: scaledWidth,
          height: scaledHeight,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        };
        setElements((prev) => [...prev, newElement]);
        setSelectedId(newElement.id);
      };
      img.onerror = () => {
        console.error('[Canvas] 图片加载失败:', src);
      };
    },
    [stageSize]
  );

  // 当生成新图片时添加到画布
  useEffect(() => {
    if (generatedImageUrl) {
      addImageToCanvas(generatedImageUrl);
    }
  }, [generatedImageUrl, addImageToCanvas]);

  // 滚轮缩放
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = scale;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const mousePointTo = {
      x: pointerPos.x / oldScale - stage.x() / oldScale,
      y: pointerPos.y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    if (newScale < 0.1 || newScale > 5) return;

    setScale(newScale);
    const newPointerPos = stage.getPointerPosition();
    if (!newPointerPos) return;
    
    setPosition({
      x: -(mousePointTo.x - newPointerPos.x / newScale) * newScale,
      y: -(mousePointTo.y - newPointerPos.y / newScale) * newScale,
    });
  };

  // 添加文字
  const addText = () => {
    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: stageSize.width / 2 - 50,
      y: stageSize.height / 2 - 12,
      text: generatedProductName || '双击编辑文字',
      fontSize: 24,
      fill: '#333333',
      draggable: true,
      rotation: 0,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
    setToolMode('select');
  };

  // 添加矩形
  const addRect = () => {
    const newElement: CanvasElement = {
      id: `rect-${Date.now()}`,
      type: 'rect',
      x: stageSize.width / 2 - 50,
      y: stageSize.height / 2 - 50,
      width: 100,
      height: 100,
      fill: '#4F46E5',
      draggable: true,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
    setToolMode('select');
  };

  // 上传图片
  const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    addImageToCanvas(url);
    e.target.value = '';
  };

  // 更新元素属性
  const updateElement = (id: string, newProps: Partial<CanvasElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...newProps } : el)));
  };

  // 删除选中元素
  const deleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter((el) => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  // 旋转选中元素
  const rotateSelected = (degree: number) => {
    if (selectedId) {
      const el = elements.find((e) => e.id === selectedId);
      if (el) {
        updateElement(selectedId, { rotation: (el.rotation || 0) + degree });
      }
    }
  };

  // 水平翻转
  const flipHorizontal = () => {
    if (selectedId) {
      const el = elements.find((e) => e.id === selectedId);
      if (el) {
        updateElement(selectedId, { scaleX: (el.scaleX || 1) * -1 });
      }
    }
  };

  // 垂直翻转
  const flipVertical = () => {
    if (selectedId) {
      const el = elements.find((e) => e.id === selectedId);
      if (el) {
        updateElement(selectedId, { scaleY: (el.scaleY || 1) * -1 });
      }
    }
  };

  // 放大选中元素
  const scaleUpSelected = () => {
    if (selectedId) {
      const el = elements.find((e) => e.id === selectedId);
      if (el) {
        updateElement(selectedId, {
          scaleX: (el.scaleX || 1) * 1.1,
          scaleY: (el.scaleY || 1) * 1.1,
        });
      }
    }
  };

  // 缩小选中元素
  const scaleDownSelected = () => {
    if (selectedId) {
      const el = elements.find((e) => e.id === selectedId);
      if (el) {
        updateElement(selectedId, {
          scaleX: (el.scaleX || 1) / 1.1,
          scaleY: (el.scaleY || 1) / 1.1,
        });
      }
    }
  };

  // 导出画布（使用服务端合成）
  const exportCanvas = async () => {
    try {
      // 准备要导出的元素数据
      const exportElements = elements.map(el => ({
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        imageSrc: el.imageSrc,
        text: el.text,
        fontSize: el.fontSize,
        fill: el.fill,
        rotation: el.rotation,
        scaleX: el.scaleX,
        scaleY: el.scaleY,
      }));

      // 发送请求到服务端
      const response = await fetch('/api/export-canvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elements: exportElements,
          width: stageSize.width,
          height: stageSize.height,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '导出失败');
      }

      // 下载图片
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `canvas-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出画布失败:', error);
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 重置视图
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 缩放控制
  const zoomIn = () => setScale((s) => Math.min(s * 1.2, 5));
  const zoomOut = () => setScale((s) => Math.max(s / 1.2, 0.1));

  // 点击空白处取消选中
  const handleStageClick = (e: Konva.KonvaEventObject<Event>) => {
    if (e.target === stageRef.current) {
      setSelectedId(null);
    }
  };

  // 鼠标按下 - 开始绘制
  const handleMouseDown = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (toolMode === 'select') return;

    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scaledPos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };

    if (toolMode === 'draw') {
      setIsDrawing(true);
      setCurrentLine({
        id: `line-${Date.now()}`,
        points: [scaledPos.x, scaledPos.y],
        stroke: drawColor,
        strokeWidth: drawWidth,
      });
    } else if (toolMode === 'arrow') {
      setIsDrawingArrow(true);
      setCurrentArrow({
        id: `arrow-${Date.now()}`,
        points: [scaledPos.x, scaledPos.y, scaledPos.x, scaledPos.y],
        stroke: drawColor,
        strokeWidth: drawWidth,
      });
    }
  };

  // 鼠标移动 - 绘制中
  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (toolMode === 'select') return;

    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const scaledPos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };

    if (toolMode === 'draw' && isDrawing && currentLine) {
      setCurrentLine({
        ...currentLine,
        points: [...currentLine.points, scaledPos.x, scaledPos.y],
      });
    } else if (toolMode === 'arrow' && isDrawingArrow && currentArrow) {
      setCurrentArrow({
        ...currentArrow,
        points: [currentArrow.points[0], currentArrow.points[1], scaledPos.x, scaledPos.y],
      });
    }
  };

  // 鼠标松开 - 完成绘制
  const handleMouseUp = () => {
    if (toolMode === 'draw' && currentLine && currentLine.points.length > 2) {
      setLines([...lines, currentLine]);
    }
    if (toolMode === 'arrow' && currentArrow) {
      setArrows([...arrows, currentArrow]);
    }
    setIsDrawing(false);
    setIsDrawingArrow(false);
    setCurrentLine(null);
    setCurrentArrow(null);
  };

  // 双击文字编辑
  const handleTextDblClick = (el: CanvasElement) => {
    if (el.type !== 'text') return;
    setEditingTextId(el.id);
    setEditingTextValue(el.text || '');
    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.select();
    }, 100);
  };

  // 保存文字编辑
  const saveTextEdit = () => {
    if (editingTextId) {
      updateElement(editingTextId, { text: editingTextValue });
    }
    setEditingTextId(null);
    setEditingTextValue('');
  };

  // 取消文字编辑
  const cancelTextEdit = () => {
    setEditingTextId(null);
    setEditingTextValue('');
  };

  // 清除所有绘制
  const clearDrawings = () => {
    setLines([]);
    setArrows([]);
  };

  // 删除选中的绘制
  const deleteSelectedDrawing = () => {
    // 如果有选中元素，删除元素
    if (selectedId) {
      deleteSelected();
      return;
    }
  };

  // 获取选中元素的实际尺寸
  const getSelectedElementInfo = () => {
    if (!selectedElement || !selectedElement.image) return null;

    const img = selectedElement.image;
    const actualWidth = Math.round(img.width * (selectedElement.scaleX || 1));
    const actualHeight = Math.round(img.height * (selectedElement.scaleY || 1));

    return {
      name: selectedElement.id.split('-')[0] + '_' + selectedElement.id.split('-')[1],
      width: actualWidth,
      height: actualHeight,
    };
  };

  const elementInfo = getSelectedElementInfo();

  // 获取光标样式
  const getCursorStyle = () => {
    switch (toolMode) {
      case 'draw':
        return 'crosshair';
      case 'arrow':
        return 'crosshair';
      case 'text':
        return 'text';
      default:
        return 'grab';
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-muted/20">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-2 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 工具选择 */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              size="sm"
              variant={toolMode === 'select' ? 'default' : 'ghost'}
              onClick={() => setToolMode('select')}
              title="选择工具 (V)"
              className="h-8 px-3"
            >
              <MousePointer className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={toolMode === 'draw' ? 'default' : 'ghost'}
              onClick={() => setToolMode('draw')}
              title="画笔工具 (P)"
              className="h-8 px-3"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={toolMode === 'arrow' ? 'default' : 'ghost'}
              onClick={() => setToolMode('arrow')}
              title="箭头工具 (A)"
              className="h-8 px-3"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={toolMode === 'text' ? 'default' : 'ghost'}
              onClick={() => setToolMode('text')}
              title="文字工具 (T)"
              className="h-8 px-3"
            >
              <Type className="w-4 h-4" />
            </Button>
          </div>

          {/* 绘制颜色选择 */}
          {(toolMode === 'draw' || toolMode === 'arrow') && (
            <div className="flex items-center gap-1">
              {['#FF4444', '#FF9500', '#4CAF50', '#2196F3', '#9C27B0', '#333333'].map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    drawColor === color ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setDrawColor(color)}
                />
              ))}
            </div>
          )}

          {/* 画笔粗细 */}
          {(toolMode === 'draw' || toolMode === 'arrow') && (
            <div className="flex items-center gap-1">
              {[2, 3, 5, 8].map((width) => (
                <Button
                  key={width}
                  size="sm"
                  variant={drawWidth === width ? 'default' : 'ghost'}
                  onClick={() => setDrawWidth(width)}
                  className="h-8 px-2"
                >
                  <div
                    className="rounded-full bg-current"
                    style={{ width: width * 2, height: width * 2 }}
                  />
                </Button>
              ))}
            </div>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          {/* 添加元素 */}
          <Button size="sm" variant="outline" onClick={addRect} title="添加矩形">
            <Square className="w-4 h-4 mr-1" />
            矩形
          </Button>
          <label className="cursor-pointer">
            <Button size="sm" variant="outline" asChild>
              <span>
                <ImageIcon className="w-4 h-4 mr-1" />
                上传图片
              </span>
            </Button>
            <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
          </label>

          <div className="w-px h-6 bg-border mx-1" />

          {/* 缩放控制 */}
          <Button size="sm" variant="ghost" onClick={zoomOut} title="缩小">
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button size="sm" variant="ghost" onClick={zoomIn} title="放大">
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={resetView} title="重置视图">
            <RotateCcw className="w-4 h-4" />
          </Button>

          <div className="flex-1" />

          {/* 清除绘制 */}
          {(lines.length > 0 || arrows.length > 0) && (
            <Button size="sm" variant="outline" onClick={clearDrawings} title="清除所有绘制">
              <Trash2 className="w-4 h-4 mr-1" />
              清除绘制
            </Button>
          )}

          {/* 清空画布 */}
          {(elements.length > 0 || lines.length > 0 || arrows.length > 0) && (
            <Button size="sm" variant="outline" onClick={clearCanvas} title="清空画布（清除所有内容）">
              <RotateCcw className="w-4 h-4 mr-1" />
              清空画布
            </Button>
          )}

          {/* 操作按钮 */}
          {selectedId && (
            <Button size="sm" variant="destructive" onClick={deleteSelected}>
              <Trash2 className="w-4 h-4 mr-1" />
              删除
            </Button>
          )}
          <Button size="sm" variant="default" onClick={exportCanvas}>
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
        </div>
      </div>

      {/* 选中元素的浮动工具栏 */}
      {selectedId && selectedElement && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg px-3 py-2">
          <div className="flex items-center gap-1">
            {/* HD 放大 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={scaleUpSelected}
              title="放大元素"
              className="h-8 px-2"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="text-xs ml-1">放大</span>
            </Button>

            {/* 旋转 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => rotateSelected(90)}
              title="顺时针旋转90°"
              className="h-8 px-2"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-xs ml-1">旋转</span>
            </Button>

            {/* 水平翻转 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={flipHorizontal}
              title="水平翻转"
              className="h-8 px-2"
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="text-xs ml-1">翻转</span>
            </Button>

            {/* 垂直翻转 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={flipVertical}
              title="垂直翻转"
              className="h-8 px-2"
            >
              <FlipVertical className="w-4 h-4" />
            </Button>

            {/* 文字编辑 */}
            {selectedElement.type === 'text' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleTextDblClick(selectedElement)}
                title="编辑文字"
                className="h-8 px-2"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-xs ml-1">编辑</span>
              </Button>
            )}

            <div className="w-px h-6 bg-border mx-1" />

            {/* 删除 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={deleteSelected}
              title="删除"
              className="h-8 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs ml-1">删除</span>
            </Button>

            {/* 取消选中 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedId(null)}
              title="取消选中"
              className="h-8 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 文字编辑输入框 */}
      {editingTextId && (
        <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-background rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-medium mb-3">编辑文字</h3>
            <input
              ref={textInputRef}
              type="text"
              value={editingTextValue}
              onChange={(e) => setEditingTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTextEdit();
                if (e.key === 'Escape') cancelTextEdit();
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入文字..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={cancelTextEdit}>
                取消
              </Button>
              <Button size="sm" onClick={saveTextEdit}>
                <Check className="w-4 h-4 mr-1" />
                确定
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 画布区域 */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ cursor: getCursorStyle() }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const imageUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
          if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
            addImageToCanvas(imageUrl);
          }
        }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          draggable={toolMode === 'select' && !selectedId}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            if (e.target === stageRef.current) {
              setPosition({
                x: e.target.x(),
                y: e.target.y(),
              });
            }
          }}
          style={{ backgroundColor: '#f8fafc' }}
          onMount={(e: Konva.KonvaEventObject<HTMLDivElement>) => {
            console.log('Stage mounted:', { width: e.target.width(), height: e.target.height() });
          }}
        >
          <Layer>
            {/* 网格背景 */}
            {Array.from({ length: Math.ceil(stageSize.width / 50) + 20 }).map((_, i) => (
              <Rect
                key={`grid-v-${i}`}
                x={i * 50}
                y={0}
                width={1}
                height={stageSize.height}
                fill="#e2e8f0"
                opacity={0.5}
              />
            ))}
            {Array.from({ length: Math.ceil(stageSize.height / 50) + 20 }).map((_, i) => (
              <Rect
                key={`grid-h-${i}`}
                x={0}
                y={i * 50}
                width={stageSize.width}
                height={1}
                fill="#e2e8f0"
                opacity={0.5}
              />
            ))}

            {/* 渲染绘制线条 */}
            {lines.map((line) => (
              <Line
                key={line.id}
                points={line.points}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            ))}
            {currentLine && (
              <Line
                points={currentLine.points}
                stroke={currentLine.stroke}
                strokeWidth={currentLine.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            )}

            {/* 渲染箭头 */}
            {arrows.map((arrow) => (
              <Arrow
                key={arrow.id}
                points={arrow.points}
                stroke={arrow.stroke}
                strokeWidth={arrow.strokeWidth}
                fill={arrow.stroke}
                pointerLength={10}
                pointerWidth={10}
                lineCap="round"
                lineJoin="round"
              />
            ))}
            {currentArrow && (
              <Arrow
                points={currentArrow.points}
                stroke={currentArrow.stroke}
                strokeWidth={currentArrow.strokeWidth}
                fill={currentArrow.stroke}
                pointerLength={10}
                pointerWidth={10}
                lineCap="round"
                lineJoin="round"
              />
            )}

            {/* 渲染元素 */}
            {elements.map((el) => {
              if (el.type === 'text') {
                return (
                  <Text
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    text={el.text}
                    fontSize={el.fontSize}
                    fill={el.fill}
                    draggable={toolMode === 'select' && el.draggable}
                    rotation={el.rotation || 0}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    stroke={selectedId === el.id ? '#3b82f6' : undefined}
                    strokeWidth={selectedId === el.id ? 1 : 0}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (toolMode === 'select') {
                        setSelectedId(el.id);
                      } else if (toolMode === 'text') {
                        handleTextDblClick(el);
                      }
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(el.id);
                    }}
                    onDblClick={() => handleTextDblClick(el)}
                    onDblTap={() => handleTextDblClick(el)}
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                    }}
                  />
                );
              }
              if (el.type === 'rect') {
                return (
                  <Rect
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill={el.fill}
                    draggable={toolMode === 'select' && el.draggable}
                    rotation={el.rotation || 0}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    stroke={selectedId === el.id ? '#3b82f6' : undefined}
                    strokeWidth={selectedId === el.id ? 2 : 0}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(el.id);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(el.id);
                    }}
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                    }}
                  />
                );
              }
              if (el.type === 'image' && el.image) {
                return (
                  <Group
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    rotation={el.rotation || 0}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    draggable={toolMode === 'select' && el.draggable}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(el.id);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(el.id);
                    }}
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                    }}
                  >
                    <KonvaImage
                      id={el.id + '-inner'}
                      x={0}
                      y={0}
                      image={el.image}
                      width={el.width}
                      height={el.height}
                    />
                    {/* 选中边框 - 相对于 Group 的位置 */}
                    {selectedId === el.id && (
                      <>
                        <Rect
                          x={0}
                          y={0}
                          width={el.width}
                          height={el.height}
                          stroke="#3b82f6"
                          strokeWidth={2 / (el.scaleX || 1)}
                          dash={[6 / (el.scaleX || 1), 4 / (el.scaleX || 1)]}
                          listening={false}
                        />
                        {/* 信息标签 */}
                        {elementInfo && (
                          <Group x={0} y={-30}>
                            <Rect
                              x={0}
                              y={0}
                              width={150}
                              height={24}
                              fill="#3b82f6"
                              cornerRadius={4}
                            />
                            <Text
                              x={8}
                              y={6}
                              text={`${elementInfo.name} | ${elementInfo.width} × ${elementInfo.height}`}
                              fontSize={11}
                              fill="#ffffff"
                            />
                          </Group>
                        )}
                      </>
                    )}
                  </Group>
                );
              }
              return null;
            })}

            {/* Transformer 用于调整大小 */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>

        {/* 空状态提示 */}
        {elements.length === 0 && lines.length === 0 && arrows.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">画布为空</p>
              <p className="text-sm mt-1">使用上方工具添加元素，或在右侧对话区生成图片</p>
            </div>
          </div>
        )}

        {/* 工具提示 */}
        {toolMode !== 'select' && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-foreground/90 text-background text-sm px-4 py-2 rounded-full">
            {toolMode === 'draw' && '在画布上拖动绘制，完成后自动保存'}
            {toolMode === 'arrow' && '从起点拖动到终点创建箭头'}
            {toolMode === 'text' && '点击已有文字编辑，或点击"文字"按钮添加新文字'}
          </div>
        )}
      </div>
    </div>
  );
}
