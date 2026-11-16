import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import api from "../api/client";
import { getSocket } from "../api/socket";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./ui/Avatar.jsx";

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
    <div className="flex h-[26rem] flex-col">
      <div className="-mx-1 flex-1 space-y-3 overflow-y-auto px-1">
        {loading && <p className="text-sm text-ink/45">Chargement de la discussion…</p>}
        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-ink">Aucun message</p>
            <p className="mt-1 text-sm text-ink/50">Échangez avec vos collègues à propos de ce document.</p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.author?.id === user?.id;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && <Avatar name={m.author?.fullName} size={26} />}
              <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                {!mine && <p className="mb-0.5 px-1 text-xs font-medium text-ink/55">{m.author?.fullName}</p>}
                <div
                  className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-paper-dim text-ink"
                  }`}
                >
                  {m.content}
                </div>
                {m.createdAt && (
                  <p className="mt-0.5 px-1 text-[11px] text-ink/40">
                    {new Date(m.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          className="input flex-1"
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary px-3" aria-label="Envoyer">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
