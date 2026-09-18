import { useEffect } from 'react'
import { X, ExternalLink, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title: string
  clientName: string
  deliverableTag?: string
  aspectRatio?: '9:16' | '16:9'
}

export default function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  title,
  clientName,
  deliverableTag = 'Commercial Video',
  aspectRatio = '16:9',
}: VideoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Format YouTube / Vimeo embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return ''
    if (url.includes('youtube.com/embed/')) return `${url}?autoplay=1&rel=0`
    if (url.includes('youtube.com/watch')) {
      const v = new URL(url).searchParams.get('v')
      return v ? `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0` : url
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : url
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0]
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : url
    }
    return url
  }

  const embedUrl = getEmbedUrl(videoUrl)
  const isDirectVideo = embedUrl.endsWith('.mp4') || embedUrl.endsWith('.webm')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${
          aspectRatio === '9:16' ? 'max-w-md' : 'max-w-4xl'
        } bg-[#0c0914] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {deliverableTag}
              </span>
              <span className="text-xs text-white/50">{clientName}</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video Player Container */}
        <div
          className={`relative w-full bg-black flex items-center justify-center ${
            aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[70vh]' : 'aspect-video'
          }`}
        >
          {isDirectVideo ? (
            <video
              src={embedUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>

        {/* Footer with conversion CTA */}
        <div className="p-4 md:p-5 border-t border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/60">
            Filmed, edited & sound-mastered for <strong className="text-white">{clientName}</strong> by Nia Media.
          </p>
          <Link
            to="/quote"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md transition-all"
          >
            <Sparkles size={13} /> Get a Video Like This
          </Link>
        </div>
      </div>
    </div>
  )
}
