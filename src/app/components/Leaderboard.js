'use client';

import Image from 'next/image';
import { Trophy, RotateCcw, Users, Calendar } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useTheme } from '@/context';
import Wrapper from '@/app/components/Wrapper';

// Top 100 displayed by default
export default function Leaderboard({ limit = 100, embeddedWallet }) {
  const { data, loading, error, refresh } = useLeaderboard(limit);
  const { themeMode } = useTheme();

  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const subTextColor = isNight ? '#999' : '#666';

  const formatScore = (score) => {
    return new Intl.NumberFormat('fr-FR').format(Math.floor(score));
  };

  const getRankStyle = (index, isCurrentUser = false) => {
    if (isCurrentUser) {
      return {
        background: isNight
          ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
          : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        color: '#fff',
        fontWeight: 'bold'
      };
    }

    if (index === 0) return {
      background: isNight
        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
        : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      color: '#000',
      fontWeight: 'bold'
    };
    if (index === 1) return {
      background: isNight
        ? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
        : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
      color: '#000',
      fontWeight: 'bold'
    };
    if (index === 2) return {
      background: isNight
        ? 'linear-gradient(135deg, #cd7c2f 0%, #a0522d 100%)'
        : 'linear-gradient(135deg, #cd7c2f 0%, #a0522d 100%)',
      color: '#fff',
      fontWeight: 'bold'
    };
    return {
      background: isNight ? '#333' : '#f9f9f9',
      color: isNight ? '#ccc' : '#666'
    };
  };

  const renderPlayerCard = (player, index, isCurrentUser = false) => (
    <div
      key={player.walletAddress}
      className="p-4 sm:p-6 hover:bg-opacity-50 transition-colors duration-200"
      style={{
        background: isCurrentUser
          ? (isNight ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)')
          : index < 3 ? (isNight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)') : 'transparent'
      }}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex-shrink-0">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base"
            style={getRankStyle(index, isCurrentUser)}
          >
            {!isCurrentUser && index === 0 && '🥇'}
            {!isCurrentUser && index === 1 && '🥈'}
            {!isCurrentUser && index === 2 && '🥉'}
            {(isCurrentUser || index > 2) && `#${player.rank}`}
          </div>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {player.twitter.avatar ? (
            <Image
              src={player.twitter.avatar}
              alt={player.twitter.displayName || 'Avatar'}
              width={48}
              height={48}
              className="rounded-full w-10 h-10 sm:w-12 sm:h-12"
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold"
              style={{
                background: isNight ? '#444' : '#e5e7eb',
                color: isNight ? '#ccc' : '#666'
              }}
            >
              {player.twitter.displayName?.[0] || '?'}
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p className="text-base sm:text-lg font-semibold truncate" style={{ color: textColor, margin: 0 }}>
              {player.twitter.displayName || 'Anonymous User'}
              {isCurrentUser && (
                <span className="ml-2 text-xs font-normal px-2 py-1 rounded-full" style={{
                  background: isNight ? '#4f46e5' : '#4f46e5',
                  color: 'white'
                }}>
                  You
                </span>
              )}
            </p>
            {player.twitter.username && (
              <span className="text-xs sm:text-sm" style={{ color: subTextColor }}>
                @{player.twitter.username}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm truncate mt-1" style={{ color: subTextColor, margin: 0 }}>
            {player.walletAddress.slice(0, 6)}...{player.walletAddress.slice(-4)}
          </p>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="text-lg sm:text-xl font-bold" style={{ color: textColor }}>
            {formatScore(player.score)}
            <span className="text-xs sm:text-sm font-normal ml-1" style={{ color: subTextColor }}>
              pts
            </span>
          </div>
          <div className="text-xs sm:text-sm mt-1" style={{ color: subTextColor }}>
            <span className="mr-2">🔥 {player.streak}</span>
            <span>👆 {formatScore(player.totalClicks)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Wrapper>
        <div
          style={{
            background: cardBg,
            padding: '40px',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            boxShadow,
            textAlign: 'center'
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-blue-500"></div>
            <p style={{ color: textColor, margin: 0 }}>Loading leaderboard...</p>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div
          style={{
            background: cardBg,
            padding: '40px',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            boxShadow,
            textAlign: 'center'
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <p style={{ color: isNight ? '#ef4444' : '#dc2626', margin: 0 }}>
              Error: {error}
            </p>
            <button
              onClick={refresh}
              style={{
                background: isNight
                  ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 3px 8px rgba(79, 70, 229, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 6px rgba(79, 70, 229, 0.3)';
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (!data || !data.topPlayers) {
    return (
      <Wrapper>
        <div
          style={{
            background: cardBg,
            padding: '40px',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            boxShadow,
            textAlign: 'center'
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <p style={{ color: subTextColor, margin: 0 }}>No data available</p>
            <button
              onClick={refresh}
              style={{
                background: isNight
                  ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </Wrapper>
    );
  }

  const { topPlayers: leaderboard, metadata } = data;

  // Find current user in the leaderboard
  const currentUser = leaderboard?.find(player =>
    player.walletAddress.toLowerCase() === embeddedWallet?.address?.toLowerCase()
  );

  // Filter out current user from top players if they're in the top 10
  const topPlayersWithoutCurrentUser = currentUser ?
    leaderboard.filter(player => player.walletAddress.toLowerCase() !== embeddedWallet?.address?.toLowerCase()) :
    leaderboard;

  return (
    <Wrapper>
      {/* Header */}
      <div
        style={{
          background: cardBg,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          marginBottom: '20px'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className={`w-6 h-6 ${isNight ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: 0,
              color: textColor
            }}>
              Leaderboard
            </h2>
          </div>

          {metadata && (
            <div className="flex flex-col sm:flex-row gap-4 text-sm" style={{ color: subTextColor }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Season {metadata.currentSeasonId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{metadata.totalPlayers} players</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current User Rank */}
      {currentUser && embeddedWallet?.address && (
        <div
          style={{
            background: cardBg,
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            boxShadow,
            overflow: 'hidden',
            marginBottom: '20px'
          }}
        >
          <div
            className="px-4 py-3 text-sm font-medium border-b"
            style={{
              background: isNight ? '#1a1a1a' : '#f9f9f9',
              color: textColor,
              borderColor: borderColor
            }}
          >
            My Rank
          </div>
          {renderPlayerCard(currentUser, -1, true)}
        </div>
      )}

      {/* Top Players */}
      <div
        style={{
          background: cardBg,
          borderRadius: '12px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          overflow: 'hidden'
        }}
      >
        <div
          className="px-4 py-3 text-sm font-medium border-b"
          style={{
            background: isNight ? '#1a1a1a' : '#f9f9f9',
            color: textColor,
            borderColor: borderColor
          }}
        >
          Top {limit}
        </div>
        <div className="divide-y" style={{ borderColor: borderColor }}>
          {topPlayersWithoutCurrentUser.map((player, index) => renderPlayerCard(player, index))}
        </div>

        {/* Footer */}
        {metadata && (
          <div
            className="px-4 py-3 text-center text-xs sm:text-sm border-t"
            style={{
              background: isNight ? '#1a1a1a' : '#f9f9f9',
              color: subTextColor,
              borderColor: borderColor
            }}
          >
            Last update: {new Date(metadata.lastUpdate).toLocaleString('fr-FR')}
          </div>
        )}
      </div>
    </Wrapper>
  );
}