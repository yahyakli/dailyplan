'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Badge } from '@/lib/types'
import BadgeIcon from './BadgeIcon'

interface BadgeUnlockToastProps {
  badges: Badge[]
  onDismiss: () => void
}

export default function BadgeUnlockToast({ badges, onDismiss }: BadgeUnlockToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; angle: number; color: string }>>([])

  const badge = badges[currentIndex]

  const generateParticles = useCallback(() => {
    const colors = ['#7c6af7', '#f7936a', '#f7be46', '#3ecfcf', '#f75c6a', '#9b8af7']
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 10,
      y: 50 + (Math.random() - 0.5) * 10,
      angle: (360 / 20) * i + Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    if (!badge) return
    requestAnimationFrame(() => {
      setVisible(true)
      generateParticles()
    })

    const timer = setTimeout(() => {
      handleNext()
    }, 4500)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, badge])

  const handleNext = () => {
    setVisible(false)
    setTimeout(() => {
      if (currentIndex < badges.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setVisible(true)
        generateParticles()
      } else {
        onDismiss()
      }
    }, 300)
  }

  if (!badge) return null

  return (
    <div
      onClick={handleNext}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        cursor: 'pointer',
      }}
    >
      {/* Confetti particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 8,
            height: 8,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            background: p.color,
            '--angle': `${p.angle}deg`,
            '--distance': `${80 + Math.random() * 60}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Badge card */}
      <div
        className={visible ? 'badge-unlock-enter' : ''}
        style={{
          background: 'var(--surface, #13131a)',
          border: '1px solid rgba(124, 106, 247, 0.4)',
          borderRadius: 20,
          padding: '40px 48px',
          textAlign: 'center',
          maxWidth: 340,
          width: '90vw',
          position: 'relative',
          boxShadow: '0 0 60px rgba(124, 106, 247, 0.2), 0 20px 60px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Badge emoji */}
        <div className="badge-emoji-glow" style={{
          display: 'flex',
          justifyContent: 'center',
          color: 'var(--accent)',
          marginBottom: 16,
        }}>
          <BadgeIcon name={badge.iconName} size={64} strokeWidth={1.5} />
        </div>

        {/* Title */}
        <div style={{
          fontSize: 11,
          fontFamily: 'Syne',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--accent, #7c6af7)',
          marginBottom: 8,
        }}>
          Badge Unlocked!
        </div>

        {/* Badge name */}
        <div style={{
          fontSize: 22,
          fontFamily: 'Syne',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginBottom: 8,
          color: 'var(--text, #e8e8f0)',
        }}>
          {badge.label}
        </div>

        {/* Description */}
        <div style={{
          fontSize: 14,
          color: 'var(--muted, #6b6b80)',
          lineHeight: 1.5,
          marginBottom: 20,
        }}>
          {badge.description}
        </div>

        {/* counter for multiple badges */}
        {badges.length > 1 && (
          <div style={{
            fontSize: 12,
            color: 'var(--muted, #6b6b80)',
          }}>
            {currentIndex + 1} / {badges.length}
          </div>
        )}

        {/* Tap hint */}
        <div style={{
          fontSize: 11,
          color: 'var(--muted, #6b6b80)',
          marginTop: 12,
          opacity: 0.6,
        }}>
          Tap to continue
        </div>
      </div>
    </div>
  )
}
