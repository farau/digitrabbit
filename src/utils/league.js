export const LEAGUE_ORDER = ['gold', 'silver', 'bronze'];

export const LEAGUE_META = {
  gold: {
    id: 'gold',
    label: 'Gold League',
    shortLabel: 'Gold',
    badge: '🏆',
    accent: '#f59e0b',
  },
  silver: {
    id: 'silver',
    label: 'Silver League',
    shortLabel: 'Silver',
    badge: '🪙',
    accent: '#9ca3af',
  },
  bronze: {
    id: 'bronze',
    label: 'Bronze League',
    shortLabel: 'Bronze',
    badge: '🥉',
    accent: '#b45309',
  },
  none: {
    id: 'none',
    label: 'No League',
    shortLabel: 'Unranked',
    badge: '',
    accent: '#6b7280',
  },
};

function toPositiveInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  return Math.floor(n);
}

function getLeagueCutoffs(totalPlayers) {
  const total = toPositiveInt(totalPlayers);
  if (total === 0) {
    return { goldCutoff: 0, silverCutoff: 0, bronzeCutoff: 0 };
  }

  const goldCount = Math.max(1, Math.ceil(total * 0.10));
  const silverCount = Math.ceil(total * 0.20);
  const bronzeCount = Math.ceil(total * 0.20);

  const goldCutoff = Math.min(total, goldCount);
  const silverCutoff = Math.min(total, goldCutoff + silverCount);
  const bronzeCutoff = Math.min(total, silverCutoff + bronzeCount);

  return { goldCutoff, silverCutoff, bronzeCutoff };
}

export function calculateLeagueScore(metrics = {}) {
  const rank = toPositiveInt(metrics.rank);
  const totalPlayers = toPositiveInt(metrics.totalPlayers);

  if (!rank || !totalPlayers || rank > totalPlayers) return 0;
  return ((totalPlayers - rank + 1) / totalPlayers) * 100;
}

export function getLeagueFromMetrics(metrics = {}) {
  const rank = toPositiveInt(metrics.rank);
  const totalPlayers = toPositiveInt(metrics.totalPlayers);
  const score = calculateLeagueScore({ rank, totalPlayers });
  const { goldCutoff, silverCutoff, bronzeCutoff } = getLeagueCutoffs(totalPlayers);

  if (!rank || !totalPlayers || rank > totalPlayers) {
    return { ...LEAGUE_META.none, score, rank: null, totalPlayers };
  }

  if (rank <= goldCutoff) {
    return { ...LEAGUE_META.gold, score, rank, totalPlayers };
  }
  if (rank <= silverCutoff) {
    return { ...LEAGUE_META.silver, score, rank, totalPlayers };
  }
  if (rank <= bronzeCutoff) {
    return { ...LEAGUE_META.bronze, score, rank, totalPlayers };
  }
  return { ...LEAGUE_META.none, score, rank, totalPlayers };
}

export function getLeagueCardBackground(leagueId, isNight) {
  if (leagueId === 'gold') {
    return isNight
      ? 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(234,179,8,0.10) 100%)'
      : 'linear-gradient(135deg, rgba(251,191,36,0.30) 0%, rgba(245,158,11,0.16) 100%)';
  }
  if (leagueId === 'silver') {
    return isNight
      ? 'linear-gradient(135deg, rgba(148,163,184,0.22) 0%, rgba(100,116,139,0.12) 100%)'
      : 'linear-gradient(135deg, rgba(148,163,184,0.30) 0%, rgba(203,213,225,0.18) 100%)';
  }
  if (leagueId === 'bronze') {
    return isNight
      ? 'linear-gradient(135deg, rgba(180,83,9,0.28) 0%, rgba(120,53,15,0.14) 100%)'
      : 'linear-gradient(135deg, rgba(180,83,9,0.22) 0%, rgba(146,64,14,0.12) 100%)';
  }
  return 'transparent';
}