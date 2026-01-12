import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ChatScreen = ({ clientId }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { user, profile } = useAuth()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (clientId) {
      fetchMessages()
      subscribeToMessages()
    }
  }, [clientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name, email, role)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`messages:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `client_id=eq.${clientId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(full_name, email, role)
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && data) {
            setMessages((prev) => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)

    try {
      const { error } = await supabase.from('messages').insert({
        client_id: clientId,
        sender_id: user.id,
        sender_type: profile.role,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getSenderBadge = (senderType) => {
    const badges = {
      client: 'bg-blue-100 text-blue-800',
      staff: 'bg-green-100 text-green-800',
      ai: 'bg-purple-100 text-purple-800',
    }
    return badges[senderType] || 'bg-gray-100 text-gray-800'
  }

  const isOwnMessage = (senderId) => senderId === user.id

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isOwnMessage(message.sender_id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                }`}
              >
                {!isOwnMessage(message.sender_id) && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {message.sender?.full_name || 'Unknown'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getSenderBadge(
                        message.sender_type
                      )}`}
                    >
                      {message.sender_type.toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <div
                  className={`text-xs mt-1 ${
                    isOwnMessage(message.sender_id) ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatScreen
