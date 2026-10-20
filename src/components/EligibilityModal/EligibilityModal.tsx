"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./EligibilityModal.module.scss";

type Step =
  | "basic"
  | "studyStatus"
  | "preferences"
  | "proceed"
  | "upload"
  | "emailChecklist"
  | "downloading"
  | "bookCallScreen"
  | "success";

type ProceedOption = "uploadNow" | "sendEmail" | "bookCall";

type UploadCategoryId =
  | "passport"
  | "cv"
  | "marks10"
  | "marks12"
  | "degree"
  | "lor"
  | "englishTest";

interface UploadCategory {
  id: UploadCategoryId;
  label: string;
  required: boolean;
  multiple?: boolean;
}

interface FormState {
  name: string;
  email: string;
  age: string;
  qualification: string;
  contactNumber: string;
  studyStatus: string;
  countries: string[];
  universities: string[];
  proceedOption: ProceedOption | null;
  uploads: Record<UploadCategoryId, File[]>;
}

const COUNTRY_OPTIONS = ["UK", "USA", "Germany", "Canada", "Ireland", "Australia"];

const STUDY_STATUS_OPTIONS = [
  "I know which university and course I want to apply for",
  "I am not sure which university or course to apply for",
  "I know my dream career but do not know how to get there",
  "The course or university does not matter",
];

/**
 * Documents cannot be uploaded yet, because nothing stores them. Until there is
 * a safe place for passports and certificates, people email them instead (the
 * "sendEmail" option). Do not turn this on before uploads are actually saved.
 */
const UPLOADS_ENABLED = false;

const ALL_PROCEED_OPTIONS: Array<{ id: ProceedOption; label: string }> = [
  { id: "uploadNow", label: "I will upload my documents now" },
  { id: "sendEmail", label: "I will send my documents via email" },
  { id: "bookCall", label: "Book a call with a Hubble Bubble mentor" },
];

const PROCEED_OPTIONS = ALL_PROCEED_OPTIONS.filter(
  (option) => UPLOADS_ENABLED || option.id !== "uploadNow",
);

/** The options about sending documents, and the separate "talk to us" option. */
const DOCUMENT_OPTIONS = PROCEED_OPTIONS.filter((option) => option.id !== "bookCall");
const CALL_OPTIONS = PROCEED_OPTIONS.filter((option) => option.id === "bookCall");

const UPLOAD_CATEGORIES: UploadCategory[] = [
  { id: "passport", label: "Passport (front and back)", required: true },
  { id: "cv", label: "CV / Resume", required: true },
  { id: "marks10", label: "10th Standard Mark sheet (Vertical)", required: true },
  { id: "marks12", label: "12th Standard Mark sheet (Vertical)", required: true },
  { id: "degree", label: "Degree / Masters certificates", required: true, multiple: true },
  {
    id: "lor",
    label: "2 LORs (Letter of Recommendation from College and/or Workplace)",
    required: true,
    multiple: true,
  },
  {
    id: "englishTest",
    label: "English Proficiency test Certificate (IELTS/PTE/Duolingo)",
    required: true,
  },
];

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 5) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function getInitialFormState(): FormState {
  return {
    name: "",
    email: "",
    age: "",
    qualification: "",
    contactNumber: "",
    studyStatus: "",
    countries: [],
    universities: [""],
    proceedOption: null,
    uploads: {
      passport: [],
      cv: [],
      marks10: [],
      marks12: [],
      degree: [],
      lor: [],
      englishTest: [],
    },
  };
}

interface EligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Where people email their documents (from Site settings) */
  contactEmail: string;
  /** Booking link for the "book a call" screen (from Site settings) */
  bookingUrl?: string;
}

