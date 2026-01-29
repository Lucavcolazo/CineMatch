"use client";

import * as React from "react";

type PosterItem = {
  id: number;
  title: string;
  posterUrl: string;
};

type Props = {
  items: PosterItem[];
};

export function PosterCarousel({ items }: Props) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    const updateAnimation = () => {
      const firstChild = track.firstElementChild as HTMLElement;
      if (!firstChild) return;
      const cardWidth = firstChild.offsetWidth;
      const gap = 16;
      const singleSetWidth = items.length * (cardWidth + gap);
      const duration = singleSetWidth / 40;
      track.style.setProperty("--carousel-duration", `${duration}s`);
      track.style.setProperty("--carousel-width", `${singleSetWidth}px`);
    };

    const images = track.querySelectorAll("img");
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === images.length) setTimeout(updateAnimation, 100);
    };
    images.forEach((img) => {
      if (img.complete) checkLoaded();
      else {
        img.addEventListener("load", checkLoaded);
        img.addEventListener("error", checkLoaded);
      }
    });
    if (images.length === 0) updateAnimation();
  }, [items]);

  const duplicatedItems = [...items, ...items];

  return (
    <div className="overflow-x-hidden w-full">
      <div
        className="flex gap-4 py-2 animate-scroll-infinite will-change-transform"
        ref={trackRef}
      >
        {/* Mismo tamaño que en discover/search/modal: 160×240 px */}
        {duplicatedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 w-40 rounded-xl overflow-hidden relative transition-transform duration-200 border border-white/10 bg-black shadow-lg hover:-translate-y-1 hover:shadow-xl"
          >
            <img
              src={item.posterUrl}
              alt={item.title}
              className="w-full h-60 object-cover block"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
