'use client'

import { Loader2, CheckCircle2, XCircle, Search, X } from 'lucide-react'
import Image from 'next/image'
import Wrapper from '@/app/components/Wrapper'
import { useTheme } from '@/context'
import { useState, useEffect, useMemo } from 'react'
import CheckerStyles from './Checker.module.css'
import { RabbitIcon } from 'lucide-react'

// Configuration des whitelists
const WHITELIST_CONFIG = [
  {
    type: 'fluffles',
    displayName: 'Fluffles FCFS Phase'
  },
  {
    type: 'gtd',
    displayName: 'Guaranteed Whitelist'
  },
  {
    type: 'fcfs',
    displayName: 'First Come First Serve'
  },
];

function LoadingModal({ isNight }) {
  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const overlayBg = isNight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: isMobile ? '160%' : '120%',
        backgroundColor: overlayBg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '20px'
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: '12px',
          padding: '48px 24px',
          border: `1px solid ${borderColor}`,
          boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px'
        }}
      >
        <Loader2
          size={48}
          style={{
            animation: 'spin 1s linear infinite',
            color: isNight ? '#4f46e5' : '#6366f1'
          }}
        />
        <p style={{
          fontSize: '16px',
          fontWeight: '600',
          color: textColor,
          margin: 0,
          textAlign: 'center'
        }}>
          Checking your eligiblity...
        </p>
      </div>
    </div>
  );
}


