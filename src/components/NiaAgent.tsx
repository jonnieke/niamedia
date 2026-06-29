import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Mic, MicOff, Volume2, VolumeX, Send, ArrowRight, Loader2, Sparkles, MessageSquare } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleGenAI, Modality } from '@google/genai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

/* --- Types --------------------------------------------------- */
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface SuggestedAction {
  type: 'ready'
  service: 'campaign-copy' | 'video' | 'audio'
  brief: {
    business: string
    product: string
    audience: string
    goal: string
    platforms: string[]
    tone: string
  }
}

type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking'

const GUEST_LIMIT = 30
const OPENING_LINE = "Hey! I'm Nia, your AI marketing advisor. Tell me — what kind of business are you running?"

/* --- Waveform animation (CSS injected once) ------------------- */
const WAVE_STYLE = `
@keyframes niaBeat {
  0%, 100% { transform: scaleY(0.15); }
  50% { transform: scaleY(1); }
}
@keyframes niaFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes niaRing {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes niaDot {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
`

/* --- Sub-components ------------------------------------------- */
function Waveform({ active }: { active: boolean }) {
  const bars = [0.4, 0.7, 1, 0.8, 0.6, 0.9, 0.5, 0.75, 0.45, 0.85, 0.6, 0.7, 0.4]
  return (
    <div className="flex items-center gap-0.5" style={{ height: 28 }}>
      {bars.map((maxH, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 28,
            borderRadius: 9999,
            background: 'linear-gradient(180deg, #a78bfa, #60a5fa)',
            transformOrigin: 'center',
            transform: active ? undefined : 'scaleY(0.15)',
            animation: active
              ? `niaBeat ${0.6 + Math.random() * 0.4}s ease-in-out ${i * 0.07}s infinite`
              : 'none',
            opacity: active ? 1 : 0.3,
            transition: 'opacity 0.3s',
          }}
        />
      ))}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-purple-400"
          style={{ animation: `niaDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

function Avatar({ state }: { state: AgentState }) {
  const speaking = state === 'speaking'
  const listening = state === 'listening'
  const thinking = state === 'thinking'

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      {/* Outer pulse ring */}
      {(speaking || listening) && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: speaking
              ? 'rgba(139,92,246,0.4)'
              : 'rgba(239,68,68,0.4)',
            animation: 'niaRing 1.2s ease-out infinite',
          }}
        />
      )}
      {/* Second ring with delay */}
      {(speaking || listening) && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: speaking
              ? 'rgba(139,92,246,0.25)'
              : 'rgba(239,68,68,0.25)',
            animation: 'niaRing 1.2s ease-out 0.4s infinite',
          }}
        />
      )}

      {/* Avatar circle */}
      <div
        className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-xl"
        style={{
          background: listening
            ? 'linear-gradient(135deg, #ef4444, #f97316)'
            : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          boxShadow: speaking
            ? '0 0 30px rgba(139,92,246,0.6)'
            : listening
            ? '0 0 30px rgba(239,68,68,0.6)'
            : '0 0 16px rgba(139,92,246,0.3)',
          animation: thinking ? 'niaFloat 1.5s ease-in-out infinite' : 'none',
          transition: 'background 0.4s, box-shadow 0.4s',
        }}
      >
        {thinking ? <Loader2 size={22} className="animate-spin" /> : 'N'}
      </div>
    </div>
  )
}

/* --- Main component ------------------------------------------- */
interface NiaAgentProps {
  onClose: () => void
}

export default function NiaAgent({ onClose }: NiaAgentProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isGuest = !user

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: OPENING_LINE },
  ])
  const [input, setInput] = useState('')
  const [agentState, setAgentState] = useState<AgentState>('idle')
  const [voiceMode, setVoiceMode] = useState(true)
  const [interimText, setInterimText] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [guestTimeLeft, setGuestTimeLeft] = useState(GUEST_LIMIT)
  const [guestStarted, setGuestStarted] = useState(false)
  const [guestExpired, setGuestExpired] = useState(false)
  const [suggestedAction, setSuggestedAction] = useState<SuggestedAction | null>(null)
  const [brandContext, setBrandContext] = useState<{ businessName?: string; industry?: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingFinalTranscriptRef = useRef('')
  const latestMessagesRef = useRef<Message[]>(messages)
  const voiceModeRef = useRef(voiceMode)
  const speechSupportedRef = useRef(speechSupported)
  const guestExpiredRef = useRef(guestExpired)
  const liveSessionRef = useRef<any>(null)
  const liveConnectingRef = useRef(false)
  const liveConnectPromiseRef = useRef<Promise<boolean> | null>(null)
  const liveDraftIdRef = useRef<string | null>(null)
  const liveDraftTextRef = useRef('')
  const liveFinalizedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById('nia-styles')) return
    const el = document.createElement('style')
    el.id = 'nia-styles'
    el.textContent = WAVE_STYLE
    document.head.appendChild(el)
  }, [])

  // Check speech API support
  useEffect(() => {
    setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  // Load brand context + previous conversation for logged-in users
  useEffect(() => {
    if (!user) return

    // Brand kit
    supabase
      .from('brand_kits')
      .select('business_name, industry')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.business_name) setBrandContext({ businessName: data.business_name, industry: data.industry ?? undefined })
      })

    // Previous session
    supabase
      .from('conversation_sessions')
      .select('messages')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.messages && Array.isArray(data.messages) && data.messages.length > 2) {
          // Restore previous messages but add a "welcome back" note
          const prev = data.messages as Message[]
          const welcomeBack: Message = {
            id: 'wb',
            role: 'assistant',
            content: `Welcome back! I remember we were chatting about ${brandContext?.businessName ?? 'your business'}. Want to pick up where we left off, or start fresh?`,
          }
          setMessages([welcomeBack, ...prev.slice(-6)]) // last 6 messages + welcome
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interimText, agentState])

  useEffect(() => {
    latestMessagesRef.current = messages
  }, [messages])

  useEffect(() => {
    voiceModeRef.current = voiceMode
  }, [voiceMode])

  useEffect(() => {
    speechSupportedRef.current = speechSupported
  }, [speechSupported])

  useEffect(() => {
    guestExpiredRef.current = guestExpired
  }, [guestExpired])

  // Guest countdown
  useEffect(() => {
    if (!isGuest || !guestStarted || guestExpired) return
    timerRef.current = setInterval(() => {
      setGuestTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setGuestExpired(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isGuest, guestStarted, guestExpired])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      audioRef.current?.pause()
      closeGeminiLive()
      if (timerRef.current) clearInterval(timerRef.current)
      if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
    }
  }, [])

  /* -- Audio playback -- */
  const playAudio = useCallback(async (base64: string) => {
    setAgentState('speaking')
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
    try {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setAgentState('idle')
        URL.revokeObjectURL(url)
        if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
        if (voiceModeRef.current && speechSupportedRef.current && !guestExpiredRef.current) {
          listeningTimerRef.current = setTimeout(() => {
            try {
              recognitionRef.current?.start()
              setAgentState('listening')
            } catch {
              setAgentState('idle')
            }
          }, 450)
        }
      }
      audio.onerror = () => {
        setAgentState('idle')
        URL.revokeObjectURL(url)
      }
      await audio.play()
    } catch {
      setAgentState('idle')
    }
  }, [])

  const persistConversation = useCallback((updatedMessages: Message[]) => {
    if (!user) return
    supabase.from('conversation_sessions').upsert(
      { user_id: user.id, messages: updatedMessages, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ).then(() => {/* silent */})
  }, [user])

  const speakReply = useCallback(async (reply: string) => {
    if (!voiceMode || !speechSupported) {
      setAgentState('idle')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY as string
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ voiceId: 'sw-f', text: reply }),
      })
      const data = await res.json() as { audio?: string; error?: string }
      if (data.audio) {
        await playAudio(data.audio)
        return
      }
    } catch {
      // Fall back to text-only idle state.
    }

    setAgentState('idle')
  }, [playAudio, speechSupported, voiceMode])

  const finalizeGeminiReply = useCallback(async (rawReply: string) => {
    if (liveFinalizedRef.current) return
    liveFinalizedRef.current = true

    const actionMatch = rawReply.match(/\[NIA_ACTION:(.+?)\]/)
    let suggestedAction: unknown = null
    if (actionMatch) {
      try { suggestedAction = JSON.parse(actionMatch[1]) } catch { /* ignore */ }
    }
    const reply = rawReply.replace(/\[NIA_ACTION:.+?\]/, '').trim()

    const assistantMsg: Message = {
      id: liveDraftIdRef.current ?? String(Date.now() + 1),
      role: 'assistant',
      content: reply,
    }

    setMessages(prev => {
      const draftId = liveDraftIdRef.current
      const next = draftId
        ? prev.map(m => m.id === draftId ? assistantMsg : m)
        : [...prev, assistantMsg]
      if (draftId && !prev.some(m => m.id === draftId)) next.push(assistantMsg)
      return next
    })

    if (suggestedAction) setSuggestedAction(suggestedAction as SuggestedAction)

    const snapshot = [...latestMessagesRef.current]
    const draftId = liveDraftIdRef.current
    const hasDraft = draftId ? snapshot.some(m => m.id === draftId) : false
    const nextMessages = hasDraft
      ? snapshot.map(m => m.id === draftId ? assistantMsg : m)
      : [...snapshot, assistantMsg]
    persistConversation(nextMessages)

    liveDraftIdRef.current = null
    liveDraftTextRef.current = ''

    if (reply) {
      await speakReply(reply)
    } else {
      setAgentState('idle')
    }
  }, [persistConversation, speakReply])

  const closeGeminiLive = useCallback(() => {
    try {
      liveSessionRef.current?.close?.()
    } catch {
      // ignore
    }
    liveSessionRef.current = null
    liveConnectingRef.current = false
    liveConnectPromiseRef.current = null
    liveDraftIdRef.current = null
    liveDraftTextRef.current = ''
    liveFinalizedRef.current = false
  }, [])

  const ensureGeminiLive = useCallback(async () => {
    if (liveSessionRef.current) return true
    if (liveConnectingRef.current && liveConnectPromiseRef.current) {
      return liveConnectPromiseRef.current
    }

    liveConnectingRef.current = true
    liveFinalizedRef.current = false
    liveDraftIdRef.current = null
    liveDraftTextRef.current = ''

    const connectPromise = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY as string
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-live-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ userContext: brandContext ?? undefined }),
        })

        const tokenData = await res.json() as { token?: string; model?: string; error?: string }
        if (!res.ok || !tokenData.token) {
          throw new Error(tokenData.error || 'Gemini Live token failed')
        }

        const ai = new GoogleGenAI({ apiKey: tokenData.token, httpOptions: { apiVersion: 'v1alpha' } })
        const liveSession = await ai.live.connect({
          model: tokenData.model ?? 'gemini-live-2.5-flash-preview',
          config: {
            responseModalities: [Modality.TEXT],
          },
          callbacks: {
            onopen: () => {
              setAgentState('idle')
            },
            onmessage: (event) => {
              const serverContent = event.serverContent
              if (!serverContent) return

              if (serverContent.interrupted) {
                setAgentState('thinking')
                return
              }

              const chunk = (serverContent.modelTurn?.parts ?? [])
                .map(part => part.text ?? '')
                .join('')

              if (chunk) {
                liveDraftTextRef.current += chunk
                setAgentState('thinking')
                const draftId = liveDraftIdRef.current ?? `gemini-${Date.now()}`
                liveDraftIdRef.current = draftId
                setMessages(prev => {
                  const nextDraft = { id: draftId, role: 'assistant' as const, content: liveDraftTextRef.current }
                  const idx = prev.findIndex(m => m.id === draftId)
                  if (idx >= 0) {
                    const next = [...prev]
                    next[idx] = nextDraft
                    return next
                  }
                  return [...prev, nextDraft]
                })
              }

              if ((serverContent.turnComplete || serverContent.generationComplete || serverContent.waitingForInput) && liveDraftTextRef.current.trim()) {
                void finalizeGeminiReply(liveDraftTextRef.current)
              }
            },
            onerror: () => {
              closeGeminiLive()
            },
            onclose: () => {
              closeGeminiLive()
            },
          },
        })

        liveSessionRef.current = liveSession
        return true
      } catch {
        closeGeminiLive()
        return false
      } finally {
        liveConnectingRef.current = false
      }
    })()

    liveConnectPromiseRef.current = connectPromise
    return connectPromise
  }, [brandContext, closeGeminiLive, finalizeGeminiReply])

  const sendGeminiLiveMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return false

    const ready = await ensureGeminiLive()
    if (!ready || !liveSessionRef.current) return false

    liveFinalizedRef.current = false
    liveDraftIdRef.current = `gemini-${Date.now()}`
    liveDraftTextRef.current = ''
    setAgentState('thinking')

    try {
      liveSessionRef.current.sendClientContent({ turns: trimmed, turnComplete: true })
      return true
    } catch {
      closeGeminiLive()
      return false
    }
  }, [closeGeminiLive, ensureGeminiLive])
  /* -- Send message to agent -- */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || agentState === 'thinking' || agentState === 'speaking' || guestExpired) return

    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
    pendingFinalTranscriptRef.current = ''
    recognitionRef.current?.stop()

    const userMsg: Message = { id: String(Date.now()), role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setInterimText('')
    setAgentState('thinking')

    if (isGuest && !guestStarted) setGuestStarted(true)

    if (voiceMode && speechSupported) {
      const sent = await sendGeminiLiveMessage(trimmed)
      if (sent) return
    }

    try {
      const history = [...latestMessagesRef.current, userMsg].map(m => ({ role: m.role, content: m.content }))
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY as string

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: history,
          voiceEnabled: voiceMode && speechSupported,
          userContext: brandContext ?? undefined,
        }),
      })

      const data = await res.json() as { reply: string; audio?: string; suggestedAction?: SuggestedAction }
      const agentMsg: Message = { id: String(Date.now() + 1), role: 'assistant', content: data.reply }
      setMessages(prev => [...prev, agentMsg])

      if (data.suggestedAction) setSuggestedAction(data.suggestedAction)

      // Persist conversation for logged-in users
      if (user) {
        const allMsgs = [...messages, userMsg, agentMsg]
        supabase.from('conversation_sessions').upsert(
          { user_id: user.id, messages: allMsgs, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        ).then(() => {/* silent */})
      }

      if (data.audio && voiceMode) {
        await playAudio(data.audio)
      } else {
        setAgentState('idle')
      }
    } catch {
      setMessages(prev => [...prev, {
        id: String(Date.now() + 2),
        role: 'assistant',
        content: 'Sorry, I had a connection issue. Please try again.',
      }])
      setAgentState('idle')
    }
  }, [messages, agentState, guestExpired, isGuest, guestStarted, voiceMode, speechSupported, brandContext, playAudio])

  /* -- Voice recognition -- */
  const scheduleFinalSend = useCallback((finalText: string) => {
    pendingFinalTranscriptRef.current = finalText
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
    listeningTimerRef.current = setTimeout(() => {
      const readyText = pendingFinalTranscriptRef.current.trim()
      pendingFinalTranscriptRef.current = ''
      if (readyText) void sendMessage(readyText)
    }, 650)
  }, [sendMessage])

  const startListening = useCallback(() => {
    if (guestExpired) return
    if (agentState === 'thinking') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const result of Array.from(event.results) as any[]) {
        if (result.isFinal) final += result[0].transcript
        else interim += result[0].transcript
      }
      setInterimText(interim || final)
      if (final.trim()) {
        scheduleFinalSend(final.trim())
      }
    }

    recognition.onend = () => {
      if (pendingFinalTranscriptRef.current.trim()) {
        scheduleFinalSend(pendingFinalTranscriptRef.current)
      }
      setAgentState(prev => prev === 'listening' ? 'idle' : prev)
    }

    recognition.onerror = () => {
      setAgentState('idle')
      setInterimText('')
      pendingFinalTranscriptRef.current = ''
    }

    recognitionRef.current = recognition
    recognition.start()
    setAgentState('listening')
  }, [agentState, guestExpired, scheduleFinalSend])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setAgentState('idle')
    setInterimText('')
    pendingFinalTranscriptRef.current = ''
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
  }, [])

  const handleMicClick = () => {
    if (agentState === 'speaking') {
      stopSpeaking()
      startListening()
      return
    }
    if (agentState === 'listening') stopListening()
    else startListening()
  }

  const handleSend = () => {
    if (input.trim()) sendMessage(input)
  }

  const stopSpeaking = () => {
    audioRef.current?.pause()
    setAgentState('idle')
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
    if (voiceMode && speechSupported && !guestExpired) {
      listeningTimerRef.current = setTimeout(() => {
        try {
          recognitionRef.current?.start()
          setAgentState('listening')
        } catch {
          setAgentState('idle')
        }
      }, 250)
    }
  }

  const buildCampaignUrl = (action: SuggestedAction) => {
    const params = new URLSearchParams({
      business_name: action.brief.business || '',
      product_name: action.brief.product || '',
      target_audience: action.brief.audience || '',
      objective: action.brief.goal || '',
      tone: action.brief.tone || 'professional',
    })
    return `/new-campaign?${params.toString()}`
  }

  const timerPct = (guestTimeLeft / GUEST_LIMIT) * 100
  const timerColor = timerPct > 60 ? '#10b981' : timerPct > 30 ? '#f59e0b' : '#ef4444'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: '#0d0d1e',
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 0 80px rgba(139,92,246,0.2), 0 40px 120px rgba(0,0,0,0.8)',
          maxHeight: '90dvh',
        }}
      >
        {/* Guest timer bar */}
        {isGuest && (
          <div className="h-0.5 w-full transition-all duration-1000"
            style={{
              background: guestStarted
                ? `linear-gradient(90deg, ${timerColor} ${timerPct}%, rgba(255,255,255,0.05) ${timerPct}%)`
                : 'rgba(255,255,255,0.05)',
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <Avatar state={agentState} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-sm">Nia</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                AI Advisor
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {agentState === 'thinking' && <p className="text-xs text-gray-500">Thinking...</p>}
              {agentState === 'listening' && <p className="text-xs text-red-400">Listening...</p>}
              {agentState === 'speaking' && (
                <div className="flex items-center gap-1.5">
                  <Waveform active />
                </div>
              )}
              {agentState === 'idle' && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'niaBeat 2s ease-in-out infinite' }} />
                  <p className="text-xs text-gray-500">Kenya market expert</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Voice toggle */}
            {speechSupported && (
              <button
                onClick={() => setVoiceMode(v => !v)}
                className="p-2 rounded-xl transition-all hover:bg-gray-50"
                title={voiceMode ? 'Voice on' : 'Voice off'}
              >
                {voiceMode
                  ? <Volume2 size={16} className="text-purple-400" />
                  : <VolumeX size={16} className="text-gray-600" />}
              </button>
            )}
            {/* Stop speaking */}
            {agentState === 'speaking' && (
              <button onClick={stopSpeaking} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-50 transition-all">
                <MicOff size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-50 transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Guest timer text */}
        {isGuest && guestStarted && !guestExpired && (
          <div className="px-5 py-2 border-b border-white/4 flex items-center justify-between shrink-0"
            style={{ background: 'rgba(0,0,0,0.2)' }}>
            <p className="text-[11px] text-gray-500">Free preview</p>
            <p className="text-[11px] font-semibold" style={{ color: timerColor }}>
              {guestTimeLeft}s remaining
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', borderBottomRightRadius: 4 }
                  : { background: 'rgba(255,255,255,0.05)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.07)', borderBottomLeftRadius: 4 }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Interim speech text */}
          {interimText && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed opacity-60"
                style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px dashed rgba(139,92,246,0.4)', borderBottomRightRadius: 4 }}>
                {interimText}...
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {agentState === 'thinking' && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/7 bg-gray-50" style={{ borderBottomLeftRadius: 4 }}>
                <TypingDots />
              </div>
            </div>
          )}

          {/* Suggested action card */}
          {suggestedAction && (
            <div className="rounded-2xl border border-purple-500/30 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.07))' }}>
              <div className="px-4 py-3 border-b border-purple-500/15 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                <p className="text-xs font-bold text-gray-900">Ready to create your campaign!</p>
              </div>
              <div className="px-4 py-3 space-y-1">
                {suggestedAction.brief.business && (
                  <p className="text-xs text-gray-500"><span className="text-gray-500">Business:</span> {suggestedAction.brief.business}</p>
                )}
                {suggestedAction.brief.goal && (
                  <p className="text-xs text-gray-500"><span className="text-gray-500">Goal:</span> {suggestedAction.brief.goal}</p>
                )}
                {suggestedAction.brief.platforms?.length > 0 && (
                  <p className="text-xs text-gray-500"><span className="text-gray-500">Platforms:</span> {suggestedAction.brief.platforms.join(', ')}</p>
                )}
              </div>
              <div className="px-4 pb-4 flex gap-2">
                {isGuest ? (
                  <Link to="/register"
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-gray-900"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                    Sign Up Free to Generate <ArrowRight size={12} />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => { onClose(); navigate(buildCampaignUrl(suggestedAction)) }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-gray-900"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                      Generate Campaign <ArrowRight size={12} />
                    </button>
                    <button
                      onClick={() => { onClose(); navigate('/audio-studio') }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:border-purple-500/30 transition-all">
                      Audio
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Guest expired overlay */}
          {guestExpired && (
            <div className="rounded-2xl border border-amber-500/25 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05))' }}>
              <div className="p-5 text-center">
                <p className="text-sm font-bold text-gray-900 mb-1">Your 30-second preview is up</p>
                <p className="text-xs text-gray-500 mb-4">
                  Sign up free to continue chatting with Nia — no credit card, no commitment.
                  Your conversation so far is saved.
                </p>
                <Link to="/register" onClick={onClose}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-gray-900"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                  Sign Up Free <ArrowRight size={14} />
                </Link>
                <p className="text-[11px] text-gray-600 mt-3">Already have an account? <Link to="/login" onClick={onClose} className="text-purple-400 hover:underline">Log in</Link></p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 pb-4 pt-2 border-t border-gray-200">
          {/* Mic button when voice mode on + supported */}
          {speechSupported && voiceMode && !guestExpired && (
            <div className="flex justify-center mb-3">
              <button
                onClick={handleMicClick}
                disabled={agentState === 'thinking'}
                className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                style={{
                  background: agentState === 'listening'
                    ? 'linear-gradient(135deg, #ef4444, #f97316)'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
                  border: `2px solid ${agentState === 'listening' ? 'rgba(239,68,68,0.6)' : 'rgba(139,92,246,0.4)'}`,
                  boxShadow: agentState === 'listening' ? '0 0 24px rgba(239,68,68,0.5)' : '0 0 16px rgba(139,92,246,0.3)',
                }}
              >
                {agentState === 'listening'
                  ? <MicOff size={22} className="text-white" />
                  : <Mic size={22} className="text-purple-300" />}
              </button>
            </div>
          )}

          {/* Text input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={
                guestExpired ? 'Sign up to continue...'
                : agentState === 'listening' ? 'Listening...'
                : agentState === 'thinking' ? 'Nia is thinking...'
                : agentState === 'speaking' ? 'Nia is speaking...'
                : speechSupported && voiceMode ? 'Or type here...'
                : 'Type your message...'
              }
              disabled={guestExpired || agentState === 'listening' || agentState === 'thinking'}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500/40 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || guestExpired || agentState === 'thinking' || agentState === 'listening'}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>

          {/* Bottom hint */}
          <p className="text-center text-[10px] text-gray-700 mt-2">
            {isGuest && !guestStarted
              ? 'Free 30-second preview · No sign up required'
              : isGuest && !guestExpired
              ? `${guestTimeLeft}s of free conversation remaining`
              : !isGuest
              ? 'Your conversations are private and remembered'
              : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

/* --- Floating trigger button (export separately for use in pages) -- */
export function NiaAgentButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {open && <NiaAgent onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-2xl text-sm font-bold text-gray-900 shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          boxShadow: '0 0 32px rgba(139,92,246,0.45), 0 8px 24px rgba(0,0,0,0.4)',
        }}
        aria-label="Talk to Nia"
      >
        <div className="relative">
          <MessageSquare size={17} />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400"
            style={{ animation: 'niaBeat 2s ease-in-out infinite' }} />
        </div>
        Talk to Nia
      </button>
    </>
  )
}



