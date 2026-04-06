import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBalance } from "wagmi";

const ONBOARDING_STEPS = [
  {
    app: 'Game',
    title: 'Step 1',
    description: 'Game.exe is where you play to earn RabbitPoints and progress your account. To play, you need a Digit Rabbits NFT. You can find the purchase links in the Linktree section.'
  },
  {
    app: 'RabbitChat',
    title: 'Step 2',
    description: 'RabbitChat is the social hub where you earn points by chatting and interacting with RabbitBot. A leaderboard is available and can be checked anytime in the Leaderboard tab.'
  },
  {
    app: 'settings-send-funds',
    title: 'Step 3',
    description: 'Open Settings, click Add funds, and fund your embedded wallet with a small amount of ETH for gas fees.'
  },
  {
    app: 'Game',
    title: 'Step 4',
    description: 'Well, do you remember ? Click on Game.exe to play and earn RabbitPoints, unlock new quests, and progress your account. The more you play, the more you earn!'
  },
  {
    app: 'RabbitChat',
    title: 'Step 5',
    description: 'Again, here is the RabbitChat, the social hub where you earn points by chatting and interacting with RabbitBot or other players.'
  },
  {
    app: 'FAQ',
    title: 'Step 6',
    description: 'For more details about gameplay, points, chat, and rewards, refer to the FAQ section.'
  }
];

const ONBOARDING_GAS_WEI_THRESHOLD = 1000000000000000n; // 0.001 ETH (test threshold)
const FUNDING_SUBSTEP_COPY = 0;
const FUNDING_SUBSTEP_ADD_FUNDS = 1;
const FUNDING_SUBSTEP_LINK_WALLET = 2;

