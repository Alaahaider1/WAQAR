"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/Toast";
import { Save, RotateCcw, User, Store, Share2, Truck, DollarSign, Radio, CreditCard, ImageIcon } from "lucide-react";
import { CustomerFeedbackManager } from '@/components/admin/CustomerFeedbackManager';
import {
  getAdminSettingsAction,
  updateAdminProfileAction,
  updateSiteSettingsAction,
} from "@/src/actions/settings.actions";

const S = { d:{fontFamily:"'Cormorant Garamond',Georgia,serif"}, b:{fontFamily:"'DM Sans',system-ui,sans-serif"}, m:{fontFamily:"'DM Mono',monospace"} } as const;

const TABS = [
  { id:"profile", label:"Profile", Icon:User },
  { id:"store", label:"Store Info", Icon:Store },
  { id:"social", label:"Social Links", Icon:Share2 },
  { id:"shipping", label:"Shipping", Icon:Truck },
  { id:"currency", label:"Currency", Icon:DollarSign },
  { id:"meta", label:"Meta Pixel", Icon:Radio },
  { id:"payments", label:"Payments", Icon:CreditCard },
  { id:"feedback", label:"Customer Reviews", Icon:ImageIcon },
] as const;

type SettingsForm = {
  storeName: string; storeEmail: string; currency: string; symbol: string;
  taxRate: string; taxIncluded: boolean; freeThreshold: string; standardRate: string;
  expressRate: string; standardDays: string; expressDays: string; instagram: string;
  twitter: string; facebook: string; metaPixelEnabled: boolean; metaPixelId: string;
  tikTokPixelEnabled: boolean; tikTokPixelId: string; vodafoneCashNumber: string; orangeCashNumber: string; etisalatCashNumber: string;
  wePayNumber: string; instaPayAccount: string; bankAccountName: string;
  bankAccountNumber: string; bankName: string;
  shippingProvider: string; shippingApiKey: string; shippingBaseUrl: string; shippingEnvironment: string; shippingEnabled: boolean;
};
type ProfileForm = { fullName: string; email: string; phone: string };

const defaultSettings: SettingsForm = {
  storeName:"", storeEmail:"", currency:"EGP", symbol:"E£", taxRate:"0", taxIncluded:false,
  freeThreshold:"0", standardRate:"0", expressRate:"0", standardDays:"", expressDays:"",
  instagram:"", twitter:"", facebook:"", metaPixelEnabled:false, metaPixelId:"",
  tikTokPixelEnabled:false, tikTokPixelId:"", vodafoneCashNumber:"", orangeCashNumber:"", etisalatCashNumber:"", wePayNumber:"",
  instaPayAccount:"", bankAccountName:"", bankAccountNumber:"", bankName:"",
  shippingProvider:"bosta", shippingApiKey:"", shippingBaseUrl:"", shippingEnvironment:"sandbox", shippingEnabled:false,
};
const defaultProfile: ProfileForm = { fullName:"", email:"", phone:"" };

function Field({ label, children, half }: { label:string; children:React.ReactNode; half?:boolean }) {
  return <div style={{ gridColumn:half ? "span 1" : "span 2", display:"flex", flexDirection:"column", gap:6 }} className={half ? "" : "full-col"}>
    <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase", color:"#6B6B63" }}>{label}</label>{children}
  </div>;
}

function Input({ value, onChange, type="text", placeholder }: { value:string; onChange:(value:string)=>void; type?:string; placeholder?:string }) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{ padding:"10px 13px", border:"1px solid #EDE8DC", backgroundColor:"#FAFAF7", ...S.b, fontSize:13, color:"#1A1A18", outline:"none", width:"100%", boxSizing:"border-box" }} />;
}

function Toggle({ checked, onChange, label }: { checked:boolean; onChange:(checked:boolean)=>void; label:string }) {
  return <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", ...S.b, fontSize:13, color:"#1A1A18" }}>
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{ width:16, height:16, accentColor:"#B8965A" }} />{label}
  </label>;
}

