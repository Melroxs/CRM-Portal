import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import ChatScreen from '../client/ChatScreen'

const AdminDashboard = () => {
  const { user, profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('clients')
  const [clients, setClients] = useState([])
  const [staff, setStaff] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [clientToAssign, setClientToAssign] = useState(null)
  const [showAddClientModal, setShowAddClientModal] = useState(false)

  useEffect(() => {
    fetchClients()
    fetchStaff()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          user:profiles!clients_user_id_fkey(full_name, email),
          assigned_staff:profiles!clients_assigned_staff_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff')

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const handleAssignStaff = async (staffId) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ assigned_staff_id: staffId })
        .eq('id', clientToAssign.id)

      if (error) throw error

      // Create activity
      await supabase.from('activities').insert({
        client_id: clientToAssign.id,
        activity_type: 'assignment',
        description: `Client assigned to staff member`,
        performed_by: user.id,
      })

      setShowAssignModal(false)
      setClientToAssign(null)
      fetchClients()
      alert('Staff assigned successfully')
    } catch (error) {
      console.error('Error assigning staff:', error)
      alert('Failed to assign staff')
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => {
                setActiveTab('clients')
                setSelectedClient(null)
              }}
              className={`py-4 px-2 border-b-2 font-semibold transition ${
                activeTab === 'clients'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 All Clients ({clients.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('chats')
                setSelectedClient(null)
              }}
              className={`py-4 px-2 border-b-2 font-semibold transition ${
                activeTab === 'chats'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 All Chats
            </button>
            <button
              onClick={() => {
                setActiveTab('staff')
                setSelectedClient(null)
              }}
              className={`py-4 px-2 border-b-2 font-semibold transition ${
                activeTab === 'staff'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👤 Staff Management ({staff.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'clients' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Clients</h2>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                + Add Client
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Assigned Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.user?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{client.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {client.company_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(
                            client.status
                          )}`}
                        >
                          {client.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {client.assigned_staff?.full_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => {
                            setClientToAssign(client)
                            setShowAssignModal(true)
                          }}
                          className="text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-240px)]">
            <div className="col-span-12 lg:col-span-4 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Select Client Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                      selectedClient?.id === client.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">
                      {client.user?.full_name || client.user?.email || 'Unknown'}
                    </h3>
                    {client.company_name && (
                      <p className="text-sm text-gray-600">{client.company_name}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 bg-white rounded-lg shadow-sm overflow-hidden">
              {selectedClient ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedClient.user?.full_name || selectedClient.user?.email}
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
        )}

        {activeTab === 'staff' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Assigned Clients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {member.full_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{member.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {clients.filter((c) => c.assigned_staff_id === member.id).length}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No staff members yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Staff</h2>
            <p className="text-sm text-gray-600 mb-4">
              Assign a staff member to: {clientToAssign?.user?.full_name || clientToAssign?.user?.email}
            </p>
            <div className="space-y-2 mb-6">
              {staff.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleAssignStaff(member.id)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition"
                >
                  <div className="font-semibold text-gray-900">
                    {member.full_name || 'Unnamed'}
                  </div>
                  <div className="text-sm text-gray-600">{member.email}</div>
                </button>
              ))}
              {staff.length === 0 && (
                <p className="text-center text-gray-500 py-4">No staff members available</p>
              )}
            </div>
            <button
              onClick={() => {
                setShowAssignModal(false)
                setClientToAssign(null)
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <AddClientModal
          onClose={() => setShowAddClientModal(false)}
          onSuccess={() => {
            setShowAddClientModal(false)
            fetchClients()
          }}
        />
      )}
    </div>
  )
}

// Add Client Modal Component
const AddClientModal = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Update profile
        await supabase
          .from('profiles')
          .update({ full_name: fullName, role: 'client' })
          .eq('id', authData.user.id)

        // Create client record
        await supabase.from('clients').insert({
          user_id: authData.user.id,
          company_name: companyName || null,
          phone: phone || null,
          status: 'active',
        })

        onSuccess()
      }
    } catch (error) {
      console.error('Error creating client:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Client</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminDashboard
