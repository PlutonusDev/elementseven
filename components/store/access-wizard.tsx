"use client";

import { useActionState, useMemo, useState } from "react";
import type { SmokingStatus } from "@prisma/client";
import { submitAccessRequestAction } from "@/lib/actions/access";
import { QUIT_AIDS, SMOKING_STATUS_LABELS } from "@/lib/access-constants";
import { Alert, cx, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const STEPS = [
  { symbol: "01", title: "About you", blurb: "The basics we're required to check" },
  { symbol: "02", title: "Your smoking", blurb: "Where you're at today" },
  { symbol: "03", title: "Your goals", blurb: "What you want from vaping" },
  { symbol: "04", title: "Declaration", blurb: "Review and submit" },
] as const;

const SMOKING_OPTIONS: Array<{ value: SmokingStatus; label: string; hint: string }> = [
  { value: "DAILY", label: "Yes, daily", hint: "I smoke every day" },
  { value: "OCCASIONALLY", label: "Yes, occasionally", hint: "Social or irregular smoking" },
  { value: "FORMER", label: "I used to", hint: "I've quit smoking cigarettes" },
  { value: "NEVER", label: "No, never", hint: "I've never smoked" },
];

type Answers = {
  dateOfBirth: string;
  smokingStatus: SmokingStatus | null;
  cigarettesPerDay: string;
  yearsSmoked: string;
  vapedBefore: "yes" | "no" | null;
  quitIntent: "yes" | "no" | null;
  aidsTried: string[];
  extraNotes: string;
  declareAge: boolean;
  declareTruthful: boolean;
  declarePersonal: boolean;
};

const INITIAL: Answers = {
  dateOfBirth: "",
  smokingStatus: null,
  cigarettesPerDay: "",
  yearsSmoked: "",
  vapedBefore: null,
  quitIntent: null,
  aidsTried: [],
  extraNotes: "",
  declareAge: false,
  declareTruthful: false,
  declarePersonal: false,
};

function OptionCard({
  selected,
  onSelect,
  label,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cx(
        "group flex flex-col items-start gap-0.5 border-2 px-4 py-3.5 text-left transition-all duration-300 ease-snap",
        selected
          ? "border-ink bg-ink text-paper shadow-[4px_4px_0_0_var(--color-amber)]"
          : "border-mist bg-white hover:-translate-y-0.5 hover:border-ink hover:shadow-[3px_3px_0_0_var(--color-mist)]",
      )}
    >
      <span className="text-sm font-semibold">{label}</span>
      {hint && (
        <span className={cx("text-xs", selected ? "text-paper/65" : "text-slate")}>{hint}</span>
      )}
    </button>
  );
}

function Chip({
  selected,
  onToggle,
  label,
}: {
  selected: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cx(
        "border-2 px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ease-snap",
        selected
          ? "border-ink bg-amber text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
          : "border-mist bg-white text-slate hover:border-ink hover:text-ink",
      )}
    >
      {selected ? "✓ " : ""}
      {label}
    </button>
  );
}

