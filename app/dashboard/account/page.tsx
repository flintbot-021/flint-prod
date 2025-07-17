'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/components/ui/use-toast'
import { FlintLogo } from '@/components/flint-logo'
import { PaymentSetupModal } from '@/components/payment/payment-setup-modal'
import { 
  CreditCard, 
  User, 
  Mail, 
  Calendar, 
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Settings,
  LogOut,
  Shield,
  Activity
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface PaymentMethodInfo {
  has_payment_method: boolean
  card?: {
    brand: string
    last4: string
  }
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchPaymentMethod()
    }
  }, [user])

  const fetchPaymentMethod = async () => {
    try {
      const response = await fetch('/api/stripe/payment-method')
      const data = await response.json()
      setPaymentMethod(data)
    } catch (error) {
      console.error('Error fetching payment method:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment information',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    fetchPaymentMethod()
    toast({
      title: 'Success',
      description: 'Payment method updated successfully',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading account...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <span className="mx-4 text-gray-300 select-none">|</span>
              <FlintLogo size="sm" showText={false} className="!h-6 !w-auto" />
              <span className="text-lg font-semibold text-foreground">Account Settings</span>
            </div>
            {/* Avatar dropdown */}
            <div className="relative ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <span className="text-base font-medium text-blue-600">
                      {user?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={signOut} className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Member Since</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {user.created_at ? formatDate(user.created_at) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Account Status</label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Methods
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {paymentMethod?.has_payment_method ? 'Update' : 'Add'}
                </Button>
              </CardTitle>
              <CardDescription>
                Manage your payment methods for publishing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethod?.has_payment_method ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {paymentMethod.card?.brand?.toUpperCase()} •••• {paymentMethod.card?.last4}
                      </div>
                      <div className="text-sm text-gray-600">Default payment method</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No payment method added</p>
                  <p className="text-sm">Add a payment method to publish your campaigns</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Additional account management options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Dashboard</h4>
                  <p className="text-sm text-gray-600">Return to your main dashboard</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Sign Out</h4>
                  <p className="text-sm text-gray-600">Sign out of your account</p>
                </div>
                <Button
                  variant="outline"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Payment Setup Modal */}
      <PaymentSetupModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
} 