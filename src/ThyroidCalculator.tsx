// src/ThyroidCalculator.tsx
import { useMemo, useRef, useState } from "react";

/* External links and phone */
const YT_URL = "https://www.youtube.com/@drmuntasirmahbub2385";
const MAPS_URL = "https://maps.app.goo.gl/6xvYWvfHXJxeqEDj8";
const PHONE = "01303801712";

/* Types */
type Inputs = { tsh: string; ft4: string; ft3: string; tt4: string; tt3: string };
type InputKey = keyof Inputs;
type Modal = "A" | "B" | "C" | "D" | null;

type ResultType =
  | "normal"
  | "hypo"
  | "hyper"
  | "sub-hypo"
  | "sub-hyper"
  | "possible-hypo"
  | "possible-hyper"
  | "insufficient";

type EvalResult = {
  type: ResultType;
  headline: string;   // e.g., "Hypothyroid (হাইপো থাইরয়েড)"
  advisory: string;   // Bengali advisory copy
  severity: "green" | "amber" | "red";
};

/* Reference ranges (units kept for UI hints) */
const RANGES = {
  tsh: { lo: 0.4, hi: 4.0, unit: "mIU/L" },
  ft4: { lo: 0.8, hi: 1.8, unit: "ng/dL" },
  ft3: { lo: 2.3, hi: 4.2, unit: "pg/mL" },
  tt4: { lo: 5.0, hi: 12.0, unit: "µg/dL" },
  tt3: { lo: 80, hi: 200, unit: "ng/dL" },
} as const;

/* ---------- Core evaluator implementing the specified logic ---------- */
function evaluateThyroid({
  tsh,
  ft4,
}: {
  tsh?: number | null;
  ft4?: number | null;
}): EvalResult {
  const hasTSH = tsh !== undefined && tsh !== null && !Number.isNaN(tsh);
  const hasFT4 = ft4 !== undefined && ft4 !== null && !Number.isNaN(ft4);

  const R = { tsh: { lo: 0.4, hi: 4.0 }, ft4: { lo: 0.8, hi: 1.8 } };

  // 1) TSH + FT4 available → full classification
  if (hasTSH && hasFT4) {
    // Normal
    if (tsh! >= R.tsh.lo && tsh! <= R.tsh.hi && ft4! >= R.ft4.lo && ft4! <= R.ft4.hi) {
      return {
        type: "normal",
        headline: "Euthyroid (স্বাভাবিক)",
        advisory: "আপনার রিপোর্ট স্বাভাবিক সীমায় আছে। নিয়মিত ফলো-আপ রাখুন।",
        severity: "green",
      };
    }
    // Overt Hypo
    if (tsh! > R.tsh.hi && ft4! < R.ft4.lo) {
      return {
        type: "hypo",
        headline: "Hypothyroid (হাইপো থাইরয়েড)",
        advisory: "আপনার থাইরয়েড হরমোন কম আছে। দ্রুত চিকিৎসকের পরামর্শ নিন।",
        severity: "red",
      };
    }
    // Overt Hyper
    if (tsh! < R.tsh.lo && ft4! > R.ft4.hi) {
      return {
        type: "hyper",
        headline: "Hyperthyroid (হাইপার থাইরয়েড)",
        advisory: "আপনার থাইরয়েড হরমোন বেশি আছে। দ্রুত চিকিৎসকের পরামর্শ নিন।",
        severity: "red",
      };
    }
    // Subclinical Hypo
    if (tsh! > R.tsh.hi && ft4! >= R.ft4.lo && ft4! <= R.ft4.hi) {
      return {
        type: "sub-hypo",
        headline: "Subclinical Hypothyroidism (সাবক্লিনিকাল হাইপো)",
        advisory: "TSH বেশি কিন্তু FT4 স্বাভাবিক। নিশ্চিত হতে চিকিৎসকের পরামর্শ নিন।",
        severity: "amber",
      };
    }
    // Subclinical Hyper
    if (tsh! < R.tsh.lo && ft4! >= R.ft4.lo && ft4! <= R.ft4.hi) {
      return {
        type: "sub-hyper",
        headline: "Subclinical Hyperthyroidism (সাবক্লিনিকাল হাইপার)",
        advisory: "TSH কম কিন্তু FT4 স্বাভাবিক। নিশ্চিত হতে চিকিৎসকের পরামর্শ নিন।",
        severity: "amber",
      };
    }

    // 8) Insufficient / Discordant (e.g., both high or both low)
    return {
      type: "insufficient",
      headline: "Insufficient data (বৈষম্য আছে)",
      advisory:
        "রিপোর্টে বৈষম্য আছে বা তথ্য অসম্পূর্ণ। সঠিক সিদ্ধান্তের জন্য Free T3/Free T4/TSH পুনরায় করুন ও চিকিৎসকের পরামর্শ নিন।",
      severity: "amber",
    };
  }

  // 6–7) TSH-only extremes
  if (hasTSH && !hasFT4) {
    if (tsh! >= 10) {
      return {
        type: "possible-hypo",
        headline: "Possibly Hypothyroid (প্রবল সম্ভাবনা)",
        advisory: "TSH অনেক বেশি। নিশ্চিত করতে FT4/FT3 টেস্ট করুন এবং চিকিৎসকের পরামর্শ নিন।",
        severity: "red",
      };
    }
    if (tsh! <= 0.01) {
      return {
        type: "possible-hyper",
        headline: "Possibly Hyperthyroid (প্রবল সম্ভাবনা)",
        advisory: "TSH খুব কম। নিশ্চিত করতে FT4/FT3 টেস্ট করুন এবং চিকিৎসকের পরামর্শ নিন।",
        severity: "red",
      };
    }
    // Borderline TSH-only → insufficient
    if (tsh! < R.tsh.lo || tsh! > R.tsh.hi) {
      return {
        type: "insufficient",
        headline: "Insufficient data",
        advisory:
          "TSH স্বাভাবিক নয়, কিন্তু সিদ্ধান্তের জন্য আরো তথ্য দরকার। FT4 ও FT3 টেস্ট করুন।",
        severity: "amber",
      };
    }
  }

  // Missing TSH or other partial inputs → insufficient
  return {
    type: "insufficient",
    headline: "Insufficient data",
    advisory:
      "সিদ্ধান্তের জন্য পর্যাপ্ত তথ্য নেই। TSH, Free T4 এবং প্রয়োজনে Free T3 দিন।",
    severity: "amber",
  };
}

