"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, AlertCircle, Loader2, Clock, ShieldX } from "lucide-react"
import { HCaptchaWidget, useHCaptcha } from "@/components/security/TurnstileWidget"

interface AuthError {
    message: string
    code: string
    attemptsLeft?: number
    minutesLeft?: number
}

export default function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<AuthError | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Gestion du token hCaptcha avec nouvelles fonctionnalités
    const {
        token: hcaptchaToken,
        eKey,
        isVerified,
        captchaRef,
        handleSuccess,
        handleError,
        handleExpire,
        reset
    } = useHCaptcha()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Vérifier que le CAPTCHA est validé
        if (!isVerified || !hcaptchaToken) {
            setError({ message: "Veuillez compléter la vérification de sécurité", code: "CAPTCHA_REQUIRED" })
            return
        }

        setIsLoading(true)

        try {
            // Étape 1: Pré-validation pour obtenir des messages d'erreur précis
            // Note: On n'envoie PAS le token CAPTCHA ici car il sera utilisé par NextAuth
            const checkResponse = await fetch('/api/auth/check-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password,
                }),
            })

            const checkResult = await checkResponse.json()

            if (!checkResult.success) {
                setError({
                    message: checkResult.message,
                    code: checkResult.code,
                    attemptsLeft: checkResult.attemptsLeft,
                    minutesLeft: checkResult.minutesLeft,
                })
                reset() // Réinitialiser le CAPTCHA après une erreur
                return
            }

            // Étape 2: Connexion via NextAuth
            const result = await signIn("credentials", {
                email: email.toLowerCase().trim(),
                password,
                hcaptchaToken,
                redirect: false,
            })

            if (result?.error) {
                setError({ message: "Erreur de connexion. Veuillez réessayer.", code: "AUTH_ERROR" })
                reset()
            } else {
                // Recharger pour obtenir la session et laisser le serveur rediriger selon le rôle
                window.location.href = callbackUrl === "/" ? "/login" : callbackUrl
            }
        } catch (error) {
            setError({ message: "Une erreur est survenue. Veuillez réessayer.", code: "NETWORK_ERROR" })
            reset() // Réinitialiser le CAPTCHA après une erreur
        } finally {
            setIsLoading(false)
        }
    }

    // Rendu de l'erreur avec icône appropriée
    const renderError = () => {
        if (!error) return null

        const isLocked = error.code === 'ACCOUNT_LOCKED'
        const isDisabled = error.code === 'ACCOUNT_DISABLED'
        const Icon = isLocked ? Clock : isDisabled ? ShieldX : AlertCircle
        const bgColor = isLocked || isDisabled ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
        const textColor = isLocked || isDisabled ? 'text-amber-900' : 'text-red-900'
        const iconColor = isLocked || isDisabled ? 'text-amber-600' : 'text-red-600'
        const subTextColor = isLocked || isDisabled ? 'text-amber-700' : 'text-red-700'

        return (
            <div className={`flex items-start gap-3 rounded-xl ${bgColor} p-4 border`}>
                <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div>
                    <p className={`text-sm font-medium ${textColor}`}>{error.message}</p>
                    {error.attemptsLeft !== undefined && error.attemptsLeft > 0 && (
                        <p className={`text-xs ${subTextColor} mt-1`}>
                            Attention : votre compte sera temporairement verrouillé après {error.attemptsLeft} tentative(s) échouée(s) supplémentaire(s).
                        </p>
                    )}
                    {isLocked && (
                        <p className={`text-xs ${subTextColor} mt-1`}>
                            Vous pouvez aussi contacter l&apos;administrateur pour débloquer votre compte.
                        </p>
                    )}
                    {isDisabled && (
                        <p className={`text-xs ${subTextColor} mt-1`}>
                            Contactez l&apos;administrateur pour plus d&apos;informations.
                        </p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-5">
                {renderError()}

                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-[var(--text-dark)]"
                    >
                        Adresse email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-[var(--text-dark)] placeholder-[var(--text-muted)] transition-all focus:border-[var(--accent-orange)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/20"
                            placeholder="votre.email@example.com"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-[var(--text-dark)]"
                    >
                        Mot de passe
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-[var(--text-dark)] placeholder-[var(--text-muted)] transition-all focus:border-[var(--accent-orange)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/20"
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Vérification hCaptcha */}
                <div className="pt-2">
                    <HCaptchaWidget
                        onSuccess={handleSuccess}
                        onError={handleError}
                        onExpire={handleExpire}
                        onLoad={() => console.log('[hCaptcha] Widget chargé')}
                        onOpen={() => console.log('[hCaptcha] Challenge ouvert')}
                        onClose={() => console.log('[hCaptcha] Challenge fermé')}
                        className="flex justify-center"
                        size="normal"
                        tabindex={0}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !isVerified}
                    className="w-full rounded-xl bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dark)] py-3.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Connexion en cours...
                        </span>
                    ) : (
                        "Se connecter"
                    )}
                </button>
            </form>

            <div className="mt-6 text-center space-y-3">
                <Link
                    href="/forgot-password"
                    className="text-sm text-[var(--accent-orange)] hover:text-[var(--accent-orange-dark)] hover:underline font-medium"
                >
                    Mot de passe oublié ?
                </Link>
            </div>
        </div>
    )
}
