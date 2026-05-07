'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Brand color (from logo) ───────────────────────────────────────────────────
const BRAND_PINK = '#ec4899';

// ─── League colors ────────────────────────────────────────────────────────────
const LEAGUE_COLORS = {
    gold: {
        accent: '#f59e0b',
        accentLight: '#fbbf24',
        glow: 'rgba(245,158,11,0.55)',
        gradientCard: ['#1a1206', '#2d1f07', '#1a1206'],
        badge: 'GOLD',
        label: 'Gold League',
    },
    silver: {
        accent: '#9ca3af',
        accentLight: '#cbd5e1',
        glow: 'rgba(148,163,184,0.45)',
        gradientCard: ['#0f1318', '#1a2030', '#0f1318'],
        badge: 'SILVER',
        label: 'Silver League',
    },
    bronze: {
        accent: '#b45309',
        accentLight: '#d97706',
        glow: 'rgba(180,83,9,0.50)',
        gradientCard: ['#160d04', '#271508', '#160d04'],
        badge: 'BRONZE',
        label: 'Bronze League',
    },
    none: {
        accent: '#6b7280',
        accentLight: '#9ca3af',
        glow: 'rgba(107,114,128,0.35)',
        gradientCard: ['#0f1117', '#1a1d27', '#0f1117'],
        badge: '',
        label: 'Unranked',
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatScore(score) {
    return new Intl.NumberFormat('en-EN', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(score);
}

function formatNumber(n) {
    return new Intl.NumberFormat('en-EN').format(n);
}

function truncateWallet(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Load an image from a URL (handles CORS via proxy if needed)
function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // graceful fallback
        img.src = src;
    });
}

// Draw a rounded rectangle path
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Draw clipped circle image
function drawCircleImage(ctx, img, cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
}

// ─── Main generator ───────────────────────────────────────────────────────────
async function generateShareCard({ player, league, logoSrc = null }) {
    const W = 1200;
    const H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const lc = LEAGUE_COLORS[league?.id] || LEAGUE_COLORS.none;

    // ── Background gradient ──────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, lc.gradientCard[0]);
    bgGrad.addColorStop(0.5, lc.gradientCard[1]);
    bgGrad.addColorStop(1, lc.gradientCard[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Glow blobs ───────────────────────────────────────────────────────────
    const glowTop = ctx.createRadialGradient(200, 150, 0, 200, 150, 380);
    glowTop.addColorStop(0, lc.glow);
    glowTop.addColorStop(1, 'transparent');
    ctx.fillStyle = glowTop;
    ctx.fillRect(0, 0, W, H);

    const glowBot = ctx.createRadialGradient(W - 180, H - 120, 0, W - 180, H - 120, 300);
    glowBot.addColorStop(0, lc.glow.replace('0.5', '0.3').replace('0.55', '0.28').replace('0.45', '0.22').replace('0.35', '0.18'));
    glowBot.addColorStop(1, 'transparent');
    ctx.fillStyle = glowBot;
    ctx.fillRect(0, 0, W, H);

    // ── Border card ──────────────────────────────────────────────────────────
    roundRect(ctx, 18, 18, W - 36, H - 36, 24);
    ctx.strokeStyle = lc.accent + '55';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Grid lines (subtle) ──────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // ── Load images in parallel ───────────────────────────────────────────────
    const [avatarImg, logoImg] = await Promise.all([
        player.twitter?.avatar ? loadImage(player.twitter.avatar) : Promise.resolve(null),
        logoSrc ? loadImage(logoSrc) : Promise.resolve(null)
    ]);

    // ── Logo (top-right) — fond noir transparent via composite 'screen' ──────
    if (logoImg) {
        const lw = 480;
        const lh = Math.round((logoImg.height / logoImg.width) * lw); // ~215px
        const lx = W - lw - 36;
        const ly = 40;
        // 'screen' blend : pixels noirs (0,0,0) deviennent transparents,
        // le rose + blanc du logo restent visibles sur fond sombre
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.95;
        ctx.drawImage(logoImg, lx, ly, lw, lh);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    } else {
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.fillStyle = BRAND_PINK;
        ctx.textAlign = 'right';
        ctx.fillText('DIGIT RABBITS', W - 52, 62);
        ctx.textAlign = 'left';
    }

    // ── Subtle pink corner glow (cohérence branding logo) ────────────────────
    const cornerGrad = ctx.createRadialGradient(W, H / 2, 0, W, H / 2, 340);
    cornerGrad.addColorStop(0, 'rgba(236,72,153,0.12)');
    cornerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cornerGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Avatar ───────────────────────────────────────────────────────────────
    const avatarX = 90;
    const avatarY = H / 2 - 10;
    const avatarR = 72;

    // Avatar ring glow
    const ringGrad = ctx.createRadialGradient(avatarX, avatarY, avatarR - 4, avatarX, avatarY, avatarR + 10);
    ringGrad.addColorStop(0, lc.accent + 'cc');
    ringGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR + 10, 0, Math.PI * 2);
    ctx.fill();

    // Avatar ring
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR + 4, 0, Math.PI * 2);
    ctx.strokeStyle = lc.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (avatarImg) {
        drawCircleImage(ctx, avatarImg, avatarX, avatarY, avatarR);
    } else {
        // Fallback circle with initial
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
        ctx.fillStyle = '#2d2d2d';
        ctx.fill();
        ctx.font = `bold ${avatarR}px system-ui, sans-serif`;
        ctx.fillStyle = lc.accent;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            (player.twitter?.displayName?.[0] || '?').toUpperCase(),
            avatarX,
            avatarY
        );
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
    }

    // ── Rank badge (overlapping avatar, bottom-right) ────────────────────────
    const badgeX = avatarX + avatarR - 8;
    const badgeY = avatarY + avatarR - 8;
    const badgeR = 28;

    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = lc.accent;
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = `bold 18px system-ui, sans-serif`;
    ctx.fillStyle = league?.id === 'silver' ? '#1e293b' : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${player.rank}`, badgeX, badgeY);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // ── Player name + username ────────────────────────────────────────────────
    const textX = avatarX + avatarR + 52;
    let textY = avatarY - 82;

    // League badge pill
    if (league?.id && league.id !== 'none') {
        roundRect(ctx, textX, textY - 26, 160, 32, 16);
        ctx.fillStyle = lc.accent + 'cc';
        ctx.fill();
        ctx.strokeStyle = lc.accentLight;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillStyle = league.id === 'silver' ? '#1e293b' : '#fff';
        ctx.letterSpacing = '1px';
        ctx.fillText(lc.label.toUpperCase(), textX + 14, textY - 5);
        textY += 20;
    }

    // Display name
    const displayName = player.twitter?.displayName || 'Anonymous';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';

    // Truncate if too long
    let name = displayName;
    while (ctx.measureText(name).width > 580 && name.length > 3) {
        name = name.slice(0, -1);
    }
    if (name !== displayName) name += '…';

    ctx.fillText(name, textX, textY + 52);
    textY += 62;

    // @username
    if (player.twitter?.username) {
        ctx.font = '26px system-ui, sans-serif';
        ctx.fillStyle = lc.accentLight;
        ctx.fillText(`@${player.twitter.username}`, textX, textY + 26);
        textY += 36;
    }

    // Wallet
    ctx.font = '18px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(truncateWallet(player.walletAddress), textX, textY + 26);

    // ── Divider ───────────────────────────────────────────────────────────────
    const divY = H - 198;
    const divGrad = ctx.createLinearGradient(52, 0, W - 52, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.15, lc.accent + '66');
    divGrad.addColorStop(0.85, lc.accent + '66');
    divGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.moveTo(52, divY);
    ctx.lineTo(W - 52, divY);
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Stats row ─────────────────────────────────────────────────────────────
    const stats = [
        { color: '#f59e0b', letter: 'RB', label: 'RabbitPoints', value: formatScore(player.score) },
        { color: '#3b82f6', letter: 'C', label: 'Clicks', value: formatNumber(player.totalClicks || 0) },
        { color: '#eab308', letter: 'M', label: 'Max Clicks', value: formatNumber(player.maxClicks || 0) },
        { color: '#ef4444', letter: 'ST', label: 'Streak', value: String(player.streak || 0) },
        { color: '#10b981', letter: 'Q', label: 'Quests', value: formatNumber(player.questsClaimed || 0) },
    ];

    const statsY = divY + 28;
    const colW = (W - 104) / stats.length;

    stats.forEach((stat, i) => {
        const cx = 52 + colW * i + colW / 2;

        // Subtle pill bg
        roundRect(ctx, cx - colW / 2 + 10, statsY - 2, colW - 20, 106, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fill();
        ctx.strokeStyle = stat.color + '44';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Icon circle
        const iconR = 16;
        const iconY = statsY + 22;
        ctx.beginPath();
        ctx.arc(cx, iconY, iconR, 0, Math.PI * 2);
        ctx.fillStyle = stat.color + '33';
        ctx.fill();
        ctx.strokeStyle = stat.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Letter inside circle
        ctx.font = `bold ${stat.letter.length > 1 ? '10' : '13'}px system-ui, sans-serif`;
        ctx.fillStyle = stat.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stat.letter, cx, iconY);
        ctx.textBaseline = 'alphabetic';

        // Value (avec icône RB optionnelle)
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        if (stat.rbIcon) {
            const iconSize = 18;
            const textW = ctx.measureText(stat.value).width;
            const gap = 5;
            const totalW = textW + gap + iconSize;
            const textX2 = cx - totalW / 2;
            ctx.textAlign = 'left';
            ctx.fillText(stat.value, textX2, statsY + 66);
            const imgX = textX2 + textW + gap;
            const imgY = statsY + 66 - iconSize + 2;
            try { ctx.drawImage(stat.rbIcon, imgX, imgY, iconSize, iconSize); } catch (_) { }
            ctx.textAlign = 'center';
        } else {
            ctx.fillText(stat.value, cx, statsY + 66);
        }

        // Label
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.40)';
        ctx.fillText(stat.label, cx, statsY + 88);

        ctx.textAlign = 'left';
    });

    // ── Footer watermark ──────────────────────────────────────────────────────
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('digitrabbits.com', W / 2, H - 28);
    ctx.textAlign = 'left';

    return canvas;
}

function createTweetText({ player, league }) {
    return [
        `🐇 I'm ranked #${player.rank} on @DigitRabbits`,
        `${league?.badge || ''} ${league?.label || ''}`.trim(),
        ``,
        `⭐ ${new Intl.NumberFormat('en-EN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(player.score)} RabbitPoints`,
        `🎯 ${new Intl.NumberFormat('en-EN').format(player.totalClicks || 0)} clicks  ⚡ ${new Intl.NumberFormat('en-EN').format(player.maxClicks || 0)} best`,
        `🔥 ${player.streak || 0} streak  📜 ${new Intl.NumberFormat('en-EN').format(player.questsClaimed || 0)} quests claimed`,
        ``,
        `Join the race 👇`,
        `https://digitrabbits.com`,
    ].join('\n');
}

