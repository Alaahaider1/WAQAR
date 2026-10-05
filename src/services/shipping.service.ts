export type ShipmentInput = { orderNumber: string; total: number; address: { fullName: string; phone: string | null; addressLine1: string; city: string }; items: Array<{ productName: string; quantity: number }> };
export type ShipmentResult = { shipmentId: string; trackingNumber: string; trackingUrl: string | null; status: string };

export interface ShippingProvider { createShipment(input: ShipmentInput): Promise<ShipmentResult>; refreshShipment(shipmentId: string): Promise<ShipmentResult>; }

export class BostaShippingService implements ShippingProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  constructor(baseUrl: string, apiKey: string) {
    let parsed: URL;
    try { parsed = new URL(baseUrl); }
    catch { throw new Error('Bosta base URL must be a valid HTTPS URL'); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !(parsed.hostname === 'bosta.co' || parsed.hostname.endsWith('.bosta.co'))) {
      throw new Error('Bosta base URL must use an HTTPS Bosta domain');
    }
    this.baseUrl = parsed.toString().replace(/\/$/, '');
    this.apiKey = apiKey;
  }
  private async request(path: string, init?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { Authorization: this.apiKey, "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "Bosta request failed");
    return data as Record<string, unknown>;
  }
  private result(data: Record<string, unknown>): ShipmentResult {
    const delivery = (data.delivery ?? data) as Record<string, unknown>;
    return { shipmentId: String(delivery._id ?? delivery.id ?? ""), trackingNumber: String(delivery.trackingNumber ?? delivery.awb ?? ""), trackingUrl: typeof delivery.trackingUrl === "string" ? delivery.trackingUrl : null, status: String(delivery.state ?? delivery.status ?? "created") };
  }
  async createShipment(input: ShipmentInput) {
    const result = await this.request("/api/v2/deliveries?apiVersion=1", { method: "POST", body: JSON.stringify({ type: "delivery", businessReference: input.orderNumber, cod: input.total, receiver: { firstName: input.address.fullName, phone: input.address.phone, address: input.address.addressLine1, city: input.address.city }, notes: input.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ") }) });
    return this.result(result);
  }
  async refreshShipment(shipmentId: string) { return this.result(await this.request(`/api/v2/deliveries/${encodeURIComponent(shipmentId)}`)); }
}