export default function ThyroidCalculator() {
  const [inputs, setInputs] = useState<Inputs>({ tsh: "", ft4: "", ft3: "", tt4: "", tt3: "" });
  const [result, setResult] = useState<EvalResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const firstInputRef = useRef<HTMLInputElement>(null!);

  const enteredCount = useMemo(
    () =>
      (Object.keys(inputs) as InputKey[]).reduce((n, k) => n + (inputs[k] ? 1 : 0), 0),
    [inputs]
  );

  const onChange = (key: InputKey, v: string) => {
    const next = String(v).replace(",", ".");
    if (next === "" || /^[0-9]*\.?[0-9]*$/.test(next)) {
      setInputs((p) => ({ ...p, [key]: next }));
      setHasCalculated(false);
    }
  };

  const resetAll = () => {
    setInputs({ tsh: "", ft4: "", ft3: "", tt4: "", tt3: "" });
    setResult(null);
    setHasCalculated(false);
    setActiveModal(null);
    setTimeout(() => firstInputRef.current?.focus(), 0);
  };

  function parseNum(v: string): number | undefined {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  function onCalculate() {
    const tsh = parseNum(inputs.tsh);
    const ft4 = parseNum(inputs.ft4);
    const evalRes = evaluateThyroid({ tsh, ft4 });
    setResult(evalRes);
    setHasCalculated(true);
  }

  return (
    <div className="calc-wrap">
      <div className="container">
        {/* Heading */}
        <div className="heading">
          <div className="script">Dr. Muntasir’s</div>
          <div className="title">Thyroid Calculator</div>
        </div>

        {/* Card with fields */}
        <div className="card">
          <Field
            id="tsh"
            label="TSH"
            value={inputs.tsh}
            onChange={(v) => onChange("tsh", v)}
            unit={RANGES.tsh.unit}
            hint={`Normal: ${RANGES.tsh.lo}–${RANGES.tsh.hi} ${RANGES.tsh.unit}`}
            inputRef={firstInputRef}
          />
          <Field
            id="ft4"
            label="Free T4"
            value={inputs.ft4}
            onChange={(v) => onChange("ft4", v)}
            unit={RANGES.ft4.unit}
            hint={`Normal: ${RANGES.ft4.lo}–${RANGES.ft4.hi} ${RANGES.ft4.unit}`}
          />
          {/* Optional fields kept for completeness and UI parity */}
          <Field
            id="ft3"
            label="Free T3"
            value={inputs.ft3}
            onChange={(v) => onChange("ft3", v)}
            unit={RANGES.ft3.unit}
            hint={`Normal: ${RANGES.ft3.lo}–${RANGES.ft3.hi} ${RANGES.ft3.unit}`}
          />
          <Field
            id="tt4"
            label="Total T4"
            value={inputs.tt4}
            onChange={(v) => onChange("tt4", v)}
            unit={RANGES.tt4.unit}
            hint={`Normal: ${RANGES.tt4.lo}–${RANGES.tt4.hi} ${RANGES.tt4.unit}`}
          />
          <Field
            id="tt3"
            label="Total T3"
            value={inputs.tt3}
            onChange={(v) => onChange("tt3", v)}
            unit={RANGES.tt3.unit}
            hint={`Normal: ${RANGES.tt3.lo}–${RANGES.tt3.hi} ${RANGES.tt3.unit}`}
          />

          <button className="btn btnPrimary" disabled={enteredCount < 1} onClick={onCalculate}>
            CALCULATE
          </button>

          {/* Result section */}
          <div className="resultBox" role="region" aria-live="polite">
            {hasCalculated && result && (
              <>
                <div
                  className="resultPill"
                  style={{
                    background:
                      result.severity === "green"
                        ? "#dcfce7"
                        : result.severity === "red"
                        ? "#fee2e2"
                        : "#fef9c3",
                  }}
                >
                  <div className="pillTitle">Result</div>
                  <div
                    className="pillOutcome"
                    style={{
                      color:
                        result.severity === "green"
                          ? "#059669"
                          : result.severity === "red"
                          ? "#dc2626"
                          : "#b45309",
                    }}
                  >
                    {result.headline}
                  </div>
                </div>

                <div className="adviceRow">
                  <div
                    className="adviceCard"
                    style={{
                      borderColor:
                        result.severity === "green"
                          ? "#bbf7d0"
                          : result.severity === "red"
                          ? "#fecaca"
                          : "#fde68a",
                    }}
                  >
<div className="adviceLine">
  <p style={{ margin: 0 }}>
    {result.type !== "normal" && "⚠️ "}
    {result.advisory}
  </p>
</div>
</div>
<button
  className="btnNextLg"
  onClick={() => setActiveModal(result.type === "normal" ? "A" : "C")}
>
  NEXT
</button>
</div>
</>
)}
</div>
</div>


        <div className="footer">
          Educational use only. Not a diagnostic tool. Consult a qualified clinician for decisions.
        </div>
      </div>

      {/* -------------------- Modals -------------------- */}

      {/* Modal A: Normal path guidance */}
      {activeModal === "A" && (
        <div className="backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <button className="close" aria-label="Close" onClick={() => setActiveModal(null)}>
              ×
            </button>
            <h3 style={{ marginTop: 4 }}>আপনার ফলাফল স্বাভাবিক</h3>
            <p>“আপনার ফলাফল স্বাভাবিক। আপনি ২ মাস পর টেস্টটি পুনরায় করতে পারেন।”</p>
            <p>যদি আপনার কোনো সমস্যা না থাকে তবে Finish চাপুন।</p>
            <p>যদি কোন ব্যাপারে আমাদের সাহায্য প্রয়োজন হয় তাহলে Help চাপুন</p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btnSm" onClick={resetAll}>
                Finish
              </button>
              <button className="btnSm" onClick={() => setActiveModal("B")}>
                Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal B: Help choices */}
      {activeModal === "B" && (
        <div className="backdrop" role="dialog" aria-modal="true">
          <div className="modal modalHelp">
            <button className="close" aria-label="Close" onClick={() => setActiveModal(null)}>
              ×
            </button>

            <h3 className="modalTitle">আমরা কিভাবে আপনাকে সাহায্য করতে পারি ?</h3>

            <div className="helpList">
              <a className="helpItem" href={YT_URL} target="_blank" rel="noreferrer">
                <div className="helpIcon">▶︎</div>
                <div className="helpText">আরও তথ্য জানতে আমাদের YOUTUBE চ্যানেলে যেতে পারেন</div>
              </a>

              <a className="helpItem" href={`tel:${PHONE}`}>
                <div className="helpIcon">📞</div>
                <div className="helpText">আমাদের প্রতিনিধির সাথে কথা বলতে পারেন</div>
              </a>

              <button className="helpItem" onClick={() => setActiveModal("D")}>
                <div className="helpIcon">👨‍⚕️</div>
                <div className="helpText">আপনি ডাঃ মুনতাসির মাহবুব স্যার কে সরাসরি দেখাতে পারেন</div>
              </button>

              <a className="helpItem" href={`tel:${PHONE}`}>
                <div className="helpIcon">🎥</div>
                <div className="helpText">আপনি স্যার কে অনলাইনে দেখাতে পারেন</div>
              </a>
            </div>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button className="btnSm" onClick={() => setActiveModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal C: Abnormal / Discordant guidance */}
      {activeModal === "C" && (
        <div className="backdrop" role="dialog" aria-modal="true">
          <div className="modal modalAbnormal">
            <button className="close" aria-label="Close" onClick={() => setActiveModal(null)}>
              ×
            </button>
            <h3 style={{ marginTop: 4, fontWeight: 800 }}>আপনার ফলাফল অসামঞ্জস্য দেখাচ্ছে</h3>
            <p>এটি বিপজ্জনক হওয়ার আগে আরও পরীক্ষা ও চিকিৎসার প্রয়োজন।”</p>
            <p>যদি এই ব্যাপারে আমাদের সাহায্য প্রয়োজন হয় তাহলে Help চাপুন</p>

            <div className="modalActions">
              <button className="modalBtn" onClick={resetAll}>
                Finish
              </button>
              <button className="modalBtn" onClick={() => setActiveModal("B")}>
                Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal D: Appointment / Doctor details */}
      {activeModal === "D" && (
        <div className="backdrop" role="dialog" aria-modal="true">
          <div className="modal modalAppointment">
            <button className="close" aria-label="Close" onClick={() => setActiveModal(null)}>
              ×
            </button>
            <h3 style={{ marginTop: 4, fontWeight: 800 }}>অ্যাপয়েন্টমেন্ট করুন</h3>

            <DoctorDetails mapsUrl={MAPS_URL} phone={PHONE} />

            <div className="appointmentActions">
              <a className="btnAction green" href={`tel:${PHONE}`}>
                📞 Call Now
              </a>
              <button className="btnAction" onClick={() => setActiveModal("B")}>
                ⬅ Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Subcomponents -------------------- */

function Field({
  id,
  label,
  value,
  onChange,
  unit,
  hint,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  hint: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="row">
      <div className="labelBox">
        <label htmlFor={id}>{label}</label>
      </div>
      <div className="inputBox">
        <input
          id={id}
          ref={inputRef}
          className="input"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value"
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        {hint && (
          <div id={`${id}-hint`} className="hint">
            {hint}
          </div>
        )}
      </div>
      <div className="unit">{unit}</div>
    </div>
  );
}

function DoctorDetails({ mapsUrl, phone }: { mapsUrl: string; phone: string }) {
  return (
    <div style={{ fontSize: 14, fontFamily: "Hind Siliguri, sans-serif" }}>
      <p>
        <strong>ডাঃ মুনতাসির মাহবুব</strong>
      </p>
      <p>এমবিবিএস (ডিইউ), এফসিপিএস (ইএনটি)</p>
      <p>নাক কান গলা রোগ বিশেষজ্ঞ এবং হেড নেক থাইরয়েড সার্জন</p>
      <p>সহযোগী অধ্যাপক ও বিভাগীয় প্রধান</p>
      <p>খাজা ইউনুস আলী মেডিকেল কলেজ হাসপাতাল</p>

      <h4 style={{ margin: "10px 0 4px" }}>Dhaka Chamber Address</h4>
      <p>মেডিসন মেডিকেল সার্ভিসেস</p>
      <p>সারা সন্ধানী টাওয়ার, প্লট ২২/১০, শ্যামলী, ঢাকা</p>
      <p>শিশুমেলা পার্কের সামনে</p>
      <p>
        📍 <a href={mapsUrl} target="_blank" rel="noreferrer">Google Maps Link</a>
      </p>

      <h4 style={{ margin: "10px 0 4px" }}>Serial Number</h4>
      <p>📞 {phone}</p>

      <h4 style={{ margin: "10px 0 4px" }}>Visiting Hours</h4>
      <p>প্রতি শনি, রবি ও সোমবার</p>
      <p>⏰ সকাল ১০টা – ১২টা</p>
    </div>
  );
}
