"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Check, Ticket } from "lucide-react";
import { createCouponAction, updateCouponAction, deleteCouponAction } from "@/src/actions/coupon.actions";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils/formatPrice";

const S = {
  d: { fontFamily:"'Cormorant Garamond',Georgia,serif" },
  b: { fontFamily:"'DM Sans',system-ui,sans-serif" },
  m: { fontFamily:"'DM Mono',monospace" },
} as const;

type CouponStatus = "active"|"draft"|"expired"|"disabled";
type Coupon = { id:string; code:string; description:string|null; discount_type:string; discount_value:number; minimum_order_value:number; maximum_discount:number|null; usage_limit:number|null; usage_count:number; per_user_limit:number; status:CouponStatus; valid_from:string; valid_until:string|null; created_at:string; rowKey:string };
type FD = { code:string; description:string; discountType:"percentage"|"fixed"; discountValue:number; minimumOrderValue:number; usageLimit:string; perUserLimit:number; status:CouponStatus; validFrom:string; validUntil:string };
const EMPTY: FD = { code:"", description:"", discountType:"percentage", discountValue:10, minimumOrderValue:0, usageLimit:"", perUserLimit:1, status:"active", validFrom:"", validUntil:"" };

const SC: Record<CouponStatus,{bg:string;border:string;text:string}> = {
  active:  {bg:"rgba(184,150,90,0.1)",  border:"rgba(184,150,90,0.25)", text:"#B8965A"},
  expired: {bg:"rgba(204,68,68,0.08)",  border:"rgba(204,68,68,0.2)",   text:"#cc4444"},
  draft:   {bg:"#F5F0E8",               border:"#EDE8DC",               text:"#6B6B63"},
  disabled:{bg:"rgba(107,107,99,0.08)", border:"rgba(107,107,99,0.2)",  text:"#6B6B63"},
};

function iStyle(focused:boolean,error?:boolean):React.CSSProperties {
  return { padding:"9px 12px", border:`1px solid ${error?"#cc4444":focused?"#B8965A":"#EDE8DC"}`, backgroundColor:"#FAFAF7", ...S.b, fontSize:13, color:"#1A1A18", outline:"none", width:"100%", boxSizing:"border-box" };
}

