'use client'

import Image from 'next/image'
import { GlassCard } from 'react-glass-ui'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
    return (
        <div
            className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
            style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >

            {/* Layout */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-16 flex items-center justify-between gap-8 min-h-screen py-16">

                {/* Left — logo + tagline */}
                <div className="hidden lg:flex flex-col gap-8 flex-1 max-w-[260px]">
                    <Image src="/logo.png" alt="KinarCRM" width={155} height={55} className="object-contain" style={{ filter: 'brightness(10)' }} />
                    <p className="text-white/80 text-[17px] leading-relaxed font-light">
                        Recuperamos oportunidades.<br />
                        Transformamos dados em{' '}
                        <span style={{ color: '#3b82f6' }}>receita</span>.
                    </p>
                    <p className="text-white/20 text-xs absolute bottom-8 left-16">
                        © 2024 KinarCRM. Todos os direitos reservados.
                    </p>
                </div>

                {/* Center — login card com GlassCard */}
                <div style={{ width: 420, flexShrink: 0 }}>
                    <GlassCard
                        blur={22}
                        distortion={50}
                        borderRadius={20}
                        borderSize={1.5}
                        borderColor="rgba(100,160,255,0.4)"
                        borderOpacity={1}
                        backgroundColor="#0d1c3e"
                        backgroundOpacity={0.22}
                        innerLightBlur={60}
                        innerLightSpread={3}
                        innerLightColor="rgba(59,130,246,0.2)"
                        innerLightOpacity={0.5}
                        outerLightBlur={80}
                        outerLightSpread={6}
                        outerLightColor="rgba(37,99,235,0.35)"
                        outerLightOpacity={0.6}
                        padding="44px 40px"
                    >
                        <LoginForm />
                    </GlassCard>
                </div>

                {/* Right — 3D floating card */}
                <div className="hidden lg:flex flex-1 items-center justify-center">
                    <div style={{ perspective: '1400px' }}>
                        <div
                            style={{
                                width: 300,
                                height: 345,
                                borderRadius: 28,
                                background: 'linear-gradient(155deg, #0e1d40 0%, #080f24 55%, #050c1a 100%)',
                                border: '1.5px solid rgba(59,130,246,0.45)',
                                boxShadow: [
                                    '0 0 0 1px rgba(59,130,246,0.08)',
                                    '0 0 55px rgba(37,99,235,0.5)',
                                    '0 0 110px rgba(37,99,235,0.22)',
                                    '0 0 200px rgba(37,99,235,0.1)',
                                    'inset 0 1px 0 rgba(255,255,255,0.08)',
                                    '0 60px 100px rgba(0,0,0,0.75)',
                                ].join(', '),
                                transform: 'rotateY(-22deg) rotateX(8deg)',
                                transformStyle: 'preserve-3d',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Inner top-left lighting */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(145deg, rgba(59,130,246,0.1) 0%, transparent 45%)',
                                borderRadius: 'inherit', pointerEvents: 'none',
                            }} />
                            {/* Specular top line */}
                            <div style={{
                                position: 'absolute', top: 0, left: '12%', right: '12%', height: 1,
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                                pointerEvents: 'none',
                            }} />
                            {/* Logo — cores originais */}
                            <Image
                                src="/Ativo 4.png"
                                alt=""
                                width={210}
                                height={185}
                                className="relative select-none"
                                style={{ opacity: 0.9, zIndex: 1 }}
                                priority
                            />
                            {/* Bottom inner glow */}
                            <div style={{
                                position: 'absolute', bottom: -8, left: '10%', right: '10%',
                                height: 60, background: 'rgba(37,99,235,0.28)',
                                borderRadius: '50%', filter: 'blur(28px)', pointerEvents: 'none',
                            }} />
                        </div>

                        {/* Floor reflection */}
                        <div style={{
                            width: 300, height: 60, marginTop: 2,
                            background: 'linear-gradient(180deg, rgba(37,99,235,0.16) 0%, transparent 100%)',
                            transform: 'rotateY(-22deg) rotateX(8deg) scaleY(-1)',
                            borderRadius: '0 0 28px 28px',
                            opacity: 0.3, filter: 'blur(3px)',
                        }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