export function useMainPageOnboarding({
  embeddedWalletAddress,
  hasLoadedPlayerData,
  hasNoPoints,
  appZIndices,
  isMobile,
  show3DEffects,
  setShow3DEffects,
  openApp,
  closeApp,
}) {
  const [onboardingStepIndex, setOnboardingStepIndex] = useState(0);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingFundingSubStep, setOnboardingFundingSubStep] = useState(FUNDING_SUBSTEP_COPY);
  const [hasClickedLinkWallet, setHasClickedLinkWallet] = useState(false);
  const [onboardingTargetPosition, setOnboardingTargetPosition] = useState(null);
  const [onboardingBubblePosition, setOnboardingBubblePosition] = useState(null);
  const [onboardingTargetRect, setOnboardingTargetRect] = useState(null);
  const [typedOnboardingDescription, setTypedOnboardingDescription] = useState('');
  const onboardingTypingSoundRef = useRef(null);
  const onboardingStepCompleteSoundRef = useRef(null);

  const openAppRef = useRef(openApp);
  const closeAppRef = useRef(closeApp);

  useEffect(() => {
    openAppRef.current = openApp;
  }, [openApp]);

  useEffect(() => {
    closeAppRef.current = closeApp;
  }, [closeApp]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio('/sounds/text.wav');
    audio.volume = 0.08;
    audio.preload = 'auto';
    onboardingTypingSoundRef.current = audio;

    const completeAudio = new Audio('/sounds/text_complete.wav');
    completeAudio.volume = 0.12;
    completeAudio.preload = 'auto';
    onboardingStepCompleteSoundRef.current = completeAudio;

    return () => {
      if (onboardingTypingSoundRef.current) {
        onboardingTypingSoundRef.current.pause();
        onboardingTypingSoundRef.current = null;
      }
      if (onboardingStepCompleteSoundRef.current) {
        onboardingStepCompleteSoundRef.current.pause();
        onboardingStepCompleteSoundRef.current = null;
      }
    };
  }, []);

  const shouldRunOnboarding = Boolean(embeddedWalletAddress) && hasLoadedPlayerData && hasNoPoints && !onboardingDismissed;
  const activeOnboardingStep = shouldRunOnboarding ? ONBOARDING_STEPS[onboardingStepIndex] : null;
  const isFundingStep = activeOnboardingStep?.app === 'settings-send-funds';
  const isFundingCopySubStep = isFundingStep && onboardingFundingSubStep === FUNDING_SUBSTEP_COPY;
  const isFundingSendSubStep = isFundingStep && onboardingFundingSubStep === FUNDING_SUBSTEP_ADD_FUNDS;
  const isFundingLinkSubStep = isFundingStep && onboardingFundingSubStep === FUNDING_SUBSTEP_LINK_WALLET;
  const onboardingTargetAppOverride = null;

  const highestWindowZ = Math.max(
    0,
    ...Object.values(appZIndices || {})
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
  );
  const onboardingBaseZ = Math.max(5000, highestWindowZ + 50);

  const { data: walletBalance, refetch: refetchWalletBalance } = useBalance({
    address: embeddedWalletAddress,
  });

  const hasGasBalance = typeof walletBalance?.value === 'bigint'
    ? walletBalance.value > ONBOARDING_GAS_WEI_THRESHOLD
    : Number(walletBalance?.formatted || 0) > 1;

  const onboardingProgressText = `${Math.min(onboardingStepIndex + 1, ONBOARDING_STEPS.length)}/${ONBOARDING_STEPS.length}`;
  const onboardingDescriptionText = isFundingCopySubStep
    ? 'Copy the adress of your embedded wallet now.'
    : isFundingSendSubStep
      ? 'Click here to add funds on your embedded wallet.\nMake sure to have some ETH for gas fees to play the game.'
      : isFundingLinkSubStep
        ? 'Click Link wallet to connect wallets holding your Digit Rabbits NFTs.\nThis will allow you to play the game using your NFTs without transferring them to the embedded wallet.'
        : activeOnboardingStep?.description || '';
  const fundingLinkWarningText = isFundingLinkSubStep
    ? 'To play the game, simply link wallets that already hold your Digit Rabbits NFTs.\nNo need to transfer or purchase NFTs to your embedded wallet.'
    : '';
  const isFundingNextLocked = isFundingStep && (!hasGasBalance || !isFundingLinkSubStep || !hasClickedLinkWallet);

  useEffect(() => {
    if (!shouldRunOnboarding || isMobile) return;
    if (!show3DEffects) {
      setShow3DEffects(true);
      localStorage.setItem('show3DEffects', JSON.stringify(true));
    }
  }, [shouldRunOnboarding, isMobile, show3DEffects, setShow3DEffects]);

  useEffect(() => {
    if (!embeddedWalletAddress) {
      setOnboardingStepIndex(0);
      return;
    }

    if (!shouldRunOnboarding) {
      setOnboardingStepIndex(0);
    }
  }, [embeddedWalletAddress, shouldRunOnboarding, onboardingStepIndex]);

  useEffect(() => {
    if (!activeOnboardingStep) {
      setOnboardingTargetPosition(null);
      setOnboardingBubblePosition(null);
      setOnboardingTargetRect(null);
      return;
    }

    const updateTargetPosition = () => {
      const onboardingAppKey = onboardingTargetAppOverride
        || (isFundingCopySubStep
          ? 'settings-copy-wallet'
          : isFundingLinkSubStep
            ? 'settings-link-wallet'
            : activeOnboardingStep.app);
      const appKey = String(onboardingAppKey || '');
      const selectors = Array.from(new Set([
        `[data-app="${appKey}"]`,
        `[data-app="${appKey.toLowerCase()}"]`,
        `[data-app="${appKey.toUpperCase()}"]`
      ]));

      const targetElements = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
      const targetElement = targetElements.find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (!targetElement) {
        setOnboardingTargetPosition(null);
        setOnboardingBubblePosition(null);
        setOnboardingTargetRect(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const centerLeft = rect.left + rect.width / 2;
      const centerTop = rect.top + rect.height / 2;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const horizontalMargin = 12;
      const rabbitOffsetX = isMobile ? 0 : 52;
      const onboardingRightShift = isMobile ? 8 : 22;
      const bubbleWidth = isMobile ? Math.min(viewportWidth - 24, 320) : 360;
      const minCenter = horizontalMargin + bubbleWidth / 2;
      const maxCenter = viewportWidth - horizontalMargin - bubbleWidth / 2;
      const bubbleLeft = Math.min(Math.max(centerLeft + rabbitOffsetX * 0.85 + onboardingRightShift, minCenter), Math.max(minCenter, maxCenter));
      const bubbleHeight = isMobile ? 210 : 228;
      const topMin = 10;
      const topMax = Math.max(topMin, viewportHeight - bubbleHeight - 14);
      const preferredTop = centerTop - (isMobile ? 245 : 270);
      const bubbleTop = Math.min(Math.max(preferredTop, topMin), topMax);

      setOnboardingTargetPosition({
        left: centerLeft,
        top: centerTop,
      });
      setOnboardingTargetRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });

      setOnboardingBubblePosition({
        left: bubbleLeft,
        top: bubbleTop,
        width: bubbleWidth
      });
    };

    updateTargetPosition();
    const interval = setInterval(updateTargetPosition, 180);
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [activeOnboardingStep, onboardingStepIndex, isMobile, isFundingCopySubStep, isFundingLinkSubStep]);

  useEffect(() => {
    if (!shouldRunOnboarding || !isFundingStep) return;
    openAppRef.current?.('Settings', { force: true });
  }, [shouldRunOnboarding, isFundingStep]);

  useEffect(() => {
    if (!shouldRunOnboarding) {
      setOnboardingFundingSubStep(FUNDING_SUBSTEP_COPY);
      setHasClickedLinkWallet(false);
      return;
    }
    if (isFundingStep) {
      setOnboardingFundingSubStep(FUNDING_SUBSTEP_COPY);
      setHasClickedLinkWallet(false);
    }
  }, [shouldRunOnboarding, isFundingStep, onboardingStepIndex]);

  useEffect(() => {
    if (!shouldRunOnboarding || !isFundingCopySubStep) return;

    const handleEmbeddedWalletCopied = () => {
      setOnboardingFundingSubStep(FUNDING_SUBSTEP_ADD_FUNDS);
    };

    window.addEventListener('embedded-wallet-address-copied', handleEmbeddedWalletCopied);
    return () => {
      window.removeEventListener('embedded-wallet-address-copied', handleEmbeddedWalletCopied);
    };
  }, [shouldRunOnboarding, isFundingCopySubStep]);

  useEffect(() => {
    if (!shouldRunOnboarding || !isFundingStep || hasGasBalance) return;

    const interval = setInterval(() => {
      void refetchWalletBalance();
    }, 8000);

    return () => clearInterval(interval);
  }, [shouldRunOnboarding, isFundingStep, hasGasBalance, refetchWalletBalance]);

  useEffect(() => {
    if (!shouldRunOnboarding || !isFundingStep) return;
    if (!hasGasBalance) return;
    if (onboardingFundingSubStep >= FUNDING_SUBSTEP_LINK_WALLET) return;

    setOnboardingFundingSubStep(FUNDING_SUBSTEP_LINK_WALLET);
  }, [shouldRunOnboarding, isFundingStep, hasGasBalance, onboardingFundingSubStep]);

  useEffect(() => {
    if (!shouldRunOnboarding || !isFundingLinkSubStep) return;

    const handleLinkWalletClicked = () => {
      setHasClickedLinkWallet(true);
    };

    window.addEventListener('settings-link-wallet-clicked', handleLinkWalletClicked);
    return () => {
      window.removeEventListener('settings-link-wallet-clicked', handleLinkWalletClicked);
    };
  }, [shouldRunOnboarding, isFundingLinkSubStep]);

  useEffect(() => {
    if (!shouldRunOnboarding || !isFundingLinkSubStep) return;

    const scrollLinkWalletIntoView = () => {
      const linkWalletButton = document.querySelector('[data-app="settings-link-wallet"]');
      if (!linkWalletButton || typeof linkWalletButton.scrollIntoView !== 'function') return;
      linkWalletButton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    };

    scrollLinkWalletIntoView();
    const timeout = setTimeout(scrollLinkWalletIntoView, 180);

    return () => clearTimeout(timeout);
  }, [shouldRunOnboarding, isFundingLinkSubStep]);

  useEffect(() => {
    setTypedOnboardingDescription('');
    if (!onboardingDescriptionText) return;

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedOnboardingDescription(onboardingDescriptionText.slice(0, index));
      if (index === 1 || index % 3 === 0) {
        const typingSound = onboardingTypingSoundRef.current;
        if (typingSound) {
          typingSound.currentTime = 0;
          void typingSound.play().catch(() => { });
        }
      }
      if (index >= onboardingDescriptionText.length) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onboardingDescriptionText]);

  const advanceOnboardingStep = useCallback(() => {
    if (isFundingNextLocked) return;
    const stepCompleteSound = onboardingStepCompleteSoundRef.current;
    if (stepCompleteSound) {
      stepCompleteSound.currentTime = 0;
      void stepCompleteSound.play().catch(() => { });
    }

    if (isFundingStep && hasGasBalance) {
      closeAppRef.current?.('Settings');
    }

    if (onboardingStepIndex >= ONBOARDING_STEPS.length - 1) {
      if (!isMobile) {
        setShow3DEffects(true);
        localStorage.setItem('show3DEffects', JSON.stringify(true));
        sessionStorage.removeItem('3d_temp_disabled');
      }

      setShow3DEffects(true);
      localStorage.setItem('show3DEffects', JSON.stringify(true));
      sessionStorage.removeItem('3d_temp_disabled');
      setOnboardingDismissed(true);
      setOnboardingStepIndex(ONBOARDING_STEPS.length);
      openAppRef.current?.('FAQ', { force: true });

      setTimeout(() => {
        setShow3DEffects(true);
        localStorage.setItem('show3DEffects', JSON.stringify(true));
        sessionStorage.removeItem('3d_temp_disabled');
      }, 0);
      return;
    }

    setOnboardingStepIndex((previousStep) => Math.min(previousStep + 1, ONBOARDING_STEPS.length));
  }, [isFundingNextLocked, isFundingStep, hasGasBalance, onboardingStepIndex, isMobile, setShow3DEffects]);

  return useMemo(() => ({
    activeOnboardingStep,
    onboardingStepIndex,
    onboardingBaseZ,
    onboardingTargetPosition,
    onboardingBubblePosition,
    onboardingTargetRect,
    typedOnboardingDescription,
    onboardingProgressText,
    onboardingDescriptionText,
    fundingLinkWarningText,
    isFundingStep,
    isFundingCopySubStep,
    isFundingLinkSubStep,
    hasGasBalance,
    hasClickedLinkWallet,
    isFundingNextLocked,
    shouldRunOnboarding,
    onboardingTargetAppOverride,
    advanceOnboardingStep,
    onboardingStepsLength: ONBOARDING_STEPS.length,
  }), [
    activeOnboardingStep,
    onboardingStepIndex,
    onboardingBaseZ,
    onboardingTargetPosition,
    onboardingBubblePosition,
    onboardingTargetRect,
    typedOnboardingDescription,
    onboardingProgressText,
    onboardingDescriptionText,
    fundingLinkWarningText,
    isFundingStep,
    isFundingCopySubStep,
    isFundingLinkSubStep,
    hasGasBalance,
    hasClickedLinkWallet,
    isFundingNextLocked,
    shouldRunOnboarding,
    onboardingTargetAppOverride,
    advanceOnboardingStep,
  ]);
}
