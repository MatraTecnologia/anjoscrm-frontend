'use client'

import Image from 'next/image'
import { GlassCard } from 'react-glass-ui'
import { motion } from 'framer-motion'
import { LoginForm } from '@/components/login-form'

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

const fadeIn = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8, delay, ease: 'easeOut' },
})

export default function LoginPage() {
    return (
        <div
            className="relative min-h-screen w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            {/* Logo 3D — flutuando atrás do card */}
            <motion.div
                className="hidden lg:block absolute select-none pointer-events-none"
                style={{
                    zIndex: 5,
                    top: '55%',
                    right: '100px',
                    translateY: '-52%',
                }}
                initial={{ opacity: 0, x: 80, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Flutuação contínua */}
                <motion.div
                    animate={{
                        y: [0, -18, 0],
                        rotate: [0, 1.5, -1.5, 0],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {/* Glow pulsante */}
                    <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Image
                            src="/logo-3d.png"
                            alt=""
                            width={750}
                            height={750}
                            className="w-[500px] h-auto"
                            style={{
                                filter: 'drop-shadow(0 0 55px rgba(37,99,235,0.75)) drop-shadow(0 0 120px rgba(37,99,235,0.4))',
                            }}
                            priority
                        />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Layout principal */}
            <div
                className="relative min-h-screen flex items-center"
                style={{ zIndex: 10 }}
            >
                <div className="w-full max-w-[1280px] mx-auto px-12 flex items-center">

                    {/* Esquerda — logo + tagline */}
                    <div className="hidden lg:flex flex-col gap-6 w-[280px] flex-shrink-0">
                        <motion.div {...fadeUp(0.1)}>
                            <Image
                                src="/logo.png"
                                alt="KinarCRM"
                                width={185}
                                height={65}
                                className="object-contain object-left"
                                style={{ filter: 'brightness(10)' }}
                            />
                        </motion.div>
                        <motion.p
                            className="text-white/70 text-[15px] leading-relaxed font-light"
                            {...fadeUp(0.25)}
                        >
                            Recuperamos oportunidades.<br />
                            Transformamos dados em{' '}
                            <span style={{ color: '#3b82f6' }}>receita</span>.
                        </motion.p>
                    </div>

                    {/* Centro — card com entrada de baixo */}
                    <div className="flex-1 flex items-center justify-center">
                        <motion.div
                            style={{ width: 480, height: 620, display: 'flex', flexDirection: 'column' }}
                            initial={{ opacity: 0, y: 48, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        >
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
                        </motion.div>
                    </div>

                    {/* Espaçador direito */}
                    <div className="hidden lg:block w-[340px] flex-shrink-0" />

                </div>
            </div>

            {/* Copyright */}
            <motion.p
                className="absolute bottom-6 left-12 text-white/20 text-xs"
                style={{ zIndex: 10 }}
                {...fadeIn(0.8)}
            >
                © 2024 KinarCRM. Todos os direitos reservados.
            </motion.p>
        </div>
    )
}
