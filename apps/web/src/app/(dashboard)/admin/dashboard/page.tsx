import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  BookOpen, 
  Shield, 
  BarChart3,
  Activity,
  AlertTriangle,
  Settings,
  Database,
  Server,
  Globe,
  UserCheck,
  FileText,
  TrendingUp,
  Clock
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Enterprise Educational Platform',
  description: 'System overview, user management, and administrative controls.',
}

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Administration</h2>
          <p className="text-muted-foreground">
            Monitor platform health, manage users, and oversee system operations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            System Health
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              +182 new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12 published this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent System Events */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent System Events</CardTitle>
            <CardDescription>
              Latest administrative activities and system events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Security alert: Multiple failed login attempts</p>
                <p className="text-sm text-muted-foreground">IP: 192.168.1.100 - 15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <UserCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">New organization registered: "TechCorp University"</p>
                <p className="text-sm text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Database className="h-4 w-4 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Database backup completed successfully</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Globe className="h-4 w-4 text-orange-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">CDN cache cleared for all regions</p>
                <p className="text-sm text-muted-foreground">4 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and performance metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Database</span>
              </div>
              <span className="text-sm text-muted-foreground">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">API Services</span>
              </div>
              <span className="text-sm text-muted-foreground">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span className="text-sm">File Storage</span>
              </div>
              <span className="text-sm text-muted-foreground">Degraded</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Authentication</span>
              </div>
              <span className="text-sm text-muted-foreground">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Real-time</span>
              </div>
              <span className="text-sm text-muted-foreground">Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Quick access to user administration tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start h-auto p-3">
                <div className="text-left">
                  <div className="font-medium">Students</div>
                  <div className="text-sm text-muted-foreground">2,234 active</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-3">
                <div className="text-left">
                  <div className="font-medium">Teachers</div>
                  <div className="text-sm text-muted-foreground">89 active</div>
                </div>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start h-auto p-3">
                <div className="text-left">
                  <div className="font-medium">Admins</div>
                  <div className="text-sm text-muted-foreground">12 active</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-3">
                <div className="text-left">
                  <div className="font-medium">Organizations</div>
                  <div className="text-sm text-muted-foreground">47 active</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
            <CardDescription>
              Key performance metrics for the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Exams Completed</span>
              </div>
              <span className="text-sm font-medium">12,847</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm">Course Completions</span>
              </div>
              <span className="text-sm font-medium">3,456</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Avg. Session Duration</span>
              </div>
              <span className="text-sm font-medium">24 min</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Daily Active Users</span>
              </div>
              <span className="text-sm font-medium">1,847</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
