import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, TrendingUp, ArrowLeft, CheckCircle } from 'lucide-react'
import { resetPassword } from '@/features/auth/authService'

const schema = z.object({
  email: z.string().email('Correo inválido'),
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setAuthError(null)
    try {
      await resetPassword(data.email)
      setSent(true)
    } catch {
      setAuthError('No se pudo enviar el correo. Verifica la dirección.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1923] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-[#3D8BFF] rounded-xl flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-[#F0F4F8] text-xl font-semibold tracking-tight">
            FinanceApp
          </span>
        </div>

        <div className="bg-[#161F2C] border border-white/5 rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-[#1DB87A] mx-auto mb-3" />
              <h2 className="text-[#F0F4F8] font-semibold mb-2">Correo enviado</h2>
              <p className="text-[#8899AA] text-sm">
                Revisa tu bandeja de entrada y sigue las instrucciones para recuperar tu contraseña.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-[#F0F4F8] text-xl font-semibold mb-1">Recuperar contraseña</h1>
              <p className="text-[#8899AA] text-sm mb-6">
                Ingresa tu correo y te enviaremos un enlace de recuperación.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
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

                {authError && (
                  <div className="bg-[#FF5B5B]/10 border border-[#FF5B5B]/20 rounded-lg px-3 py-2">
                    <p className="text-[#FF5B5B] text-xs">{authError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#3D8BFF] hover:bg-[#2d7aee] text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Enviar enlace'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-[#8899AA] hover:text-[#F0F4F8] transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}