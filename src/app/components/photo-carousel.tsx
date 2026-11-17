"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type PhotoSlide = {
  src: string;
  alt: string;
  title: string;
  detail: string;
};

type PhotoCarouselProps = {
  slides: PhotoSlide[];
  className: string;
  label: string;
  intervalDuration?: number;
  transitionDuration?: number;
};

export default function PhotoCarousel({
  slides,
  className,
  label,
  intervalDuration = 4000,
  transitionDuration = 650,
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<PhotoSlide | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHoverCapable, setIsHoverCapable] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const showSlide = useCallback((index: number) => {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === activeIndex) return;
    setPreviousSlide(slides[activeIndex]);
    setActiveIndex(nextIndex);
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(
      () => setPreviousSlide(null),
      prefersReducedMotion ? 250 : transitionDuration,
    );
  }, [activeIndex, prefersReducedMotion, slides, transitionDuration]);

  useEffect(() => {
    const hoverPreference = window.matchMedia("(hover: hover)");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreferences = () => {
      setIsHoverCapable(hoverPreference.matches);
      setPrefersReducedMotion(motionPreference.matches);
    };
    const updateVisibility = () => setIsHidden(document.visibilityState === "hidden");

    updatePreferences();
    updateVisibility();
    hoverPreference.addEventListener("change", updatePreferences);
    motionPreference.addEventListener("change", updatePreferences);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      hoverPreference.removeEventListener("change", updatePreferences);
      motionPreference.removeEventListener("change", updatePreferences);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (isPaused || isHidden || (isHoverCapable && isHovered) || slides.length < 2) return;
    const timer = window.setInterval(() => {
      showSlide(activeIndex + 1);
    }, intervalDuration);

    return () => window.clearInterval(timer);
  }, [activeIndex, intervalDuration, isHidden, isHoverCapable, isHovered, isPaused, showSlide, slides.length]);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  if (slides.length === 0) return null;
  const activeSlide = slides[activeIndex];

  return (
    <div
      className={`photo-carousel ${className}${prefersReducedMotion ? " photo-carousel--reduced-motion" : ""}`}
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
      onPointerEnter={() => { if (isHoverCapable) setIsHovered(true); }}
      onPointerLeave={() => setIsHovered(false)}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        const endX = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (startX === null || endX === undefined) return;
        const distance = endX - startX;
        if (Math.abs(distance) >= 40) showSlide(activeIndex + (distance < 0 ? 1 : -1));
      }}
    >
      {previousSlide && (
        <Image
          key={`previous-${previousSlide.src}`}
          className="photo-carousel__image photo-carousel__image--outgoing"
          src={previousSlide.src}
          alt=""
          fill
          aria-hidden="true"
          sizes={className === "photo-carousel--hero" ? "100vw" : "(max-width: 760px) 100vw, 52vw"}
          style={{ animationDuration: `${prefersReducedMotion ? 250 : transitionDuration}ms` }}
        />
      )}
      <Image
        key={activeSlide.src}
        className="photo-carousel__image"
        src={activeSlide.src}
        alt={activeSlide.alt}
        fill
        loading={className === "photo-carousel--hero" ? "eager" : "lazy"}
        sizes={className === "photo-carousel--hero" ? "100vw" : "(max-width: 760px) 100vw, 52vw"}
        style={{ animationDuration: `${prefersReducedMotion ? 250 : transitionDuration}ms` }}
      />
      <div className="photo-carousel__caption" aria-live="polite">
        <span className="photo-carousel__detail">{activeSlide.detail}</span>
        <span className="photo-carousel__title">{activeSlide.title}</span>
      </div>
      <div className="photo-carousel__controls">
        <button type="button" aria-label="Previous photo" onClick={() => showSlide(activeIndex - 1)}>‹</button>
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        <button type="button" aria-label="Next photo" onClick={() => showSlide(activeIndex + 1)}>›</button>
        <button
          type="button"
          aria-label={isPaused ? "Resume automatic slide rotation" : "Pause automatic slide rotation"}
          aria-pressed={isPaused}
          onClick={() => setIsPaused((paused) => !paused)}
        >
          {isPaused ? "▶" : "Ⅱ"}
        </button>
      </div>
    </div>
  );
}
