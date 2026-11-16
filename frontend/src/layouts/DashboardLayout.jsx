import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  FileStack,
  Building2,
  CreditCard,
  Users,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  LifeBuoy,
  ChevronsUpDown,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client";
import { getSocket } from "../api/socket";
import Logo from "../components/Logo.jsx";
import Avatar from "../components/ui/Avatar.jsx";

const ROLE_LABEL = { admin: "Administrateur", gestionnaire: "Gestionnaire", lecteur: "Lecteur" };

const NAV_MAIN = [
  { to: "/app", label: "Tableau de bord", icon: LayoutGrid, end: true },
  { to: "/app/documents", label: "Documents", icon: FileStack },
  { to: "/app/departements", label: "Départements", icon: Building2 },
];
const NAV_ADMIN = [
  { to: "/app/equipe", label: "Utilisateurs", icon: Users },
  { to: "/app/facturation", label: "Abonnement", icon: CreditCard },
  { to: "/app/parametres", label: "Paramètres", icon: Settings },
];

function NavItem({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "bg-brand-50 text-brand-dark" : "text-ink/65 hover:bg-ink/[0.04] hover:text-ink"
        }`
      }
    >
      <Icon size={17} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

export default function DashboardLayout() {
  const { user, tenant, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState("");

  const notifRef = useRef(null);
  const menuRef = useRef(null);
  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(menuRef, () => setMenuOpen(false));

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    api
      .get("/notifications")
      .then(({ data }) => {
        setNotifications(data.notifications);
        setUnread(data.unread);
      })
      .catch(() => {});
    const socket = getSocket();
    function onNotification(n) {
      setNotifications((prev) => [n, ...prev].slice(0, 30));
      setUnread((u) => u + 1);
    }
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, []);

  async function toggleNotifications() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening && unread > 0) {
      try {
        await api.patch("/notifications/tout-lire");
        setUnread(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch {
        /* sans gravité */
      }
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/app/documents?q=${encodeURIComponent(q)}` : "/app/documents");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo size={30} />
      </div>

      <div className="mx-3 mb-4 rounded-lg border border-line bg-paper-dim/60 px-3 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink/40">Organisation</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink">{tenant?.name}</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {NAV_MAIN.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-ink/40">Administration</p>
            <div className="space-y-0.5">
              {NAV_ADMIN.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <a
          href="mailto:support@archivix.example"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink/65 hover:bg-ink/[0.04] hover:text-ink"
        >
          <LifeBuoy size={17} /> Assistance
        </a>

        <div ref={menuRef} className="relative mt-1">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink/[0.04]"
          >
            <Avatar name={user?.fullName} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{user?.fullName}</span>
              <span className="block truncate text-xs text-ink/50">{ROLE_LABEL[user?.role] || user?.role}</span>
            </span>
            <ChevronsUpDown size={15} className="text-ink/35" />
          </button>
          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-line bg-white p-1.5 shadow-pop">
              <p className="truncate px-2.5 py-1.5 text-xs text-ink/50">{user?.email}</p>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-danger hover:bg-danger-light"
              >
                <LogOut size={15} /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper-dim">
      {/* Barre latérale fixe (écran large) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>

      {/* Tiroir mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} />
          <aside className="animate-in absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-pop">
            <button
              onClick={() => setDrawerOpen(false)}
              className="icon-btn-neutral absolute right-3 top-4"
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button onClick={() => setDrawerOpen(true)} className="icon-btn-neutral lg:hidden" aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>

          <form onSubmit={handleSearch} className="relative max-w-md flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document, une référence…"
              className="h-10 w-full rounded-lg border border-line bg-paper-dim/70 pl-9 pr-3 text-sm outline-none transition placeholder:text-ink/40 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </form>

          <div className="ml-auto flex items-center gap-1">
            <div ref={notifRef} className="relative">
              <button onClick={toggleNotifications} className="icon-btn-neutral relative h-10 w-10" aria-label="Notifications">
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-white shadow-pop">
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-sm font-semibold">Notifications</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-ink/50">Aucune notification pour le moment.</p>
                    )}
                    {notifications.map((n) => (
                      <div key={n.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-brand"}`} />
                        <div className="min-w-0">
                          <p className="text-sm text-ink/80">{n.message}</p>
                          <p className="mt-0.5 text-xs text-ink/45">{new Date(n.createdAt).toLocaleString("fr-FR")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="mx-2 hidden h-6 w-px bg-line sm:block" />
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar name={user?.fullName} size={32} />
              <span className="hidden text-sm font-medium text-ink/80 md:inline">{user?.fullName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-in mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
