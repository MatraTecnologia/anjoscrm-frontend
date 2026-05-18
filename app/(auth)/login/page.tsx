'use client'

import Image from 'next/image'
import { GlassCard } from 'react-glass-ui'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
    return (
        <div
            className="relative min-h-screen w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Logo 3D — atrás do card (z-5), grande, ponta na luz direita */}
            <Image
                src="/logo-3d.png"
                alt=""
                width={700}
                height={200}
                className="hidden lg:block absolute select-none pointer-events-none w-[500px]"
                style={{
                    zIndex: 5,
                    top: '55%',
                    right: '100px',
                    transform: 'translateY(-52%)',
                    filter: 'drop-shadow(0 0 55px rgba(37,99,235,0.75)) drop-shadow(0 0 120px rgba(37,99,235,0.4))',
                }}
                priority
            />

            {/* Layout principal — z-10, card fica acima da logo 3D */}
            <div
                className="relative min-h-screen flex items-center"
                style={{ zIndex: 10 }}
            >
                <div className="w-full max-w-[1280px] mx-auto px-12 flex items-center">

                    {/* Esquerda — logo + tagline */}
                    <div className="hidden lg:flex flex-col gap-6 w-[280px] flex-shrink-0">
                        <Image
                            src="/logo.png"
                            alt="KinarCRM"
                            width={185}
                            height={65}
                            className="object-contain object-left"
                            style={{ filter: 'brightness(10)' }}
                        />
                        <p className="text-white/70 text-[15px] leading-relaxed font-light">
                            Recuperamos oportunidades.<br />
                            Transformamos dados em{' '}
                            <span style={{ color: '#3b82f6' }}>receita</span>.
                        </p>
                    </div>

                    {/* Centro — card, flex-1 para empurrar para o meio */}
                    <div className="flex-1 flex items-center justify-center">
                        <div style={{ width: 400 }}>
                            <GlassCard
                                blur={28}
                                distortion={60}
                                chromaticAberration={0}
                                borderRadius={22}
                                borderSize={1}
                                borderColor="rgba(120,170,255,0.35)"
                                borderOpacity={1}
                                backgroundColor="#0b1836"
                                backgroundOpacity={0.15}
                                innerLightBlur={80}
                                innerLightSpread={4}
                                innerLightColor="rgba(80,130,255,0.18)"
                                innerLightOpacity={0.7}
                                outerLightBlur={90}
                                outerLightSpread={8}
                                outerLightColor="rgba(37,99,235,0.4)"
                                outerLightOpacity={0.65}
                                padding="44px 36px"
                            >
                                <LoginForm />
                            </GlassCard>
                        </div>
                    </div>

                    {/* Espaçador direito — empurra o card para a esquerda
                        e reserva espaço para a logo 3D visível */}
                    <div className="hidden lg:block w-[340px] flex-shrink-0" />

                </div>
            </div>

            {/* Copyright */}
            <p
                className="absolute bottom-6 left-12 text-white/20 text-xs"
                style={{ zIndex: 10 }}
            >
                © 2024 KinarCRM. Todos os direitos reservados.
            </p>
        </div>
    )
}
