'use client';

import React, { useEffect, useRef } from 'react';

/**
 * MatrixRainCanvas
 * Rendu Canvas d'une cascade discrète de caractères ASCII / Katakana inspirée de Matrix.
 * Teinte grise semi-transparente discrète assurant une lisibilité optimale de l'interface.
 */
export const MatrixRainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -100);
      }
    };

    window.addEventListener('resize', handleResize);

    // Caractères ASCII, mathématiques, hexadécimaux et katakana
    const CHARS =
      '0123456789ABCDEF0123456789><+-/*#%[]{}ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
    const charArray = CHARS.split('');
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);

    // Position verticale de chaque colonne (démarrage échelonné pour un rendu naturel)
    let drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -100);
    }

    let lastTime = 0;
    const fps = 30; // 30 FPS pour un mouvement fluide et une consommation CPU ultra-basse
    const interval = 1000 / fps;

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      // Traînée de fondu subtile
      ctx.fillStyle = 'rgba(7, 10, 20, 0.12)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0) {
          // Tête de colonne légèrement plus claire
          ctx.fillStyle = 'rgba(215, 225, 240, 0.22)';
          ctx.fillText(text, x, y);

          // Corps de colonne en gris semi-transparent discret
          ctx.fillStyle = 'rgba(140, 155, 175, 0.09)';
          ctx.fillText(text, x, y - fontSize);
        }

        if (y > height && Math.random() > 0.985) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-85 transition-opacity duration-1000"
      style={{
        backgroundColor: '#070a14',
      }}
      aria-hidden="true"
    />
  );
};

export default MatrixRainCanvas;
