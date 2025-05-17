import { cookies } from 'next/headers'

export async function POST() {
    const cookieStore = await cookies()
    cookieStore.delete('sb-access-token')
    return new Response(null, { status: 204 })
}
