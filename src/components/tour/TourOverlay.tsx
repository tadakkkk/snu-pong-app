"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

export interface TourStep {
  selector?: string;
  title: string;
  desc: string;
}

interface Props {
  steps: TourStep[];
  storageKey: string;
}

interface ElemRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const TOOLTIP_H = 160;
const TIP_GAP = 10;
const SIDE = 16;

export default function TourOverlay({ steps, storageKey }: Props) {
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<ElemRect | null>(null);
  const [entered, setEntered] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setActive(true);
  }, [storageKey]);

  const dismiss = useCallback(() => {
    localStorage.setItem(storageKey, "1");
    setActive(false);
  }, [storageKey]);

  const doMeasure = useCallback((el: HTMLElement, container: HTMLElement) => {
    if (!overlayRef.current) return;
    const elR = el.getBoundingClientRect();
    const cR = container.getBoundingClientRect();
    setRect({
      top: elR.top - cR.top,
      left: elR.left - cR.left,
      width: elR.width,
      height: elR.height,
    });
  }, []);

  const measureRect = useCallback(() => {
    if (!overlayRef.current) return;
    const container = overlayRef.current.parentElement;
    if (!container) return;

    const step = steps[stepIdx];
    if (!step) return;

    if (!step.selector) {
      setRect(null);
      return;
    }

    const el = document.querySelector<HTMLElement>(step.selector);
    if (!el) {
      const next = stepIdx + 1;
      if (next >= steps.length) {
        localStorage.setItem(storageKey, "1");
        setActive(false);
      } else {
        setStepIdx(next);
      }
      return;
    }

    el.scrollIntoView({ behavior: "auto", block: "center" });
    requestAnimationFrame(() => {
      doMeasure(el, container);
      setTimeout(() => {
        if (!overlayRef.current) return;
        const c = overlayRef.current.parentElement;
        if (c) doMeasure(el, c);
      }, 50);
    });
  }, [steps, stepIdx, storageKey, doMeasure]);

  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(measureRect);
    return () => cancelAnimationFrame(id);
  }, [active, stepIdx, measureRect]);

  useEffect(() => {
    if (!active) return;
    window.addEventListener("resize", measureRect);
    return () => window.removeEventListener("resize", measureRect);
  }, [active, measureRect]);

  const goNext = useCallback(() => {
    if (stepIdx >= steps.length - 1) {
      dismiss();
    } else {
      setRect(null);
      setStepIdx((i) => i + 1);
    }
  }, [stepIdx, steps.length, dismiss]);

  const isCentered = !steps[stepIdx]?.selector;
  const showTooltip = active && (isCentered || rect !== null);

  useEffect(() => {
    if (!showTooltip) {
      setEntered(false);
      return;
    }
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [showTooltip, stepIdx]);

  if (!active) return null;

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const containerH =
    overlayRef.current?.parentElement?.getBoundingClientRect().height ?? 700;

  // Band vertical bounds (clamped to frame)
  const bandTop = rect ? Math.max(0, rect.top - PAD) : 0;
  const bandBottom = rect
    ? Math.min(containerH, rect.top + rect.height + PAD)
    : 0;

  // Tooltip placement
  const spaceBelow = containerH - bandBottom;
  const tooltipBelow = spaceBelow >= TOOLTIP_H + TIP_GAP;

  let tipStyle: CSSProperties = {};
  if (!isCentered) {
    const slideY = entered ? 0 : tooltipBelow ? 8 : -8;
    if (tooltipBelow) {
      tipStyle = {
        top: Math.min(bandBottom + TIP_GAP, containerH - TOOLTIP_H - SIDE),
        left: SIDE,
        right: SIDE,
        opacity: entered ? 1 : 0,
        transform: `translateY(${slideY}px)`,
      };
    } else {
      tipStyle = {
        bottom: Math.min(
          containerH - bandTop + TIP_GAP,
          containerH - TOOLTIP_H - SIDE
        ),
        left: SIDE,
        right: SIDE,
        opacity: entered ? 1 : 0,
        transform: `translateY(${slideY}px)`,
      };
    }
  }

  return (
    // Container is always transparent; each overlay layer is a child div.
    <div ref={overlayRef} className="absolute inset-0 z-50">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes tour-overlay-in { from{opacity:0} to{opacity:1} }
        @keyframes tour-card-in { from{opacity:0;transform:translateY(calc(-50% + 40px)) scale(0.9)} to{opacity:1;transform:translateY(-50%) scale(1)} }
        @keyframes tour-emoji-bounce { 0%{transform:scale(1) rotate(0)} 28%{transform:scale(1.15) rotate(-8deg)} 52%{transform:scale(0.95) rotate(6deg)} 72%{transform:scale(1.05) rotate(-3deg)} 100%{transform:scale(1) rotate(0)} }
      `}} />

      {/* ── Band mode (selector steps) ── */}
      {!isCentered && (
        <>
          {/* Full dark while rect not yet measured (between steps) */}
          {!rect && <div className="absolute inset-0 bg-black/60" />}

          {/* Split dark strips once rect is known */}
          {rect && (
            <>
              <div
                className="absolute inset-x-0 top-0 bg-black/60 transition-all duration-300"
                style={{ height: bandTop }}
              />
              <div
                className="absolute inset-x-0 bottom-0 bg-black/60 transition-all duration-300"
                style={{ top: bandBottom }}
              />
              <div
                className="absolute inset-x-0 bg-white/80 transition-all duration-300"
                style={{ top: bandTop, height: 2 }}
              />
              <div
                className="absolute inset-x-0 bg-white/80 transition-all duration-300"
                style={{ top: bandBottom - 2, height: 2 }}
              />
            </>
          )}

          {/* Tooltip */}
          {rect && (
            <div
              className="absolute bg-white rounded-xl p-4 shadow-lg transition-all duration-200"
              style={tipStyle}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-[15px] text-ink leading-tight pr-2">
                  {step.title}
                </p>
                <p className="text-[11px] text-ink-3 shrink-0 mt-0.5">
                  {stepIdx + 1}/{steps.length}
                </p>
              </div>
              <p className="text-[13px] text-ink-3 mt-1 mb-3 leading-relaxed">
                {step.desc}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={dismiss}
                  className="text-[12px] text-ink-3 active:opacity-60"
                >
                  건너뛰기
                </button>
                <button
                  onClick={goNext}
                  className="bg-blue text-white text-[13px] font-medium rounded-lg px-4 py-1.5 active:opacity-80"
                >
                  {isLast ? "시작하기" : "다음"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Centered disclaimer card (no-selector steps) ── */}
      {isCentered && (
        <>
          {/* Overlay fades in separately */}
          <div
            className="absolute inset-0 bg-black/60"
            style={{ animation: "tour-overlay-in 250ms ease-out both" }}
          />

          {/* Card bounces up from below */}
          <div
            key={stepIdx}
            className="absolute bg-white rounded-3xl p-6 shadow-xl"
            style={{
              top: "50%",
              left: SIDE,
              right: SIDE,
              // translateY(-50%) is baked into the keyframe so it doesn't fight base transform
              animation:
                "tour-card-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}
          >
            {/* Emoji wiggles after card lands */}
            <p
              className="text-center text-[36px] mb-3 leading-none"
              style={{
                display: "block",
                animation: "tour-emoji-bounce 600ms ease-in-out 380ms both",
              }}
            >
              💡
            </p>
            <p className="font-bold text-[17px] text-ink text-center mb-3">
              {step.title}
            </p>
            <div className="mb-5 space-y-3">
              {step.desc.split("\n\n").map((para, i) => (
                <p key={i} className="text-[13px] text-ink-3 leading-relaxed">
                  • {para}
                </p>
              ))}
            </div>
            <button
              onClick={goNext}
              className="w-full bg-blue text-white text-[15px] font-semibold rounded-xl py-3 active:opacity-80"
            >
              시작하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
