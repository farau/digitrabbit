// app/login/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter()

    const handleSubmit = async (e) => {
        e.preventDefault()

        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        })

        if (response.ok) {
            router.push('/')
        } else {
            setError('Incorrect password')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 backdrop-blur-sm">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h3 className="text-base font-bold text-white mb-2">
                            Access Test
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
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pl-12 pr-12 text-black bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                        >
                            Access
                        </button>

                        {error && (
                            <div className="bg-red-900 border border-red-700 rounded-xl p-4 flex items-center space-x-2">
                                <div className="w-5 h-5 rounded-full bg-red-800 flex items-center justify-center">
                                    <span className="text-red-400 text-sm font-bold">!</span>
                                </div>
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}
                    </form>

                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}