// Order and customer mock data for admin pages not yet backed by Supabase.

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderItem = { productId: string; name: string; qty: number; price: number; image: string };

export type Order = {
  id: string;
  orderNumber: string;
  customer: { name: string; email: string; avatar: string };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
};

export const MOCK_ORDERS: Order[] = [
  { id: "ord-1", orderNumber: "WQ-10041", customer: { name: "Sarah Mitchell", email: "sarah@example.com", avatar: "SM" }, items: [{ productId: "lumiere-doree", name: "Golden Light", qty: 1, price: 285, image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=80&q=60" }, { productId: "rose-absolue", name: "Rose Absolute", qty: 1, price: 245, image: "https://images.unsplash.com/photo-1548369937-47519962c11a?w=80&q=60" }], total: 530, status: "delivered", paymentStatus: "paid", paymentMethod: "Visa", shippingAddress: "123 Park Ave, New York, NY 10001", createdAt: "2025-03-12T10:30:00Z", updatedAt: "2025-03-15T14:00:00Z" },
  { id: "ord-2", orderNumber: "WQ-10042", customer: { name: "James Chen", email: "james@example.com", avatar: "JC" }, items: [{ productId: "oud-imperial", name: "Royal Oud", qty: 1, price: 420, image: "https://images.unsplash.com/photo-1493813931589-a2b5bfcbbf56?w=80&q=60" }], total: 420, status: "shipped", paymentStatus: "paid", paymentMethod: "Mastercard", shippingAddress: "45 King Street, London, UK", createdAt: "2025-03-14T09:15:00Z", updatedAt: "2025-03-14T16:00:00Z" },
  { id: "ord-3", orderNumber: "WQ-10043", customer: { name: "Aisha Rahman", email: "aisha@example.com", avatar: "AR" }, items: [{ productId: "signature-set", name: "Signature Set", qty: 1, price: 680, image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=80&q=60" }], total: 680, status: "processing", paymentStatus: "paid", paymentMethod: "InstaPay", shippingAddress: "88 Sheikh Zayed Rd, Dubai, UAE", createdAt: "2025-03-15T14:22:00Z", updatedAt: "2025-03-15T14:30:00Z" },
  { id: "ord-4", orderNumber: "WQ-10044", customer: { name: "Marco Rossi", email: "marco@example.com", avatar: "MR" }, items: [{ productId: "bois-sacre", name: "Sacred Wood", qty: 2, price: 380, image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=80&q=60" }], total: 760, status: "pending", paymentStatus: "pending", paymentMethod: "Cash on Delivery", shippingAddress: "Via Roma 12, Milan, Italy", createdAt: "2025-03-16T08:00:00Z", updatedAt: "2025-03-16T08:00:00Z" },
  { id: "ord-5", orderNumber: "WQ-10045", customer: { name: "Elena Volkov", email: "elena@example.com", avatar: "EV" }, items: [{ productId: "nuit-de-velours", name: "Velvet Night", qty: 1, price: 320, image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=80&q=60" }, { productId: "vanille-noire", name: "Dark Vanilla", qty: 1, price: 240, image: "https://images.unsplash.com/photo-1580552833071-89c80ef0e6fc?w=80&q=60" }], total: 560, status: "delivered", paymentStatus: "paid", paymentMethod: "Vodafone Cash", shippingAddress: "Leninsky Ave 45, Moscow, Russia", createdAt: "2025-03-10T11:00:00Z", updatedAt: "2025-03-13T10:00:00Z" },
  { id: "ord-6", orderNumber: "WQ-10046", customer: { name: "David Park", email: "david@example.com", avatar: "DP" }, items: [{ productId: "ambre-pur", name: "Pure Amber", qty: 1, price: 210, image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=80&q=60" }], total: 210, status: "cancelled", paymentStatus: "refunded", paymentMethod: "Mastercard", shippingAddress: "Gangnam-gu, Seoul, South Korea", createdAt: "2025-03-08T07:45:00Z", updatedAt: "2025-03-09T12:00:00Z" },
  { id: "ord-7", orderNumber: "WQ-10047", customer: { name: "Priya Sharma", email: "priya@example.com", avatar: "PS" }, items: [{ productId: "duo-estival", name: "Summer Duo", qty: 1, price: 290, image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=80&q=60" }], total: 290, status: "shipped", paymentStatus: "paid", paymentMethod: "InstaPay", shippingAddress: "Bandra West, Mumbai, India", createdAt: "2025-03-16T15:00:00Z", updatedAt: "2025-03-16T18:00:00Z" },
  { id: "ord-8", orderNumber: "WQ-10048", customer: { name: "Lucas Bernard", email: "lucas@example.com", avatar: "LB" }, items: [{ productId: "collection-hivernal", name: "Winter Collection", qty: 1, price: 540, image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=80&q=60" }], total: 540, status: "processing", paymentStatus: "paid", paymentMethod: "Visa", shippingAddress: "Rue de Rivoli 68, Paris, France", createdAt: "2025-03-17T09:30:00Z", updatedAt: "2025-03-17T10:00:00Z" },
];

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  ordersCount: number;
  totalSpending: number;
  lastOrder: string;
  joinedAt: string;
  status: "active" | "inactive";
};

export const MOCK_CUSTOMERS: Customer[] = [
  { id: "cus-1", name: "Sarah Mitchell", email: "sarah@example.com", phone: "+1 212 555 0101", avatar: "SM", location: "New York, USA", ordersCount: 5, totalSpending: 1840, lastOrder: "2025-03-12", joinedAt: "2024-01-15", status: "active" },
  { id: "cus-2", name: "James Chen", email: "james@example.com", phone: "+44 20 7946 0958", avatar: "JC", location: "London, UK", ordersCount: 3, totalSpending: 1260, lastOrder: "2025-03-14", joinedAt: "2024-02-20", status: "active" },
  { id: "cus-3", name: "Aisha Rahman", email: "aisha@example.com", phone: "+971 4 555 0123", avatar: "AR", location: "Dubai, UAE", ordersCount: 8, totalSpending: 4320, lastOrder: "2025-03-15", joinedAt: "2023-11-10", status: "active" },
  { id: "cus-4", name: "Marco Rossi", email: "marco@example.com", phone: "+39 02 1234 5678", avatar: "MR", location: "Milan, Italy", ordersCount: 2, totalSpending: 760, lastOrder: "2025-03-16", joinedAt: "2024-06-05", status: "active" },
  { id: "cus-5", name: "Elena Volkov", email: "elena@example.com", phone: "+7 495 555 0199", avatar: "EV", location: "Moscow, Russia", ordersCount: 4, totalSpending: 1890, lastOrder: "2025-03-10", joinedAt: "2024-03-22", status: "active" },
  { id: "cus-6", name: "David Park", email: "david@example.com", phone: "+82 2 555 0123", avatar: "DP", location: "Seoul, South Korea", ordersCount: 1, totalSpending: 210, lastOrder: "2025-03-08", joinedAt: "2025-01-30", status: "inactive" },
  { id: "cus-7", name: "Priya Sharma", email: "priya@example.com", phone: "+91 22 555 0145", avatar: "PS", location: "Mumbai, India", ordersCount: 6, totalSpending: 2340, lastOrder: "2025-03-16", joinedAt: "2023-09-14", status: "active" },
  { id: "cus-8", name: "Lucas Bernard", email: "lucas@example.com", phone: "+33 1 555 0189", avatar: "LB", location: "Paris, France", ordersCount: 3, totalSpending: 1380, lastOrder: "2025-03-17", joinedAt: "2024-04-11", status: "active" },
];
