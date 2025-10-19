'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Copy, 
  Plus, 
  Trash2, 
  XCircle, 
  CheckCircle, 
  Clock, 
  Users,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react'

interface Invite {
  id: string
  exam_id: string
  student_id: string | null
  token: string
  invite_type: 'single-use' | 'reusable'
  expires_at: string | null
  max_uses: number
  uses_count: number
  is_active: boolean
  created_at: string
  used_at: string | null
  revoked_at: string | null
  student?: {
    id: string
    email: string
    profiles?: {
      first_name: string
      last_name: string
    }
  }
}

interface ExamInfo {
  id: string
  title: string
  slug: string
}

export default function ExamInvitesPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string

  const [exam, setExam] = useState<ExamInfo | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  // Generate dialog state
  const [inviteType, setInviteType] = useState<'single-use' | 'reusable'>('single-use')
  const [tokenCount, setTokenCount] = useState(1)
  const [maxUses, setMaxUses] = useState(1)
  const [hasExpiration, setHasExpiration] = useState(false)
  const [expirationDate, setExpirationDate] = useState('')

  useEffect(() => {
    fetchExamInfo()
    fetchInvites()
  }, [examId])

  const fetchExamInfo = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`)
      if (response.ok) {
        const data = await response.json()
        setExam(data.exam)
      }
    } catch (error) {
      console.error('Error fetching exam:', error)
    }
  }

  const fetchInvites = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/exam/invites/${examId}`)
      if (response.ok) {
        const data = await response.json()
        setInvites(data.invites)
      } else {
        alert('Failed to fetch invites')
      }
    } catch (error) {
      console.error('Error fetching invites:', error)
      alert('An error occurred while fetching invites')
    } finally {
      setIsLoading(false)
    }
  }

  const generateInvites = async () => {
    try {
      setIsGenerating(true)
      
      const payload = {
        inviteType,
        count: tokenCount,
        maxUses: inviteType === 'reusable' ? maxUses : 1,
        expiresAt: hasExpiration && expirationDate ? new Date(expirationDate).toISOString() : null
      }

      const response = await fetch(`/api/exam/invites/${examId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        setShowGenerateDialog(false)
        fetchInvites()
        
        // Reset form
        setInviteType('single-use')
        setTokenCount(1)
        setMaxUses(1)
        setHasExpiration(false)
        setExpirationDate('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate invites')
      }
    } catch (error) {
      console.error('Error generating invites:', error)
      alert('An error occurred while generating invites')
    } finally {
      setIsGenerating(false)
    }
  }

  const revokeInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/exam/invites/revoke/${inviteId}`, {
        method: 'PATCH'
      })

      if (response.ok) {
        alert('Invite revoked successfully')
        fetchInvites()
      } else {
        alert('Failed to revoke invite')
      }
    } catch (error) {
      console.error('Error revoking invite:', error)
      alert('An error occurred while revoking invite')
    }
  }

  const deleteInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to delete this invite? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/exam/invites/revoke/${inviteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Invite deleted successfully')
        fetchInvites()
      } else {
        alert('Failed to delete invite')
      }
    } catch (error) {
      console.error('Error deleting invite:', error)
      alert('An error occurred while deleting invite')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const getInviteUrl = (token: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/exam/${exam?.slug}?token=${token}`
  }

  const getStatusBadge = (invite: Invite) => {
    if (invite.revoked_at) {
      return <Badge variant="destructive">Revoked</Badge>
    }
    if (!invite.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>
    }
    if (invite.invite_type === 'single-use' && invite.uses_count >= invite.max_uses) {
      return <Badge variant="secondary">Used</Badge>
    }
    return <Badge variant="default" className="bg-green-500">Active</Badge>
  }

  const activeInvites = invites.filter(i => i.is_active && !i.revoked_at)
  const usedInvites = invites.filter(i => i.uses_count > 0)
  const revokedInvites = invites.filter(i => i.revoked_at)

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Exam Invites</h1>
            {exam && (
              <p className="text-muted-foreground mt-1">
                Managing invites for: <span className="font-medium">{exam.title}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchInvites}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Invites
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Exam Invites</DialogTitle>
                  <DialogDescription>
                    Create secure tokens for students to access the exam
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Invite Type</Label>
                    <Select value={inviteType} onValueChange={(v: any) => setInviteType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-use">Single Use</SelectItem>
                        <SelectItem value="reusable">Reusable</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {inviteType === 'single-use' 
                        ? 'Token can only be used once' 
                        : 'Token can be used multiple times'}
                    </p>
                  </div>

                  <div>
                    <Label>Number of Tokens</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={tokenCount}
                      onChange={(e) => setTokenCount(parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate multiple tokens at once (max 100)
                    </p>
                  </div>

                  {inviteType === 'reusable' && (
                    <div>
                      <Label>Maximum Uses Per Token</Label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={maxUses}
                        onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label>Set Expiration Date</Label>
                    <Switch
                      checked={hasExpiration}
                      onCheckedChange={setHasExpiration}
                    />
                  </div>

                  {hasExpiration && (
                    <div>
                      <Label>Expires At</Label>
                      <Input
                        type="datetime-local"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowGenerateDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={generateInvites}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LinkIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invites</p>
                <p className="text-2xl font-bold">{invites.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeInvites.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-2xl font-bold">{usedInvites.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revoked</p>
                <p className="text-2xl font-bold">{revokedInvites.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Invites List */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Invite Tokens</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading invites...</p>
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No invites generated yet</p>
                <Button onClick={() => setShowGenerateDialog(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate First Invite
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(invite)}
                          <Badge variant="outline">
                            {invite.invite_type === 'single-use' ? 'Single Use' : 'Reusable'}
                          </Badge>
                          {invite.student && (
                            <Badge variant="secondary">
                              <Users className="w-3 h-3 mr-1" />
                              {invite.student.profiles?.first_name} {invite.student.profiles?.last_name}
                            </Badge>
                          )}
                        </div>

                        <div className="font-mono text-sm bg-muted p-2 rounded flex items-center justify-between">
                          <span className="truncate">{invite.token}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(invite.token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>

                        {exam && (
                          <div className="text-sm text-muted-foreground bg-muted p-2 rounded flex items-center justify-between">
                            <span className="truncate flex-1">
                              {getInviteUrl(invite.token)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(getInviteUrl(invite.token))}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created: {new Date(invite.created_at).toLocaleString()}
                          </span>
                          {invite.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {new Date(invite.expires_at).toLocaleString()}
                            </span>
                          )}
                          <span>
                            Uses: {invite.uses_count} / {invite.max_uses}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {invite.is_active && !invite.revoked_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeInvite(invite.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteInvite(invite.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
