'use client';

import { useCallback, useEffect, useRef } from 'react';
import { TransitionRouter } from 'next-transition-router';
import gsap from 'gsap';

const BLOCK_SIZE = 60;
const BLOCK_COLOR = 'rgb(255, 79, 0)';

type TransitionProviderProps = {
  children: React.ReactNode;
};

export default function TransitionProvider({ children }: TransitionProviderProps) {
  const transitionGridRef = useRef<HTMLDivElement | null>(null);
  const blocksRef = useRef<HTMLDivElement[]>([]);

  const createTransitionGrid = useCallback(() => {
    if (!transitionGridRef.current) return;

    const container = transitionGridRef.current;
    container.innerHTML = '';
    blocksRef.current = [];

    const gridWidth = window.innerWidth;
    const gridHeight = window.innerHeight;
    const columns = Math.ceil(gridWidth / BLOCK_SIZE);
    const rows = Math.ceil(gridHeight / BLOCK_SIZE) + 1;
    const offsetX = (gridWidth - columns * BLOCK_SIZE) / 2;
    const offsetY = (gridHeight - rows * BLOCK_SIZE) / 2;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const block = document.createElement('div');
        block.className = 'transition-block';
        block.style.width = `${BLOCK_SIZE}px`;
        block.style.height = `${BLOCK_SIZE}px`;
        block.style.left = `${col * BLOCK_SIZE + offsetX}px`;
        block.style.top = `${row * BLOCK_SIZE + offsetY}px`;
        block.style.backgroundColor = BLOCK_COLOR;
        container.appendChild(block);
        blocksRef.current.push(block);
      }
    }

    gsap.set(blocksRef.current, { opacity: 0 });
  }, []);

  useEffect(() => {
    createTransitionGrid();
    window.addEventListener('resize', createTransitionGrid);
    return () => window.removeEventListener('resize', createTransitionGrid);
  }, [createTransitionGrid]);

  return (
    <TransitionRouter
      auto
      leave={(next) => {
        // People who ask for less motion get an instant page change.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          next();
          return;
        }
        const tween = gsap.to(blocksRef.current, {
          opacity: 1,
          duration: 0.03,
          ease: 'power2.inOut',
          stagger: { amount: 0.38, from: 'random' },
          onComplete: next,
        });
        return () => tween.kill();
      }}
      enter={(next) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.set(blocksRef.current, { opacity: 0 });
          next();
          return;
        }
        gsap.set(blocksRef.current, { opacity: 1 });
        const tween = gsap.to(blocksRef.current, {
          opacity: 0,
          duration: 0.03,
          delay: 0.08,
          ease: 'power2.inOut',
          stagger: { amount: 0.38, from: 'random' },
          onComplete: next,
        });
        return () => tween.kill();
      }}
    >
      <div ref={transitionGridRef} className="transition-grid" aria-hidden="true" />
      {children}
    </TransitionRouter>
  );
}
