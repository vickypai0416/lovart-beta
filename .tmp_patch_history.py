from pathlib import Path

path = Path(r'd:\BaiduNetdiskDownload\仿lovart系统\projects\src\lib\history-manager.ts')
text = path.read_text(encoding='utf-8')

text = text.replace(
"import { idbPut, idbGetAll, idbDelete, idbClear, STORES, saveImageBlobFromUrl, getImageUrl, idbDeleteImageBlob } from './idb-storage';",
"import { saveImageBlobFromUrl, getImageUrl, idbDeleteImageBlob } from './idb-storage';"
)

insert_after = "const CHAT_STORAGE_KEY = 'chat_image_history';\nconst CHAT_MAX_IMAGES = 50;\n"
helper = "const CHAT_STORAGE_KEY = 'chat_image_history';\nconst CHAT_MAX_IMAGES = 50;\n\nfunction toStorageSafeUrl(url: string): string {\n  if (url.startsWith('data:')) {\n    return '';\n  }\n  return url;\n}\n\nfunction safeSetChatHistory(history: ChatImageHistoryItem[]): void {\n  try {\n    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));\n    return;\n  } catch {}\n\n  const trimmed = [...history];\n  while (trimmed.length > 0) {\n    trimmed.pop();\n    try {\n      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));\n      return;\n    } catch {}\n  }\n\n  localStorage.removeItem(CHAT_STORAGE_KEY);\n}\n"
text = text.replace(insert_after, helper)

text = text.replace(
"    url,",
"    url: toStorageSafeUrl(url),",
1
)

text = text.replace(
"  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));",
"  safeSetChatHistory(history);",
1
)

text = text.replace(
"  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(filtered));",
"  safeSetChatHistory(filtered);",
1
)

path.write_text(text, encoding='utf-8')
print('patched history-manager')
