import { create } from "zustand";

export type NotificationType = "order" | "stock" | "customer" | "message";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href?: string;
};

type NotificationStore = {
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  unreadCount: () => number;
};

const SEED: Notification[] = [
  { id: "n1", type: "order",    title: "New Order",        body: "WQ-10048 received from Lucas Bernard — $540",         time: "2 min ago",  read: false, href: "/admin/orders" },
  { id: "n2", type: "stock",    title: "Low Stock Alert",  body: "Royal Oud (Royal Oud) has only 4 units left",       time: "15 min ago", read: false, href: "/admin/products" },
  { id: "n3", type: "customer", title: "New Customer",     body: "Lucas Bernard joined from Paris, France",              time: "22 min ago", read: false, href: "/admin/customers" },
  { id: "n4", type: "order",    title: "Order Shipped",    body: "WQ-10047 shipped to Priya Sharma in Mumbai",           time: "1 hr ago",   read: false, href: "/admin/orders" },
  { id: "n5", type: "message",  title: "Contact Message",  body: "New enquiry from Sarah Mitchell regarding returns",    time: "3 hr ago",   read: true,  href: "/admin/customers" },
  { id: "n6", type: "stock",    title: "Low Stock Alert",  body: "Sacred Wood (Sacred Wood) has only 6 units left",       time: "5 hr ago",   read: true,  href: "/admin/products" },
  { id: "n7", type: "order",    title: "Order Delivered",  body: "WQ-10041 delivered to Sarah Mitchell in New York",     time: "1 day ago",  read: true,  href: "/admin/orders" },
  { id: "n8", type: "customer", title: "New Customer",     body: "Marco Rossi joined from Milan, Italy",                 time: "2 days ago", read: true,  href: "/admin/customers" },
];

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: SEED,
  markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  dismiss: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
