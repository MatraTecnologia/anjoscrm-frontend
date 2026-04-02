import Image from 'next/image'
import { RegisterForm } from '@/components/register-form'
import { AIBackground } from '@/components/ai-background'

export default function RegisterPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Esquerda — formulário */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center md:justify-start">
                    <a href="#" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="KinarCRM" width={28} height={28} className="w-7 h-7 object-contain" />
                        <span className="font-semibold text-sm">KinarCRM</span>
                    </a>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <RegisterForm />
                    </div>
                </div>
            </div>

            {/* Direita — painel animado IA */}
            <AIBackground className="hidden lg:block">
                <div className="flex flex-col items-center justify-center gap-8 p-12 text-center h-full min-h-svh">
                    <img src="/logo.png" alt="KinarCRM" className="w-48 object-contain drop-shadow-2xl" />
                    <div className="flex flex-col gap-3 max-w-sm">
                        <p className="text-3xl font-bold tracking-tight leading-snug" style={{ color: '#D0AB6D' }}>
                            Feche mais negócios.<br />Deixe a IA qualificar.
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(208,171,109,0.55)' }}>
                            O KinarCRM responde seus leads automaticamente e entrega os melhores para o seu time fechar.
                        </p>
                    </div>
                </div>
            </AIBackground>
        </div>
    )
}
