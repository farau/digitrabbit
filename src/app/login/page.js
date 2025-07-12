// app/login/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
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
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Access Test</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: '10px', margin: '10px', color: 'black' }}
                />
                <button type="submit" style={{ padding: '10px 20px' }}>
                    Enter
                </button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    )
}