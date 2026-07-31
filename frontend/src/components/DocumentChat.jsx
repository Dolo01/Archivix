import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import api from "../api/client";
import { getSocket } from "../api/socket";
import { useAuth } from "../context/AuthContext.jsx";

export default function DocumentChat({ documentId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);

    api
      .get(`/messages/${documentId}`)
      .then(({ data }) => setMessages(data))
      .finally(() => setLoading(false));

    const socket = getSocket();
    socket.emit("rejoindre_document", documentId);

    function onNewMessage(msg) {
      if (msg.document === documentId || msg.document?.id === documentId) {
        setMessages((prev) => [...prev, msg]);
      }
    }
    socket.on("nouveau_message", onNewMessage);

    return () => {
      socket.emit("quitter_document", documentId);
      socket.off("nouveau_message", onNewMessage);
    };
  }, [documentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text;
    setText("");
    try {
      await api.post(`/messages/${documentId}`, { content });
    } catch {
      setText(content);
    }
  }

  return (
    <div className="flex h-96 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {loading && <p className="text-sm text-ink/45">Chargement de la discussion…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-ink/45">Aucun message pour l'instant. Lancez la discussion sur ce dossier.</p>
        )}
        {messages.map((m) => {
          const mine = m.author?.id === user?.id || m.author?.id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-ink text-paper" : "bg-ink/[0.06] text-ink"}`}>
                {!mine && <p className="mb-0.5 font-mono text-[10px] uppercase text-ink/45">{m.author?.fullName}</p>}
                <p>{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message à propos de ce dossier…"
          className="input flex-1"
        />
        <button type="submit" className="btn-brass px-3.5">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
