import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis/client'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/exams/[examId]/session/heartbeat
 * Refreshes the Redis session lock TTL
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
            return NextResponse.json({ success: true, message: 'Redis not configured, skipping lock' })
        }

        const lockKey = `exam:session:lock:${params.examId}:${userId}`
        const activeSessionId = await redis.get(lockKey)

        if (activeSessionId && activeSessionId !== sessionId) {
            logger.warn('🚫 Heartbeat conflict - session taken by another device:', {
                examId: params.examId,
                userId,
                activeSessionId,
                currentSessionId: sessionId
            })
            return NextResponse.json(
                {
                    error: 'Session active on another device',
                    code: 'CONCURRENT_SESSION'
                },
                { status: 403 }
            )
        }

        // Refresh TTL to 60 seconds
        await redis.set(lockKey, sessionId, { ex: 60 })

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error('💥 Error in heartbeat:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
