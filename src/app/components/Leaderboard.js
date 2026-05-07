'use client';

import Image from 'next/image';
import { Trophy, RotateCcw, Users, Calendar, ChevronLeft, ChevronRight, Zap, Target, Flame, ScrollText, Copy, Download, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useTheme, useGame } from '@/context';
import Wrapper from '@/app/components/Wrapper';
import { getLeagueFromMetrics, getLeagueCardBackground } from '@/utils/league';
import { useShareCard } from '../hooks/useShareCard';

export default function Leaderboard({ }) {
  const {
    leaderboard,
    metadata,
    loading,
    error,
    refresh,
    retry,
    getUserData,
    stats,
    canRetry
  } = useLeaderboard();

  const { themeMode } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [initialLoadTimeout, setInitialLoadTimeout] = useState(false);
  const itemsPerPage = 10;

  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const subTextColor = isNight ? '#999' : '#666';

  const {
    prepareShareCard,
    closeShareCard,
    copyShareCard,
    saveShareCard,
    openShareOnTwitter,
    shareCard,
    isGenerating
  } = useShareCard({
    logoSrc: '/img/logo.png', // logo app
  });

  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };


  const { embeddedWallet } = useGame();

  // Timeout uniquement pendant un chargement actif, sans setState synchrone dans l'effet
  useEffect(() => {
    if (!loading || stats.hasData || error) {
      const resetTimeout = setTimeout(() => {
        setInitialLoadTimeout((prev) => (prev ? false : prev));
      }, 0);
      return () => clearTimeout(resetTimeout);
    }

    const timeout = setTimeout(() => {
      setInitialLoadTimeout(true);
    }, 120000); // 2 minutes

    return () => clearTimeout(timeout);
  }, [loading, stats.hasData, error]);

  const formatScore = (score) => {
    return new Intl.NumberFormat('en-EN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(score);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-EN').format(number);
  };

  const leagueByWallet = useMemo(() => {
    const map = new Map();
    const totalPlayers = Number(metadata?.totalPlayers || leaderboard.length || 0);
    for (const player of leaderboard) {
      const wallet = player?.walletAddress?.toLowerCase?.();
      if (!wallet) continue;
      map.set(wallet, getLeagueFromMetrics({
        rank: Number(player?.rank || 0),
        totalPlayers
      }));
    }
    return map;
  }, [leaderboard, metadata?.totalPlayers]);

  const getPlayerLeague = (player) => {
    const wallet = player?.walletAddress?.toLowerCase?.();
    if (!wallet) return getLeagueFromMetrics({ rank: 0, totalPlayers: Number(metadata?.totalPlayers || leaderboard.length || 0) });
    return leagueByWallet.get(wallet) || getLeagueFromMetrics({});
  };

  const shareRankOnTwitter = async (player) => {
    if (!player || isGenerating) return;
    const league = getPlayerLeague(player);

    showToast('Generating your card…', 'loading');

    const card = await prepareShareCard({ player, league });

    if (card) {
      showToast('Share card ready', 'success');
    } else {
      showToast('Could not generate card', 'error');
    }
  };

  const handleCopyShareCard = async () => {
    const success = await copyShareCard();
    showToast(
      success ? 'Image copied. Paste it into your post.' : 'Copy is not available in this browser',
      success ? 'success' : 'error'
    );
  };

  const handleSaveShareCard = () => {
    const success = saveShareCard();
    showToast(success ? 'Image saved' : 'Could not save image', success ? 'success' : 'error');
  };

  const handleOpenShareOnTwitter = () => {
    const success = openShareOnTwitter();
    if (success) showToast('X share window opened', 'success');
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

  const renderPlayerCard = (player, isCurrentUser = false) => {
    const league = getPlayerLeague(player);
    const hasLeague = league.id !== 'none';

    return (
      <div
        key={player.walletAddress}
        className="p-3 sm:p-4 md:p-6 hover:bg-opacity-50 transition-colors duration-200"
        // Dans le style du div principal de renderPlayerCard
        style={{
          background: hasLeague
            ? getLeagueCardBackground(league.id, isNight)
            : isCurrentUser
              ? (isNight ? 'rgba(79,70,229,0.15)' : 'rgba(79,70,229,0.08)')
              : player.rank <= 3
                ? (isNight ? 'rgba(79,70,229,0.1)' : 'rgba(79,70,229,0.05)')
                : 'transparent',
          borderLeft: hasLeague
            ? `3px solid ${league.accent}`          // ← accent bar gauche
            : isCurrentUser
              ? '3px solid #4f46e5'
              : '3px solid transparent',
          borderTop: '1px solid transparent',
          borderRight: '1px solid transparent',
          borderBottom: `1px solid ${borderColor}`,
          borderRadius: '0px',                      // ← retirer le radius pour les items de liste
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
            {player.twitter?.avatar ? (
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
                {player.twitter?.displayName?.[0] || '?'}
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Display Name avec badge "You" */}
            <div className="flex items-center gap-1 min-w-0">
              <p className="text-xs sm:text-sm md:text-base font-semibold truncate flex-shrink" style={{ color: textColor, margin: 0 }}>
                {(() => {
                  const displayName = player.twitter?.displayName || 'Anonymous User';
                  const reservedSpace = isCurrentUser ? 35 : 0;
                  let maxLength;
                  if (window.innerWidth < 640) {
                    maxLength = Math.max(8, 15 - (reservedSpace / 8));
                  } else if (window.innerWidth < 768) {
                    maxLength = Math.max(10, 18 - (reservedSpace / 10));
                  } else if (window.innerWidth < 1024) {
                    maxLength = Math.max(12, 22 - (reservedSpace / 12));
                  } else {
                    maxLength = Math.max(15, 25 - (reservedSpace / 15));
                  }
                  return displayName.length > maxLength ?
                    `${displayName.slice(0, maxLength)}...` :
                    displayName;
                })()}
              </p>
              {isCurrentUser && (
                <span className="flex-shrink-0 text-xs font-normal px-1 py-0.5 rounded-full whitespace-nowrap" style={{
                  background: isNight ? '#4f46e5' : '#4f46e5',
                  color: 'white'
                }}>
                  You
                </span>
              )}
            </div>

            {/* Username */}
            {player.twitter?.username && (
              <div className="min-w-0 mt-0.5">
                <span className="text-xs truncate block" style={{ color: subTextColor }}>
                  @{(() => {
                    const username = player.twitter.username;
                    let maxUsernameLength;
                    if (window.innerWidth < 640) {
                      maxUsernameLength = 10;
                    } else if (window.innerWidth < 768) {
                      maxUsernameLength = 12;
                    } else if (window.innerWidth < 1024) {
                      maxUsernameLength = 15;
                    } else {
                      maxUsernameLength = 18;
                    }
                    return username.length > maxUsernameLength ?
                      `${username.slice(0, maxUsernameLength)}...` :
                      username;
                  })()}
                </span>
              </div>
            )}

            {/* Wallet Address */}
            <p className="text-xs truncate mt-0.5" style={{ color: subTextColor, margin: 0 }}>
              {player.walletAddress.slice(0, 5)}...{player.walletAddress.slice(-4)}
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
              <div className="flex flex-wrap gap-1 sm:gap-2 justify-end">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Target className="w-3 h-3 text-blue-500" />
                  {formatNumber(player.totalClicks || 0)}
                </span>
                {player.maxClicks && (
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    {formatNumber(player.maxClicks)}
                  </span>
                )}
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Flame className="w-3 h-3 text-orange-500" />
                  {player.streak || 0}
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <ScrollText className="w-3 h-3 text-emerald-500" />
                  {player.questsClaimed || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== FIX: Améliorer la condition de chargement =====
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
            <p className="text-sm sm:text-base" style={{ color: textColor, margin: 0 }}>
              Loading leaderboard...
            </p>
            <p className="text-xs" style={{ color: subTextColor, margin: 0 }}>
              This may take a few moments...
            </p>
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
            <div className="flex gap-2">
              {canRetry && (
                <button
                  onClick={retry}
                  style={{
                    background: isNight
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 3px 8px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 6px rgba(245, 158, 11, 0.3)';
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              )}
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
                Refresh
              </button>
            </div>
          </div>
        </div>
      </Wrapper>
    );
  }

  // ===== FIX: Condition améliorée pour leaderboard vide =====
  if (!stats.hasData) {
    const isTimeout = initialLoadTimeout && !error;
    const displayError = error || (isTimeout ? 'Connection timeout - Unable to load leaderboard data after 2 minutes' : 'No players have played yet');

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
            <div className="text-4xl mb-2">
              {isTimeout ? '⏰' : '📭'}
            </div>
            <p className="text-sm sm:text-base font-medium" style={{
              color: (error && !isTimeout) ? (isNight ? '#ef4444' : '#dc2626') : textColor,
              margin: 0
            }}>
              {isTimeout ? 'Connection Timeout' : 'Leaderboard Empty'}
            </p>
            <p className="text-xs sm:text-sm text-center max-w-md" style={{ color: subTextColor, margin: 0 }}>
              {displayError}
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              {canRetry && (
                <button
                  onClick={() => {
                    setInitialLoadTimeout(false);
                    retry();
                  }}
                  style={{
                    background: isNight
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 3px 8px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 6px rgba(245, 158, 11, 0.3)';
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              )}
              <button
                onClick={() => {
                  setInitialLoadTimeout(false);
                  refresh();
                }}
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
                {isTimeout ? 'Try Again' : 'Refresh'}
              </button>
            </div>
            {isTimeout && (
              <p className="text-xs mt-2" style={{ color: subTextColor, margin: 0 }}>
                The server might be experiencing high load. Please try again.
              </p>
            )}
          </div>
        </div>
      </Wrapper>
    );
  }

  // Find current user in the leaderboard
  const currentUser = embeddedWallet?.address ? getUserData(embeddedWallet.address) : null;

  const displayData = leaderboard;
  const currentUserForView = currentUser && embeddedWallet?.address
    ? leaderboard.find(p => p.walletAddress.toLowerCase() === embeddedWallet.address.toLowerCase()) || currentUser
    : currentUser;

  // Filter out current user from top players
  const topPlayersWithoutCurrentUser = currentUserForView ?
    displayData.filter(player => player.walletAddress.toLowerCase() !== embeddedWallet?.address?.toLowerCase()) :
    displayData;

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

  const totalQuestsClaimed = leaderboard.reduce((sum, p) => sum + (parseInt(p.questsClaimed, 10) || 0), 0);

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
                <span>Season 1</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{stats.totalPlayers} players</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current User Rank */}
      {currentUserForView && embeddedWallet?.address && (
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
            className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b flex items-center justify-between gap-2"
            style={{
              background: isNight ? '#1a1a1a' : '#f9f9f9',
              color: textColor,
              borderColor: borderColor
            }}
          >
            <span>My Rank</span>
            <button
              type="button"
              onClick={() => shareRankOnTwitter(currentUserForView)}
              disabled={isGenerating}
              style={{
                background: isGenerating
                  ? (isNight ? '#374151' : '#d1d5db')
                  : 'linear-gradient(135deg, #0f1117 0%, #1a1d27 100%)',
                color: isGenerating ? (isNight ? '#6b7280' : '#9ca3af') : '#fff',
                border: `1px solid ${isGenerating ? 'transparent' : '#ffffff22'}`,
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                padding: '6px 12px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                boxShadow: isGenerating ? 'none' : '0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {isGenerating ? (
                <>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      border: '2px solid #6b7280',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Generating…
                </>
              ) : (
                <>
                  {/* X logo SVG */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Show Card
                </>
              )}
            </button>
          </div>
          {renderPlayerCard(currentUserForView, true)}
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
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: borderColor }}>
          {currentPagePlayers.length > 0 ? (
            currentPagePlayers.map((player) => renderPlayerCard(player, false))
          ) : (
            <div className="p-6 text-center" style={{ color: subTextColor }}>
              <p>No players found</p>
            </div>
          )}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                Last update: {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('en-EN') : 'N/A'}
              </div>
              <div className="flex flex-wrap gap-3 text-xs justify-center">
                <span>🏆 {stats.totalPlayers} competitors</span>
                {leaderboard[0] && (
                  <span>👑 Top: {formatScore(leaderboard[0].score)} pts</span>
                )}
                <span>📜 {formatNumber(totalQuestsClaimed)} quests claimed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Preview Modal */}
      {shareCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leaderboard-share-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: isNight ? 'rgba(0, 0, 0, 0.72)' : 'rgba(17, 24, 39, 0.36)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={closeShareCard}
        >
          <div
            style={{
              width: 'min(920px, 100%)',
              maxHeight: 'min(92vh, 760px)',
              overflow: 'auto',
              background: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              boxShadow,
              color: textColor,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '18px 20px',
                background: isNight ? '#1a1a1a' : '#f9f9f9',
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              <h3
                id="leaderboard-share-title"
                style={{
                  margin: 0,
                  fontSize: '22px',
                  lineHeight: 1.2,
                  fontWeight: 800,
                  color: textColor,
                }}
              >
                Share Rank
              </h3>
              <button
                type="button"
                aria-label="Close share preview"
                onClick={closeShareCard}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isNight ? '#222' : '#f3f3f3',
                  color: subTextColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div
                style={{
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: isNight ? '#111' : '#fff',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shareCard.previewUrl}
                  alt={`Digit Rabbits leaderboard rank ${shareCard.player?.rank || ''} share card`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '1200 / 630',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '12px',
                padding: '16px 20px 20px',
                background: isNight ? '#1a1a1a' : '#f9f9f9',
                borderTop: `1px solid ${borderColor}`,
              }}
              className="leaderboard-share-actions"
            >
              <button
                type="button"
                onClick={handleCopyShareCard}
                style={{
                  height: '52px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isNight ? '#222' : '#f3f3f3',
                  color: textColor,
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <Copy className="w-5 h-5" />
                Copy
              </button>
              <button
                type="button"
                onClick={handleSaveShareCard}
                style={{
                  height: '52px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <Download className="w-5 h-5" />
                Save
              </button>
              <button
                type="button"
                onClick={handleOpenShareOnTwitter}
                style={{
                  height: '52px',
                  borderRadius: '8px',
                  border: '1px solid #ffffff22',
                  background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 100%)',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            animation: 'fadeInUp 0.25s ease',
            background:
              toast.type === 'error'
                ? '#ef4444'
                : toast.type === 'loading'
                  ? (isNight ? '#1e293b' : '#f1f5f9')
                  : (isNight ? '#14532d' : '#dcfce7'),
            color:
              toast.type === 'loading' && !isNight ? '#0f172a' : '#fff',
            border:
              toast.type === 'loading'
                ? `1px solid ${isNight ? '#334155' : '#cbd5e1'}`
                : 'none',
          }}
        >
          {toast.type === 'loading' && (
            <span
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid currentColor',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }}
            />
          )}
          {toast.type === 'success' && '✅'}
          {toast.type === 'error' && '❌'}
          {toast.message}
        </div>
      )}
    </Wrapper>
  );
}
