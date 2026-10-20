import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import JourneySection from "@/components/JourneySection/JourneySection";
import { getHomePage } from "@/lib/sanity/data";

// The Journey (the three steps) as a screen of its own. On phones the bottom
// bar's Journey tab opens it. The same steps also sit on the home page.

const TITLE = "Your journey";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomePage();
  const steps = (page.journeySteps ?? [])
    .map((step) => [step.title, step.titleHighlight].filter(Boolean).join(" "))
    .filter(Boolean);
  return {
    title: `${TITLE} | Hubble Bubble`,
    description: steps.length
      ? steps.join(" ")
      : "The three steps of a Hubble Bubble journey: your profile, your path, your growth.",
    alternates: { canonical: "/journey/" },
  };
}

export default async function JourneyRoute() {
  const page = await getHomePage();

  return (
    <main>
      <NavBar />
      {/* The steps' own headings are h2, so the page heading is for readers and crawlers only. */}
      <h1 className="sr-only">{TITLE}</h1>
      <JourneySection steps={page.journeySteps} outputsLabel={page.journeyOutputsLabel} />
    </main>
  );
}
