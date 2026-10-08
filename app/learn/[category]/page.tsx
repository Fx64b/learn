import { LearnPage } from '@/components/learn/session/learn-page'

export default async function LearnDeckPage({
    params,
}: {
    params: Promise<{ category: string }>
}) {
    const { category } = await params
    return <LearnPage scope={category} />
}
