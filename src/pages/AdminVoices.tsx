import { useState, useEffect, useRef } from 'react'
import { Upload, Mic2, Trash2, Loader2, CheckCircle, XCircle, AlertCircle, Play, Pause, ChevronLeft, Volume2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface VoiceProfile {
  slot_id: string
  label: string
  age_group: string
  gender: string
  status: 'pending' | 'cloning' | 'ready' | 'failed'
  elevenlabs_voice_id: string | null
  sample_count: number
}

interface VoiceSample {
  id: string
  slot_id: string
  storage_path: string
  file_name: string
}

const AGE_GROUPS = ['Kids', 'Teens', 'Young Adult', 'Mature', 'Elder']

const STATUS_CONFIG = {
  pending: { label: 'No Clone', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: AlertCircle },
  cloning: { label: 'Cloningâ€¦', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Loader2 },
  ready:   { label: 'Live Clone', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
  failed:  { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
}

export default function AdminVoices() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<VoiceProfile[]>([])
  const [samples, setSamples] = useState<Record<string, VoiceSample[]>>({})
  const [loading, setLoading] = useState(true)
  const [cloning, setCloning] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { void load() }, [])

  const load = async () => {
    setLoading(true)
    const { data: profileData } = await supabase
      .from('voice_profiles')
      .select('slot_id, label, age_group, gender, status, elevenlabs_voice_id, sample_count')
      .order('age_group')

    const { data: sampleData } = await supabase
      .from('voice_samples')
      .select('id, slot_id, storage_path, file_name')

    if (profileData) setProfiles(profileData)
    if (sampleData) {
      const grouped: Record<string, VoiceSample[]> = {}
      for (const s of sampleData) {
        if (!grouped[s.slot_id]) grouped[s.slot_id] = []
        grouped[s.slot_id].push(s)
      }
      setSamples(grouped)
    }
    setLoading(false)
  }

  const uploadSamples = async (slotId: string, files: FileList) => {
    setUploading(u => ({ ...u, [slotId]: true }))
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() ?? 'mp3'
      const path = `${slotId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('voice-samples').upload(path, file, { contentType: file.type })
      if (error) { console.error('Upload failed:', error.message); continue }
      await supabase.from('voice_samples').insert({ slot_id: slotId, storage_path: path, file_name: file.name })
      await supabase.from('voice_profiles').update({ sample_count: (samples[slotId]?.length ?? 0) + 1 }).eq('slot_id', slotId)
    }
    await load()
    setUploading(u => ({ ...u, [slotId]: false }))
  }

  const deleteSample = async (sample: VoiceSample) => {
    await supabase.storage.from('voice-samples').remove([sample.storage_path])
    await supabase.from('voice_samples').delete().eq('id', sample.id)
    const newCount = Math.max(0, (samples[sample.slot_id]?.length ?? 1) - 1)
    await supabase.from('voice_profiles').update({ sample_count: newCount }).eq('slot_id', sample.slot_id)
    await load()
  }

  const cloneVoice = async (slotId: string) => {
    setCloning(c => ({ ...c, [slotId]: true }))
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY as string
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clone-voice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ slotId }),
        }
      )
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Clone failed')
    } catch (err) {
      console.error('Clone error:', err)
    }
    await load()
    setCloning(c => ({ ...c, [slotId]: false }))
  }

  const deleteClone = async (profile: VoiceProfile) => {
    setDeleting(d => ({ ...d, [profile.slot_id]: true }))
    await supabase.from('voice_profiles')
      .update({ status: 'pending', elevenlabs_voice_id: null, updated_at: new Date().toISOString() })
      .eq('slot_id', profile.slot_id)
    await load()
    setDeleting(d => ({ ...d, [profile.slot_id]: false }))
  }

  const playPreview = async (slotId: string) => {
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null }
    if (previewPlaying === slotId) { setPreviewPlaying(null); return }
    setPreviewLoading(slotId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY as string
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ voiceId: slotId }),
        }
      )
      if (!res.ok) throw new Error(`${res.status}`)
      const { audio } = await res.json() as { audio: string }
      const binary = atob(audio)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audioEl = new Audio(url)
      previewAudioRef.current = audioEl
      audioEl.onended = () => { setPreviewPlaying(null); URL.revokeObjectURL(url) }
      void audioEl.play()
      setPreviewPlaying(slotId)
    } catch (err) { console.error('Preview error:', err) }
    finally { setPreviewLoading(null) }
  }

  const slotSamples = (slotId: string) => samples[slotId] ?? []

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="animate-spin text-purple-400" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-600 mb-4 transition-colors w-fit">
            <ChevronLeft size={13} /> Back to Admin
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.2)' }}>
              <Mic2 size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voice Clone Studio</h1>
              <p className="text-xs text-gray-500">Upload African voice samples â†’ clone â†’ deploy to Audio Studio</p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/8 text-xs text-blue-300 space-y-1">
            <p className="font-semibold text-blue-200">How it works</p>
            <p>1. Upload 1â€“5 high-quality audio samples per voice (MP3/WAV, 30sâ€“3 min each, clear speech, no background noise).</p>
            <p>2. Click <strong>Clone Voice</strong> â€” ElevenLabs creates a voice model from your samples (takes ~30 seconds).</p>
            <p>3. Once <span className="text-green-400 font-semibold">Live Clone</span> appears, all Audio Studio orders and previews use your authentic African voice automatically.</p>
          </div>
        </div>

        {/* Voice groups */}
        {AGE_GROUPS.map(group => {
          const groupProfiles = profiles.filter(p => p.age_group === group)
          if (!groupProfiles.length) return null
          return (
            <div key={group} className="mb-10">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{group}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupProfiles.map(profile => {
                  const statusCfg = STATUS_CONFIG[profile.status]
                  const StatusIcon = statusCfg.icon
                  const slotSampleList = slotSamples(profile.slot_id)
                  const canClone = slotSampleList.length > 0 && !cloning[profile.slot_id]
                  const isCloning = cloning[profile.slot_id] || profile.status === 'cloning'

                  return (
                    <div key={profile.slot_id}
                      className="rounded-2xl border border-gray-200 bg-white/2 overflow-hidden">
                      {/* Card header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{profile.label}</p>
                          <p className="text-[10px] text-gray-600">{profile.gender === 'F' ? 'Female' : 'Male'} Â· {group}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Preview button */}
                          <button onClick={() => void playPreview(profile.slot_id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/6 text-gray-500 hover:bg-white/12 hover:text-white transition-all"
                            title="Preview voice">
                            {previewLoading === profile.slot_id
                              ? <Loader2 size={12} className="animate-spin" />
                              : previewPlaying === profile.slot_id
                                ? <Pause size={12} />
                                : <Volume2 size={12} />}
                          </button>
                          {/* Status badge */}
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${statusCfg.color} ${statusCfg.bg}`}>
                            <StatusIcon size={10} className={isCloning ? 'animate-spin' : ''} />
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Samples */}
                      <div className="px-4 py-3">
                        {slotSampleList.length === 0 ? (
                          <p className="text-[11px] text-gray-600 mb-3">No samples uploaded yet. Add at least 1 to enable cloning.</p>
                        ) : (
                          <div className="space-y-1.5 mb-3">
                            {slotSampleList.map(sample => (
                              <div key={sample.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Mic2 size={11} className="text-purple-400 shrink-0" />
                                  <span className="text-[11px] text-gray-600 truncate">{sample.file_name}</span>
                                </div>
                                <button onClick={() => void deleteSample(sample)}
                                  className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                                  title="Remove sample">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {/* Upload */}
                          <input
                            ref={el => { fileInputRefs.current[profile.slot_id] = el }}
                            type="file"
                            accept="audio/*"
                            multiple
                            className="hidden"
                            onChange={e => e.target.files && void uploadSamples(profile.slot_id, e.target.files)}
                          />
                          <button
                            onClick={() => fileInputRefs.current[profile.slot_id]?.click()}
                            disabled={uploading[profile.slot_id]}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-600 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50">
                            {uploading[profile.slot_id]
                              ? <><Loader2 size={11} className="animate-spin" /> Uploadingâ€¦</>
                              : <><Upload size={11} /> Add Samples</>}
                          </button>

                          {/* Clone */}
                          {profile.status !== 'ready' ? (
                            <button
                              onClick={() => void cloneVoice(profile.slot_id)}
                              disabled={!canClone || isCloning}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-800 transition-all disabled:opacity-40"
                              style={{ background: canClone && !isCloning ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(139,92,246,0.2)' }}>
                              {isCloning
                                ? <><Loader2 size={11} className="animate-spin" /> Cloningâ€¦</>
                                : <><Mic2 size={11} /> Clone Voice</>}
                            </button>
                          ) : (
                            <button
                              onClick={() => void deleteClone(profile)}
                              disabled={deleting[profile.slot_id]}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-400 border border-red-500/20 bg-red-500/6 hover:bg-red-500/12 transition-all disabled:opacity-50">
                              {deleting[profile.slot_id]
                                ? <><Loader2 size={11} className="animate-spin" /> Removingâ€¦</>
                                : <><Trash2 size={11} /> Remove Clone</>}
                            </button>
                          )}
                        </div>

                        {profile.status === 'ready' && profile.elevenlabs_voice_id && (
                          <p className="text-[10px] text-gray-600 mt-2 font-mono">ID: {profile.elevenlabs_voice_id}</p>
                        )}
                        {profile.status === 'failed' && (
                          <p className="text-[10px] text-red-400 mt-2">Clone failed â€” check samples quality and try again.</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </DashboardLayout>
  )
}

