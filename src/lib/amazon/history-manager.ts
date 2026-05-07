import { PromptGenerationResult, VariantOption } from './prompt-generator';
import { ProductAnalysis } from './product-analyzer';
import { SceneType } from './visual-strategy';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  productName: string;
  scene: SceneType;
  sceneName: string;
  variants?: VariantOption[];
  analysis: ProductAnalysis;
  result: PromptGenerationResult;
  generatedImages?: Array<{ index: number; type: string; url: string }>;
}

export interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number | null;
}

const STORAGE_KEY = 'amazon_prompt_history';
const MAX_ENTRIES = 50;

export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private currentIndex: number | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: HistoryState = JSON.parse(data);
        this.entries = parsed.entries || [];
        this.currentIndex = parsed.currentIndex || null;
      }
    } catch (error) {
      console.warn('加载历史记录失败:', error);
      this.entries = [];
      this.currentIndex = null;
    }
  }

  private saveToStorage(): void {
    try {
      const state: HistoryState = {
        entries: this.entries,
        currentIndex: this.currentIndex,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('保存历史记录失败:', error);
    }
  }

  addEntry(result: PromptGenerationResult, generatedImages?: Array<{ index: number; type: string; url: string }>): HistoryEntry {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      productName: result.productAnalysis.productName,
      scene: result.scene,
      sceneName: result.sceneName,
      variants: result.prompts
        .filter(p => p.type === 'variant')
        .map((_, idx) => ({
          color: `variant_${idx + 1}`,
          name: `Variant ${idx + 1}`,
        })),
      analysis: result.productAnalysis,
      result,
      generatedImages,
    };

    this.entries.unshift(entry);
    
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }

    this.currentIndex = 0;
    this.saveToStorage();

    return entry;
  }

  getEntries(): HistoryEntry[] {
    return this.entries;
  }

  getEntryById(id: string): HistoryEntry | undefined {
    return this.entries.find(entry => entry.id === id);
  }

  getCurrentEntry(): HistoryEntry | null {
    if (this.currentIndex === null || this.currentIndex >= this.entries.length) {
      return null;
    }
    return this.entries[this.currentIndex];
  }

  setCurrentEntry(id: string): boolean {
    const index = this.entries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.currentIndex = index;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteEntry(id: string): boolean {
    const index = this.entries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.entries.splice(index, 1);
      if (this.currentIndex === index) {
        this.currentIndex = this.entries.length > 0 ? Math.min(index, this.entries.length - 1) : null;
      } else if (this.currentIndex !== null && this.currentIndex > index) {
        this.currentIndex--;
      }
      this.saveToStorage();
      return true;
    }
    return false;
  }

  clearHistory(): void {
    this.entries = [];
    this.currentIndex = null;
    this.saveToStorage();
  }

  updateGeneratedImages(entryId: string, images: Array<{ index: number; type: string; url: string }>): boolean {
    const entry = this.entries.find(e => e.id === entryId);
    if (entry) {
      entry.generatedImages = images;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getEntryPreview(entry: HistoryEntry): {
    id: string;
    timestamp: string;
    productName: string;
    sceneName: string;
    promptCount: number;
    hasImages: boolean;
  } {
    return {
      id: entry.id,
      timestamp: entry.timestamp,
      productName: entry.productName,
      sceneName: entry.sceneName,
      promptCount: entry.result.prompts.length,
      hasImages: !!entry.generatedImages && entry.generatedImages.length > 0,
    };
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`;
    } else if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  }
}
