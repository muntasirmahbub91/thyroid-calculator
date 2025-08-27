// src/ThyroidCalculator.tsx
import { useMemo, useRef, useState } from "react";

/* External links and phone */
const YT_URL = "https://www.youtube.com/@drmuntasirmahbub2385";
const MAPS_URL = "https://maps.app.goo.gl/fujFwJgY61Z3P5g37?g_st=ipc";
const PHONE = "01303801712";

/* Types */
type Inputs = { tsh: string; ft4: string; ft3: string; tt4: string; tt3: string };
type InputKey = keyof Inputs;
type Modal = "A" | "B" | "C" | "D" | null;

/* Reference ranges */
const RANGES = {
  tsh: { lo: 0.4, hi: 4.0, unit: "mIU/L" },
  ft4: { lo: 0.8, hi: 1.8, unit: "ng/dL" },
  ft3: { lo: 2.3, hi: 4.2, unit: "pg/mL" },
  tt4: { lo: 5.0, hi: 12.0, unit: "µg/dL" },
  tt3: { lo: 80, hi: 200, unit: "ng/dL" },
} as const;

export default function ThyroidCalculator() {
  const [inputs, setInputs] = useState<Inputs>({ tsh: "", ft4: "", ft3: "", tt4: "", tt3: "" });
  const [result, setResult] = useState<string>("Indeterminate");
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const firstInputRef = useRef<HTMLInputElement>(null!);

  const enteredCount = useMemo(
    () =>
      (Object.keys(inputs) as InputKey[]).reduce(
        (n, k) => n + (inputs[k] ? 1 : 0),
        0
      ),
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
    setResult("Indeterminate");
    setHasCalculated(false);
    setActiveModal(null);
    setTimeout(() => firstInputRef.current?.focus(), 0);
  };

  function parseNum(v: string): number | undefined {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  function inRange(name: keyof typeof RANGES, v: number) {
    const { lo, hi } = RANGES[name];
    return v >= lo && v <= hi;
  }
  function stateFrom(name: keyof typeof RANGES, v: number) {
    const { lo, hi } = RANGES[name];
    if (v < lo) return "Hypothyroid";
    if (v > hi) return "Hyperthyroid";
    return "Euthyroid";
  }

  function compute(): string {
    const tsh = parseNum(inputs.tsh);
    const ft4 = parseNum(inputs.ft4);
    const ft3 = parseNum(inputs.ft3);
    const tt4 = parseNum(inputs.tt4);
    const tt3 = parseNum(inputs.tt3);

    const t4 = ft4 ?? (ft4 === undefined ? tt4 ?? undefined : undefined);
    const t3 = ft3 ?? (ft3 === undefined ? tt3 ?? undefined : undefined);

    const tshKind = tsh === undefined ? undefined : stateFrom("tsh", tsh);
    const t4Kind =
      t4 === undefined
        ? undefined
        : ft4 !== undefined
        ? stateFrom("ft4", t4)
        : stateFrom("tt4", t4);
    const t3Kind =
      t3 === undefined
        ? undefined
        : ft3 !== undefined
        ? stateFrom("ft3", t3)
        : stateFrom("tt3", t3);

    const providedKinds = [tshKind, t4Kind, t3Kind].filter(Boolean);
    if (providedKinds.length === 0) return "Indeterminate";

    // Overt hypo: high TSH + low T4
    if (tsh !== undefined && tsh > RANGES.tsh.hi) {
      const lowT4 =
        (ft4 !== undefined && ft4 < RANGES.ft4.lo) ||
        (ft4 === undefined && tt4 !== undefined && tt4 < RANGES.tt4.lo);
      if (lowT4) return "Hypothyroid";
    }

    // Overt hyper: low TSH + high T4 or high T3
    if (tsh !== undefined && tsh < RANGES.tsh.lo) {
      const highT4 =
        (ft4 !== undefined && ft4 > RANGES.ft4.hi) ||
        (ft4 === undefined && tt4 !== undefined && tt4 > RANGES.tt4.hi);
      const highT3 =
        (ft3 !== undefined && ft3 > RANGES.ft3.hi) ||
        (ft3 === undefined && tt3 !== undefined && tt3 > RANGES.tt3.hi);
      if (highT4 || highT3) return "Hyperthyroid";
    }

    // Subclinical hypo: high TSH + normal T4
    if (tsh !== undefined && tsh > RANGES.tsh.hi) {
      const normalT4 =
        (ft4 !== undefined && inRange("ft4", ft4)) ||
        (ft4 === undefined && tt4 !== undefined && inRange("tt4", tt4));
      if (normalT4) return "Subclinical Hypothyroidism";
    }

    // Subclinical hyper: low TSH + normal T4 + normal T3
    if (tsh !== undefined && tsh < RANGES.tsh.lo) {
      const normalT4 =
        (ft4 !== undefined && inRange("ft4", ft4)) ||
        (ft4 === undefined && tt4 !== undefined && inRange("tt4", tt4));
      const normalT3 =
        (ft3 !== undefined && inRange("ft3", ft3)) ||
        (ft3 === undefined && tt3 !== undefined && inRange("tt3", tt3));
      if (normalT4 && normalT3) return "Subclinical Hyperthyroidism";
    }

    // All provided within range
    const allInRange =
      (tsh === undefined || inRange("tsh", tsh)) &&
      (ft4 === undefined || inRange("ft4", ft4)) &&
      (ft3 === undefined || inRange("ft3", ft3)) &&
      (ft4 !== undefined || tt4 === undefined || inRange("tt4", tt4)) &&
      (ft3 !== undefined || tt3 === undefined || inRange("tt3", tt3));
    if (allInRange) return "Euthyroid";

    // Mixed states
    if (providedKinds.length >= 2 && new Set(providedKinds).size > 1) return "Imbalance/Discordant";
    return "Imbalance/Discordant";
  }

  const onCalculate = () => {
    setResult(compute());
    setHasCalculated(true);
  };

  const isNormalPath = result === "Euthyroid";
  const isImbalancePath = result !== "Indeterminate" && !isNormalPath;

  const secondaryMsg =
    result === "Euthyroid"
      ? "✅ অভিনন্দন, কোনো সমস্যা পাওয়া যায়নি।"
      : isImbalancePath
      ? "⚠️ আপনার রিপোর্টে অসামঞ্জস্য পাওয়া গেছে। আপনার আরও পরামর্শের প্রয়োজন হতে পারে।"
      : "";

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
            {hasCalculated && (
              <>
                <div className="resultPill">
                  <div className="pillTitle">Result</div>
                  <div className="pillOutcome">{result}</div>
                </div>

                {secondaryMsg && (
                  <div className="adviceRow">
                    <div className="adviceCard">
                      <div className="adviceLine">
                        <span style={{ fontSize: 20 }}></span>
                        <p style={{ margin: 0 }}>{secondaryMsg}</p>
                      </div>
                    </div>
                    <button
                      className="btnNextLg"
                      onClick={() => setActiveModal(isNormalPath ? "A" : "C")}
                    >
                      NEXT
                    </button>
                  </div>
                )}
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
