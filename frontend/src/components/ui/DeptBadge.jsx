// Pastille colorée avec les initiales d'un département (couleur stable selon son nom)
const PALETTE = [
  "bg-blue-50 text-blue-700 ring-blue-100",
  "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "bg-amber-50 text-amber-700 ring-amber-100",
  "bg-violet-50 text-violet-700 ring-violet-100",
  "bg-rose-50 text-rose-700 ring-rose-100",
  "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "bg-indigo-50 text-indigo-700 ring-indigo-100",
];

export function deptColor(name = "", index) {
  if (Number.isInteger(index)) return PALETTE[index % PALETTE.length];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function DeptBadge({ name = "", size = 40, index }) {
  const initiales = name
    .split(/[\s'’-]+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || name.slice(0, 2).toUpperCase();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold ring-1 ring-inset ${deptColor(name, index)}`}
      style={{ width: size, height: size }}
    >
      {initiales}
    </span>
  );
}
