// Server Component
import NovelPageClient from './NovelPageClient'

// 使用标准的Next.js 15参数类型
export default async function NovelPage({
  params,
}: {
  params: Promise<{ levelId: string }>
}) {
  // 异步解构访问params参数
  const { levelId } = await params;
    
  return <NovelPageClient levelId={levelId || ''} />
} 