export function AccessWizard({ firstName }: { firstName: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(INITIAL);
  const [stepError, setStepError] = useState<string | null>(null);
  const [state, formAction] = useActionState(submitAccessRequestAction, null);

  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  }, []);

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setStepError(null);
  }

  const smokes = answers.smokingStatus !== null && answers.smokingStatus !== "NEVER";
  const declarationsOk =
    answers.declareAge && answers.declareTruthful && answers.declarePersonal;

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (!answers.dateOfBirth) return "Enter your date of birth.";
      if (answers.dateOfBirth > maxDob) return "You must be 18 or older to apply.";
    }
    if (index === 1) {
      if (!answers.smokingStatus) return "Select your smoking status.";
      if (answers.vapedBefore === null) return "Tell us whether you've vaped before.";
    }
    if (index === 2) {
      if (answers.quitIntent === null) return "Answer the quit-intent question.";
    }
    return null;
  }

  function next() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block" aria-label="Application progress">
        <ol className="space-y-0">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.symbol} className="relative flex gap-4 pb-8 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cx(
                      "absolute top-11 left-[21px] h-[calc(100%-2.75rem)] w-0.5 transition-colors duration-500",
                      done ? "bg-ink" : "bg-mist",
                    )}
                  />
                )}
                <span
                  className={cx(
                    "z-10 flex h-11 w-11 shrink-0 items-center justify-center border-2 font-display text-sm font-black transition-all duration-300 ease-snap",
                    done && "border-ink bg-ink text-paper",
                    active && "scale-110 border-nitro bg-nitro text-paper shadow-[3px_3px_0_0_var(--color-amber)]",
                    !done && !active && "border-mist bg-white text-slate",
                  )}
                >
                  {done ? "✓" : s.symbol}
                </span>
                <span className="pt-1">
                  <span className={cx("block text-sm font-semibold", !done && !active && "text-slate")}>
                    {s.title}
                  </span>
                  <span className="block text-xs text-slate">{s.blurb}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </aside>

      <div>
        <div className="mb-5 lg:hidden">
          <div className="flex items-baseline justify-between text-xs font-semibold">
            <span>
              Step {step + 1} of {STEPS.length}, {STEPS[step].title}
            </span>
            <span className="text-slate tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-mist">
            <div
              className="h-full bg-amber transition-[width] duration-500 ease-snap"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form action={formAction} className="border-2 border-ink bg-white p-6 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-8">
          <input type="hidden" name="dateOfBirth" value={answers.dateOfBirth} />
          {answers.smokingStatus && <input type="hidden" name="smokingStatus" value={answers.smokingStatus} />}
          {smokes && answers.cigarettesPerDay && (
            <input type="hidden" name="cigarettesPerDay" value={answers.cigarettesPerDay} />
          )}
          {smokes && answers.yearsSmoked && (
            <input type="hidden" name="yearsSmoked" value={answers.yearsSmoked} />
          )}
          {answers.vapedBefore && <input type="hidden" name="vapedBefore" value={answers.vapedBefore} />}
          {answers.quitIntent && <input type="hidden" name="quitIntent" value={answers.quitIntent} />}
          {answers.aidsTried.map((aid) => (
            <input key={aid} type="hidden" name="aidsTried" value={aid} />
          ))}
          {answers.extraNotes && <input type="hidden" name="extraNotes" value={answers.extraNotes} />}
          {declarationsOk && <input type="hidden" name="declarations" value="on" />}

          <div key={step} className="animate-step">
            {step === 0 && (
              <section>
                <h2 className="font-display text-2xl font-black tracking-tight">
                  G&apos;day{firstName ? `, ${firstName}` : ""} 👋
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
                  This short application takes about a minute, and a decision will be made by our team within one business day.
                </p>
                <div className="mt-6 max-w-xs">
                  <Label htmlFor="aw-dob">Date of birth</Label>
                  <Input
                    id="aw-dob"
                    type="date"
                    max={maxDob}
                    value={answers.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-slate">
                    The sale of nicotine products is restricted to adults 18+.
                  </p>
                </div>
              </section>
            )}

            {step === 1 && (
              <section>
                <h2 className="font-display text-2xl font-black tracking-tight">
                  Do you currently smoke?
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {SMOKING_OPTIONS.map((option) => (
                    <OptionCard
                      key={option.value}
                      selected={answers.smokingStatus === option.value}
                      onSelect={() => set("smokingStatus", option.value)}
                      label={option.label}
                      hint={option.hint}
                    />
                  ))}
                </div>

                {smokes && (
                  <div className="animate-rise mt-6 grid max-w-md grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="aw-perday">
                        {answers.smokingStatus === "FORMER" ? "Cigarettes/day (before quitting)" : "Cigarettes per day"}
                      </Label>
                      <Input
                        id="aw-perday"
                        inputMode="numeric"
                        placeholder="e.g. 15"
                        value={answers.cigarettesPerDay}
                        onChange={(e) => set("cigarettesPerDay", e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="aw-years">Years smoked</Label>
                      <Input
                        id="aw-years"
                        inputMode="numeric"
                        placeholder="e.g. 8"
                        value={answers.yearsSmoked}
                        onChange={(e) => set("yearsSmoked", e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                )}

                <h3 className="mt-8 text-sm font-semibold">
                  Have you used nicotine vaping products before?
                </h3>
                <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
                  <OptionCard
                    selected={answers.vapedBefore === "yes"}
                    onSelect={() => set("vapedBefore", "yes")}
                    label="Yes"
                  />
                  <OptionCard
                    selected={answers.vapedBefore === "no"}
                    onSelect={() => set("vapedBefore", "no")}
                    label="No"
                  />
                </div>
              </section>
            )}

            {step === 2 && (
              <section>
                <h2 className="font-display text-2xl font-black tracking-tight">
                  Do you want to use nicotine vaping products as an aid to quit smoking?
                </h2>
                <div className="mt-5 grid max-w-md grid-cols-2 gap-3">
                  <OptionCard
                    selected={answers.quitIntent === "yes"}
                    onSelect={() => set("quitIntent", "yes")}
                    label="Yes"
                    hint="Quitting or cutting down is my goal"
                  />
                  <OptionCard
                    selected={answers.quitIntent === "no"}
                    onSelect={() => set("quitIntent", "no")}
                    label="No"
                    hint="I have another reason"
                  />
                </div>

                <h3 className="mt-8 text-sm font-semibold">
                  Which quit methods have you tried before? <span className="font-normal text-slate">(optional)</span>
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUIT_AIDS.map((aid) => (
                    <Chip
                      key={aid}
                      label={aid}
                      selected={answers.aidsTried.includes(aid)}
                      onToggle={() =>
                        set(
                          "aidsTried",
                          answers.aidsTried.includes(aid)
                            ? answers.aidsTried.filter((a) => a !== aid)
                            : [...answers.aidsTried, aid],
                        )
                      }
                    />
                  ))}
                </div>

                <div className="mt-8 max-w-lg">
                  <Label htmlFor="aw-notes">
                    Anything else we should know? <span className="font-normal text-slate">(optional)</span>
                  </Label>
                  <Textarea
                    id="aw-notes"
                    rows={3}
                    maxLength={1000}
                    value={answers.extraNotes}
                    onChange={(e) => set("extraNotes", e.target.value)}
                    placeholder="Relevant health context, questions, anything at all…"
                  />
                </div>
              </section>
            )}

            {step === 3 && (
              <section>
                <h2 className="font-display text-2xl font-black tracking-tight">Almost there.</h2>
                <p className="mt-2 text-sm text-slate">Check your answers, then confirm the declarations.</p>

                <dl className="mt-5 space-y-2 border-2 border-mist bg-paper p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate">Date of birth</dt>
                    <dd className="font-medium">{answers.dateOfBirth || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate">Currently smoke</dt>
                    <dd className="font-medium">
                      {answers.smokingStatus ? SMOKING_STATUS_LABELS[answers.smokingStatus] : "—"}
                    </dd>
                  </div>
                  {smokes && answers.cigarettesPerDay && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate">Cigarettes per day</dt>
                      <dd className="font-medium">{answers.cigarettesPerDay}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate">Vaped before</dt>
                    <dd className="font-medium">{answers.vapedBefore === "yes" ? "Yes" : "No"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate">Using to quit smoking</dt>
                    <dd className="font-medium">{answers.quitIntent === "yes" ? "Yes" : "No"}</dd>
                  </div>
                </dl>

                <div className="mt-6 space-y-3">
                  {(
                    [
                      ["declareAge", "I am 18 years of age or older."],
                      ["declareTruthful", "The information I've provided is true and complete."],
                      ["declarePersonal", "Products purchased are for my personal use only and will not be supplied to minors."],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={answers[key]}
                        onChange={(e) => set(key, e.target.checked)}
                        className="mt-0.5 size-4 accent-ink"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </section>
            )}
          </div>

          {(stepError || (state?.message && !state.ok)) && (
            <Alert tone="error" className="mt-6">
              {stepError ?? state?.message}
            </Alert>
          )}

          <div className="mt-8 flex items-center justify-between border-t-2 border-mist pt-5">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="text-sm text-slate underline-offset-2 transition-colors hover:text-ink hover:underline disabled:invisible"
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="btn-shine inline-flex items-center justify-center bg-ink px-7 py-2.5 text-sm font-medium text-paper shadow-[3px_3px_0_0_var(--color-amber)] transition-all duration-300 ease-snap hover:-translate-y-0.5 hover:bg-nitro hover:shadow-[5px_5px_0_0_var(--color-amber)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-amber)]"
              >
                Continue →
              </button>
            ) : (
              <SubmitButton variant="amber" pendingText="Submitting…" disabled={!declarationsOk}>
                Submit application
              </SubmitButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
