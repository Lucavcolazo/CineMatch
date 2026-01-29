"use client";

/* Carrusel horizontal con efecto de loop infinito usando CSS animations. */

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

    // Calculamos el ancho total de una copia de los items
    const updateAnimation = () => {
      const firstChild = track.firstElementChild as HTMLElement;
      if (!firstChild) return;
      
      const cardWidth = firstChild.offsetWidth;
      const gap = 16; // gap entre cards en px
      const singleSetWidth = items.length * (cardWidth + gap);
      
      // Establecemos la duración de la animación basada en el ancho
      // Velocidad aproximada: 40px por segundo (un poco más rápido)
      const duration = singleSetWidth / 40;
      track.style.setProperty('--carousel-duration', `${duration}s`);
      track.style.setProperty('--carousel-width', `${singleSetWidth}px`);
    };

    // Esperamos a que las imágenes se carguen
    const images = track.querySelectorAll('img');
    let loadedCount = 0;
    
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        setTimeout(updateAnimation, 100);
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        checkLoaded();
      } else {
        img.addEventListener('load', checkLoaded);
        img.addEventListener('error', checkLoaded);
      }
    });

    // Fallback si no hay imágenes o ya están cargadas
    if (images.length === 0) {
      updateAnimation();
    }
  }, [items]);

  // Duplicamos los items para el efecto infinito
  const duplicatedItems = [...items, ...items];

  return (
    <div className="carouselShell">
      <div className="carouselTrack carouselTrackInfinite" ref={trackRef}>
        {duplicatedItems.map((item, index) => (
          <div key={`${item.id}-${index}`} className="posterCard">
            <img src={item.posterUrl} alt={item.title} className="posterImage" />
          </div>
        ))}
      </div>
    </div>
  );
}
