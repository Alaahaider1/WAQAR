"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShipmentAction, refreshShipmentStatusAction } from "@/src/actions/order.actions";
import { toast } from "@/components/ui/Toast";
export function ShipmentControls({ orderId, shipmentId }: { orderId:string; shipmentId:string|null }) { const router=useRouter(); const [pending,start]=useTransition(); const run=()=>start(async()=>{const r=shipmentId?await refreshShipmentStatusAction(orderId,shipmentId):await createShipmentAction(orderId); if(!r.success) toast.error(r.error); else { toast.success(shipmentId?"Shipment status refreshed.":"Shipment created successfully."); router.refresh(); }}); return <button type="button" onClick={run} disabled={pending} style={{padding:"9px 12px",border:"1px solid #B8965A",backgroundColor:"#FAFAF7",color:"#B8965A",cursor:pending?"not-allowed":"pointer",fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:12}}>{pending?"Working...":shipmentId?"Refresh Shipment Status":"Create Shipment"}</button>; }
