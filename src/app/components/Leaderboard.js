'use client';

import Image from 'next/image';
import { Trophy, RotateCcw, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useTheme, useGame } from '@/context';
import Wrapper from '@/app/components/Wrapper';

// Top 100 displayed by default
export default function Leaderboard({ limit = 100 }) {
  const { data, loading, error, refresh } = useLeaderboard(limit);
  const { themeMode } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const subTextColor = isNight ? '#999' : '#666';

  const { embeddedWallet } = useGame()

  const formatScore = (score) => {
    return new Intl.NumberFormat('en-EN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(score);
  };

  const getRankStyle = (rank, isCurrentUser = false) => {
    if (isCurrentUser) {
      return {
        background: isNight
          ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
          : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        color: '#fff',
        fontWeight: 'bold'
      };
    }

    if (rank === 1) return {
      background: isNight
        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
        : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      color: '#000',
      fontWeight: 'bold'
    };
    if (rank === 2) return {
      background: isNight
        ? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
        : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
      color: '#000',
      fontWeight: 'bold'
    };
    if (rank === 3) return {
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

  const renderPlayerCard = (player, isCurrentUser = false) => (
    <div
      key={player.walletAddress}
      className="p-3 sm:p-4 md:p-6 hover:bg-opacity-50 transition-colors duration-200"
      style={{
        background: isCurrentUser
          ? (isNight ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)')
          : player.rank <= 3 ? (isNight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)') : 'transparent'
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {/* Rank */}
        <div className="flex-shrink-0">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm"
            style={getRankStyle(player.rank, isCurrentUser)}
          >
            {!isCurrentUser && player.rank === 1 && '🥇'}
            {!isCurrentUser && player.rank === 2 && '🥈'}
            {!isCurrentUser && player.rank === 3 && '🥉'}
            {(isCurrentUser || player.rank > 3) && `#${player.rank}`}
          </div>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {player.twitter.avatar ? (
            <Image
              src={player.twitter.avatar}
              alt={player.twitter.displayName || 'Avatar'}
              width={96}
              height={96}
              className="rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
              sizes="(min-width: 768px) 48px, (min-width: 640px) 40px, 32px"
            />
          ) : (
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold"
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
            <p className="text-sm sm:text-base md:text-lg font-semibold truncate" style={{ color: textColor, margin: 0 }}>
              {player.twitter.displayName || 'Anonymous User'}
              {isCurrentUser && (
                <span className="ml-1 sm:ml-2 text-xs font-normal px-1 sm:px-2 py-0.5 sm:py-1 rounded-full" style={{
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
          <p className="text-xs sm:text-sm truncate mt-0.5 sm:mt-1" style={{ color: subTextColor, margin: 0 }}>
            {player.walletAddress.slice(0, 6)}...{player.walletAddress.slice(-4)}
          </p>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: textColor }}>
            {formatScore(player.score)}
            <span className="text-xs sm:text-sm font-normal ml-1" style={{ color: subTextColor }}>
              pts
            </span>
          </div>
          <div className="text-xs sm:text-sm mt-0.5 sm:mt-1" style={{ color: subTextColor }}>
            <span className="mr-1 sm:mr-2">🔥 {player.streak}</span>
            <span>👆 {player.totalClicks}</span>
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
            padding: '30px 20px',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            boxShadow,
            textAlign: 'center'
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-2 border-transparent border-t-blue-500"></div>
            <p className="text-sm sm:text-base" style={{ color: textColor, margin: 0 }}>Loading leaderboard...</p>
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
            padding: '30px 20px',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            boxShadow,
            textAlign: 'center'
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm sm:text-base" style={{ color: isNight ? '#ef4444' : '#dc2626', margin: 0 }}>
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
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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
            padding: '30px 20px',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            boxShadow,
            textAlign: 'center'
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm sm:text-base" style={{ color: subTextColor, margin: 0 }}>No data available</p>
            <button
              onClick={refresh}
              style={{
                background: isNight
                  ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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

  // Pagination logic
  const totalPages = Math.ceil(topPlayersWithoutCurrentUser.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPagePlayers = topPlayersWithoutCurrentUser.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <Wrapper>
      {/* Header */}
      <div
        style={{
          background: cardBg,
          padding: '16px 20px',
          borderRadius: '12px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          marginBottom: '16px'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${isNight ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              color: textColor
            }} className="sm:text-2xl">
              Leaderboard
            </h2>
          </div>

          {metadata && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm" style={{ color: subTextColor }}>
              <div className="flex items-center gap-1 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Season {metadata.currentSeasonId}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
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
            marginBottom: '16px'
          }}
        >
          <div
            className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b"
            style={{
              background: isNight ? '#1a1a1a' : '#f9f9f9',
              color: textColor,
              borderColor: borderColor
            }}
          >
            My Rank
          </div>
          {renderPlayerCard(currentUser, true)}
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
          className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b flex items-center justify-between"
          style={{
            background: isNight ? '#1a1a1a' : '#f9f9f9',
            color: textColor,
            borderColor: borderColor
          }}
        >
          <span>Top Players</span>
          <span style={{ color: subTextColor }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: borderColor }}>
          {currentPagePlayers.map((player) => renderPlayerCard(player, false))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="px-3 sm:px-4 py-3 border-t"
            style={{
              background: isNight ? '#1a1a1a' : '#f9f9f9',
              borderColor: borderColor
            }}
          >
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? (isNight ? '#333' : '#e5e7eb') : (isNight ? '#4f46e5' : '#4f46e5'),
                  color: currentPage === 1 ? (isNight ? '#666' : '#999') : 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft className="w-3 h-3" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      style={{
                        background: pageNum === currentPage ? (isNight ? '#4f46e5' : '#4f46e5') : 'transparent',
                        color: pageNum === currentPage ? 'white' : textColor,
                        border: `1px solid ${pageNum === currentPage ? (isNight ? '#4f46e5' : '#4f46e5') : borderColor}`,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: pageNum === currentPage ? '600' : '400',
                        cursor: 'pointer',
                        minWidth: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? (isNight ? '#333' : '#e5e7eb') : (isNight ? '#4f46e5' : '#4f46e5'),
                  color: currentPage === totalPages ? (isNight ? '#666' : '#999') : 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {metadata && (
          <div
            className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm border-t"
            style={{
              background: isNight ? '#1a1a1a' : '#f9f9f9',
              color: subTextColor,
              borderColor: borderColor
            }}
          >
            Last update: {new Date(metadata.lastUpdate).toLocaleString('en-EN')}
          </div>
        )}
      </div>
    </Wrapper>
  );
}