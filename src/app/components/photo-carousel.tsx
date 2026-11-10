"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
};

export default function PhotoCarousel({ slides, className, label }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const showSlide = (index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  };
  const activeSlide = slides[activeIndex];

  return (
    <div className={`photo-carousel ${className}`} role="region" aria-label={label} aria-roledescription="carousel">
      <Image
        key={activeSlide.src}
        className="photo-carousel__image"
        src={activeSlide.src}
        alt={activeSlide.alt}
        fill
        priority={activeIndex === 0}
        sizes="(max-width: 760px) 100vw, 52vw"
      />
      <div className="photo-carousel__caption" aria-live="polite">
        <span className="photo-carousel__detail">{activeSlide.detail}</span>
        <span className="photo-carousel__title">{activeSlide.title}</span>
      </div>
      <div className="photo-carousel__controls">
        <button type="button" aria-label="Previous photo" onClick={() => showSlide(activeIndex - 1)}>‹</button>
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        <button type="button" aria-label="Next photo" onClick={() => showSlide(activeIndex + 1)}>›</button>
      </div>
    </div>
  );
}
