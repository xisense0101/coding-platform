import { NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis/client'
import { sendContactEmail } from '@/lib/email/mailjet'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(10),
  // Honeypot field - should be empty
  website: z.string().optional().or(z.literal('')),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // 1. Validate input
    const result = contactSchema.safeParse(body)
    if (!result.success) {
      const errorMessage = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Invalid input: ${errorMessage}` }, { status: 400 })
    }

    const { name, email, subject, message, website } = result.data

    // 2. Spam Protection (Honeypot)
    if (website && website.length > 0) {
      // Pretend it worked to fool bots
      return NextResponse.json({ success: true })
    }

    // 3. Rate Limiting
    const redis = getRedisClient()
    if (redis) {
      const ip = req.headers.get('x-forwarded-for') || 'unknown'
      const rateLimitKey = `contact_limit:${ip}`
      
      const attempts = await redis.incr(rateLimitKey)
      if (attempts === 1) {
        await redis.expire(rateLimitKey, 60) // 1 minute TTL
      }

      if (attempts > 1) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again in a minute.' },
          { status: 429 }
        )
      }
    }

    // 4. Send Email
    const emailResult = await sendContactEmail({
      name,
      email,
      subject,
      message
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
