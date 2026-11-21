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
  History,
  KeyRound,
  Lock,
  PanelLeft,
} from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client";
import { getSocket } from "../api/socket";
import Logo, { LogoMark } from "../components/Logo.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import PushToggle from "../components/PushToggle.jsx";
import Modal from "../components/Modal.jsx";
import ChangePasswordForm from "../components/ChangePasswordForm.jsx";

const ROLE_LABEL = { admin: "Administrateur", gestionnaire: "Gestionnaire", lecteur: "Lecteur" };

const NAV_MAIN = [
  { to: "/app", label: "Tableau de bord", icon: LayoutGrid, end: true },
  { to: "/app/documents", label: "Documents", icon: FileStack },
  { to: "/app/departements", label: "Départements", icon: Building2 },
];
const NAV_ADMIN = [
  { to: "/app/activite", label: "Activité", icon: History },
  { to: "/app/equipe", label: "Utilisateurs", icon: Users },
  { to: "/app/facturation", label: "Abonnement", icon: CreditCard },
  { to: "/app/parametres", label: "Paramètres", icon: Settings },
];

function NavItem({ to, label, icon: Icon, end, onClick, compact }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      title={compact ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors ${compact ? "justify-center px-0" : "px-3"} ${
          isActive ? "bg-white/[0.12] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#60A5FA]" />}
          <Icon size={20} active={isActive} className={`shrink-0 ${isActive ? "text-[#93C5FD]" : "text-white/55 group-hover:text-white/80"}`} />
          {!compact && <span className="truncate">{label}</span>}
        </>
      )}
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
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordDone, setPasswordDone] = useState(false);
  const [, forceRender] = useState(0);
  // Menu latéral replié (icônes seules) sur grand écran, mémorisé sur cet appareil
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("archivix_menu_replie") === "1";
    } catch {
      return false;
    }
  });
  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem("archivix_menu_replie", c ? "0" : "1");
      } catch {
        /* sans gravité */
      }
      return !c;
    });
  }

  // Lecture seule : abonnement expiré (vérifié à l'affichage, et dès qu'une action est refusée par le serveur)
  const expiry = tenant?.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : null;
  const readOnly = Boolean(expiry && expiry < new Date());
  useEffect(() => {
    const onReadOnly = () => forceRender((n) => n + 1);
    window.addEventListener("archivix:lecture-seule", onReadOnly);
    return () => window.removeEventListener("archivix:lecture-seule", onReadOnly);
  }, []);

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

  const renderSidebar = (c) => (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0B1A3A] to-[#0F2557] text-white">
      <div className={`flex h-16 items-center ${c ? "justify-center" : "px-5"}`}>
        {c ? <LogoMark size={32} /> : <Logo size={30} light />}
      </div>

      {c ? (
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-xs font-semibold" title={tenant?.name}>
          {(tenant?.name || "?").slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <div className="mx-3 mb-5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">Organisation</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{tenant?.name}</p>
        </div>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {NAV_MAIN.map((item) => (
            <NavItem key={item.to} {...item} compact={c} />
          ))}
        </div>

        {isAdmin && (
          <div>
            {c ? (
              <div className="mx-3 mb-3 border-t border-white/10" />
            ) : (
              <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-white/40">Administration</p>
            )}
            <div className="space-y-0.5">
              {NAV_ADMIN.map((item) => (
                <NavItem key={item.to} {...item} compact={c} />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <a
          href="mailto:supportarchivix@gmail.com"
          title={c ? "Assistance" : undefined}
          className={`flex items-center gap-3 rounded-lg py-2 text-sm font-medium text-white/65 hover:bg-white/[0.06] hover:text-white ${c ? "justify-center" : "px-3"}`}
        >
          <LifeBuoy size={19} className="shrink-0 text-white/55" /> {!c && "Assistance"}
        </a>

        <div ref={menuRef} className="relative mt-1">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            title={c ? user?.fullName : undefined}
            className={`flex w-full items-center gap-3 rounded-lg py-2 text-left hover:bg-white/[0.06] ${c ? "justify-center" : "px-2"}`}
          >
            <Avatar name={user?.fullName} size={32} />
            {!c && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{user?.fullName}</span>
                  <span className="block truncate text-xs text-white/50">{ROLE_LABEL[user?.role] || user?.role}</span>
                </span>
                <ChevronsUpDown size={15} className="text-white/40" />
              </>
            )}
          </button>
          {menuOpen && (
            <div className={`absolute bottom-full left-0 mb-2 rounded-lg border border-line bg-white p-1.5 shadow-pop ${c ? "w-60" : "right-0"}`}>
              <p className="truncate px-2.5 py-1.5 text-xs text-ink/50">{user?.email}</p>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setPasswordDone(false);
                  setPasswordOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-ink/80 hover:bg-ink/[0.04]"
              >
                <KeyRound size={15} /> Changer mon mot de passe
              </button>
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
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 ease-out lg:block ${collapsed ? "w-[76px]" : "w-64"}`}
      >
        {renderSidebar(collapsed)}
      </aside>

      {/* Tiroir mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} />
          <aside className="animate-in absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-pop">
            <button
              onClick={() => setDrawerOpen(false)}
              className="icon-btn absolute right-3 top-4 z-10 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
            {renderSidebar(false)}
          </aside>
        </div>
      )}

      <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button onClick={() => setDrawerOpen(true)} className="icon-btn-neutral lg:hidden" aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>
          <button
            onClick={toggleCollapsed}
            className="icon-btn-neutral hidden h-10 w-10 lg:inline-flex"
            aria-label={collapsed ? "Afficher le menu" : "Réduire le menu"}
            title={collapsed ? "Afficher le menu" : "Réduire le menu"}
          >
            <PanelLeft size={20} />
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
                  <PushToggle />
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-ink/50">Aucune notification pour le moment.</p>
                    )}
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          if (n.link) navigate(n.link);
                        }}
                        className="flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-paper-dim/60"
                      >
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-brand"}`} />
                        <span className="min-w-0">
                          <span className="block text-sm text-ink/80">{n.message}</span>
                          <span className="mt-0.5 block text-xs text-ink/45">{new Date(n.createdAt).toLocaleString("fr-FR")}</span>
                        </span>
                      </button>
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

        {readOnly && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-danger/20 bg-danger-light/60 px-4 py-2.5 text-sm text-danger-dark sm:px-6 lg:px-8">
            <Lock size={16} className="shrink-0" />
            <span className="min-w-0 flex-1">
              <strong>Lecture seule.</strong>{" "}
              {tenant?.plan === "essai" ? "La période d'essai" : "L'abonnement"} a pris fin le {expiry.toLocaleDateString("fr-FR")}.
              Les documents restent consultables ; l'ajout et la modification sont suspendus
              {isAdmin ? " jusqu'au renouvellement." : ". Prévenez votre administrateur."}
            </span>
            {isAdmin && location.pathname !== "/app/facturation" && (
              <button onClick={() => navigate("/app/facturation")} className="btn-primary px-3 py-1.5 text-xs">
                Choisir une offre
              </button>
            )}
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-in mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Changer mon mot de passe"
        description={passwordDone ? undefined : "Choisissez un mot de passe que vous seul connaissez."}
        size="sm"
      >
        {passwordDone ? (
          <div className="space-y-4">
            <p className="alert-success">Mot de passe changé. Vos autres appareils ont été déconnectés.</p>
            <div className="flex justify-end">
              <button onClick={() => setPasswordOpen(false)} className="btn-primary">Fermer</button>
            </div>
          </div>
        ) : (
          <ChangePasswordForm onDone={() => setPasswordDone(true)} onCancel={() => setPasswordOpen(false)} submitLabel="Enregistrer" />
        )}
      </Modal>
    </div>
  );
}
