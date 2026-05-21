'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { GlassCard } from 'react-glass-ui'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function NotFound() {
    return (
        <div
            className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
            style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="absolute inset-0 bg-black/40" />

            <motion.div
                className="relative z-10 w-full max-w-md px-4"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
            >
                <GlassCard className="p-10 text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                    >
                        <p className="text-8xl font-bold text-white/10 select-none leading-none">
                            404
                        </p>
                    </motion.div>

                    <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h1 className="text-2xl font-semibold text-white">
                            Página não encontrada
                        </h1>
                        <p className="text-white/60 text-sm">
                            A página que você está procurando não existe ou foi removida.
                        </p>
                    </motion.div>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Button
                            variant="outline"
                            className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="size-4" />
                            Voltar
                        </Button>
                        <Button
                            asChild
                            className="gap-2"
                        >
                            <Link href="/">
                                <Home className="size-4" />
                                Ir para o início
                            </Link>
                        </Button>
                    </motion.div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
