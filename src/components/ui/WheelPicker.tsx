"use client";

import { useEffect, useRef, useState } from "react";

export interface WheelOption<T extends string | number> {
  value: T;
  label: string;
}

interface WheelPickerProps<T extends string | number> {
  options: WheelOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 항목 1개의 높이(px). 같은 그룹 안의 휠은 모두 같은 값을 써야 한다. */
  itemHeight?: number;
  /** 한 번에 보이는 항목 수. 가운데 정렬을 위해 홀수여야 한다. */
  visibleCount?: number;
  ariaLabel?: string;
  className?: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * iOS 드럼롤 스타일 휠 피커.
 *
 * 라이브러리 없이 CSS scroll-snap + 네이티브 관성 스크롤에 얹었다.
 * 터치 스크롤을 JS로 가로채지 않기 때문에 iOS WKWebView(Capacitor)에서도
 * 시스템 피커와 동일한 감속/바운스가 그대로 나온다.
 */
export default function WheelPicker<T extends string | number>({
  options,
  value,
  onChange,
  itemHeight = 36,
  visibleCount = 5,
  ariaLabel,
  className = "",
}: WheelPickerProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 사용자가 스크롤/관성 이동 중인 동안에는 프로그램 스크롤을 막아 감속을 끊지 않는다.
  const isScrollingRef = useRef(false);

  const foundIndex = options.findIndex((o) => o.value === value);
  const selectedIndex = foundIndex < 0 ? 0 : foundIndex;
  const [centerIndex, setCenterIndex] = useState(selectedIndex);

  const padCount = Math.floor(visibleCount / 2);
  const padHeight = padCount * itemHeight;

  // 마운트 시점과 외부에서 value가 바뀐 경우에만 스크롤 위치를 맞춘다.
  // 사용자가 굴려서 바뀐 값이면 스크롤 위치가 이미 목표와 같으므로 아무 일도 안 한다.
  useEffect(() => {
    if (isScrollingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const target = selectedIndex * itemHeight;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTop = target;
      setCenterIndex(selectedIndex);
    }
  }, [selectedIndex, itemHeight]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (settleRef.current) clearTimeout(settleRef.current);
    };
  }, []);

  function handleScroll() {
    isScrollingRef.current = true;

    if (settleRef.current) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 160);

    // 프레임당 한 번만 읽어서 관성 스크롤 중 과도한 리렌더를 막는다.
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      const idx = clamp(
        Math.round(el.scrollTop / itemHeight),
        0,
        options.length - 1
      );
      setCenterIndex(idx);
      const next = options[idx];
      if (next && next.value !== value) onChange(next.value);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const delta = e.key === "ArrowDown" ? 1 : -1;
    const next = options[clamp(selectedIndex + delta, 0, options.length - 1)];
    if (next && next.value !== value) onChange(next.value);
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      className={`relative flex-1 overflow-y-auto snap-y snap-mandatory outline-none overscroll-contain touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      style={{
        height: itemHeight * visibleCount,
        // 위아래로 갈수록 흐려지는 드럼 곡면 느낌
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)",
        maskImage:
          "linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)",
      }}
    >
      <div style={{ height: padHeight }} aria-hidden />

      {options.map((opt, i) => {
        const distance = Math.abs(i - centerIndex);
        const isCenter = distance === 0;
        return (
          <div
            key={String(opt.value)}
            role="option"
            aria-selected={opt.value === value}
            onClick={() => {
              if (opt.value !== value) onChange(opt.value);
            }}
            className={`flex items-center justify-center snap-center select-none transition-colors ${
              isCenter ? "text-ink font-medium" : "text-ink-3"
            }`}
            style={{
              height: itemHeight,
              fontSize: isCenter ? 17 : 15,
              opacity: distance >= 2 ? 0.45 : 1,
            }}
          >
            {opt.label}
          </div>
        );
      })}

      <div style={{ height: padHeight }} aria-hidden />
    </div>
  );
}

interface WheelPickerGroupProps {
  children: React.ReactNode;
  itemHeight?: number;
  visibleCount?: number;
}

/**
 * 휠 여러 개를 하나의 피커처럼 묶고, 가운데 선택 밴드를 깔아준다.
 * itemHeight/visibleCount는 안에 넣는 WheelPicker와 반드시 같아야 한다.
 */
export function WheelPickerGroup({
  children,
  itemHeight = 36,
  visibleCount = 5,
}: WheelPickerGroupProps) {
  const padCount = Math.floor(visibleCount / 2);
  return (
    <div
      className="relative rounded-[14px] bg-surface overflow-hidden"
      style={{ height: itemHeight * visibleCount }}
    >
      <div
        className="pointer-events-none absolute inset-x-2 rounded-[10px] bg-surface-muted"
        style={{ top: padCount * itemHeight, height: itemHeight }}
        aria-hidden
      />
      <div className="relative flex h-full">{children}</div>
    </div>
  );
}
