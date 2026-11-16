// Couleur stable dérivée du nom, dans une palette sobre
const TONES = [
  "bg-brand-50 text-brand-dark",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
  "bg-rose-50 text-rose-700",
];

export function initialsOf(name = "?") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

export default function Avatar({ name, size = 32, square = false }) {
  let hash = 0;
  for (const c of name || "") hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const tone = TONES[hash % TONES.length];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-semibold ${square ? "rounded-lg" : "rounded-full"} ${tone}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {initialsOf(name)}
    </span>
  );
}
