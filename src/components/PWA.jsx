import { useState, useEffect } from 'react'

const C = {
  navy: '#0C1B33', teal: '#0A8F7F', tealLight: '#12C4AD',
  cream: '#FAFAF7', warm: '#F5F3EE', border: '#E0DDD5',
  text: '#1A1A18', light: '#8A8A82', white: '#FFF', error: '#D35E5E',
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function PWANotificationToggle({ businessId }) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    const ok = typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'PushManager' in window
    setSupported(ok)
    if (ok) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {
      // SW not active yet
    }
  }

  async function handleEnable() {
    setLoading(true)
    setError(null)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setError('Notification permission denied. Enable it in your browser settings.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, businessId }),
      })
      setSubscribed(true)
    } catch (e) {
      setError('Failed to enable notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      setSubscribed(false)
    } catch {
      setError('Failed to disable notifications.')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <div style={{
      borderTop: `2px solid ${C.border}`, paddingTop: 28, marginTop: 4,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div>
        <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: C.navy, marginBottom: 4, fontWeight: 400 }}>
          Push Notifications
        </h3>
        <p style={{ fontSize: 13, color: C.light, lineHeight: 1.6 }}>
          Get notified when customers send messages or posts are published
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: subscribed ? '#2ECC71' : C.light,
          boxShadow: subscribed ? '0 0 0 3px rgba(46,204,113,0.2)' : 'none',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: subscribed ? '#2ECC71' : C.light }}>
          {subscribed ? 'Notifications enabled' : 'Notifications disabled'}
        </span>

        <button
          onClick={subscribed ? handleDisable : handleEnable}
          disabled={loading || permission === 'denied'}
          style={{
            marginLeft: 'auto',
            background: subscribed ? 'rgba(211,94,94,0.06)' : 'rgba(10,143,127,0.08)',
            border: `1px solid ${subscribed ? 'rgba(211,94,94,0.2)' : 'rgba(10,143,127,0.2)'}`,
            borderRadius: 10, padding: '9px 20px',
            color: subscribed ? C.error : C.teal,
            fontSize: 13, fontWeight: 700,
            cursor: (loading || permission === 'denied') ? 'not-allowed' : 'pointer',
            fontFamily: "'Syne', -apple-system, sans-serif",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : subscribed ? 'Disable' : 'Enable Notifications'}
        </button>
      </div>

      {permission === 'denied' && (
        <div style={{ fontSize: 12, color: C.error, background: 'rgba(211,94,94,0.06)', border: '1px solid rgba(211,94,94,0.15)', borderRadius: 8, padding: '8px 14px' }}>
          Notifications are blocked. Allow them in your browser settings, then refresh.
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: C.error }}>{error}</div>
      )}
    </div>
  )
}
