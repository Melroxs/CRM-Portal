import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ActivityTimeline = ({ clientId }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clientId) {
      fetchActivities()
    }
  }, [clientId])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          performed_by:profiles(full_name, email)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    const icons = {
      message: '💬',
      status_change: '🔄',
      assignment: '👤',
      note: '📝',
      call: '📞',
      meeting: '🤝',
    }
    return icons[type] || '📋'
  }

  const getActivityColor = (type) => {
    const colors = {
      message: 'bg-blue-100 text-blue-800',
      status_change: 'bg-yellow-100 text-yellow-800',
      assignment: 'bg-green-100 text-green-800',
      note: 'bg-purple-100 text-purple-800',
      call: 'bg-orange-100 text-orange-800',
      meeting: 'bg-pink-100 text-pink-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading activities...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Timeline</h2>

        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No activities yet
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActivityColor(
                      activity.activity_type
                    )}`}
                  >
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 my-2" />
                  )}
                </div>

                {/* Activity Content */}
                <div className="flex-1 pb-8">
                  <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${getActivityColor(
                          activity.activity_type
                        )}`}
                      >
                        {activity.activity_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{activity.description}</p>
                    {activity.performed_by && (
                      <p className="text-xs text-gray-600">
                        By: {activity.performed_by.full_name || activity.performed_by.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityTimeline
