'use client'

import { useEffect, useRef } from 'react'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    opacity: number
    pulse: number
    pulseSpeed: number
}

export function AIBackground({ children, className }: { children?: React.ReactNode; className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animId: number
        const PARTICLE_COUNT = 60
        const CONNECTION_DIST = 140
        const particles: Particle[] = []

        const resize = () => {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
        }

        const spawn = (): Particle => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.6 + 0.2,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.01 + Math.random() * 0.02,
        })

        resize()
        window.addEventListener('resize', resize)

        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawn())

        // Shared wave phase
        let wavePhase = 0

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // --- background gradient ---
            const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
            bg.addColorStop(0, '#04060F')
            bg.addColorStop(0.5, '#060B18')
            bg.addColorStop(1, '#04060F')
            ctx.fillStyle = bg
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // --- subtle grid ---
            ctx.strokeStyle = 'rgba(21,53,200,0.05)'
            ctx.lineWidth = 0.5
            const gridSize = 50
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
            }
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
            }

            // --- flowing wave lines ---
            for (let w = 0; w < 3; w++) {
                ctx.beginPath()
                const amp = 30 + w * 18
                const freq = 0.008 - w * 0.0015
                const offset = (wavePhase + w * 1.2) % (Math.PI * 2)
                const yBase = canvas.height * (0.35 + w * 0.15)
                ctx.moveTo(0, yBase)
                for (let x = 0; x <= canvas.width; x += 4) {
                    const y = yBase + Math.sin(x * freq + offset) * amp
                    ctx.lineTo(x, y)
                }
                const alpha = [0.12, 0.08, 0.05][w]
                ctx.strokeStyle = `rgba(21,53,200,${alpha})`
                ctx.lineWidth = 1.5 - w * 0.4
                ctx.stroke()
            }

            // --- ambient glow blobs ---
            const glows = [
                { cx: canvas.width * 0.2, cy: canvas.height * 0.3, r: 180, color: 'rgba(21,53,200,0.07)' },
                { cx: canvas.width * 0.8, cy: canvas.height * 0.7, r: 220, color: 'rgba(21,53,200,0.05)' },
                { cx: canvas.width * 0.5, cy: canvas.height * 0.1, r: 140, color: 'rgba(208,171,109,0.04)' },
            ]
            for (const g of glows) {
                const grd = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.r)
                grd.addColorStop(0, g.color)
                grd.addColorStop(1, 'transparent')
                ctx.fillStyle = grd
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            // --- connections ---
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < CONNECTION_DIST) {
                        const a = (1 - dist / CONNECTION_DIST) * 0.25
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(21,53,200,${a})`
                        ctx.lineWidth = 0.8
                        ctx.stroke()
                    }
                }
            }

            // --- particles ---
            for (const p of particles) {
                p.pulse += p.pulseSpeed
                const glowAlpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse))

                // outer glow
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4)
                grd.addColorStop(0, `rgba(21,53,200,${glowAlpha * 0.6})`)
                grd.addColorStop(1, 'transparent')
                ctx.fillStyle = grd
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2)
                ctx.fill()

                // core dot
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(120,160,255,${glowAlpha})`
                ctx.fill()

                // move
                p.x += p.vx
                p.y += p.vy
                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width) p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0
            }

            wavePhase += 0.008
            animId = requestAnimationFrame(draw)
        }

        draw()

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', background: '#04060F' }}>
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
            <div style={{ position: 'relative', zIndex: 10 }}>
                {children}
            </div>
        </div>
    )
}
