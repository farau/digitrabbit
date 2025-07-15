// app/login/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [attempts, setAttempts] = useState(0)
    const [isBlocked, setIsBlocked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()
    const MAX_ATTEMPTS = 5
    const BLOCK_TIME = 30000 // 30 secondes

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (isBlocked) {
            setError('Too many attempts. Please wait.')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            // Hachage côté client (basique - mieux vaut le faire côté serveur)
            const hashedPassword = await hashPassword(password)

            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: hashedPassword,
                    timestamp: Date.now() // Protection contre replay attacks
                })
            })

            const data = await response.json()

            if (response.ok) {
                // Réinitialiser les tentatives en cas de succès
                setAttempts(0)

                // Ou forcer le rechargement de la page
                window.location.href = '/'
            } else {
                handleFailedAttempt(data.message || 'Authentication failed')
            }
        } catch (error) {
            handleFailedAttempt('Connection error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleFailedAttempt = (message) => {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
            setIsBlocked(true)
            setError('Too many failed attempts. Access blocked for 30 seconds.')

            // Débloquer après le délai
            setTimeout(() => {
                setIsBlocked(false)
                setAttempts(0)
                setError('')
            }, BLOCK_TIME)
        } else {
            setError(`${message} (${newAttempts}/${MAX_ATTEMPTS} attempts)`)
        }

        // Effacer le mot de passe après échec
        setPassword('')
    }

    // Fonction de hachage simple (côté client)
    const hashPassword = async (password) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 backdrop-blur-sm relative overflow-hidden">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            Secure Access
                        </h3>
                        <p className="text-gray-300">
                            Please enter your password to continue
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isBlocked || isLoading}
                                className={`w-full px-4 py-3 pl-10 pr-12 text-black bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 ${isBlocked || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                required
                                minLength="6"
                                maxLength="50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-2 flex items-center text-black-400 hover:text-white transition-colors"
                                disabled={isBlocked || isLoading}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5 text-black" /> : <Eye className="h-5 w-5 text-black" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isBlocked || isLoading || password.length < 6}
                            className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform shadow-lg ${isBlocked || isLoading || password.length < 6
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl'
                                }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Authenticating...</span>
                                </div>
                            ) : isBlocked ? (
                                'Access Blocked'
                            ) : (
                                'Access'
                            )}
                        </button>

                        {error && (
                            <div className={`border rounded-xl p-4 flex items-center space-x-2 ${isBlocked
                                ? 'bg-red-900 border-red-700'
                                : 'bg-yellow-900 border-yellow-700'
                                }`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isBlocked ? 'bg-red-800' : 'bg-yellow-800'
                                    }`}>
                                    <span className={`text-sm font-bold ${isBlocked ? 'text-red-400' : 'text-yellow-400'
                                        }`}>!</span>
                                </div>
                                <p className={`text-sm ${isBlocked ? 'text-red-300' : 'text-yellow-300'
                                    }`}>{error}</p>
                            </div>
                        )}
                    </form>

                    {/* Security indicator */}
                    <div className="mt-6 text-center">
                        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Secure connection</span>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                </div>
            </div>
        </div>
    )
}