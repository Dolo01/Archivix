import { FileText, FileSpreadsheet, Image } from "../icons.jsx";

// Icône de fichier colorée selon son type (PDF, Word, Excel, image…)
export function fileKind(mimeType = "", fileName = "") {
  const m = mimeType.toLowerCase();
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (m.includes("pdf") || ext === "pdf") return { label: "PDF", cls: "bg-rose-50 text-rose-600", Icon: FileText };
  if (m.includes("word") || ["doc", "docx", "odt"].includes(ext)) return { label: "DOC", cls: "bg-blue-50 text-blue-600", Icon: FileText };
  if (m.includes("sheet") || m.includes("excel") || ["xls", "xlsx", "ods", "csv"].includes(ext))
    return { label: "XLS", cls: "bg-emerald-50 text-emerald-600", Icon: FileSpreadsheet };
  if (m.startsWith("image/")) return { label: "IMG", cls: "bg-violet-50 text-violet-600", Icon: Image };
  return { label: "FICHIER", cls: "bg-slate-100 text-slate-600", Icon: FileText };
}

export default function FileIcon({ mimeType, fileName, size = 40 }) {
  const { cls, Icon } = fileKind(mimeType, fileName);
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl ${cls}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
}
