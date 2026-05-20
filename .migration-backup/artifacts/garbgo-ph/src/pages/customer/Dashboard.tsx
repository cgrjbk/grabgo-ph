import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocation } from 'wouter'
import { MapPin, Clock, CheckCircle, Loader2, Plus } from 'lucide-react'
import CustomerLayout from '@/components/shared/CustomerLayout'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [, navigate] = useLocation()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('bookings')
          .select('*, waste_types(name)')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        setBookings(data || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  return (
    <CustomerLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-emerald-600 text-lg">Track your pickup requests</p>
        </div>
        <Button onClick={() => navigate('/customer/book')} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          New Booking
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-20 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Book your first pickup and help keep Zamboanga clean!</p>
            <Button onClick={() => navigate('/customer/book')} size="lg">
              Book a Pickup Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">
                        {booking.waste_types?.name || 'Waste Pickup'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                        {booking.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        {booking.address || 'Zamboanga City'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        {new Date(booking.created_at).toLocaleDateString('en-PH', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </div>
                    </div>
                    {booking.total_amount && (
                      <p className="mt-3 font-semibold text-emerald-700">
                        ₱{booking.total_amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CustomerLayout>
  )
}