function CouponModal({ initial, onSave, onClose, title }: { initial?:FD; onSave:(d:FD)=>Promise<void>; onClose:()=>void; title:string }) {
  const [form, setForm] = useState<FD>(initial ?? EMPTY);
  const [focused, setFocused] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FD,string>>>({});
  const [pending, start] = useTransition();
  const [isMobile, setIsMobile] = useState(false);

  const set = <K extends keyof FD>(k:K, v:FD[K]) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})); };

  const submit = () => {
    const e: typeof errors = {};
    if (!form.code.trim()) e.code = "Required";
    if (form.discountValue <= 0) e.discountValue = "Must be > 0";
    if (form.discountType === "percentage" && form.discountValue > 100) e.discountValue = "Max 100%";
    if (Object.keys(e).length) { setErrors(e); return; }
    start(async () => { await onSave(form); });
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const originalRootOverflow = root.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyOverflowX = body.style.overflowX;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overflowX = "hidden";

    const media = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobile(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);

    return () => {
      root.style.overflow = originalRootOverflow;
      body.style.overflow = originalBodyOverflow;
      body.style.overflowX = originalBodyOverflowX;
      media.removeEventListener("change", updateViewport);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div key="coupon-modal-root" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
          style={{ position:"absolute", inset:0, backgroundColor:"rgba(26,26,24,0.4)", backdropFilter:"blur(4px)" }} />
        <motion.div initial={{opacity:0,scale:0.96,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0}} transition={{duration:0.2}}
          onClick={e=>e.stopPropagation()}
          style={{ position:"relative", zIndex:1, width:isMobile?"100%":"min(560px, 100%)", maxWidth:isMobile?"none":"560px", maxHeight:"calc(100vh - 48px)", overflowY:"auto", borderRadius:16, backgroundColor:"#FAFAF7", boxShadow:"0 24px 64px rgba(26,26,24,0.16)", padding:"clamp(20px,3vw,32px)", margin:0, boxSizing:"border-box" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22 }}>
          <h2 style={{ ...S.d,fontSize:22,fontWeight:300,color:"#1A1A18",margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#6B6B63",padding:4,display:"flex" }}><X size={16} strokeWidth={1.5} /></button>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"14px 16px",marginBottom:14 }}>
          {/* Code */}
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ ...S.m,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:errors.code?"#cc4444":"#6B6B63",display:"block",marginBottom:5 }}>Coupon Code *</label>
            <input value={form.code} onChange={e=>set("code",e.target.value.toUpperCase())} onFocus={()=>setFocused("code")} onBlur={()=>setFocused("")} placeholder="SUMMER25" style={iStyle(focused==="code",!!errors.code)} />
            {errors.code && <p style={{ ...S.b,fontSize:11,color:"#cc4444",marginTop:3 }}>{errors.code}</p>}
          </div>

          {/* Discount type + value */}
          <div>
            <label style={{ ...S.m,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#6B6B63",display:"block",marginBottom:5 }}>Type</label>
            <select value={form.discountType} onChange={e=>set("discountType",e.target.value as "percentage"|"fixed")}
              style={{ ...iStyle(false),appearance:"none" as const }}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label style={{ ...S.m,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:errors.discountValue?"#cc4444":"#6B6B63",display:"block",marginBottom:5 }}>Value *</label>
            <input type="number" value={form.discountValue} onChange={e=>set("discountValue",Number(e.target.value))} onFocus={()=>setFocused("val")} onBlur={()=>setFocused("")} style={iStyle(focused==="val",!!errors.discountValue)} />
            {errors.discountValue && <p style={{ ...S.b,fontSize:11,color:"#cc4444",marginTop:3 }}>{errors.discountValue}</p>}
          </div>

          {/* Min order + usage limit */}
          <div>
            <label style={{ ...S.m,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#6B6B63",display:"block",marginBottom:5 }}>Min. Order</label>
            <input type="number" value={form.minimumOrderValue} onChange={e=>set("minimumOrderValue",Number(e.target.value))} onFocus={()=>setFocused("min")} onBlur={()=>setFocused("")} style={iStyle(focused==="min")} />
          </div>
          <div>
            <label style={{ ...S.m,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#6B6B63",display:"block",marginBottom:5 }}>Usage Limit</label>
            <input type="number" value={form.usageLimit} onChange={e=>set("usageLimit",e.target.value)} placeholder="Unlimited" onFocus={()=>setFocused("ulimit")} onBlur={()=>setFocused("")} style={iStyle(focused==="ulimit")} />
          </div>

          {/* Dates */}
          <div>
            <label style={{ ...S.m,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#6B6B63",display:"block",marginBottom:5 }}>Valid From</label>
            <input type="date" value={form.validFrom} onChange={e=>set("validFrom",e.target.value)} style={iStyle(false)} />
          </div>
          <div>
            <label style={{ ...S.m,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#6B6B63",display:"block",marginBottom:5 }}>Expiry Date</label>
            <input type="date" value={form.validUntil} onChange={e=>set("validUntil",e.target.value)} style={iStyle(false)} />
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom:20 }}>
          <label style={{ ...S.m,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#6B6B63",display:"block",marginBottom:8 }}>Status</label>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {(["active","draft","expired","disabled"] as CouponStatus[]).map(s=>{
              const c=SC[s]; const on=form.status===s;
              return <button key={s} type="button" onClick={()=>set("status",s)} style={{ padding:"6px 14px",border:`1px solid ${on?c.border:"#EDE8DC"}`,backgroundColor:on?c.bg:"#F5F0E8",cursor:"pointer",...S.m,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:on?c.text:"#6B6B63" }}>{s}</button>;
            })}
          </div>
        </div>

        <div style={{ display:"flex",gap:10,justifyContent:isMobile?"stretch":"flex-end",flexWrap:"wrap" }}>
          <button onClick={onClose} style={{ flex:isMobile?"1 1 100%":"0 0 auto", padding:"9px 20px",border:"1px solid #EDE8DC",backgroundColor:"#F5F0E8",cursor:"pointer",...S.m,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:"#6B6B63" }}>Cancel</button>
          <button onClick={submit} disabled={pending} style={{ flex:isMobile?"1 1 100%":"0 0 auto", display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 20px",backgroundColor:"#1A1A18",color:"#FAFAF7",border:"none",cursor:"pointer",...S.m,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase" as const,opacity:pending?0.7:1 }}>
            <Check size={11} /> {pending?"Saving…":"Save Coupon"}
          </button>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function toFD(c: Coupon): FD {
  return {
    code: c.code,
    description: c.description ?? "",
    discountType: c.discount_type as "percentage"|"fixed",
    discountValue: Number(c.discount_value),
    minimumOrderValue: Number(c.minimum_order_value),
    usageLimit: c.usage_limit ? String(c.usage_limit) : "",
    perUserLimit: c.per_user_limit,
    status: c.status,
    validFrom: c.valid_from ? c.valid_from.slice(0,10) : "",
    validUntil: c.valid_until ? c.valid_until.slice(0,10) : "",
  };
}

export function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon|null>(null);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [, startDel] = useTransition();

  const refresh = () => router.refresh();

  const toPayload = (d: FD) => ({
    code: d.code, description: d.description||undefined,
    discountType: d.discountType, discountValue: d.discountValue,
    minimumOrderValue: d.minimumOrderValue,
    usageLimit: d.usageLimit ? Number(d.usageLimit) : undefined,
    perUserLimit: d.perUserLimit, status: d.status,
    validFrom: d.validFrom ? new Date(d.validFrom).toISOString() : undefined,
    validUntil: d.validUntil ? new Date(d.validUntil).toISOString() : undefined,
  });

  const handleAdd = async (d: FD) => {
    const r = await createCouponAction(toPayload(d));
    if (r.success) { toast.success(`Coupon "${d.code}" created`); setShowAdd(false); refresh(); }
    else toast.error(r.error);
  };

  const handleEdit = async (d: FD) => {
    if (!editCoupon) return;
    const r = await updateCouponAction(editCoupon.id, toPayload(d));
    if (r.success) { toast.success(`Coupon "${d.code}" updated`); setEditCoupon(null); refresh(); }
    else toast.error(r.error);
  };

  const handleDelete = (id: string) => {
    startDel(async () => {
      const r = await deleteCouponAction(id);
      if (r.success) { toast.success("Coupon deleted"); setDeleteId(null); refresh(); }
      else toast.error(r.error);
    });
  };

  const th: React.CSSProperties = { ...S.m,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:"#6B6B63",padding:"10px 14px",textAlign:"left",backgroundColor:"#F5F0E8",borderBottom:"1px solid #EDE8DC",whiteSpace:"nowrap" };

  const active  = initialCoupons.filter(c=>c.status==="active").length;
  const draft   = initialCoupons.filter(c=>c.status==="draft").length;
  const expired = initialCoupons.filter(c=>c.status==="expired"||c.status==="disabled").length;

  return (
    <>
      <div style={{ padding:"clamp(16px,3vw,32px)",display:"flex",flexDirection:"column",gap:20 }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
          <div>
            <p style={{ ...S.m,fontSize:9,letterSpacing:"0.25em",textTransform:"uppercase",color:"#6B6B63",marginBottom:4 }}>Admin</p>
            <h1 style={{ ...S.d,fontSize:"clamp(22px,4vw,32px)",fontWeight:300,color:"#1A1A18",margin:0 }}>Coupons</h1>
          </div>
          <button onClick={()=>setShowAdd(true)} style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",backgroundColor:"#1A1A18",color:"#FAFAF7",border:"none",cursor:"pointer",...S.m,fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase" }}>
            <Plus size={13} strokeWidth={2} /> Add Coupon
          </button>
        </div>

        {/* Summary */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
          {[["Active",active,"#B8965A"],["Draft",draft,"#6B6B63"],["Expired / Disabled",expired,"#cc4444"]].map(([l,v,col])=>(
            <div key={l as string} style={{ backgroundColor:"#FAFAF7",border:"1px solid #EDE8DC",padding:"14px 18px" }}>
              <p style={{ ...S.d,fontSize:24,fontWeight:300,color:"#1A1A18",margin:"0 0 4px" }}>{v}</p>
              <p style={{ ...S.m,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:col as string,margin:0 }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor:"#FAFAF7",border:"1px solid #EDE8DC",overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",minWidth:540 }}>
            <thead>
              <tr>
                {["Code","Type","Value","Min. Order","Usage","Expiry","Status","Actions"].map(h=>(
                  <th key={h} style={{ ...th,textAlign:h==="Actions"?"right":"left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialCoupons.length===0?(
                <tr><td colSpan={8} style={{ textAlign:"center",padding:"48px 24px" }}>
                  <Ticket size={28} strokeWidth={1} style={{ color:"#EDE8DC",marginBottom:10 }} />
                  <p style={{ ...S.d,fontSize:20,fontWeight:300,color:"#1A1A18",margin:"0 0 4px" }}>No coupons yet</p>
                </td></tr>
              ):initialCoupons.map((c,i)=>{
                const sc=SC[c.status]??SC.draft;
                return (
                  <tr key={c.rowKey} style={{ borderBottom:i<initialCoupons.length-1?"1px solid #EDE8DC":"none" }}>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ ...S.m,fontSize:12,fontWeight:500,color:"#1A1A18",backgroundColor:"#F5F0E8",border:"1px solid #EDE8DC",padding:"3px 10px",letterSpacing:"0.06em" }}>{c.code}</span>
                    </td>
                    <td style={{ padding:"12px 14px" }}><span style={{ ...S.m,fontSize:10,color:"#6B6B63" }}>{c.discount_type}</span></td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ ...S.m,fontSize:13,color:"#B8965A",fontWeight:500 }}>
                        {c.discount_type==="percentage"?`${c.discount_value}%`:`${formatPrice(Number(c.discount_value))}`}
                      </span>
                    </td>
                    <td style={{ padding:"12px 14px" }}><span style={{ ...S.m,fontSize:12,color:"#6B6B63" }}>{formatPrice(Number(c.minimum_order_value))}</span></td>
                    <td style={{ padding:"12px 14px" }}>
                      <div>
                        <p style={{ ...S.m,fontSize:12,color:"#1A1A18",margin:0 }}>{c.usage_count}/{c.usage_limit??'∞'}</p>
                        {c.usage_limit && (
                          <div style={{ height:3,backgroundColor:"#EDE8DC",marginTop:4,width:64,position:"relative" }}>
                            <div style={{ position:"absolute",left:0,top:0,bottom:0,width:`${Math.min(100,(c.usage_count/c.usage_limit)*100)}%`,backgroundColor:"#B8965A" }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ ...S.m,fontSize:10,color:"#6B6B63",whiteSpace:"nowrap" }}>
                        {c.valid_until?new Date(c.valid_until).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"—"}
                      </span>
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ ...S.m,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:sc.text,backgroundColor:sc.bg,border:`1px solid ${sc.border}`,padding:"3px 8px" }}>{c.status}</span>
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex",gap:5,justifyContent:"flex-end" }}>
                        <button onClick={()=>setEditCoupon(c)} style={{ width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #EDE8DC",backgroundColor:"#F5F0E8",cursor:"pointer",color:"#6B6B63",transition:"all 0.15s" }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#1A1A18";(e.currentTarget as HTMLButtonElement).style.color="#1A1A18";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#EDE8DC";(e.currentTarget as HTMLButtonElement).style.color="#6B6B63";}}>
                          <Pencil size={12} strokeWidth={1.5} />
                        </button>
                        {deleteId===c.id?(
                          <div style={{ display:"flex",gap:4 }}>
                            <button onClick={()=>handleDelete(c.id)} style={{ width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #cc4444",backgroundColor:"#cc4444",cursor:"pointer",color:"#FAFAF7" }}><Check size={11} strokeWidth={2} /></button>
                            <button onClick={()=>setDeleteId(null)} style={{ width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #EDE8DC",backgroundColor:"#F5F0E8",cursor:"pointer",color:"#6B6B63" }}><X size={11} strokeWidth={1.5} /></button>
                          </div>
                        ):(
                          <button onClick={()=>setDeleteId(c.id)} style={{ width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #EDE8DC",backgroundColor:"#F5F0E8",cursor:"pointer",color:"#6B6B63",transition:"all 0.15s" }}
                            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#cc4444";(e.currentTarget as HTMLButtonElement).style.color="#cc4444";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#EDE8DC";(e.currentTarget as HTMLButtonElement).style.color="#6B6B63";}}>
                            <Trash2 size={12} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <CouponModal title="New Coupon" onSave={handleAdd} onClose={()=>setShowAdd(false)} />}
      {editCoupon && <CouponModal title={`Edit ${editCoupon.code}`} initial={toFD(editCoupon)} onSave={handleEdit} onClose={()=>setEditCoupon(null)} />}
    </>
  );
}
