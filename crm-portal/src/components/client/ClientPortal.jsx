import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import ChatScreen from './ChatScreen'
import ActivityTimeline from './ActivityTimeline'

const ClientPortal = () => {
  const { user, profile, signOut } = useAuth()
  const [clientData, setClientData] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientData()
  }, [user])

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          assigned_staff:profiles!clients_assigned_staff_id_fkey(full_name, email)
        `)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setClientData(data)
    } catch (error) {
      console.error('Error fetching client data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h2>
          <p className="text-gray-600 mb-6">
            Your account is being set up. Please contact support for assistance.
          </p>
          <button
            onClick={signOut}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
              <p className="text-sm text-gray-600">Welcome, {profile?.full_name || user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Client Info Banner */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              {clientData.company_name && (
                <span>
                  <strong>Company:</strong> {clientData.company_name}
                </span>
              )}
              <span>
                <strong>Status:</strong>{' '}
                <span className="capitalize">{clientData.status}</span>
              </span>
            </div>
            {clientData.assigned_staff && (
              <span>
                <strong>Your Rep:</strong> {clientData.assigned_staff.full_name || clientData.assigned_staff.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-4 px-2 border-b-2 font-semibold transition ${
                activeTab === 'chat'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-2 border-b-2 font-semibold transition ${
                activeTab === 'activity'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Activity Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-280px)]">
          {activeTab === 'chat' && <ChatScreen clientId={clientData.id} />}
          {activeTab === 'activity' && <ActivityTimeline clientId={clientData.id} />}
        </div>
      </div>
    </div>
  )
}

export default ClientPortal
