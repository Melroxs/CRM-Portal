import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import ChatScreen from '../client/ChatScreen'

const StaffDashboard = () => {
  const { user, profile, signOut } = useAuth()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState({})

  useEffect(() => {
    fetchAssignedClients()
  }, [user])

  const fetchAssignedClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          user:profiles!clients_user_id_fkey(full_name, email)
        `)
        .eq('assigned_staff_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
      
      // Fetch unread counts for each client
      if (data && data.length > 0) {
        fetchUnreadCounts(data.map(c => c.id))
      }
    } catch (error) {
      console.error('Error fetching assigned clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCounts = async (clientIds) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('client_id, id')
        .in('client_id', clientIds)
        .eq('is_read', false)
        .neq('sender_id', user.id)

      if (error) throw error

      const counts = {}
      data.forEach(msg => {
        counts[msg.client_id] = (counts[msg.client_id] || 0) + 1
      })
      setUnreadCounts(counts)
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
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

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]">
          {/* Clients List */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                My Clients ({clients.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {clients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No clients assigned yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        selectedClient?.id === client.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {client.user?.full_name || client.user?.email || 'Unknown'}
                          </h3>
                          {client.company_name && (
                            <p className="text-sm text-gray-600">{client.company_name}</p>
                          )}
                        </div>
                        {unreadCounts[client.id] > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {unreadCounts[client.id]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(
                            client.status
                          )}`}
                        >
                          {client.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(client.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat View */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-lg shadow-sm overflow-hidden">
            {selectedClient ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Chat with {selectedClient.user?.full_name || selectedClient.user?.email}
                  </h2>
                  {selectedClient.company_name && (
                    <p className="text-sm text-gray-600">{selectedClient.company_name}</p>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatScreen clientId={selectedClient.id} />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a client to view their chat
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
