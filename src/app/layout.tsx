import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Lovart Studio',
    template: '%s | Lovart Studio',
  },
  description:
    'AI 驱动的视觉设计平台，智能生成电商套图与创意视觉内容。',
  keywords: [
    'Lovart',
    'AI 设计',
    '电商视觉',
    '商品图生成',
    'AI 绘图',
  ],
  authors: [{ name: 'Lovart Studio' }],
  openGraph: {
    title: 'Lovart Studio | AI 视觉设计平台',
    description:
      'AI 驱动的视觉设计平台，智能生成电商套图与创意视觉内容。',
    type: 'website',
    locale: 'zh_CN',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