function ResultModal({ whitelistData, isNight, onClose }) {
  // ✅ Les Hooks DOIVENT être appelés en premier, avant tout early return
  const [showConfetti, setShowConfetti] = useState(false);

  const textColor = isNight ? '#eee' : '#333';
  const cardBg = isNight ? '#222' : '#f3f3f3';
  const borderColor = isNight ? '#444' : '#ddd';
  const labelColor = isNight ? '#ccc' : '#333';
  const image = whitelistData?.image;
  const overlayBg = isNight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Créer la liste des whitelists avec leurs données
  const whitelists = useMemo(() => {
    if (!whitelistData) return [];
    return WHITELIST_CONFIG.map(config => {
      const data = whitelistData[config.type];
      return {
        ...config,
        count: data?.count || 0,
        isWhitelisted: data?.isWhitelisted || false
      };
    }).filter(wl => wl.isWhitelisted);
  }, [whitelistData]);

  // Déclencher les confettis si éligible
  useEffect(() => {
    if (whitelists.length > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [whitelists.length]);

  // ✅ Early return APRÈS les Hooks
  if (!whitelistData) return null;

  // Générer les confettis
  const generateConfetti = () => {
    return Array.from({ length: 50 }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 2 + Math.random() * 1;
      const color = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)];

      return (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: `${left}%`,
            top: '-10px',
            width: '8px',
            height: '8px',
            backgroundColor: color,
            borderRadius: '50%',
            pointerEvents: 'none',
            animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
            zIndex: 51,
          }}
        />
      );
    });
  };

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {/* Confettis */}
      {showConfetti && generateConfetti()}

      <div
        style={{
          position: 'fixed',
          top: 15,
          left: 0,
          width: '100%',
          height: isMobile ? '150%' : '120%',
          backgroundColor: overlayBg,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '10px',
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '540px',
            width: '100%',
            maxHeight: '100vh',
            overflowY: 'auto',
            border: `1px solid ${borderColor}`,
            boxShadow: isNight ? '0 0 8px rgba(255,255,255,0.05)' : '0 2px 6px rgba(0,0,0,0.1)',
            color: textColor,
            animation: 'bounce-in 0.4s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Video / Image */}
          {image && (
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '200px', height: '200px', borderRadius: '16px', overflow: 'hidden' }}>
                {image.endsWith('.mp4') ? (
                  <video
                    src={image}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img src={image} alt="Result" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>
            </div>
          )}

          {/* Whitelists Section */}
          <div style={{ marginBottom: '16px' }}>
            {whitelists.length > 0 ? (
              <>
                {/* Success Banner */}
                <div
                  style={{
                    background: isNight ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${isNight ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.3)'}`,
                    textAlign: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: isNight ? '#86efac' : '#22c55e',
                    margin: 0,
                  }}>
                    <RabbitIcon className="inline-block w-5 h-5 mr-2 mb-1" />
                    You&apos;re eligible!
                  </p>
                </div>

                {/* Header Divider */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: `1px solid ${borderColor}`,
                  position: 'relative'
                }}>
                </div>

                {/* Whitelists List */}
                {whitelists.map((whitelist, index) => (
                  <div
                    key={whitelist.type}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: index < whitelists.length - 1 ? '12px' : '0',
                      paddingBottom: index < whitelists.length - 1 ? '12px' : '0',
                      borderBottom: index < whitelists.length - 1 ? `1px solid ${borderColor}` : 'none'
                    }}
                  >
                    {/* Checkmark Circle */}
                    <div style={{
                      background: isNight ? '#4f46e5' : '#6366f1',
                      color: 'white',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginRight: '16px',
                      flexShrink: 0
                    }}>
                      ✓
                    </div>

                    {/* Whitelist Info */}
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: labelColor,
                        margin: '0 0 4px 0'
                      }}>
                        {whitelist.displayName}
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: textColor,
                        lineHeight: '1.5',
                        margin: 0,
                        fontWeight: '400'
                      }}>
                        <span style={{ fontWeight: '600' }}>{whitelist.count} spot{whitelist.count > 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              /* Not Whitelisted Message */
              <div
                style={{
                  background: isNight ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: `1px solid ${borderColor}`,
                  textAlign: 'center',
                }}
              >
                <XCircle className="w-10 h-10 mx-auto mb-3" style={{ color: isNight ? '#fca5a5' : '#dc2626' }} />
                <p style={{ fontSize: '14px', fontWeight: '600', color: textColor, margin: 0 }}>
                  Sorry, this address is not whitelisted.
                </p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              background: isNight ? '#4f46e5' : '#6366f1',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

function CheckWhitelistButton({ isNight }) {
  const [isChecking, setIsChecking] = useState(false);
  const [whitelistData, setWhitelistData] = useState(null);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const textColor = isNight ? '#eee' : '#333';
  const borderColor = isNight ? '#444' : '#ddd';

  const VIDEO_COUNTS = {
    ok: 3,
    ko: 7,
    fluffles: 1
  };

  const getRandomImage = (isEligible, isEligibleFluffles) => {
    const folder = isEligible ? (isEligibleFluffles ? 'fluffles' : 'ok') : 'ko';
    const count = VIDEO_COUNTS[folder];
    const randomIndex = Math.floor(Math.random() * count) + 1;
    return `/img/whitelist/${folder}/${randomIndex}.mp4`;
  };

  const handleCheckWhitelist = async () => {
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      setError('Please enter a valid address');
      return;
    }

    if (!trimmedAddress.startsWith('0x')) {
      setError('Address must start with 0x');
      return;
    }

    const hexPattern = /^0x[0-9a-fA-F]+$/;
    if (!hexPattern.test(trimmedAddress)) {
      setError('Address must be in hexadecimal format (0x followed by hex characters)');
      return;
    }

    if (trimmedAddress.length !== 42) {
      setError('Address must be 42 characters long (0x + 40 hex characters)');
      return;
    }

    setWhitelistData(null);
    setIsChecking(true);
    setError(null);
    setIsLoading(true);
    setShowResultModal(true);

    try {
      const timeout = new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('/api/whitelist/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: trimmedAddress })
      });

      await timeout;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const isEligible = data.gtd?.isWhitelisted || data.fcfs?.isWhitelisted || data.fluffles?.isWhitelisted;
      const isEligibleFluffles = data.fluffles?.isWhitelisted;
      const randomImage = getRandomImage(isEligible, isEligibleFluffles);

      setWhitelistData({ ...data, image: randomImage });

    } catch (err) {
      console.error('Error checking eligibility:', err);
      setError('Failed to check eligibility. Please try again later.');
      setShowResultModal(false);
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  };

  // Fonction pour effacer l'input
  const handleClearAddress = () => {
    setAddress('');
    setError(null);
    setIsHovering(false);
  };

  return (
    <>
      <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Enter wallet address (0x...)"
            maxLength={42}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && address && !isChecking) {
                handleCheckWhitelist();
              }
            }}
            style={{
              width: '100%',
              background: isNight ? '#1a1a1a' : '#ffffff',
              color: textColor,
              border: `1px solid ${borderColor}`,
              padding: '12px 40px 12px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = isNight ? '#6366f1' : '#4f46e5';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = borderColor;
            }}
          />

          {/* Icône croix/loupe à droite de l'input */}
          <div
            onMouseDown={(e) => {
              if (address) {
                e.preventDefault();
                handleClearAddress();
              }
            }}
            onMouseEnter={() => {
              if (address) {
                setIsHovering(true);
              }
            }}
            onMouseLeave={() => {
              setIsHovering(false);
            }}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: address ? 'pointer' : 'default',
              color: isHovering && address ? (isNight ? '#ef4444' : '#dc2626') : (isNight ? '#666' : '#999'),
              transition: 'color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: address ? 'auto' : 'none',
              userSelect: 'none',
            }}
          >
            {address ? (
              <X size={18} strokeWidth={2.5} />
            ) : (
              <Search size={18} />
            )}
          </div>
        </div>

        <button
          onClick={handleCheckWhitelist}
          disabled={isChecking || !address}
          style={{
            width: '100%',
            background: isNight ? '#4f46e5' : '#6366f1',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isChecking || !address ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'opacity 0.2s ease',
            opacity: isChecking || !address ? 0.5 : 1,
          }}
          onMouseOver={(e) => {
            if (!isChecking && address) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseOut={(e) => {
            if (!isChecking && address) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {isChecking ? 'Checking...' : 'Check eligibility'}
        </button>

        {error && (
          <div
            style={{
              background: isNight ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              marginTop: '16px',
            }}
          >
            <p style={{
              fontSize: '13px',
              color: isNight ? '#fca5a5' : '#dc2626',
              margin: 0,
              textAlign: 'center',
            }}>
              {error}
            </p>
          </div>
        )}
      </div>

      {isLoading && <LoadingModal isNight={isNight} />}

      <ResultModal
        whitelistData={whitelistData}
        isNight={isNight}
        onClose={() => {
          setShowResultModal(false);
          setWhitelistData(null);
        }}
      />
    </>
  );
}


export default function Checker() {
  const { themeMode } = useTheme();
  const isNight = themeMode === 'dark';
  const textColor = isNight ? '#eee' : '#333';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const borderColor = isNight ? '#444' : '#ddd';

  return (
    <Wrapper>
      <p style={{ margin: "0 0 20px 0", padding: 10, color: textColor }} className="text-center italic">
        Enter your wallet address to check your eligibility.
      </p>

      <Image
        src={isMobile ? "/img/checker_mobile.jpg" : "/img/checker.jpg"}
        alt="Logo"
        width={isMobile ? 300 : 500}
        height={isMobile ? 300 : 500}
        style={{
          margin: "10px auto 20px",
          display: "block",
          borderRadius: 12,
          borderColor: isNight ? '#444' : '#ddd',
          borderWidth: 1,
          borderStyle: 'solid'
        }}
      />

      {/* Header */}
      <div
        className={CheckerStyles.responsiveContainer}
        style={{
          borderBottom: `1px solid ${borderColor}`,
        }}></div>

      <div style={{ margin: "20px 0", marginTop: 30 }}>
        <CheckWhitelistButton isNight={isNight} />
      </div>
    </Wrapper >
  )
}