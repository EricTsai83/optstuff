import { useEffect, useRef } from "react";

type AnimationState = {
  readonly scanProgress: number;
  readonly isOptimized: boolean;
  readonly isScanning: boolean;
  readonly opacity: number;
  readonly wasOptimizing: boolean;
  readonly transitionStartTime: number;
  readonly pauseStartTime: number;
};

type UseScanAnimationParams = {
  readonly autoPlay: boolean;
  readonly scanDuration: number;
  readonly pauseDuration: number;
  readonly onFrame: (state: AnimationState) => void;
};

/**
 * Scan animation logic hook
 */
export const useScanAnimation = ({
  autoPlay,
  scanDuration,
  pauseDuration,
  onFrame,
}: UseScanAnimationParams) => {
  const animationFrameIdRef = useRef<number | undefined>(undefined);
  const scanProgressRef = useRef(0);
  const isOptimizedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const pauseStartTimeRef = useRef(0);
  const transitionStartTimeRef = useRef(0);
  const wasOptimizingRef = useRef(false);
  const onFrameRef = useRef(onFrame);

  // Update onFrame ref to avoid dependency changes
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const animate = () => {
      const now = Date.now();

      // === State machine ===
      if (autoPlay) {
        if (!isOptimizedRef.current) {
          const elapsed = now - startTimeRef.current;
          scanProgressRef.current = Math.min(
            (elapsed / scanDuration) * 100,
            100,
          );

          if (scanProgressRef.current >= 100) {
            isOptimizedRef.current = true;
            pauseStartTimeRef.current = now;
            transitionStartTimeRef.current = now;
            wasOptimizingRef.current = true;
          }
        } else {
          const pauseElapsed = now - pauseStartTimeRef.current;
          if (pauseElapsed >= pauseDuration) {
            scanProgressRef.current = 0;
            isOptimizedRef.current = false;
            startTimeRef.current = now;
            wasOptimizingRef.current = false;
          }
        }
      }

      const isScanning = autoPlay && !isOptimizedRef.current;
      const opacity = isOptimizedRef.current ? 0.85 : isScanning ? 0.7 : 0.5;

      onFrameRef.current({
        scanProgress: scanProgressRef.current,
        isOptimized: isOptimizedRef.current,
        isScanning,
        opacity,
        wasOptimizing: wasOptimizingRef.current,
        transitionStartTime: transitionStartTimeRef.current,
        pauseStartTime: pauseStartTimeRef.current,
      });

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [autoPlay, scanDuration, pauseDuration]);
};
