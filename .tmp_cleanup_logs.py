from pathlib import Path

path = Path(r'd:\BaiduNetdiskDownload\仿lovart系统\projects\src\app\page.tsx')
text = path.read_text(encoding='utf-8')
text = text.replace("  console.log('[isAmazonVisualPlan] hasPlanHeader:', hasPlanHeader, 'hasImagePattern:', hasImagePattern);\n", "")
text = text.replace("  console.log('[parseAmazonVisualPlan] matches found:', matches.length);\n", "")
text = text.replace("              console.log('[Message Update] isPlan:', isPlan, 'planImages length:', planImages?.length || 0, 'data.done:', data.done);\n", "")
path.write_text(text, encoding='utf-8')
print('done')
