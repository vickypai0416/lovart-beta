from pathlib import Path

path = Path(r'd:\BaiduNetdiskDownload\仿lovart系统\projects\src\app\page.tsx')
text = path.read_text(encoding='utf-8')

old1 = """              const planImages = isPlan && data.done === true ? parseAmazonVisualPlan(content) : undefined;
              
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { 
                          ...msg, 
                          content, 
                          isGenerating: data.done === false,
                          isAmazonPlan: isPlan,
                          planImages: data.done === true ? planImages : msg.planImages,
                        }
                      : msg
                  )
                );
              }
"""
new1 = """              const planImages = isPlan ? parseAmazonVisualPlan(content) : undefined;
              
              if (isMounted.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { 
                          ...msg, 
                          content, 
                          isGenerating: data.done === false,
                          isAmazonPlan: isPlan,
                          planImages: planImages && planImages.length > 0 ? planImages : msg.planImages,
                        }
                      : msg
                  )
                );
              }
"""

if old1 not in text:
    raise SystemExit('block1 not found')
text = text.replace(old1, new1, 1)

old2 = """    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[Chat Error]', error);
        if (generationIdRef.current) {
          const duration = Date.now() - requestStartTimeRef.current;
          updateGeneration(generationIdRef.current, {
            status: 'failed',
            duration,
            error: error instanceof Error ? error.message : '网络错误',
          });
        }
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: `❌ 请求失败: ${error instanceof Error ? error.message : '网络错误'}`, isGenerating: false }
                : msg
            )
          );
        }
      }
    } finally {
"""
new2 = """    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== aiMessageId) return msg;
              const content = msg.content || '';
              const isPlan = isAmazonVisualPlan(content);
              const planImages = isPlan ? parseAmazonVisualPlan(content) : msg.planImages;
              return {
                ...msg,
                isGenerating: false,
                isAmazonPlan: isPlan || msg.isAmazonPlan,
                planImages: planImages && planImages.length > 0 ? planImages : msg.planImages,
              };
            })
          );
        }
      } else {
        console.error('[Chat Error]', error);
        if (generationIdRef.current) {
          const duration = Date.now() - requestStartTimeRef.current;
          updateGeneration(generationIdRef.current, {
            status: 'failed',
            duration,
            error: error instanceof Error ? error.message : '网络错误',
          });
        }
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: `❌ 请求失败: ${error instanceof Error ? error.message : '网络错误'}`, isGenerating: false }
                : msg
            )
          );
        }
      }
    } finally {
"""

if old2 not in text:
    raise SystemExit('block2 not found')
text = text.replace(old2, new2, 1)

path.write_text(text, encoding='utf-8')
print('ok')
