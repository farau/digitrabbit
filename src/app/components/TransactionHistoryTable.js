import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '@/context'

export default function TransactionHistoryTable({ transactionHistory, clearHistory }) {
    const [hoveredRow, setHoveredRow] = useState(null)
    const { themeMode } = useTheme();
    const isNight = themeMode === 'dark';

    // Couleurs harmonisées avec Profile
    const textColor = isNight ? '#eee' : '#333'
    const cardBg = isNight ? '#222' : '#f3f3f3'
    const labelColor = isNight ? '#ccc' : '#333'
    const borderColor = isNight ? '#444' : '#ddd'
    const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)'
    const hoverBg = isNight ? '#333' : '#e5e5e5'
    const headerBg = isNight ? '#1a1a1a' : '#e8e8e8'

    const getExplorerUrl = (tx) => `https://web3.okx.com/explorer/megaeth-testnet/tx/${tx}`

    const getTimeStyle = (time) => {
        if (time < 200) return isNight
            ? 'bg-green-950/20 text-green-400 border-green-900/50'
            : 'bg-green-100/80 text-green-700 border-green-200'
        if (time < 500) return isNight
            ? 'bg-yellow-950/20 text-yellow-400 border-yellow-900/50'
            : 'bg-yellow-100/80 text-yellow-700 border-yellow-200'
        return isNight
            ? 'bg-red-950/20 text-red-400 border-red-900/50'
            : 'bg-red-100/80 text-red-700 border-red-200'
    }

    if (transactionHistory.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl mt-8 md:mt-16 px-4 md:px-0"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                    <p className="text-xs md:text-xl font-bold" style={{ color: textColor }}>
                        Transaction History
                    </p>
                    <span
                        className="px-2 md:px-3 py-1 text-blue-700 text-xs md:text-sm font-medium rounded-full border"
                        style={{
                            backgroundColor: isNight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            borderColor: isNight ? '#1e40af' : '#3b82f6',
                            color: isNight ? '#93c5fd' : '#1d4ed8'
                        }}
                    >
                        {transactionHistory.length} transaction{transactionHistory.length > 1 ? 's' : ''}
                    </span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearHistory}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg transition-all duration-200 w-full sm:w-auto"
                    style={{
                        backgroundColor: cardBg,
                        color: isNight ? '#ef4444' : '#dc2626',
                        border: `1px solid ${borderColor}`,
                        boxShadow
                    }}
                >
                    Clear History
                </motion.button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-xl shadow-lg" style={{ border: `1px solid ${borderColor}` }}>
                <div
                    className="border-b"
                    style={{
                        backgroundColor: headerBg,
                        borderBottomColor: borderColor
                    }}
                >
                    <div className="grid grid-cols-3 gap-4 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="font-semibold text-sm" style={{ color: labelColor }}>Network</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-semibold text-sm" style={{ color: labelColor }}>Transaction Hash</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-sm" style={{ color: labelColor }}>Execution Time</span>
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: cardBg }}>
                    <AnimatePresence>
                        {transactionHistory.map((tx, index) => (
                            <motion.div
                                key={`${tx.hash}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                onMouseEnter={() => setHoveredRow(index)}
                                onMouseLeave={() => setHoveredRow(null)}
                                className="grid grid-cols-3 gap-4 px-6 py-4 border-b transition-all duration-200 cursor-pointer"
                                style={{
                                    borderBottomColor: isNight ? '#333' : '#ddd',
                                    backgroundColor: hoveredRow === index ? hoverBg : 'transparent'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                                        <span className="text-white font-bold text-xs">M</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-sm" style={{ color: textColor }}>
                                            {tx.network}
                                        </span>
                                        <div className="text-xs" style={{ color: labelColor }}>Testnet</div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <motion.a
                                        whileHover={{ scale: 1.05 }}
                                        href={getExplorerUrl(tx.hash)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group"
                                        style={{
                                            backgroundColor: isNight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            border: `1px solid ${isNight ? '#1e40af' : '#3b82f6'}50`
                                        }}
                                    >
                                        <span
                                            className="font-mono text-xs"
                                            style={{ color: isNight ? '#93c5fd' : '#1d4ed8' }}
                                        >
                                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                                        </span>
                                        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            style={{ color: isNight ? '#60a5fa' : '#3b82f6' }}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </motion.a>
                                </div>

                                <div className="flex items-center justify-start">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border ${getTimeStyle(tx.time)}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${tx.time < 200 ? 'bg-green-500' :
                                                tx.time < 500 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}></div>
                                            <span className="font-mono">{tx.time}ms</span>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                <AnimatePresence>
                    {transactionHistory.map((tx, index) => (
                        <motion.div
                            key={`${tx.hash}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="rounded-xl shadow-lg overflow-hidden"
                            style={{
                                backgroundColor: cardBg,
                                border: `1px solid ${borderColor}`,
                                boxShadow
                            }}
                        >
                            {/* Card Header */}
                            <div
                                className="px-4 py-3 border-b"
                                style={{
                                    backgroundColor: headerBg,
                                    borderBottomColor: isNight ? '#333' : '#ddd'
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                                            <span className="text-white font-bold text-xs">M</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-sm" style={{ color: textColor }}>
                                                {tx.network}
                                            </span>
                                            <div className="text-xs" style={{ color: labelColor }}>Testnet</div>
                                        </div>
                                    </div>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTimeStyle(tx.time)}`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${tx.time < 200 ? 'bg-green-500' :
                                                tx.time < 500 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}></div>
                                            <span className="font-mono">{tx.time}ms</span>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4">
                                <div className="space-y-3">
                                    {/* Transaction Hash Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span
                                                className="text-xs font-medium uppercase tracking-wide"
                                                style={{ color: labelColor }}
                                            >
                                                Transaction Hash
                                            </span>
                                        </div>
                                        <motion.a
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            href={getExplorerUrl(tx.hash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 group"
                                            style={{
                                                backgroundColor: isNight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                border: `1px solid ${isNight ? '#1e40af' : '#3b82f6'}50`
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="font-mono text-xs truncate"
                                                    style={{ color: isNight ? '#93c5fd' : '#1d4ed8' }}
                                                >
                                                    {tx.hash}
                                                </div>
                                                <div className="text-xs mt-0.5" style={{ color: labelColor }}>
                                                    Tap to view on explorer
                                                </div>
                                            </div>
                                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2"
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                style={{ color: isNight ? '#60a5fa' : '#3b82f6' }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </motion.a>
                                    </div>

                                    {/* Execution Time Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span
                                                className="text-xs font-medium uppercase tracking-wide"
                                                style={{ color: labelColor }}
                                            >
                                                Execution Time
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${getTimeStyle(tx.time)}`}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${tx.time < 200 ? 'bg-green-500' :
                                                        tx.time < 500 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}></div>
                                                    <span className="font-mono">{tx.time}ms</span>
                                                    <span className="text-xs opacity-70">
                                                        {tx.time < 200 ? 'Fast' : tx.time < 500 ? 'Normal' : 'Slow'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}