export default function EligibilityModal({ isOpen, onClose, contactEmail, bookingUrl }: EligibilityModalProps) {
  const [step, setStep] = useState<Step>("basic");
  const [form, setForm] = useState<FormState>(getInitialFormState);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  // The details already emailed to the team. Going Back and pressing Next again
  // must not send the same message twice.
  const [alreadySent, setAlreadySent] = useState<string | null>(null);
  // When the form opened. The server uses this to spot scripts that post instantly.
  const openedAt = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    openedAt.current = Date.now();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const universitiesTrimmed = useMemo(
    () => form.universities.map((item) => item.trim()).filter(Boolean),
    [form.universities]
  );

  const canGoNext = useMemo(() => {
    if (step === "basic") {
      return (
        form.name.trim().length > 1 &&
        isValidEmail(form.email) &&
        form.age.trim().length > 0 &&
        form.qualification.trim().length > 1 &&
        form.contactNumber.trim().length > 4
      );
    }

    if (step === "studyStatus") {
      return Boolean(form.studyStatus);
    }

    if (step === "preferences") {
      return form.countries.length > 0 && universitiesTrimmed.length > 0;
    }

    if (step === "proceed") {
      return Boolean(form.proceedOption);
    }

    if (step === "upload") {
      return UPLOAD_CATEGORIES.filter((item) => item.required).every(
        (item) => form.uploads[item.id].length > 0
      );
    }

    return true;
  }, [form, step, universitiesTrimmed.length]);

  if (!isOpen) {
    return null;
  }

  const closeModal = () => onClose();

  const goBack = () => {
    if (step === "studyStatus") setStep("basic");
    if (step === "preferences") setStep("studyStatus");
    if (step === "proceed") setStep("preferences");
    if (step === "upload") setStep("proceed");
    if (step === "emailChecklist") setStep("proceed");
    if (step === "bookCallScreen") setStep("proceed");
  };

  /** Emails the details to the team (through /api/eligibility), then moves on. */
  const sendDetailsAndContinue = async () => {
    const choice = form.proceedOption;
    if (sending || (choice !== "sendEmail" && choice !== "bookCall")) return;

    const nextScreen: Step = choice === "sendEmail" ? "emailChecklist" : "bookCallScreen";
    const details = JSON.stringify({
      name: form.name.trim(),
      email: form.email.trim(),
      age: form.age.trim(),
      qualification: form.qualification.trim(),
      contactNumber: form.contactNumber.trim(),
      studyStatus: form.studyStatus,
      countries: form.countries,
      universities: universitiesTrimmed,
      nextStep: choice,
    });
    if (details === alreadySent) {
      setStep(nextScreen);
      return;
    }

    setSending(true);
    setSendFailed(false);
    try {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(details), elapsedMs: Date.now() - openedAt.current }),
      });
      const body: { ok?: boolean } | null = await res.json().catch(() => null);
      if (res.ok && body?.ok) {
        setAlreadySent(details);
        setStep(nextScreen);
      } else {
        setSendFailed(true);
      }
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  };

  const goNext = () => {
    if (!canGoNext) return;

    if (step === "basic") setStep("studyStatus");
    if (step === "studyStatus") setStep("preferences");
    if (step === "preferences") setStep("proceed");
    if (step === "proceed") {
      if (form.proceedOption === "uploadNow") {
        // Only reachable when UPLOADS_ENABLED is on (see above)
        setStep("upload");
      } else {
        void sendDetailsAndContinue();
      }
    }
    if (step === "upload") setStep("success");
  };

  const toggleCountry = (country: string) => {
    setForm((previous) => {
      const exists = previous.countries.includes(country);
      return {
        ...previous,
        countries: exists
          ? previous.countries.filter((item) => item !== country)
          : [...previous.countries, country],
      };
    });
  };

  const setUniversityAt = (index: number, value: string) => {
    setForm((previous) => {
      const nextUniversities = [...previous.universities];
      nextUniversities[index] = value;
      return { ...previous, universities: nextUniversities };
    });
  };

  const addUniversity = () => {
    setForm((previous) => ({
      ...previous,
      universities: [...previous.universities, ""],
    }));
  };

  const addFiles = (categoryId: UploadCategoryId, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setForm((previous) => {
      const category = UPLOAD_CATEGORIES.find((item) => item.id === categoryId);
      const incoming = Array.from(files);
      const next = category?.multiple ? [...previous.uploads[categoryId], ...incoming] : incoming;

      return {
        ...previous,
        uploads: {
          ...previous.uploads,
          [categoryId]: next,
        },
      };
    });
  };

  const removeFile = (categoryId: UploadCategoryId, fileIndex: number) => {
    setForm((previous) => ({
      ...previous,
      uploads: {
        ...previous.uploads,
        [categoryId]: previous.uploads[categoryId].filter((_, index) => index !== fileIndex),
      },
    }));
  };

  const downloadChecklist = () => {
    const checklist = [
      "Hubble Bubble - Eligibility Checklist",
      "",
      `Please share the following documents to ${contactEmail}:`,
      "",
      "- Passport (front and back)",
      "- CV / Resume",
      "- 10th mark sheet (vertical)",
      "- 12th mark sheet (vertical)",
      "- Degree / Masters Certificates",
      "- 2 LORs with referee name, contact number and email",
      "- English Proficiency test Certificate (IELTS / PTE / Duolingo)",
    ].join("\n");

    const blob = new Blob([checklist], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hubblebubble-checklist.txt";
    link.click();
    URL.revokeObjectURL(url);
    setStep("downloading");
  };

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eligibility-title"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          aria-label="Close eligibility form"
          onClick={closeModal}
        >
          x
        </button>

        <h2 id="eligibility-title" className={styles.title}>
          Check Eligibility
        </h2>

        {step === "basic" && (
          <div className={styles.content}>
            <p className={styles.sectionLabel}>Basic Details</p>
            <div className={styles.formGrid}>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelRow}>
                  Name<span className={styles.required}>*</span>
                </span>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelRow}>
                  Email<span className={styles.required}>*</span>
                </span>
                <input
                  type="email"
                  className={styles.input}
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </label>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelRow}>
                  Age<span className={styles.required}>*</span>
                </span>
                <input
                  className={styles.input}
                  value={form.age}
                  onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
                />
              </label>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelRow}>
                  Current qualification<span className={styles.required}>*</span>
                </span>
                <input
                  className={styles.input}
                  value={form.qualification}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, qualification: event.target.value }))
                  }
                />
              </label>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelRow}>
                  Contact Number<span className={styles.required}>*</span>
                </span>
                <input
                  className={styles.input}
                  value={form.contactNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, contactNumber: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={goNext}
                disabled={!canGoNext}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === "studyStatus" && (
          <div className={styles.content}>
            <p className={styles.sectionHeading}>Current status in study abroad process</p>
            <div className={styles.optionGroup}>
              {STUDY_STATUS_OPTIONS.map((option) => {
                const isSelected = form.studyStatus === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, studyStatus: option }))}
                  >
                    <span className={styles.optionRadio}>{isSelected ? "●" : ""}</span>
                    {option}
                  </button>
                );
              })}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={goNext}
                disabled={!canGoNext}
              >
                Next
              </button>
              <button type="button" className={styles.secondaryButton} onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div className={styles.content}>
            <p className={styles.sectionHeading}>Select your preferred country and university</p>
            <div className={styles.formGrid}>
              <div className={styles.fieldLabel}>
                Country<span className={styles.required}>*</span>
                <div className={styles.chipGroup}>
                  {COUNTRY_OPTIONS.map((country) => {
                    const selected = form.countries.includes(country);
                    return (
                      <button
                        key={country}
                        type="button"
                        onClick={() => toggleCountry(country)}
                        className={`${styles.chip} ${selected ? styles.chipSelected : ""}`}
                      >
                        {country}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.fieldLabel}>
                University<span className={styles.required}>*</span>
                <div className={styles.formGrid}>
                  {form.universities.map((university, index) => (
                    <input
                      key={`university-${index}`}
                      className={styles.input}
                      placeholder={`University ${index + 1}`}
                      value={university}
                      onChange={(event) => setUniversityAt(index, event.target.value)}
                    />
                  ))}
                </div>
                <button type="button" className={styles.inlineLink} onClick={addUniversity}>
                  + Add more
                </button>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={goNext}
                disabled={!canGoNext}
              >
                Next
              </button>
              <button type="button" className={styles.secondaryButton} onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        )}

        {step === "proceed" && (
          <div className={styles.content}>
            <p className={styles.sectionHeading}>How do you want to proceed?</p>
            <div className={styles.optionGroup}>
              {DOCUMENT_OPTIONS.map((option) => {
                const selected = form.proceedOption === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.optionCard} ${selected ? styles.optionCardSelected : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, proceedOption: option.id }))}
                  >
                    <span className={styles.optionRadio}>{selected ? "●" : ""}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>

            <p className={styles.stillGotQuestions}>Still got questions?</p>

            <div className={styles.optionGroup}>
              {CALL_OPTIONS.map((option) => {
                const selected = form.proceedOption === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.optionCard} ${selected ? styles.optionCardSelected : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, proceedOption: option.id }))}
                  >
                    <span className={styles.optionRadio}>{selected ? "●" : ""}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>

            {sendFailed && (
              <p className={styles.errorText} role="alert">
                Sorry, we could not send your details. Please try again, or email us at{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
              </p>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={goNext}
                disabled={!canGoNext || sending}
              >
                {sending ? "Sending..." : "Next"}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        )}

        {step === "upload" && (
          <div className={styles.content}>
            <p className={styles.sectionLabel}>Upload Documents</p>
            <div className={styles.uploadList}>
              {UPLOAD_CATEGORIES.map((category) => {
                const files = form.uploads[category.id];
                return (
                  <div key={category.id} className={styles.uploadCard}>
                    <p className={styles.uploadLabel}>
                      {category.label}
                      {category.required ? <span className={styles.required}>*</span> : null}
                    </p>

                    {files.length > 0 && (
                      <div className={styles.fileStack}>
                        {files.map((file, index) => (
                          <div key={`${file.name}-${index}`} className={styles.fileRow}>
                            <span>{file.name}</span>
                            <button
                              type="button"
                              className={styles.removeFile}
                              onClick={() => removeFile(category.id, index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className={styles.uploadBox}>
                      Click to upload
                      <input
                        type="file"
                        className={styles.hiddenInput}
                        multiple={category.multiple}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={(event) => addFiles(category.id, event.target.files)}
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={goNext}
                disabled={!canGoNext}
              >
                Submit
              </button>
              <button type="button" className={styles.secondaryButton} onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        )}

        {step === "emailChecklist" && (
          <div className={styles.content}>
            <p className={styles.thanks}>Thanks, we have your details.</p>
            <p className={styles.sectionHeading}>Share the following documents to</p>
            <p className={styles.emailAddress}>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </p>
            <ul className={styles.checklist}>
              <li>Passport (front and back)</li>
              <li>CV/Resume</li>
              <li>Std 10th mark sheet (vertical)</li>
              <li>Std 12th mark sheet (vertical)</li>
              <li>Degree/Masters Certificates</li>
              <li>
                2 LORs - Letter of Recommendation from College and/or Workplace (must contain the
                name, contact number, and email ID of the referee)
              </li>
              <li>English Proficiency test Certificate (IELTS/PTE/Duolingo)</li>
            </ul>

            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={downloadChecklist}>
                Download Checklist
              </button>
              <button type="button" className={styles.secondaryButton} onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        )}

        {step === "bookCallScreen" && (
          <div className={`${styles.content} ${styles.centered}`}>
            <Image
              src="/images/herosection/astronaut.webp"
              alt="Astronaut illustration"
              width={170}
              height={170}
              className={styles.stateImage}
            />
            <h3 className={styles.stateTitle}>Let&apos;s talk</h3>
            <p className={styles.stateText}>
              Thanks, we have your details. Book a call with a Hubble Bubble Mentor and begin your
              dream journey!
            </p>
            <div className={styles.actions}>
              <a
                href={bookingUrl || "/contact"}
                {...(bookingUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={styles.primaryButton}
              >
                Book now
              </a>
              <button type="button" className={styles.secondaryButton} onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        )}

        {step === "downloading" && (
          <div className={`${styles.content} ${styles.centered}`}>
            <Image
              src="/images/herosection/astronaut.webp"
              alt="Astronaut illustration"
              width={170}
              height={170}
              className={styles.stateImage}
            />
            <h3 className={styles.stateTitle}>Downloading...</h3>
            <p className={styles.stateText}>
              Follow the checklist and send the documents via email. We will be patiently waiting
              for you.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className={`${styles.content} ${styles.centered}`}>
            <Image
              src="/images/herosection/astronaut.webp"
              alt="Astronaut illustration"
              width={170}
              height={170}
              className={styles.stateImage}
            />
            <h3 className={styles.stateTitle}>Perfecto!</h3>
            <p className={styles.stateText}>
              Your details have safely landed in our systems and our team will be reviewing it and
              getting back to you in the next 24 hours. Hold on till then.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
