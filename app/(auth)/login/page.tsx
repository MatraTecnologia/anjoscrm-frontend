import Image from 'next/image'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
    return (
        <div
            className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
            style={{ background: '#060d1c' }}
        >
            {/* Dot grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            />

            {/* Blue radial glow — top right */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: '-10%',
                    right: '-5%',
                    width: 700,
                    height: 700,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, transparent 65%)',
                }}
            />

            {/* Blue radial glow — bottom left */}
            <div
                className="absolute pointer-events-none"
                style={{
                    bottom: '-15%',
                    left: '-5%',
                    width: 500,
                    height: 500,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 65%)',
                }}
            />

            {/* Diagonal accent lines */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <line x1="0" y1="35%" x2="100%" y2="65%" stroke="rgba(37,99,235,0.07)" strokeWidth="1" />
                <line x1="0" y1="55%" x2="100%" y2="85%" stroke="rgba(37,99,235,0.05)" strokeWidth="1" />
                <line x1="15%" y1="0" x2="85%" y2="100%" stroke="rgba(37,99,235,0.06)" strokeWidth="1" />
                <line x1="60%" y1="0" x2="100%" y2="55%" stroke="rgba(37,99,235,0.04)" strokeWidth="1" />
            </svg>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-8 min-h-screen py-12">

                {/* Left — logo + tagline */}
                <div className="hidden lg:flex flex-col gap-8 flex-1 max-w-xs">
                    <Image
                        src="/logo.png"
                        alt="KinarCRM"
                        width={160}
                        height={60}
                        className="object-contain"
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <p className="text-white text-lg leading-relaxed font-light">
                        Recuperamos oportunidades.<br />
                        Transformamos dados em{' '}
                        <span style={{ color: '#3b82f6' }}>receita</span>.
                    </p>

                    <p className="text-white/25 text-xs absolute bottom-8 left-12">
                        © 2024 KinarCRM. Todos os direitos reservados.
                    </p>
                </div>

                {/* Center — card */}
                <div
                    className="w-full max-w-sm flex-shrink-0 rounded-2xl p-8 flex flex-col gap-6"
                    style={{
                        background: 'rgba(10, 18, 38, 0.75)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(24px)',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                >
                    <LoginForm />
                </div>

                {/* Right — 3D asset */}
                <div className="hidden lg:flex flex-1 items-center justify-center">
                    <div
                        className="relative"
                        style={{
                            filter: 'drop-shadow(0 0 60px rgba(37,99,235,0.55)) drop-shadow(0 0 120px rgba(37,99,235,0.25))',
                            transform: 'perspective(800px) rotateY(-12deg) rotateX(4deg)',
                        }}
                    >
                        <Image
                            src="/Ativo 4.png"
                            alt=""
                            width={340}
                            height={280}
                            className="object-contain select-none"
                            style={{ filter: 'brightness(0) invert(1)' }}
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