function openTwitterIntent(tweetText) {
    const w = 600, h = 560;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
    window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
        'share-twitter',
        `width=${w},height=${h},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useShareCard({ logoSrc = null } = {}) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [shareCard, setShareCard] = useState(null);
    const objectUrlRef = useRef(null);

    const revokePreviewUrl = useCallback(() => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
    }, []);

    useEffect(() => revokePreviewUrl, [revokePreviewUrl]);

    const prepareShareCard = useCallback(
        async ({ player, league }) => {
            if (!player || isGenerating) return null;
            setIsGenerating(true);

            try {
                const canvas = await generateShareCard({ player, league, logoSrc });
                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
                if (!blob) throw new Error('Could not create share image');

                revokePreviewUrl();

                const previewUrl = URL.createObjectURL(blob);
                objectUrlRef.current = previewUrl;

                const nextShareCard = {
                    blob,
                    previewUrl,
                    tweetText: createTweetText({ player, league }),
                    fileName: `digitrabbits-rank-${player.rank}.png`,
                    player,
                    league,
                };

                setShareCard(nextShareCard);
                return nextShareCard;
            } catch (err) {
                console.error('Share card error:', err);
                return null;
            } finally {
                setIsGenerating(false);
            }
        },
        [logoSrc, isGenerating, revokePreviewUrl]
    );

    const closeShareCard = useCallback(() => {
        setShareCard(null);
        revokePreviewUrl();
    }, [revokePreviewUrl]);

    const saveShareCard = useCallback(() => {
        if (!shareCard) return false;

        const a = document.createElement('a');
        a.href = shareCard.previewUrl;
        a.download = shareCard.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
    }, [shareCard]);

    const copyShareCard = useCallback(async () => {
        if (!shareCard) return false;

        try {
            if (!navigator.clipboard || !window.ClipboardItem) {
                throw new Error('Image clipboard is not supported');
            }

            await navigator.clipboard.write([
                new ClipboardItem({ [shareCard.blob.type]: shareCard.blob })
            ]);
            return true;
        } catch (err) {
            console.error('Copy share card error:', err);
            return false;
        }
    }, [shareCard]);

    const openShareOnTwitter = useCallback(() => {
        if (!shareCard) return false;
        openTwitterIntent(shareCard.tweetText);
        return true;
    }, [shareCard]);

    const shareOnTwitter = useCallback(
        async ({ player, league, formatScore: _fs, formatNumber: _fn }) => {
            if (!player || isGenerating) return;
            setIsGenerating(true);

            try {
                // 1. Generate card
                const canvas = await generateShareCard({ player, league, logoSrc });

                // 2. Download image
                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `digitrabbits-rank-${player.rank}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // 4. Open Twitter after 2s (let download settle)
                setTimeout(() => {
                    openTwitterIntent(createTweetText({ player, league }));
                }, 2000);

                return true; // signal success for toast
            } catch (err) {
                console.error('Share card error:', err);
                return false;
            } finally {
                setIsGenerating(false);
            }
        },
        [logoSrc, isGenerating]
    );

    return {
        shareOnTwitter,
        prepareShareCard,
        closeShareCard,
        copyShareCard,
        saveShareCard,
        openShareOnTwitter,
        shareCard,
        isGenerating,
    };
}
