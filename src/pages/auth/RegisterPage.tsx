import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, User, TrendingUp } from 'lucide-react'
import { registerWithEmail, loginWithGoogle } from '@/features/auth/authService'

const schema = z
  .object({
    displayName: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Correo inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setAuthError(null)
    try {
      await registerWithEmail(data.email, data.password, data.displayName)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === 'auth/email-already-in-use') {
        setAuthError('Este correo ya está registrado.')
      } else {
        setAuthError('Ocurrió un error. Inténtalo de nuevo.')
      }
    }
  }

  const handleGoogle = async () => {
    setAuthError(null)
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch {
      setAuthError('No se pudo iniciar sesión con Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1923] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#1DB87A]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-[#3D8BFF] rounded-xl flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-[#F0F4F8] text-xl font-semibold tracking-tight">
            FinanceApp
          </span>
        </div>

        <div className="bg-[#161F2C] border border-white/5 rounded-2xl p-6">
          <h1 className="text-[#F0F4F8] text-xl font-semibold mb-1">Crear cuenta</h1>
          <p className="text-[#8899AA] text-sm mb-6">Empieza a controlar tus finanzas</p>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[#F0F4F8] rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 mb-4 cursor-pointer"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Registrarse con Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[#8899AA] text-xs">o con correo</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            {/* Name */}
            <div>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8899AA]" />
                <input
                  {...register('displayName')}
                  type="text"
                  placeholder="Tu nombre"
                  autoComplete="name"
                  className="w-full bg-[#1E2A3A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F0F4F8] placeholder-[#8899AA] focus:outline-none focus:border-[#3D8BFF]/50 focus:ring-1 focus:ring-[#3D8BFF]/30 transition-colors"
                />
              </div>
              {errors.displayName && (
                <p className="text-[#FF5B5B] text-xs mt-1 ml-1">{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8899AA]" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className="w-full bg-[#1E2A3A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F0F4F8] placeholder-[#8899AA] focus:outline-none focus:border-[#3D8BFF]/50 focus:ring-1 focus:ring-[#3D8BFF]/30 transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-[#FF5B5B] text-xs mt-1 ml-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8899AA]" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  autoComplete="new-password"
                  className="w-full bg-[#1E2A3A] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-[#F0F4F8] placeholder-[#8899AA] focus:outline-none focus:border-[#3D8BFF]/50 focus:ring-1 focus:ring-[#3D8BFF]/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] hover:text-[#F0F4F8] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[#FF5B5B] text-xs mt-1 ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8899AA]" />
                <input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  autoComplete="new-password"
                  className="w-full bg-[#1E2A3A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F0F4F8] placeholder-[#8899AA] focus:outline-none focus:border-[#3D8BFF]/50 focus:ring-1 focus:ring-[#3D8BFF]/30 transition-colors"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[#FF5B5B] text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {authError && (
              <div className="bg-[#FF5B5B]/10 border border-[#FF5B5B]/20 rounded-lg px-3 py-2">
                <p className="text-[#FF5B5B] text-xs">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#3D8BFF] hover:bg-[#2d7aee] text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#8899AA] mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#3D8BFF] hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}