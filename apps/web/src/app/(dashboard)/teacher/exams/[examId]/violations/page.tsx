'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  RefreshCw,
  Filter,
  FileText,
  AlertCircle
} from 'lucide-react'

interface Violation {
  id: string
  submission_id: string
  violation_type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  details: any
  screenshot_url?: string
  review_status: 'pending' | 'reviewed' | 'dismissed'
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  action_taken?: string
  created_at: string
  submission?: {
    id: string
    student?: {
      id: string
      email: string
      profiles?: {
        first_name: string
        last_name: string
      }
    }
  }
}

interface CheatingFlag {
  id: string
  submission_id: string
  flag_type: string
  description: string
  evidence: any
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: string
  created_at: string
  submission?: {
    id: string
    student?: {
      id: string
      email: string
      profiles?: {
        first_name: string
        last_name: string
      }
    }
  }
}

interface Summary {
  total_violations: number
  pending: number
  reviewed: number
  dismissed: number
  total_flags: number
  high_risk_students: number
}

export default function ViolationReviewPage() {
  const params = useParams()
  const examId = params.examId as string

  const [violations, setViolations] = useState<Violation[]>([])
  const [flags, setFlags] = useState<CheatingFlag[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'dismissed'>('reviewed')
  const [actionTaken, setActionTaken] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchViolations()
  }, [examId, filterStatus])

  const fetchViolations = async () => {
    try {
      setIsLoading(true)
      const url = filterStatus === 'all' 
        ? `/api/exam/violations/${examId}`
        : `/api/exam/violations/${examId}?status=${filterStatus}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setViolations(data.violations)
        setFlags(data.flags)
        setSummary(data.summary)
      } else {
        alert('Failed to fetch violations')
      }
    } catch (error) {
      console.error('Error fetching violations:', error)
      alert('An error occurred while fetching violations')
    } finally {
      setIsLoading(false)
    }
  }

  const openReviewDialog = (violation: Violation) => {
    setSelectedViolation(violation)
    setReviewStatus('reviewed')
    setActionTaken('')
    setReviewNotes('')
    setShowReviewDialog(true)
  }

  const submitReview = async () => {
    if (!selectedViolation) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/exam/violations/review/${selectedViolation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus,
          actionTaken,
          reviewNotes
        })
      })

      if (response.ok) {
        alert('Violation reviewed successfully')
        setShowReviewDialog(false)
        fetchViolations()
      } else {
        alert('Failed to review violation')
      }
    } catch (error) {
      console.error('Error reviewing violation:', error)
      alert('An error occurred while reviewing violation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'reviewed':
        return <Badge variant="default" className="bg-green-500">Reviewed</Badge>
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getViolationTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Violation Review</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage exam violations and security flags
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchViolations}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{summary.total_violations}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{summary.pending}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                  <p className="text-2xl font-bold">{summary.reviewed}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dismissed</p>
                  <p className="text-2xl font-bold">{summary.dismissed}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flags</p>
                  <p className="text-2xl font-bold">{summary.total_flags}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                  <p className="text-2xl font-bold">{summary.high_risk_students}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Cheating Flags Section */}
        {flags && flags.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                High-Priority Cheating Flags
              </h2>
              <div className="space-y-3">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="border border-red-200 bg-red-50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">
                            {getViolationTypeLabel(flag.flag_type)}
                          </Badge>
                          {flag.is_resolved && (
                            <Badge variant="default" className="bg-green-500">Resolved</Badge>
                          )}
                          {flag.submission?.student && (
                            <span className="text-sm font-medium">
                              {flag.submission.student.profiles?.first_name}{' '}
                              {flag.submission.student.profiles?.last_name}
                              <span className="text-muted-foreground ml-1">
                                ({flag.submission.student.email})
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-2">{flag.description}</p>
                        {flag.evidence && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View Evidence
                            </summary>
                            <pre className="mt-2 p-2 bg-white rounded border overflow-auto">
                              {JSON.stringify(flag.evidence, null, 2)}
                            </pre>
                          </details>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Flagged: {new Date(flag.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Violations List */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Violations</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading violations...</p>
              </div>
            ) : violations.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No violations found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSeverityBadge(violation.severity)}
                          {getStatusBadge(violation.review_status)}
                          <Badge variant="outline">
                            {getViolationTypeLabel(violation.violation_type)}
                          </Badge>
                          {violation.submission?.student && (
                            <span className="text-sm font-medium">
                              {violation.submission.student.profiles?.first_name}{' '}
                              {violation.submission.student.profiles?.last_name}
                              <span className="text-muted-foreground ml-1">
                                ({violation.submission.student.email})
                              </span>
                            </span>
                          )}
                        </div>

                        <p className="text-sm">{violation.description}</p>

                        {violation.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                              {JSON.stringify(violation.details, null, 2)}
                            </pre>
                          </details>
                        )}

                        {violation.review_notes && (
                          <div className="text-sm bg-muted p-2 rounded">
                            <span className="font-medium">Review Notes: </span>
                            {violation.review_notes}
                          </div>
                        )}

                        {violation.action_taken && (
                          <div className="text-sm">
                            <span className="font-medium">Action Taken: </span>
                            <Badge variant="outline">{getViolationTypeLabel(violation.action_taken)}</Badge>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Detected: {new Date(violation.created_at).toLocaleString()}
                          {violation.reviewed_at && (
                            <span className="ml-4">
                              Reviewed: {new Date(violation.reviewed_at).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {violation.review_status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => openReviewDialog(violation)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Violation</DialogTitle>
              <DialogDescription>
                Review this violation and take appropriate action
              </DialogDescription>
            </DialogHeader>

            {selectedViolation && (
              <div className="space-y-4">
                {/* Violation Details */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(selectedViolation.severity)}
                    <Badge variant="outline">
                      {getViolationTypeLabel(selectedViolation.violation_type)}
                    </Badge>
                  </div>
                  <p className="text-sm">{selectedViolation.description}</p>
                  {selectedViolation.submission?.student && (
                    <p className="text-sm text-muted-foreground">
                      Student: {selectedViolation.submission.student.profiles?.first_name}{' '}
                      {selectedViolation.submission.student.profiles?.last_name}
                      {' '}({selectedViolation.submission.student.email})
                    </p>
                  )}
                </div>

                {/* Review Form */}
                <div className="space-y-4">
                  <div>
                    <Label>Review Decision</Label>
                    <Select 
                      value={reviewStatus} 
                      onValueChange={(v: any) => setReviewStatus(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reviewed">Confirm Violation</SelectItem>
                        <SelectItem value="dismissed">Dismiss as False Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {reviewStatus === 'reviewed' && (
                    <div>
                      <Label>Action to Take</Label>
                      <Select value={actionTaken} onValueChange={setActionTaken}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warning">Issue Warning</SelectItem>
                          <SelectItem value="invalidate_score">Invalidate Score</SelectItem>
                          <SelectItem value="allow_retest">Allow Retest</SelectItem>
                          <SelectItem value="no_action">No Action Required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Review Notes</Label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add any notes about your decision..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitReview}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
