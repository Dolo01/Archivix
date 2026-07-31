import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutGrid,
  FileStack,
  Building2,
  CreditCard,
  Users,
  Search,
  Bell,
  MoreVertical,
  ChevronRight,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client";
import { getSocket } from "../api/socket";

export default function DashboardLayout() {
  const { user, tenant, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  function fetchNotifications() {
    api.get("/notifications").then(({ data }) => {
      setNotifications(data.notifications);
      setUnread(data.unread);
    }).catch(() => {});
  }

  useEffect(() => {
    fetchNotifications();
    const socket = getSocket();
    function onNotification(n) {
      setNotifications((prev) => [n, ...prev].slice(0, 30));
      setUnread((u) => u + 1);
    }
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, []);

  async function openNotifications() {
    setNotifOpen((o) => !o);
    if (!notifOpen && unread > 0) {
      await api.patch("/notifications/tout-lire");
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }

  const NAV_MAIN = [
    { to: "/app", label: "Tableau de bord", icon: LayoutGrid, end: true },
    { to: "/app/documents", label: "Documents", icon: FileStack },
    { to: "/app/departements", label: "Départements", icon: Building2 },
  ];
  const NAV_ADMIN = [
    { to: "/app/facturation", label: "Facturation", icon: CreditCard },
    { to: "/app/equipe", label: "Équipe", icon: Users },
  ];

  const initials = (user?.fullName || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-paper-dim">
      <aside className="hidden w-64 shrink-0 flex-col bg-white md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass text-white">
            <FileStack size={16} />
          </div>
          <span className="font-display text-base font-semibold text-ink">Archivix</span>
        </div>

        <nav className="mt-2 flex-1 space-y-6 px-4">
          <div>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink/35">Navigation</p>
            <div className="mt-2 space-y-1">
              {NAV_MAIN.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-brass/10 text-brass-dark" : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"
                    }`
                  }
                >
                  <Icon size={17} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={14} className="opacity-0 transition-opacity group-hover:opacity-40" />
                </NavLink>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink/35">Administration</p>
              <div className="mt-2 space-y-1">
                {NAV_ADMIN.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? "bg-brass/10 text-brass-dark" : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"
                      }`
                    }
                  >
                    <Icon size={17} />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={14} className="opacity-0 transition-opacity group-hover:opacity-40" />
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning to-danger p-5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <HelpCircle size={18} />
            </div>
            <p className="mt-3 font-display text-sm font-semibold">Besoin d'aide ?</p>
            <p className="mt-1 text-xs leading-relaxed text-white/85">
              Une question sur votre registre ? Contactez votre administrateur ou notre support.
            </p>
            <a
              href="mailto:support@archivix.example"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-white/90"
            >
              Contacter le support
            </a>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="relative bg-gradient-to-r from-ink via-brass-dark to-brass px-6 py-5 md:px-8">
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2.5 text-white/80">
              <Search size={16} />
              <input
                placeholder="Rechercher un document, un département…"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/60 outline-none"
              />
            </div>

            <div className="hidden items-center gap-1 text-white/70 lg:flex">
              <div className="relative z-30">
                <button onClick={openNotifications} className="relative rounded-lg p-2 hover:bg-white/10 hover:text-white">
                  <Bell size={17} />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 max-h-96 w-80 overflow-y-auto rounded-xl border border-ink/10 bg-white p-2 text-ink shadow-lg">
                    {notifications.length === 0 && <p className="p-3 text-sm text-ink/50">Aucune notification pour l'instant.</p>}
                    {notifications.map((n) => (
                      <div key={n.id} className={`rounded-lg p-3 text-sm ${n.isRead ? "" : "bg-brass/5"}`}>
                        <p className="text-ink/80">{n.message}</p>
                        <p className="mt-1 text-xs text-ink/40">{new Date(n.createdAt).toLocaleString("fr-FR")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="rounded-lg p-2 hover:bg-white/10 hover:text-white">
                <MoreVertical size={17} />
              </button>
            </div>

            <div className="hidden items-center gap-5 text-sm font-medium text-white/85 lg:flex">
              <Link to="/app/documents" className="hover:text-white">Documents</Link>
              <Link to="/app/departements" className="hover:text-white">Départements</Link>
            </div>

            <div className="relative z-30 ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-white/90 sm:inline">Bonjour, {user?.fullName?.split(" ")[0]}</span>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white"
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-11 w-48 rounded-xl border border-ink/10 bg-white p-2 text-ink shadow-lg">
                  <p className="truncate px-2 py-1 text-xs text-ink/50">{tenant?.name}</p>
                  <button
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-danger hover:bg-danger-light"
                  >
                    <LogOut size={15} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="animate-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
