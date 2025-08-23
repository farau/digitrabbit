'use client';

import Image from 'next/image';
import { Trophy, RotateCcw, Users, Calendar, ChevronLeft, ChevronRight, Zap, Target, Flame, ShoppingBag, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useTheme, useGame } from '@/context';
import Wrapper from '@/app/components/Wrapper';


export default function Leaderboard({ }) {
  const {
    leaderboard,
    metadata,
    loading,
    error,
    refresh,
    retry,
    getUserData,
    getTopItemBuyers,
    getItemsStats,
    stats,
    canRetry
  } = useLeaderboard();

  const { themeMode } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('score'); // 'score', 'items', 'clicks'
  const [initialLoadTimeout, setInitialLoadTimeout] = useState(false);
  const itemsPerPage = 10;

  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const boxShadow = isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)';
  const subTextColor = isNight ? '#999' : '#666';

  const { embeddedWallet } = useGame();

  // Timeout pour le chargement initial (2 minutes)
  useEffect(() => {
    if (!loading && !stats.hasData && !error) {
      const timeout = setTimeout(() => {
        setInitialLoadTimeout(true);
      }, 120000); // 2 minutes

      return () => clearTimeout(timeout);
    } else if (stats.hasData || error) {
      setInitialLoadTimeout(false);
    }
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

  // Fonction pour obtenir le top des joueurs par total de clics
  const getTopClickPlayers = (limit = null) => {
    return [...leaderboard]
      .filter(player => player.totalClicks && player.totalClicks > 0)
      .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }))
      .slice(0, limit || leaderboard.length);
  };

  // Fonction améliorée pour obtenir le top des acheteurs d'items avec recalcul du rang
  const getTopItemBuyersWithRank = (limit = null) => {
    return [...leaderboard]
      .filter(player => player.itemsBought && player.itemsBought.count > 0)
      .sort((a, b) => (b.itemsBought?.count || 0) - (a.itemsBought?.count || 0))
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }))
      .slice(0, limit || leaderboard.length);
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <p className="text-xs sm:text-sm md:text-base font-semibold truncate flex-shrink" style={{ color: textColor, margin: 0 }}>
                {(() => {
                  const displayName = player.twitter?.displayName || 'Anonymous User';
                  // Réserver de l'espace pour le badge "You" si nécessaire
                  const reservedSpace = isCurrentUser ? 35 : 0; // ~35px pour le badge "You"
                  let maxLength;
                  if (window.innerWidth < 640) { // mobile
                    maxLength = Math.max(8, 15 - (reservedSpace / 8)); // Ajuster selon l'espace réservé
                  } else if (window.innerWidth < 768) { // sm
                    maxLength = Math.max(10, 18 - (reservedSpace / 10));
                  } else if (window.innerWidth < 1024) { // md
                    maxLength = Math.max(12, 22 - (reservedSpace / 12));
                  } else { // lg+
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
            {player.twitter?.username && (
              <div className="min-w-0 flex-shrink-0">
                <span className="text-xs truncate block sm:inline whitespace-nowrap" style={{ color: subTextColor }}>
                  @{(() => {
                    const username = player.twitter.username;
                    // Longueur adaptative pour le username selon la taille d'écran
                    let maxUsernameLength;
                    if (window.innerWidth < 640) { // mobile
                      maxUsernameLength = 10;
                    } else if (window.innerWidth < 768) { // sm
                      maxUsernameLength = 12;
                    } else if (window.innerWidth < 1024) { // md
                      maxUsernameLength = 15;
                    } else { // lg+
                      maxUsernameLength = 18;
                    }
                    return username.length > maxUsernameLength ?
                      `${username.slice(0, maxUsernameLength)}...` :
                      username;
                  })()}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs truncate mt-0.5" style={{ color: subTextColor, margin: 0 }}>
            {player.walletAddress.slice(0, 5)}...{player.walletAddress.slice(-4)}
          </p>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: textColor }}>
            {viewMode === 'score' ? (
              <>
                {formatScore(player.score)}
                <span className="text-xs sm:text-sm font-normal ml-1" style={{ color: subTextColor }}>
                  pts
                </span>
              </>
            ) : viewMode === 'items' ? (
              <>
                {formatNumber(player.itemsBought?.count || 0)}
                <span className="text-xs sm:text-sm font-normal ml-1" style={{ color: subTextColor }}>
                  items
                </span>
              </>
            ) : (
              <>
                {formatNumber(player.totalClicks || 0)}
                <span className="text-xs sm:text-sm font-normal ml-1" style={{ color: subTextColor }}>
                  clicks
                </span>
              </>
            )}
          </div>
          <div className="text-xs sm:text-sm mt-0.5 sm:mt-1" style={{ color: subTextColor }}>
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-end">
              {/* Total clicks (sauf si c'est le mode clicks) */}
              {viewMode !== 'clicks' && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Target className="w-3 h-3 text-blue-500" />
                  {formatNumber(player.totalClicks || 0)}
                </span>
              )}
              {/* Best clicks si disponible */}
              {player.bestClicksInGame && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  {formatNumber(player.bestClicksInGame)}
                </span>
              )}
              {/* Items bought (sauf si c'est le mode items) */}
              {viewMode !== 'items' && player.itemsBought?.count > 0 && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <ShoppingBag className="w-3 h-3 text-green-500" />
                  {formatNumber(player.itemsBought.count)}
                </span>
              )}
            </div>
            {/* Informations supplémentaires sur une nouvelle ligne */}
            {(player.averageClicks || player.longestStreak || player.totalPointsClaimed) && (
              <div className="flex flex-wrap gap-1 sm:gap-2 justify-end mt-1 text-xs" style={{ color: subTextColor }}>
                {/* Streak */}
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Flame className="w-3 h-3 text-orange-500" />
                  {player.currentStreak || 0}
                </span>
                {player.totalPointsClaimed && (
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Gift className="w-3 h-3 text-violet-500" />
                    {formatNumber(player.totalPointsClaimed)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading || (!stats.hasData && !error && !initialLoadTimeout)) {
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
              {loading ? 'Loading leaderboard...' : 'Connecting to leaderboard...'}
            </p>
            {!loading && !stats.hasData && !error && (
              <p className="text-xs" style={{ color: subTextColor, margin: 0 }}>
                This may take a few moments...
              </p>
            )}
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

  if (!stats.hasData && (error || initialLoadTimeout)) {
    const isTimeout = initialLoadTimeout && !error;
    const displayError = error || (isTimeout ? 'Connection timeout - Unable to load leaderboard data after 2 minutes' : 'No data available');

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
              {isTimeout ? '⏰' : error ? '⚠️' : '📭'}
            </div>
            <p className="text-sm sm:text-base font-medium" style={{
              color: (error && !isTimeout) ? (isNight ? '#ef4444' : '#dc2626') : textColor,
              margin: 0
            }}>
              {isTimeout ? 'Connection Timeout' : error ? 'Error Loading Data' : 'No Data Available'}
            </p>
            <p className="text-xs sm:text-sm text-center max-w-md" style={{ color: subTextColor, margin: 0 }}>
              {displayError}
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
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

  // Find current user in the leaderboard using the hook helper
  const currentUser = embeddedWallet?.address ? getUserData(embeddedWallet.address) : null;

  // Get data based on view mode
  let displayData = leaderboard;
  let currentUserForView = currentUser;

  if (viewMode === 'items') {
    displayData = getTopItemBuyersWithRank(leaderboard.length);
    // Recalculer le rang du current user dans le classement items
    if (currentUser && embeddedWallet?.address) {
      const itemsLeaderboard = getTopItemBuyersWithRank(leaderboard.length);
      const userInItemsLeaderboard = itemsLeaderboard.find(p =>
        p.walletAddress.toLowerCase() === embeddedWallet.address.toLowerCase()
      );
      currentUserForView = userInItemsLeaderboard || null;

      // Si l'utilisateur n'est pas trouvé dans le classement items mais a des items
      if (!currentUserForView && currentUser.itemsBought?.count > 0) {
        // Calculer le rang parmi tous les acheteurs d'items
        const allItemBuyers = [...leaderboard]
          .filter(player => player.itemsBought && player.itemsBought.count > 0)
          .sort((a, b) => (b.itemsBought?.count || 0) - (a.itemsBought?.count || 0));

        const userRankInItems = allItemBuyers.findIndex(p =>
          p.walletAddress.toLowerCase() === embeddedWallet.address.toLowerCase()
        ) + 1;

        if (userRankInItems > 0) {
          currentUserForView = {
            ...currentUser,
            rank: userRankInItems
          };
        }
      }
    }
  } else if (viewMode === 'clicks') {
    displayData = getTopClickPlayers(leaderboard.length);
    // Recalculer le rang du current user dans le classement clicks
    if (currentUser && embeddedWallet?.address) {
      const clicksLeaderboard = getTopClickPlayers(leaderboard.length);
      const userInClicksLeaderboard = clicksLeaderboard.find(p =>
        p.walletAddress.toLowerCase() === embeddedWallet.address.toLowerCase()
      );
      currentUserForView = userInClicksLeaderboard || null;

      // Si l'utilisateur n'est pas trouvé dans le classement clicks mais a des clicks
      if (!currentUserForView && currentUser.totalClicks > 0) {
        // Calculer le rang parmi tous les clickers
        const allClickers = [...leaderboard]
          .filter(player => player.totalClicks && player.totalClicks > 0)
          .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0));

        const userRankInClicks = allClickers.findIndex(p =>
          p.walletAddress.toLowerCase() === embeddedWallet.address.toLowerCase()
        ) + 1;

        if (userRankInClicks > 0) {
          currentUserForView = {
            ...currentUser,
            rank: userRankInClicks
          };
        }
      }
    }
  } else if (viewMode === 'score') {
    // S'assurer que currentUserForView a le bon rang même en mode score
    if (currentUser && embeddedWallet?.address) {
      const userInScoreLeaderboard = leaderboard.find(p =>
        p.walletAddress.toLowerCase() === embeddedWallet.address.toLowerCase()
      );
      currentUserForView = userInScoreLeaderboard || currentUser;
    }
  }

  // Filter out current user from top players if they're in the top 10
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

  // Switch view mode and reset pagination
  const switchViewMode = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  // Get items stats for display
  const itemsStats = getItemsStats();

  // Get clicks stats
  const clicksStats = {
    totalClicks: leaderboard.reduce((sum, player) => sum + (parseInt(player.totalClicks) || 0), 0),
    playersWithClicks: leaderboard.filter(player => parseInt(player.totalClicks) > 0).length,
    averageClicks: leaderboard.length > 0 ?
      leaderboard.reduce((sum, player) => sum + (parseInt(player.totalClicks) || 0), 0) / leaderboard.length : 0,
    topClicker: displayData[0] || null
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
                <span>Season {metadata.seasonId || '0'}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{stats.totalPlayers} players</span>
              </div>
              {stats.hasItemsData && itemsStats && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{formatNumber(itemsStats.totalItems)} items bought</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div
        style={{
          background: cardBg,
          padding: '12px 16px',
          borderRadius: '12px',
          border: `1px solid ${borderColor}`,
          boxShadow,
          marginBottom: '16px'
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap" style={{ color: textColor }}>
            View by:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => switchViewMode('score')}
              title="Sort by total score points"
              style={{
                background: viewMode === 'score' ? (isNight ? '#4f46e5' : '#4f46e5') : 'transparent',
                color: viewMode === 'score' ? 'white' : textColor,
                border: `1px solid ${viewMode === 'score' ? (isNight ? '#4f46e5' : '#4f46e5') : borderColor}`,
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Trophy className="w-3 h-3" />
              <span>Score</span>
            </button>
            <button
              onClick={() => switchViewMode('clicks')}
              title="Sort by total clicks made"
              style={{
                background: viewMode === 'clicks' ? (isNight ? '#4f46e5' : '#4f46e5') : 'transparent',
                color: viewMode === 'clicks' ? 'white' : textColor,
                border: `1px solid ${viewMode === 'clicks' ? (isNight ? '#4f46e5' : '#4f46e5') : borderColor}`,
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Target className="w-3 h-3" />
              <span>Clicks</span>
            </button>
            {stats.hasItemsData && (
              <button
                onClick={() => switchViewMode('items')}
                title="Sort by number of items purchased"
                style={{
                  background: viewMode === 'items' ? (isNight ? '#4f46e5' : '#4f46e5') : 'transparent',
                  color: viewMode === 'items' ? 'white' : textColor,
                  border: `1px solid ${viewMode === 'items' ? (isNight ? '#4f46e5' : '#4f46e5') : borderColor}`,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Items</span>
              </button>
            )}
          </div>
        </div>

        {/* Légende des icônes */}
        <div className="mt-2 pt-2 border-t text-xs flex flex-wrap gap-4 justify-center" style={{
          borderColor: borderColor,
          color: subTextColor
        }}>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-blue-500" />
            <span>Total clicks</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span>Best in-game clicks</span>
          </div>
          {stats.hasItemsData && (
            <div className="flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-green-500" />
              <span>Items bought</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>Streak</span>
          </div>
          <div className="flex items-center gap-1">
            <Gift className="w-3 h-3 text-violet-500" />
            <span>Points claimed</span>
          </div>
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
            className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b"
            style={{
              background: isNight ? '#1a1a1a' : '#f9f9f9',
              color: textColor,
              borderColor: borderColor
            }}
          >
            My Rank
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
          <span>
            {viewMode === 'score' && 'Top players'}
            {viewMode === 'clicks' && 'Top clickers'}
            {viewMode === 'items' && 'Top item buyers'}
          </span>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                Last update: {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('en-EN') : 'N/A'}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {/* Stats spécifiques au mode */}
                {viewMode === 'items' && stats.hasItemsData && itemsStats && (
                  <>
                    <span>📊 {itemsStats.playersWithItems} buyers</span>
                    <span>🏪 {itemsStats.uniqueItems} items bought</span>
                    <span>📈 {formatScore(itemsStats.averageItemsPerBuyer)} items bought in avg/user</span>
                  </>
                )}
                {viewMode === 'clicks' && clicksStats.totalClicks > 0 && (
                  <>
                    <span>🎯 {clicksStats.playersWithClicks} clickers</span>
                    {clicksStats.topClicker && (
                      <span>👑 Top: {formatNumber(clicksStats.topClicker.totalClicks)} clicks</span>
                    )}
                  </>
                )}
                {viewMode === 'score' && (
                  <>
                    <span>🏆 {stats.totalPlayers} competitors</span>
                    {leaderboard[0] && (
                      <span>👑 Top: {formatScore(leaderboard[0].score)} pts</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}