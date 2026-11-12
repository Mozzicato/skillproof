"use client";

import { Compass, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "skillproof-tour";
const EVENT = "skillproof-tour";

const STEPS: { href: string; title: string; text: string }[] = [
  { href: "/#same-cv", title: "Claims are not proof", text: "Daniel's CV claims more than Priya's. Every score here comes from evidence, so the ranking flips. Select a name to open that student's passport." },
  { href: "/p/daniel-reyes", title: "Work he could not explain", text: "Daniel submitted a cleaning script but could not answer questions about it, so those scores are capped at 25. He was also sure of seven wrong answers, giving him a self-awareness of 41." },
  { href: "/student", title: "The student's own view", text: "Readiness counts only what is proven. The next step is the gap that unlocks the most vacancies. Use \"Explore as\" above to switch to any of the eleven sample students." },
  { href: "/student/assessment", title: "An assessment that measures honesty", text: "Students rate themselves, then answer adaptive questions and say how sure they are. Confident mistakes cost more, and the answers never leave the server." },
  { href: "/student/plan", title: "A two-week sprint", text: "Each gap becomes a sprint: a project criterion to hit, a defence and a reassessment. A step is ticked only when the evidence arrives, never by clicking." },
  { href: "/student/projects", title: "Projects marked against a rubric", text: "Every criterion must quote the student's own work word for word, or it scores zero. Work can be imported from GitHub, then defended under questioning." },
  { href: "/p/lena-clarke", title: "Growth that is visible", text: "Lena's SQL went from 10 to 90 in two months. Her lecturer's confirmation is verified through a code sent to a work email. Employers can scan the QR code or download the passport as a PDF." },
  { href: "/employer?skill=sql&skill=statistics&min=60", title: "Employers search by proven skill", text: "Filter by evidenced score, then see self-awareness and verified confirmations beside each candidate before opening the work." },
  { href: "/university", title: "Universities see the curriculum gap", text: "What each department teaches against what students prove and employers ask for, plus who the careers team should refer, reassess or call in." },
  { href: "/coach", title: "Coaches follow their learners", text: "A coach shares one link. Learners who accept appear with their readiness, sprint and the next step to take with them." },
  { href: "/pricing", title: "How SkillProof AI earns", text: "Free builds an evidence-based talent pool; Pro at $29.99 a year adds the growth plan, simulations and passport. Every listed feature links to where it works." },
];

function read(): number | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function write(step: number | null) {
  try {
    if (step === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, String(step));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function TourStart({ className = "btn quiet", label = "Take the 3-minute tour" }: { className?: string; label?: string }) {
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={() => { write(0); router.push(STEPS[0].href); }}>
      <Compass size={18} aria-hidden="true" />{label}
    </button>
  );
}

export function Tour() {
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setStep(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (step === null || !STEPS[step]) return null;
  const current = STEPS[step];
  const onPath = pathname === current.href.split(/[?#]/)[0];
  const go = (to: number) => {
    write(to);
    router.push(STEPS[to].href);
  };

  return (
    <aside className="tour no-print" aria-label="Guided tour" aria-live="polite">
      <div className="row between">
        <span className="small muted">Tour, stop {step + 1} of {STEPS.length}</span>
        <button type="button" className="tour-close" aria-label="End the tour" onClick={() => write(null)}><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="tour-progress"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <h2>{current.title}</h2>
      <p className="small">{current.text}</p>
      <div className="row">
        {!onPath ? (
          <button type="button" className="btn btn-sm" onClick={() => go(step)}>Back to this stop</button>
        ) : step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-sm" onClick={() => go(step + 1)}>Next stop</button>
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => write(null)}>Finish the tour</button>
        )}
        {step > 0 && <button type="button" className="btn quiet btn-sm" onClick={() => go(step - 1)}>Previous</button>}
      </div>
    </aside>
  );
}