export default function AdminSettingsPage() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("profile");
  const [profile, setProfile] = useState(defaultProfile);
  const [settings, setSettings] = useState(defaultSettings);
  const [initialProfile, setInitialProfile] = useState(defaultProfile);
  const [initialSettings, setInitialSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const result = await getAdminSettingsAction();
      if (!result.success) { toast.error(result.error); setLoading(false); return; }
      const s = result.data.settings;
      const loadedSettings: SettingsForm = {
        storeName:s.storeName ?? "", storeEmail:s.storeEmail ?? "", currency:s.storeCurrency ?? "EGP",
        symbol:s.storeCurrencySymbol ?? "EGP", taxRate:String(s.taxRate ?? 0), taxIncluded:s.taxIncluded ?? false,
        freeThreshold:String(s.shippingFreeThreshold ?? 0), standardRate:String(s.shippingStandardRate ?? 0),
        expressRate:String(s.shippingExpressRate ?? 0), standardDays:s.shippingStandardDays ?? "",
        expressDays:s.shippingExpressDays ?? "", instagram:s.socialInstagram ?? "", twitter:s.socialTwitter ?? "",
        facebook:s.socialFacebook ?? "", metaPixelEnabled:s.metaPixelEnabled ?? false, metaPixelId:s.metaPixelId ?? "",
        tikTokPixelEnabled:s.tikTokPixelEnabled ?? false, tikTokPixelId:s.tikTokPixelId ?? "",
        vodafoneCashNumber:s.vodafoneCashNumber ?? "", orangeCashNumber:s.orangeCashNumber ?? "",
        etisalatCashNumber:s.etisalatCashNumber ?? "", wePayNumber:s.wePayNumber ?? "",
        instaPayAccount:s.instaPayAccount ?? "", bankAccountName:s.bankAccountName ?? "",
        bankAccountNumber:s.bankAccountNumber ?? "", bankName:s.bankName ?? "",
        shippingProvider:s.shippingProvider ?? "bosta", shippingApiKey:s.shippingApiKey ?? "", shippingBaseUrl:s.shippingBaseUrl ?? "", shippingEnvironment:s.shippingEnvironment ?? "sandbox", shippingEnabled:s.shippingEnabled ?? false,
      };
      const loadedProfile = result.data.profile;
      setSettings(loadedSettings); setInitialSettings(loadedSettings);
      setProfile(loadedProfile); setInitialProfile(loadedProfile); setLoading(false);
    })();
  }, []);

  const dirty = JSON.stringify(profile) !== JSON.stringify(initialProfile) || JSON.stringify(settings) !== JSON.stringify(initialSettings);
  const updateSetting = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => setSettings(current => ({ ...current, [key]:value }));
  const updateProfile = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => setProfile(current => ({ ...current, [key]:value }));

  const reset = () => { setProfile(initialProfile); setSettings(initialSettings); toast.info("Changes discarded"); };
  const save = async () => {
    setSaving(true);
    const [profileResult, settingsResult] = await Promise.all([
      updateAdminProfileAction(profile),
      updateSiteSettingsAction({
        store_name:settings.storeName, store_email:settings.storeEmail, store_currency:settings.currency,
        store_currency_symbol:settings.symbol, tax_rate:Number(settings.taxRate) || 0, tax_included:settings.taxIncluded,
        shipping_free_threshold:Number(settings.freeThreshold) || 0, shipping_standard_rate:Number(settings.standardRate) || 0,
        shipping_express_rate:Number(settings.expressRate) || 0, shipping_standard_days:settings.standardDays,
        shipping_express_days:settings.expressDays, social_instagram:settings.instagram, social_twitter:settings.twitter,
        social_facebook:settings.facebook, meta_pixel_enabled:settings.metaPixelEnabled, meta_pixel_id:settings.metaPixelId.trim(),
        tiktok_pixel_enabled:settings.tikTokPixelEnabled, tiktok_pixel_id:settings.tikTokPixelId.trim(),
        vodafone_cash_number:settings.vodafoneCashNumber.trim(), orange_cash_number:settings.orangeCashNumber.trim(),
        etisalat_cash_number:settings.etisalatCashNumber.trim(), we_pay_number:settings.wePayNumber.trim(),
        instapay_account:settings.instaPayAccount.trim(), bank_account_name:settings.bankAccountName.trim(),
        bank_account_number:settings.bankAccountNumber.trim(), bank_name:settings.bankName.trim(),
        shipping_provider:settings.shippingProvider, shipping_api_key:settings.shippingApiKey.trim(), shipping_base_url:settings.shippingBaseUrl.trim(), shipping_environment:settings.shippingEnvironment, shipping_enabled:settings.shippingEnabled,
      }),
    ]);
    setSaving(false);
    const failure = !profileResult.success ? profileResult : !settingsResult.success ? settingsResult : null;
    if (failure) { toast.error(failure.error); return; }
    setInitialProfile(profile); setInitialSettings(settings); toast.success("Settings saved successfully");
  };

  const card = { backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", padding:"clamp(16px,3vw,28px)" };
  const grid = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px 20px" };
  if (loading) return <div style={{ padding:32, ...S.b, color:"#6B6B63" }}>Loading settings…</div>;

  return <div style={{ padding:"clamp(16px,3vw,32px)", display:"flex", flexDirection:"column", gap:24 }}>
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
      <div><p style={{ ...S.m, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"#6B6B63", marginBottom:4 }}>Admin</p><h1 style={{ ...S.d, fontSize:"clamp(22px,4vw,32px)", fontWeight:300, color:"#1A1A18", margin:0 }}>Settings</h1></div>
      {dirty && <div style={{ display:"flex", gap:8 }}><button onClick={reset} style={buttonLight}><RotateCcw size={11} /> Reset</button><button onClick={()=>void save()} disabled={saving} style={buttonDark}><Save size={11} /> {saving ? "Saving…" : "Save Changes"}</button></div>}
    </div>
    <div className="settings-layout">
      <div style={{ display:"flex", flexDirection:"column", gap:2 }} className="settings-tabs">{TABS.map(({id,label,Icon}) => <button key={id} onClick={()=>setActive(id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:active===id ? "rgba(184,150,90,0.05)" : "none", border:`1px solid ${active===id ? "rgba(184,150,90,0.2)" : "transparent"}`, borderLeft:`2px solid ${active===id ? "#B8965A" : "transparent"}`, cursor:"pointer", textAlign:"left" }}><Icon size={14} strokeWidth={1.5} style={{ color:active===id ? "#B8965A" : "#6B6B63" }} /><span style={{ ...S.b, fontSize:13, color:active===id ? "#1A1A18" : "#6B6B63" }}>{label}</span></button>)}</div>
      <div><AnimatePresence mode="wait"><motion.div key={active} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.18}}>
        {active === "profile" && <section style={card}><Title>Profile</Title><div style={grid} className="settings-grid"><Field label="Full Name"><Input value={profile.fullName} onChange={v=>updateProfile("fullName",v)} /></Field><Field label="Email Address"><Input type="email" value={profile.email} onChange={v=>updateProfile("email",v)} /></Field><Field label="Phone Number"><Input type="tel" value={profile.phone} onChange={v=>updateProfile("phone",v)} /></Field></div></section>}
        {active === "store" && <section style={card}><Title>Store Information</Title><div style={grid} className="settings-grid"><Field label="Store Name" half><Input value={settings.storeName} onChange={v=>updateSetting("storeName",v)} /></Field><Field label="Contact Email" half><Input type="email" value={settings.storeEmail} onChange={v=>updateSetting("storeEmail",v)} /></Field></div></section>}
        {active === "social" && <section style={card}><Title>Social Links</Title><div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:560}}><Field label="Instagram"><Input value={settings.instagram} onChange={v=>updateSetting("instagram",v)} /></Field><Field label="Twitter / X"><Input value={settings.twitter} onChange={v=>updateSetting("twitter",v)} /></Field><Field label="Facebook"><Input value={settings.facebook} onChange={v=>updateSetting("facebook",v)} /></Field></div></section>}
        {active === "shipping" && <section style={card}><Title>Shipping Settings</Title><div style={grid} className="settings-grid"><Field label="Free Shipping Threshold" half><Input type="number" value={settings.freeThreshold} onChange={v=>updateSetting("freeThreshold",v)} /></Field><Field label="Standard Rate" half><Input type="number" value={settings.standardRate} onChange={v=>updateSetting("standardRate",v)} /></Field><Field label="Express Rate" half><Input type="number" value={settings.expressRate} onChange={v=>updateSetting("expressRate",v)} /></Field><Field label="Standard Delivery (days)" half><Input value={settings.standardDays} onChange={v=>updateSetting("standardDays",v)} /></Field><Field label="Express Delivery (days)" half><Input value={settings.expressDays} onChange={v=>updateSetting("expressDays",v)} /></Field><Field label="Provider" half><Input value={settings.shippingProvider} onChange={v=>updateSetting("shippingProvider",v)} /></Field><Field label="API Key" half><Input value={settings.shippingApiKey} onChange={v=>updateSetting("shippingApiKey",v)} /></Field><Field label="Base URL" half><Input value={settings.shippingBaseUrl} onChange={v=>updateSetting("shippingBaseUrl",v)} /></Field><Field label="Environment" half><select value={settings.shippingEnvironment} onChange={e=>updateSetting("shippingEnvironment",e.target.value)} style={{padding:"10px 13px",border:"1px solid #EDE8DC",backgroundColor:"#FAFAF7",...S.b,fontSize:13}}><option value="sandbox">Sandbox</option><option value="production">Production</option></select></Field><Field label="Enable Shipping"><Toggle checked={settings.shippingEnabled} onChange={v=>updateSetting("shippingEnabled",v)} label="Enable shipping provider" /></Field></div></section>}
        {active === "currency" && <section style={card}><Title>Currency & Tax</Title><div style={grid} className="settings-grid"><Field label="Currency" half><Input value={settings.currency} onChange={v=>updateSetting("currency",v)} /></Field><Field label="Currency Symbol" half><Input value={settings.symbol} onChange={v=>updateSetting("symbol",v)} /></Field><Field label="Tax Rate (%)"><Input type="number" value={settings.taxRate} onChange={v=>updateSetting("taxRate",v)} /></Field><Field label="Tax Display"><Toggle checked={settings.taxIncluded} onChange={v=>updateSetting("taxIncluded",v)} label="Prices include tax" /></Field></div></section>}
        {active === "meta" && <section style={card}><Title>Meta Pixel</Title><div style={{display:"flex",flexDirection:"column",gap:18,maxWidth:560}}><Toggle checked={settings.metaPixelEnabled} onChange={v=>updateSetting("metaPixelEnabled",v)} label="Enable Meta Pixel" /><Field label="Pixel ID"><Input value={settings.metaPixelId} onChange={v=>updateSetting("metaPixelId",v)} placeholder="123456789012345" /></Field><p style={{...S.b,fontSize:12,color:"#6B6B63",margin:0,lineHeight:1.6}}>When enabled, PageView is sent globally. AddToCart, Purchase, InitiateCheckout, and ViewContent helpers are ready for storefront use.</p><div style={{display:"flex",flexDirection:"column",gap:14,marginTop:8,paddingTop:16,borderTop:"1px solid #EDE8DC"}}><Toggle checked={settings.tikTokPixelEnabled} onChange={v=>updateSetting("tikTokPixelEnabled",v)} label="Enable TikTok Pixel" /><Field label="TikTok Pixel ID"><Input value={settings.tikTokPixelId} onChange={v=>updateSetting("tikTokPixelId",v)} placeholder="123456789012345" /></Field></div></div></section>}
        {active === "payments" && <section style={card}><Title>Manual Payment Details</Title><div style={grid} className="settings-grid"><Field label="Vodafone Cash Number" half><Input value={settings.vodafoneCashNumber} onChange={v=>updateSetting("vodafoneCashNumber",v)} placeholder="010XXXXXXXX" /></Field><Field label="Orange Cash Number" half><Input value={settings.orangeCashNumber} onChange={v=>updateSetting("orangeCashNumber",v)} placeholder="010XXXXXXXX" /></Field><Field label="Etisalat Cash Number" half><Input value={settings.etisalatCashNumber} onChange={v=>updateSetting("etisalatCashNumber",v)} placeholder="010XXXXXXXX" /></Field><Field label="WE Pay Number" half><Input value={settings.wePayNumber} onChange={v=>updateSetting("wePayNumber",v)} placeholder="010XXXXXXXX" /></Field><Field label="InstaPay Account" half><Input value={settings.instaPayAccount} onChange={v=>updateSetting("instaPayAccount",v)} placeholder="waqar@instapay" /></Field><Field label="Bank Account Name" half><Input value={settings.bankAccountName} onChange={v=>updateSetting("bankAccountName",v)} placeholder="WAQAR PERFUMES" /></Field><Field label="Bank Account Number" half><Input value={settings.bankAccountNumber} onChange={v=>updateSetting("bankAccountNumber",v)} placeholder="1234567890" /></Field><Field label="Bank Name" half><Input value={settings.bankName} onChange={v=>updateSetting("bankName",v)} placeholder="CIB" /></Field></div></section>}
        {active === "feedback" && <CustomerFeedbackManager />}
      </motion.div></AnimatePresence><div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}><button onClick={reset} style={buttonLight}><RotateCcw size={11} /> Reset</button><button onClick={()=>void save()} disabled={!dirty || saving} style={buttonDark}><Save size={11} /> {saving ? "Saving…" : "Save Changes"}</button></div></div>
    </div><style>{`.settings-layout{display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:start}.settings-grid{grid-template-columns:1fr 1fr}.settings-tabs{position:sticky;top:76px}.full-col{grid-column:span 2!important}@media(max-width:900px){.settings-layout{grid-template-columns:1fr}.settings-tabs{position:static;flex-direction:row;flex-wrap:wrap}}@media(max-width:560px){.settings-grid{grid-template-columns:1fr!important}.full-col{grid-column:span 1!important}}`}</style>
  </div>;
}

function Title({children}:{children:React.ReactNode}) { return <h2 style={{...S.d,fontSize:20,fontWeight:300,color:"#1A1A18",margin:"0 0 20px"}}>{children}</h2>; }
const buttonLight = { display:"flex", alignItems:"center", gap:6, padding:"9px 16px", border:"1px solid #EDE8DC", backgroundColor:"#F5F0E8", cursor:"pointer", ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase" as const, color:"#6B6B63" };
const buttonDark = { display:"flex", alignItems:"center", gap:6, padding:"9px 16px", backgroundColor:"#1A1A18", color:"#FAFAF7", border:"none", cursor:"pointer", ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase" as const };
