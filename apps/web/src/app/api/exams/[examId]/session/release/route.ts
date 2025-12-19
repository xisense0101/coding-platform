import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis/client'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/exams/[examId]/session/release
 * Explicitly removes the Redis session lock
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { examId: string } }
) {
    try {
        const { userId, sessionId } = await request.json()

        if (!userId || !sessionId) {
            return NextResponse.json(
                { error: 'Missing userId or sessionId' },
                { status: 400 }
            )
        }

        const redis = getRedisClient()
        if (!redis) {
            return NextResponse.json({ success: true, message: 'Redis not configured' })
        }

        const lockKey = `exam:session:lock:${params.examId}:${userId}`
        const activeSessionId = await redis.get(lockKey)

        // Only delete if the session ID matches
        if (activeSessionId === sessionId) {
            await redis.del(lockKey)
            logger.log('🔓 Session lock released:', { examId: params.examId, userId })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error('💥 Error in release:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
