"use client";

import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import type { EligibilityModalProps } from "./EligibilityModal";

// The pop-up is a lot of code and most visitors never open it, so it is not
// part of the page. Its code is fetched when someone is about to press a button
// that opens it (see preloadOnIntent), or at the latest when they do. Once it
// has arrived, opening it takes no waiting at all.
type ModalComponent = typeof import("./EligibilityModal").default;

let loaded: ModalComponent | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function fetchModal(): Promise<void> {
  loading ??= import("./EligibilityModal").then(
    (module) => {
      loaded = module.default;
      listeners.forEach((listener) => listener());
    },
    (error) => {
      loading = null; // let a later try fetch it again
      throw error;
    },
  );
  return loading;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getLoaded = () => loaded;
const getNothing = () => null;

/** Starts fetching the pop-up's code. Safe to call as often as you like. */
export function preloadEligibility() {
  fetchModal().catch(() => {});
}

/** Props that make a button fetch the pop-up when a pointer, finger or keyboard reaches it. */
export const preloadOnIntent = {
  onPointerEnter: preloadEligibility,
  onFocus: preloadEligibility,
} as const;

/* The pop-up component arrives from a download, but it is one and the same component for the
   life of the page, so it is safe to draw it here. (The rule below cannot tell.) */
/* eslint-disable react-hooks/static-components */
export default function EligibilityModal(props: EligibilityModalProps) {
  const Modal = useSyncExternalStore(subscribe, getLoaded, getNothing);

  // If the code cannot be fetched (offline, or the site was updated while the
  // page was open), close the pop-up and load the contact page instead of
  // leaving a dead button.
  const giveUp = useEffectEvent(() => {
    props.onClose();
    window.location.assign("/contact/");
  });
  useEffect(() => {
    if (loaded) return;
    fetchModal().catch(giveUp);
  }, []);

  // Shown for a moment when the code is not there yet: the same dim backdrop the pop-up has.
  if (!Modal) {
    return (
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0, 0, 0, 0.7)" }} />
    );
  }
  return <Modal {...props} />;
}
/* eslint-enable react-hooks/static-components */
