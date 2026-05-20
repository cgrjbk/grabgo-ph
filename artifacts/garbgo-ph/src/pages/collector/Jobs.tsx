import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Weight, Clock, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import CollectorLayout from '@/components/shared/CollectorLayout'

export default function CollectorJobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  const fetchJobs = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bookings')
        .select('*, waste_types(name, base_price_per_kg)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) console.error('Fetch error:', error)
      setJobs(data || [])
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      toast.error("Failed to load available jobs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleAccept = async (jobId: string) => {
    setAccepting(jobId)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Please log in again")

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'accepted',
          collector_id: user.id
        })
        .eq('id', jobId)
        .eq('status', 'pending')
        .select()
        .single()

      if (error) {
        console.error("Update Error:", error)
        throw error
      }

      if (!data) {
        throw new Error("Job not found or already taken")
      }

      toast.success("Job accepted successfully!", {
        description: "Head to the pickup location."
      })

      // Refresh the list
      setJobs(prev => prev.filter(j => j.id !== jobId))

    } catch (error: any) {
      console.error("Full Accept Error:", error)
      toast.error("Failed to accept job", {
        description: error.message || "Please try again"
      })
    } finally {
      setAccepting(null)
    }
  }

  return (
    <CollectorLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Available Jobs</h1>
        <p className="text-emerald-600 text-lg">Pickup requests near Zamboanga City</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-20 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No pending jobs</h3>
            <p className="text-gray-600">Check back soon for new pickup requests in your area.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">
                      {job.waste_types?.name || 'Waste Pickup'}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        {job.address || 'Zamboanga City'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="w-4 h-4 text-emerald-600" />
                        {job.estimated_weight_kg} kg estimated
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        {new Date(job.created_at).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>

                    {job.notes && (
                      <p className="text-sm text-gray-500 italic mb-4">"{job.notes}"</p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-emerald-700">
                        ₱{(job.total_amount || 0).toFixed(2)}
                      </p>

                      <Button
                        onClick={() => handleAccept(job.id)}
                        disabled={accepting === job.id}
                        className="px-8"
                      >
                        {accepting === job.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          'Accept Job'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CollectorLayout>
  )
}