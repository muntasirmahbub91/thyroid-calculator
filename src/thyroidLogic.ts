export type ResultKind =
  | "Indeterminate" | "Euthyroid" | "Hypothyroid" | "Hyperthyroid"
  | "Subclinical Hypothyroidism" | "Subclinical Hyperthyroidism" | "Imbalance/Discordant";

type States = "Hypothyroid" | "Euthyroid" | "Hyperthyroid";

export const RANGES = {
  tsh: { lo: 0.4, hi: 4.0 },   // mIU/L
  ft4: { lo: 0.8, hi: 1.8 },   // ng/dL
  ft3: { lo: 2.3, hi: 4.2 },   // pg/mL
  tt4: { lo: 5.0, hi: 12.0 },  // µg/dL
  tt3: { lo: 80, hi: 200 },    // ng/dL
} as const;

function inRange(name: keyof typeof RANGES, v: number) {
  const { lo, hi } = RANGES[name]; return v >= lo && v <= hi;
}
function stateFrom(name: keyof typeof RANGES, v: number): States {
  const { lo, hi } = RANGES[name];
  if (v < lo) return "Hypothyroid";
  if (v > hi) return "Hyperthyroid";
  return "Euthyroid";
}

// Inputs are strings from UI; pass undefined for missing values
export function computeThyroid(
  inputs: { tsh?: string; ft4?: string; ft3?: string; tt4?: string; tt3?: string }
): ResultKind {
  const parse = (s?: string) => (s?.trim() ? Number(s) : undefined);
  const tsh = parse(inputs.tsh), ft4 = parse(inputs.ft4), ft3 = parse(inputs.ft3);
  const tt4 = parse(inputs.tt4), tt3 = parse(inputs.tt3);

  const t4 = ft4 ?? (ft4 === undefined ? tt4 ?? undefined : undefined);
  const t3 = ft3 ?? (ft3 === undefined ? tt3 ?? undefined : undefined);

  const tshK: States | undefined = tsh === undefined ? undefined : stateFrom("tsh", tsh);
  const t4K: States | undefined = t4 === undefined ? undefined : ft4 !== undefined ? stateFrom("ft4", t4) : stateFrom("tt4", t4);
  const t3K: States | undefined = t3 === undefined ? undefined : ft3 !== undefined ? stateFrom("ft3", t3) : stateFrom("tt3", t3);

  const provided = [tshK, t4K, t3K].filter(Boolean) as States[];
  if (provided.length === 0) return "Indeterminate";

  if (tsh !== undefined && tsh > RANGES.tsh.hi) {
    const lowT4 = (ft4 !== undefined && ft4 < RANGES.ft4.lo) || (ft4 === undefined && tt4 !== undefined && tt4 < RANGES.tt4.lo);
    if (lowT4) return "Hypothyroid";
  }
  if (tsh !== undefined && tsh < RANGES.tsh.lo) {
    const highT4 = (ft4 !== undefined && ft4 > RANGES.ft4.hi) || (ft4 === undefined && tt4 !== undefined && tt4 > RANGES.tt4.hi);
    const highT3 = (ft3 !== undefined && ft3 > RANGES.ft3.hi) || (ft3 === undefined && tt3 !== undefined && tt3 > RANGES.tt3.hi);
    if (highT4 || highT3) return "Hyperthyroid";
  }
  if (tsh !== undefined && tsh > RANGES.tsh.hi) {
    const normalT4 = (ft4 !== undefined && inRange("ft4", ft4)) || (ft4 === undefined && tt4 !== undefined && inRange("tt4", tt4));
    if (normalT4) return "Subclinical Hypothyroidism";
  }
  if (tsh !== undefined && tsh < RANGES.tsh.lo) {
    const normalT4 = (ft4 !== undefined && inRange("ft4", ft4)) || (ft4 === undefined && tt4 !== undefined && inRange("tt4", tt4));
    const normalT3 = (ft3 !== undefined && inRange("ft3", ft3)) || (ft3 === undefined && tt3 !== undefined && inRange("tt3", tt3));
    if (normalT4 && normalT3) return "Subclinical Hyperthyroidism";
  }
  const allInRange =
    (tsh === undefined || inRange("tsh", tsh)) &&
    (ft4 === undefined || inRange("ft4", ft4)) &&
    (ft3 === undefined || inRange("ft3", ft3)) &&
    (ft4 !== undefined || tt4 === undefined || inRange("tt4", tt4!)) &&
    (ft3 !== undefined || tt3 === undefined || inRange("tt3", tt3!));
  if (allInRange) return "Euthyroid";

  const discordant = provided.length >= 2 && new Set(provided).size > 1;
  if (discordant) return "Imbalance/Discordant";
  return "Imbalance/Discordant";
}