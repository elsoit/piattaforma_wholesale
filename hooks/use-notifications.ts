import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface Notification {
  id: number
  type: 'BRAND_ACTIVATION' | 'CATALOG_ADDED' | 'BRAND_EXPIRED' | 'ORDER_STATUS' | 'SYSTEM'
  icon: string
  color: string
  brandId?: string
  brandName?: string
  brandLogo?: string
  message: string
  read: boolean
  createdAt: string
  readAt?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  connected: boolean
}

interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    total: number
    pages: number
    current: number
  }
}

interface UnreadCountResponse {
  count: number
}

const RETRY_DELAY = 3000 // 3 secondi
const MAX_RETRIES = 3
const REFRESH_INTERVAL = 30000 // 30 secondi

export function useNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const refreshInterval = useRef<NodeJS.Timeout>()
  const initialFetchDone = useRef(false)
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
    connected: false
  })

  // Funzione per caricare le notifiche
  const fetchNotifications = useCallback(async (isInitialFetch = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const notificationsRes = await fetch('/api/notifications', {
        credentials: 'include'
      })

      if (!notificationsRes.ok) {
        console.error('❌ Errore API notifiche:', notificationsRes.status)
        throw new Error(`Errore API notifiche: ${notificationsRes.status}`)
      }

      const notificationsData = await notificationsRes.json() as NotificationsResponse
      
      const countRes = await fetch('/api/notifications/unread-count', {
        credentials: 'include'
      })
      
      if (!countRes.ok) {
        console.error('❌ Errore API conteggio:', countRes.status)
        throw new Error(`Errore API conteggio: ${countRes.status}`)
      }

      const countData = await countRes.json() as UnreadCountResponse

      console.log('✅ Notifiche caricate:', {
        count: notificationsData.notifications.length,
        unread: countData.count
      })

      setState(prev => ({
        ...prev,
        notifications: notificationsData.notifications,
        unreadCount: countData.count,
        loading: false,
        error: null
      }))

      if (isInitialFetch) {
        initialFetchDone.current = true
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento delle notifiche:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Errore nel caricamento delle notifiche'
      }))
    }
  }, [])

  // Caricamento iniziale delle notifiche
  useEffect(() => {
    console.log('🚀 Avvio caricamento iniziale notifiche')
    fetchNotifications(true)
  }, [fetchNotifications])

  // Funzione per inizializzare il socket
  const initializeSocket = useCallback(() => {
    if (retryCount >= MAX_RETRIES) {
      console.log('❌ Numero massimo di tentativi raggiunto')
      return
    }

    console.log(`🔄 Tentativo di connessione socket #${retryCount + 1}`)
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const socketUrl = protocol + '//' + host

    console.log('🔌 Connessione socket a:', socketUrl)
    
    try {
      const socketInstance = io(socketUrl, {
        path: '/api/socket',
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: RETRY_DELAY,
        reconnectionAttempts: MAX_RETRIES,
        withCredentials: true,
        transports: ['websocket', 'polling'],
        forceNew: true,
        timeout: 10000
      })

      socketInstance.on('connect', () => {
        console.log('✅ Connesso al server WebSocket')
        setState(prev => ({ ...prev, connected: true, error: null }))
        setRetryCount(0) // Reset retry count on successful connection
      })

      socketInstance.on('connect_error', (error) => {
        console.error('❌ Errore di connessione socket:', error)
        setState(prev => ({ 
          ...prev, 
          connected: false,
          error: 'Errore di connessione al server delle notifiche'
        }))
        
        setRetryCount(prev => prev + 1)
        socketInstance.close()
      })

      socketInstance.on('notification', (notification: Notification) => {
        console.log('📨 Nuova notifica ricevuta:', notification)
        setState(prev => ({
          ...prev,
          notifications: [notification, ...prev.notifications],
          unreadCount: prev.unreadCount + 1
        }))
      })

      socketInstance.on('disconnect', () => {
        console.log('❌ Disconnesso dal server WebSocket')
        setState(prev => ({ ...prev, connected: false }))
      })

      socketInstance.on('error', (error: Error) => {
        console.error('❌ Errore socket:', error)
        setState(prev => ({ 
          ...prev, 
          connected: false,
          error: 'Errore nella connessione socket'
        }))
      })

      setSocket(socketInstance)

      return () => {
        console.log('🔌 Disconnessione socket')
        socketInstance.disconnect()
      }
    } catch (error) {
      console.error('❌ Errore nella creazione del socket:', error)
      setState(prev => ({ 
        ...prev, 
        connected: false,
        error: 'Errore nella creazione della connessione socket'
      }))
      setRetryCount(prev => prev + 1)
      return undefined
    }
  }, [retryCount])

  // Inizializza Socket.IO e imposta il refresh periodico
  useEffect(() => {
    console.log('🔌 Inizializzazione socket e refresh periodico')
    const cleanup = initializeSocket()
    
    // Imposta il refresh periodico
    refreshInterval.current = setInterval(() => {
      console.log('⏰ Refresh periodico notifiche')
      fetchNotifications(false)
    }, REFRESH_INTERVAL)

    return () => {
      cleanup?.()
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current)
      }
    }
  }, [initializeSocket, fetchNotifications])

  // Segna una notifica come letta
  const markAsRead = async (id: number) => {
    try {
      console.log('📝 Segnando notifica come letta:', id)
      const response = await fetch(`/api/notifications/${id}/read`, { 
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Errore nel segnare la notifica come letta')
      }

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }))
      console.log('✅ Notifica segnata come letta')
    } catch (error) {
      console.error('❌ Errore nel segnare la notifica come letta:', error)
    }
  }

  // Forza il refresh delle notifiche
  const refreshNotifications = () => {
    console.log('🔄 Forzando refresh notifiche')
    fetchNotifications(false)
  }

  return {
    ...state,
    markAsRead,
    refreshNotifications
  }
} 