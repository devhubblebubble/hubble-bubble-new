'use client';

import { useCallback, useEffect, useRef } from 'react';
import { TransitionRouter } from 'next-transition-router';

const BLOCK_SIZE = 60;
const BLOCK_COLOR = 'rgb(255, 79, 0)';
// Each block flips at a random moment inside this window, then takes DURATION to fade.
const SPREAD_MS = 380;
const DURATION_MS = 30;

type TransitionProviderProps = {
  children: React.ReactNode;
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Fades every block to `opacity` at a random moment, and calls `done` when the
 * last one has finished. Returns a function that stops the animation.
 */
function fadeBlocks(blocks: HTMLElement[], opacity: 0 | 1, delayMs: number, done: () => void) {
  if (blocks.length === 0 || typeof blocks[0].animate !== 'function') {
    blocks.forEach((block) => {
      block.style.opacity = String(opacity);
    });
    done();
    return () => {};
  }
  let cancelled = false;
  const animations = blocks.map((block) => {
    const animation = block.animate(
      [{ opacity: 1 - opacity }, { opacity }],
      { duration: DURATION_MS, delay: delayMs + Math.random() * SPREAD_MS, easing: 'ease-in-out', fill: 'both' },
    );
    // Keep the final state in the style, so no finished animation has to stay alive.
    animation.onfinish = () => {
      block.style.opacity = String(opacity);
      animation.cancel();
    };
    return animation;
  });
  Promise.all(animations.map((a) => a.finished)).then(
    () => {
      if (!cancelled) done();
    },
    () => {},
  );
  return () => {
    cancelled = true;
    animations.forEach((a) => a.cancel());
  };
}

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
        block.style.opacity = '0';
        container.appendChild(block);
        blocksRef.current.push(block);
      }
    }
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
        if (prefersReducedMotion()) {
          next();
          return;
        }
        return fadeBlocks(blocksRef.current, 1, 0, next);
      }}
      enter={(next) => {
        if (prefersReducedMotion()) {
          blocksRef.current.forEach((block) => {
            block.style.opacity = '0';
          });
          next();
          return;
        }
        blocksRef.current.forEach((block) => {
          block.style.opacity = '1';
        });
        return fadeBlocks(blocksRef.current, 0, 80, next);
      }}
    >
      <div ref={transitionGridRef} className="transition-grid" aria-hidden="true" />
      {children}
    </TransitionRouter>
  );
}
