"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Tag, Ticket, Settings, LogOut, ChevronRight,
  Menu, X, Bell, ShoppingBag, AlertTriangle,
  UserPlus, MessageSquare, Video,
} from "lucide-react";import { useNotificationStore } from "@/lib/store/notificationStore";
import { ToastContainer } from "@/components/ui/Toast";
import { signOutAction } from "@/src/actions/auth.actions";

const S = {
  d: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  b: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  m: { fontFamily: "'DM Mono', monospace" },
} as const;

const NAV = [
  { href: "/admin",            label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/products",   label: "Products",  Icon: Package },
  { href: "/admin/orders",     label: "Orders",    Icon: ShoppingCart },
  { href: "/admin/customers",  label: "Customers", Icon: Users },
  { href: "/admin/categories", label: "Categories",Icon: Tag },
  { href: "/admin/coupons",    label: "Coupons",   Icon: Ticket },
  { href: "/admin/ugc-videos", label: "UGC Videos", Icon: Video },
  { href: "/admin/settings",   label: "Settings",  Icon: Settings },
];

const NOTIF_ICONS: Record<string, React.ElementType> = {
  order: ShoppingBag, stock: AlertTriangle, customer: UserPlus, message: MessageSquare,
};

interface AdminUser {
  displayName: string;
  displayEmail: string;
  initials: string;
  role: string;
}

function SidebarContent({ user, onNav }: { user: AdminUser; onNav?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(237,232,220,0.08)", flexShrink: 0 }}>
        <Link href="/" style={{ display: "flex", flexDirection: "column", lineHeight: 1, textDecoration: "none" }}>
          <span style={{ ...S.d, fontSize: 20, fontWeight: 300, letterSpacing: "0.12em", color: "#FAFAF7" }}>WAQAR</span>
          <span style={{ ...S.m, fontSize: 8, letterSpacing: "0.4em", textTransform: "uppercase", color: "#B8965A", marginTop: 1 }}>PERFUMES</span>
        </Link>
        <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", backgroundColor: "rgba(184,150,90,0.12)", padding: "3px 8px", border: "1px solid rgba(184,150,90,0.2)" }}>
          <span style={{ ...S.m, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#B8965A" }}>
            {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <p style={{ ...S.m, fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250,250,247,0.2)", padding: "0 10px", marginBottom: 6 }}>Menu</p>
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} onClick={onNav}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 4, marginBottom: 1,
                backgroundColor: active ? "rgba(184,150,90,0.12)" : "transparent",
                border: `1px solid ${active ? "rgba(184,150,90,0.2)" : "transparent"}`,
                textDecoration: "none", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(250,250,247,0.05)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}
            >
              <Icon size={15} strokeWidth={1.5} style={{ color: active ? "#B8965A" : "rgba(250,250,247,0.45)", flexShrink: 0 }} />
              <span style={{ ...S.b, fontSize: 13, color: active ? "#FAFAF7" : "rgba(250,250,247,0.55)", fontWeight: active ? 500 : 400, flex: 1 }}>{label}</span>
              {active && <ChevronRight size={11} strokeWidth={1.5} style={{ color: "#B8965A" }} />}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign Out */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(237,232,220,0.08)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#B8965A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ ...S.m, fontSize: 10, color: "#FAFAF7" }}>{user.initials}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ ...S.b, fontSize: 12, fontWeight: 500, color: "#FAFAF7", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName}</p>
            <p style={{ ...S.m, fontSize: 9, color: "rgba(250,250,247,0.3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayEmail}</p>
          </div>
        </div>
        <form action={signOutAction}>
          <button type="submit"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 4, transition: "background-color 0.15s", background: "none", border: "none", cursor: "pointer", width: "100%" }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(250,250,247,0.05)")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent")}
          >
            <LogOut size={13} strokeWidth={1.5} style={{ color: "rgba(250,250,247,0.3)" }} />
            <span style={{ ...S.b, fontSize: 12, color: "rgba(250,250,247,0.3)" }}>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markRead, markAllRead, dismiss, unreadCount } = useNotificationStore();
  const ref = useRef<HTMLDivElement>(null);
  const unread = unreadCount();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{
        position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100,
        backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC",
        boxShadow: "0 16px 48px rgba(26,26,24,0.12)",
        width: "min(340px, calc(100vw - 24px))", maxHeight: 480, overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #EDE8DC", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...S.d, fontSize: 16, fontWeight: 300, color: "#1A1A18" }}>Notifications</span>
          {unread > 0 && <span style={{ ...S.m, fontSize: 8, letterSpacing: "0.1em", backgroundColor: "#B8965A", color: "#FAFAF7", padding: "2px 6px", borderRadius: 99 }}>{unread}</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ ...S.m, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B8965A", background: "none", border: "none", cursor: "pointer" }}>
            Mark all read
          </button>
        )}
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <Bell size={24} strokeWidth={1} style={{ color: "#EDE8DC", marginBottom: 8 }} />
            <p style={{ ...S.b, fontSize: 13, color: "#6B6B63" }}>All caught up!</p>
          </div>
        ) : notifications.map((n) => {
          const Icon = NOTIF_ICONS[n.type] ?? Bell;
          return (
            <div key={n.id}
              style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: "1px solid #EDE8DC", backgroundColor: n.read ? "transparent" : "rgba(184,150,90,0.03)", cursor: "pointer" }}
              onClick={() => markRead(n.id)}
            >
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: n.read ? "#F5F0E8" : "rgba(184,150,90,0.1)", border: `1px solid ${n.read ? "#EDE8DC" : "rgba(184,150,90,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={13} strokeWidth={1.5} style={{ color: n.read ? "#6B6B63" : "#B8965A" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ ...S.b, fontSize: 12, fontWeight: n.read ? 400 : 600, color: "#1A1A18", margin: 0 }}>{n.title}</p>
                  <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B63", padding: 2, flexShrink: 0 }}>
                    <X size={10} strokeWidth={1.5} />
                  </button>
                </div>
                <p style={{ ...S.b, fontSize: 11, color: "#6B6B63", margin: "2px 0 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</p>
                <p style={{ ...S.m, fontSize: 9, color: "#B8965A", margin: "3px 0 0", letterSpacing: "0.05em" }}>{n.time}</p>
              </div>
              {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#B8965A", flexShrink: 0, marginTop: 4 }} />}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function AdminShell({ children, user }: { children: React.ReactNode; user: AdminUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount());

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setSidebarOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F0E8" }}>

      {/* Desktop Sidebar */}
      <aside className="admin-sidebar-desktop" style={{
        width: 220, flexShrink: 0, backgroundColor: "#1A1A18",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <SidebarContent user={user} />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(26,26,24,0.4)", backdropFilter: "blur(4px)" }}
            />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.28 }}
              style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50, width: 240, backgroundColor: "#1A1A18", display: "flex", flexDirection: "column" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "16px 16px 0", flexShrink: 0 }}>
                <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(250,250,247,0.5)", padding: 4 }}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <SidebarContent user={user} onNav={() => setSidebarOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header style={{
          height: 56, backgroundColor: "#FAFAF7", borderBottom: "1px solid #EDE8DC",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", position: "sticky", top: 0, zIndex: 30, flexShrink: 0,
        }}>
          <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#1A1A18", padding: 4, display: "none", alignItems: "center" }}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <div className="admin-breadcrumb" style={{ flex: 1 }} />
          <div style={{ position: "relative" }}>
            <button onClick={() => setNotifOpen((v) => !v)}
              style={{ position: "relative", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid #EDE8DC", cursor: "pointer", color: "#1A1A18", transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#B8965A")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#EDE8DC")}
            >
              <Bell size={16} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#B8965A", ...S.m, fontSize: 8, color: "#FAFAF7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
            </AnimatePresence>
          </div>
        </header>

        <div style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
          {children}
        </div>
      </div>

      <ToastContainer />

      <style>{`
        .admin-sidebar-desktop { display: flex !important; flex-direction: column; }
        .admin-hamburger { display: none !important; }
        @media (max-width: 1023px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-hamburger { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
