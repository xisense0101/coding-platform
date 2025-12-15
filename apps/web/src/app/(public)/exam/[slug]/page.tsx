import { createServerClient_Custom } from '@/lib/database/server'
import { headers } from 'next/headers'
import ExamClient from './ExamClient'

export default async function ExamPage({ params }: { params: { slug: string } }) {
  const supabase = createServerClient_Custom()
  
  // Fetch exam allowed_ip
  const { data } = await supabase
    .from('exams')
    .select('allowed_ip')
    .eq('slug', params.slug)
    .single()
  
  const exam = data as { allowed_ip: string | null } | null

  if (exam?.allowed_ip) {
    const headersList = headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const cfConnectingIp = headersList.get('cf-connecting-ip')
    const middlewareIp = headersList.get('x-client-ip')
    
    let clientIp = middlewareIp || 
                   forwardedFor?.split(',')[0]?.trim() || 
                   cfConnectingIp || 
                   realIp || 
                   'unknown'
    
    // Normalize IPv6 localhost
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1'
    }

    const allowedIps = exam.allowed_ip.split(',').map((ip: string) => ip.trim())
    
    if (!allowedIps.includes(clientIp)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Network Restricted</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              This exam can only be accessed from a specific network (e.g., School WiFi). 
              Please connect to the authorized network to proceed.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 inline-block">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Your Current IP</p>
              <p className="text-sm font-mono text-gray-700">{clientIp}</p>
            </div>
          </div>
        </div>
      )
    }
  }

  return <ExamClient />
}
