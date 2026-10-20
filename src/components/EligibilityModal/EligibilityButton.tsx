"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import EligibilityModal from "./EligibilityModal";

type Props = {
  className?: string;
  children: ReactNode;
  /** Where people email their documents (from Site settings) */
  contactEmail: string;
  /** Booking link for the "book a call" screen (from Site settings) */
  bookingUrl?: string;
};

/**
 * A button that opens the eligibility check. The pop-up is drawn on the page
 * itself rather than inside the button's section, because the page's fade-in
 * effect would otherwise trap it inside that section.
 */
export default function EligibilityButton({ className, children, contactEmail, bookingUrl }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open &&
        createPortal(
          <EligibilityModal
            isOpen={open}
            onClose={() => setOpen(false)}
            contactEmail={contactEmail}
            bookingUrl={bookingUrl}
          />,
          document.body,
        )}
    </>
  );
}
