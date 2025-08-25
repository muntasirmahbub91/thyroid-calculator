import React, { useMemo, useState } from "react";

export default function ThyroidCalculator() {
  type ResultKind =
    | "Indeterminate"
    | "Euthyroid"
    | "Hypothyroid"
    | "Hyperthyroid"
    | "Subclinical Hypothyroidism"
    | "Subclinical Hyperthyroidism"
    | "Imbalance/Discordant";

  type States = "Hypothyroid" | "Euthyroid" | "Hyperthyroid";
  type Inputs = { tsh: string; ft4: string; ft3: string; tt4: string; tt3: string };

  const MAPS_URL = "https://maps.app.goo.gl/fujFwJgY61Z3P5g37?g_st=ipc";
  const PHONE = "01303801712";

  const [inputs, setInputs] = useState<Inputs>({ tsh: "", ft4: "", ft3: "", tt4: "", tt3: "" });
  const [result, setResult] = useState<ResultKind>("Indeterminate");
  const [hasCalculated, setHasCalculated] = useState(false);

  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  const [openC, setOpenC] = useState(false);
  const [openD, setOpenD] = useState(false);

  const enteredCount = useMemo(
    () => ["tsh", "ft4", "ft3", "tt4", "tt3"].reduce((acc, k) => acc + ((inputs as any)[k] ? 1 : 0), 0),
    [inputs]
  );

  function onChange(key: keyof Inputs, v: string) {
    if (v === "" || /^[0-9]*\.?[0-9]*$/.test(v)) {
      setInputs((p) => ({ ...p, [key]: v }));
      setHasCalculated(false);
    }
  }

  function resetAll() {
    setInputs({ tsh: "", ft4: "", ft3: "", tt4: "", tt3: "" });
    setResult("Indeterminate");
    setHasCalculated(false);
    setOpenA(false); setOpenB(false); setOpenC(false); setOpenD(false);
  }

  function parseNum(v?: string) {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  const inRange = {
    tsh: (v: number) => v >= 0.4 && v <= 4.0,
    ft4: (v: number) => v >= 0.8 && v <= 1.8,
    ft3: (v: number) => v >= 2.3 && v <= 4.2,
    tt4: (v: number) => v >= 5.0 && v <= 12.0,
    tt3: (v: number) => v >= 80 && v <= 200,
  };

  function stateTSH(v: number): States { return v < 0.4 ? "Hyperthyroid" : v > 4.0 ? "Hypothyroid" : "Euthyroid"; }
  function stateFT4(v: number): States { return v < 0.8 ? "Hypothyroid" : v > 1.8 ? "Hyperthyroid" : "Euthyroid"; }
  function stateFT3(v: number): States { return v < 2.3 ? "Hypothyroid" : v > 4.2 ? "Hyperthyroid" : "Euthyroid"; }
  function stateTT4(v: number): States { return v < 5.0 ? "Hypothyroid" : v > 12.0 ? "Hyperthyroid" : "Euthyroid"; }
  function stateTT3(v: number): States { return v < 80 ? "Hypothyroid" : v > 200 ? "Hyperthyroid" : "Euthyroid"; }

  function compute(): ResultKind {
    const tsh = parseNum(inputs.tsh);
    const ft4 = parseNum(inputs.ft4);
    const ft3 = parseNum(inputs.ft3);
    const tt4 = parseNum(inputs.tt4);
    const tt3 = parseNum(inputs.tt3);

    const provided: States[] = [];
    if (tsh !== undefined) provided.push(stateTSH(tsh));
    if (ft4 !== undefined) provided.push(stateFT4(ft4));
    if (ft3 !== undefined) provided.push(stateFT3(ft3));
    if (tt4 !== undefined && ft4 === undefined) provided.push(stateTT4(tt4));
    if (tt3 !== undefined && ft3 === undefined) provided.push(stateTT3(tt3));

    if (provided.length === 0) return "Indeterminate";

    if (tsh !== undefined && tsh > 4.0) {
      const lowT4 = (ft4 !== undefined && ft4 < 0.8) || (ft4 === undefined && tt4 !== undefined && tt4 < 5.0);
      if (lowT4) return "Hypothyroid";
    }
    if (tsh !== undefined && tsh < 0.1) {
      const highT4 = (ft4 !== undefined && ft4 > 1.8) || (ft4 === undefined && tt4 !== undefined && tt4 > 12.0);
      const highT3 = (ft3 !== undefined && ft3 > 4.2) || (ft3 === undefined && tt3 !== undefined && tt3 > 200);
      if (highT4 || highT3) return "Hyperthyroid";
    }
    if (tsh !== undefined && tsh > 4.0) {
      const normalT4 = (ft4 !== undefined && inRange.ft4(ft4)) || (ft4 === undefined && tt4 !== undefined && inRange.tt4(tt4));
      if (normalT4) return "Subclinical Hypothyroidism";
    }
    if (tsh !== undefined && tsh < 0.4) {
      const normalT4 = (ft4 !== undefined && inRange.ft4(ft4)) || (ft4 === undefined && tt4 !== undefined && inRange.tt4(tt4));
      const normalT3 = (ft3 !== undefined && inRange.ft3(ft3)) || (ft3 === undefined && tt3 !== undefined && inRange.tt3(tt3));
      if (normalT4 && normalT3) return "Subclinical Hyperthyroidism";
    }

    const allInRange =
      (tsh === undefined || inRange.tsh(tsh)) &&
      (ft4 === undefined || inRange.ft4(ft4)) &&
      (ft3 === undefined || inRange.ft3(ft3)) &&
      (ft4 !== undefined || tt4 === undefined || inRange.tt4(tt4!)) &&
      (ft3 !== undefined || tt3 === undefined || inRange.tt3(tt3!));
    if (allInRange) return "Euthyroid";

    const hasDiscordance = provided.length >= 2 && new Set(provided).size > 1;
    return hasDiscordance ? "Imbalance/Discordant" : "Imbalance/Discordant";
  }

  function onCalculate() {
    setResult(compute());
    setHasCalculated(true);
  }

  const isNormalPath = result === "Euthyroid";
  const isImbalancePath = result !== "Indeterminate" && !isNormalPath;
  const secondaryMsg = isNormalPath
    ? "✅ অভিনন্দন, কোনো সমস্যা পাওয়া যায়নি।"
    : isImbalancePath
      ? "⚠️ আপনার রিপোর্টে অসামঞ্জস্য পাওয়া গেছে। আপনার আরও পরামর্শের প্রয়োজন হতে পারে।"
      : "";

  const resultColor =
    result === "Euthyroid" ? "var(--green)" :
    (result === "Hypothyroid" || result === "Hyperthyroid") ? "var(--red)" :
    (result === "Subclinical Hypothyroidism" || result === "Subclinical Hyperthyroidism") ? "var(--orange)" :
    result === "Imbalance/Discordant" ? "var(--amber)" : "#6b7280";

  return (
    <div className="wrap">
      <style>{`
        :root{--bg:#f5f7fb; --card:#fff; --muted:#64748b; --border:#e5e7eb; --blue:#2f6eea; --green:#16a34a; --red:#dc2626; --orange:#f97316; --amber:#f59e0b}
        *{box-sizing:border-box}
        body{margin:0}
        .wrap{min-height:100vh;background:var(--bg);color:#0f172a;padding:24px;}
        .container{max-width:720px;margin:0 auto}
        .heading{margin:0 0 8px 0;display:flex;flex-direction:column;align-items:flex-start}
        .script{font-family:cursive;font-size:40px;line-height:1.1;color:#111827}
        .title{font-family:system-ui,Inter,Arial,sans-serif;font-weight:800;font-size:48px;line-height:1.1;color:#111827}
        .card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
        .row{display:flex;align-items:stretch;border:1px solid var(--border);border-radius:12px;background:#fff;margin:16px 0;overflow:hidden}
        .label{flex:0 0 120px;display:flex;align-items:center;padding:14px 16px;font-weight:600}
        .inputBox{flex:1;display:flex;align-items:center;padding:0 12px;border-left:1px solid var(--border)}
        .input{flex:1;border:none;outline:none;font-size:18px;padding:14px 0;background:#ffffff !important;color:#0f172a !important;caret-color:#0f172a;-webkit-text-fill-color:#0f172a !important;}
        .input:-webkit-autofill, .input:-webkit-autofill:hover, .input:-webkit-autofill:focus{ -webkit-box-shadow:0 0 0px 1000px #ffffff inset !important; box-shadow:0 0 0px 1000px #ffffff inset !important; -webkit-text-fill-color:#0f172a !important; }
        .input:-moz-autofill{ box-shadow:0 0 0px 1000px #ffffff inset !important; -moz-text-fill-color:#0f172a !important; }
        .input:focus{background:#ffffff !important;}
        .unit{flex:0 0 80px;display:flex;align-items:center;justify-content:center;border-left:1px solid var(--border);font-weight:600;color:#111827}
        .btn{width:100%;margin-top:12px;background:var(--blue);border:1px solid var(--blue);color:#fff;border-radius:14px;font-size:28px;font-weight:700;padding:16px 20px;cursor:pointer}
        .btn:disabled{background:#cbd5e1;border-color:#cbd5e1;cursor:not-allowed}
        .resultBox{margin-top:16px;border:1px solid var(--border);border-radius:12px;min-height:100px;background:#fff}
        .resultHeader{padding:12px 16px;border-bottom:1px solid var(--border);font-weight:700}
        .resultBody{padding:12px 16px}
        .right{display:flex;justify-content:flex-end;margin-top:8px}
        .btnOutline{background:#fff;color:var(--blue);border:1px solid var(--blue);border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
        .footer{margin-top:10px;text-align:center;color:var(--muted);font-size:12px}
        .backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50}
        .modal{position:relative;max-width:640px;width:100%;background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px}
        .close{position:absolute;top:8px;right:10px;border:none;background:transparent;font-size:20px;color:#64748b;cursor:pointer}
        .btnSm{border:1px solid #e5e7eb;border-radius:10px;padding:8px 12px;font-weight:600;background:#fff;cursor:pointer}
        .btnSmBlue{border-color:var(--blue);color:var(--blue)}
      `}</style>

      <div className="container">
        <div className="heading">
          <div className="script">Dr. Muntasir’s</div>
          <div className="title">Thyroid Calculator</div>
        </div>

        <div className="card">
          <Field label="TSH" value={inputs.tsh} onChange={(v)=>onChange("tsh", v)} unit="mIU/L" placeholder="Enter value"/>
          <Field label="Free T4" value={inputs.ft4} onChange={(v)=>onChange("ft4", v)} unit="ng/dL" placeholder="Enter value"/>
          <Field label="Free T3" value={inputs.ft3} onChange={(v)=>onChange("ft3", v)} unit="pg/mL" placeholder="Enter value"/>
          <Field label="Total T4" value={inputs.tt4} onChange={(v)=>onChange("tt4", v)} unit="µg/dL" placeholder="Enter value"/>
          <Field label="Total T3" value={inputs.tt3} onChange={(v)=>onChange("tt3", v)} unit="ng/dL" placeholder="Enter value"/>

          <button className="btn" disabled={enteredCount < 1} onClick={onCalculate}>Calculate</button>

          <div className="resultBox">
            <div className="resultHeader">Result:</div>
            <div className="resultBody">
              {hasCalculated && (
                <>
                  <div style={{fontSize:22, fontWeight:800, color: resultColor}}>{result}</div>
                  {secondaryMsg && <div style={{marginTop:6}}>{secondaryMsg}</div>}
                  {result !== "Indeterminate" && (
                    <div className="right">
                      <button className="btnOutline" onClick={()=>{ if (result === "Euthyroid") setOpenA(true); else setOpenC(true); }}>Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="footer">Educational use only</div>
      </div>

      {openA && (
        <div className="backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <button className="close" onClick={()=>setOpenA(false)}>×</button>
            <h3>আপনার ফলাফল স্বাভাবিক</h3>
            <p>“আপনার ফলাফল স্বাভাবিক। আপনি ২ মাস পর টেস্টটি পুনরায় করতে পারেন।</p>
            <p>যদি আপনার কোনো সমস্যা না থাকে তবে Finish চাপুন।</p>
            <p>যদি কিছু জানতে চান তবে Help চাপুন।”</p>
            <div style={{display:'flex', gap:8, marginTop:10}}>
              <button className="btnSm" onClick={resetAll}>Finish</button>
              <button className="btnSm" onClick={()=>{ setOpenA(false); setOpenB(true); }}>Help</button>
            </div>
          </div>
        </div>
      )}

      {openB && (
        <div className="backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <button className="close" onClick={()=>setOpenB(false)}>×</button>
            <h3>সাহায্য প্রয়োজন?</h3>
            <DoctorBlock mapsUrl={MAPS_URL} phone={PHONE} />
            <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
              <a className="btnSm btnSmBlue" href={`tel:${PHONE}`}>Call Now</a>
              <a className="btnSm" href="#" onClick={(e)=>e.preventDefault()}>Book Consultation</a>
              <button className="btnSm" onClick={()=>{ setOpenB(false); setOpenA(true); }}>Back</button>
            </div>
          </div>
        </div>
      )}

      {openC && (
        <div className="backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <button className="close" onClick={()=>setOpenC(false)}>×</button>
            <h3>আপনার ফলাফল অসামঞ্জস্য দেখাচ্ছে</h3>
            <p>“আপনার ফলাফল অসামঞ্জস্য দেখাচ্ছে।</p>
            <p>এটি বিপজ্জনক হওয়ার আগে আরও পরীক্ষা ও চিকিৎসার প্রয়োজন।</p>
            <p>আপনি আপনার স্থানীয় ডাক্তারের সঙ্গে যোগাযোগ করতে পারেন, অথবা Dr. Muntasir এর সঙ্গে যোগাযোগ করতে পারেন।”</p>
            <div style={{display:'flex', gap:8, marginTop:10}}>
              <button className="btnSm" onClick={resetAll}>Finish</button>
              <button className="btnSm" onClick={()=>{ setOpenC(false); setOpenD(true); }}>Help</button>
            </div>
          </div>
        </div>
      )}

      {openD && (
        <div className="backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <button className="close" onClick={()=>setOpenD(false)}>×</button>
            <h3>অ্যাপয়েন্টমেন্ট করুন</h3>
            <DoctorBlock mapsUrl={MAPS_URL} phone={PHONE} />
            <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
              <a className="btnSm btnSmBlue" href={`tel:${PHONE}`}>Call Now</a>
              <a className="btnSm" href="#" onClick={(e)=>e.preventDefault()}>Book Online</a>
              <button className="btnSm" onClick={()=>{ setOpenD(false); setOpenC(true); }}>Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({label,value,onChange,unit,placeholder}:{label:string;value:string;onChange:(v:string)=>void;unit:string;placeholder:string}){
  return (
    <div className="row">
      <div className="label">{label}</div>
      <div className="inputBox">
        <input className="input" inputMode="decimal" value={value} onChange={(e)=>onChange((e.target as HTMLInputElement).value)} placeholder={placeholder}/>
      </div>
      <div className="unit">{unit}</div>
    </div>
  );
}

function DoctorBlock({mapsUrl,phone}:{mapsUrl:string;phone:string}){
  return (
    <div style={{fontSize:14}}>
      <p><strong>ডাঃ মুনতাসির মাহবুব</strong></p>
      <p>এমবিবিএস (ডিইউ), এফসিপিএস (ইএনটি)</p>
      <p>নাক কান গলা রোগ বিশেষজ্ঞ এবং হেড নেক থাইরয়েড সার্জন</p>
      <p>সহযোগী অধ্যাপক ও বিভাগীয় প্রধান</p>
      <p>খাজা ইউনুস আলী মেডিকেল কলেজ হাসপাতাল</p>
      <h4 style={{margin:"10px 0 4px",fontSize:14}}>Dhaka Chamber Address</h4>
      <p>মেডিসন মেডিকেল সার্ভিসেস</p>
      <p>সারা সন্ধানী টাওয়ার, প্লট ২২/১০, শ্যামলী, ঢাকা</p>
      <p>শিশুমেলা পার্কের সামনে</p>
      <p>📍 <a href={mapsUrl} target="_blank" rel="noreferrer">Google Maps Link</a></p>
      <h4 style={{margin:"10px 0 4px",fontSize:14}}>Serial Number</h4>
      <p>📞 {phone}</p>
      <h4 style={{margin:"10px 0 4px",fontSize:14}}>Visiting Hours</h4>
      <p>প্রতি শনি, রবি ও সোমবার</p>
      <p>⏰ সকাল ১০টা – ১২টা</p>
    </div>
  );
}