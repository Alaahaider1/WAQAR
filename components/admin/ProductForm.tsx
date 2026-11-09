"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, Plus, ImageIcon, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { normalizeSizeLabel, parseSizeMilliliters } from "@/lib/catalog/sizeLabels";

const S = { d:{fontFamily:"'Cormorant Garamond',Georgia,serif"}, b:{fontFamily:"'DM Sans',system-ui,sans-serif"}, m:{fontFamily:"'DM Mono',monospace"} } as const;

export type ProductFormData = {
  name: string;
  subtitle: string;
  description: string;
  longDescription: string;
  category: "summer" | "winter" | "bundle";
  originalPrice?: number;
  discount: number;
  stock: number;
  variants: Array<{
    id?: string;
    size: string;
    price: number;
    compareAtPrice?: number | null;
    concentration?: string | null;
    position?: number;
    sku: string;
    isDefault: boolean;
    isActive: boolean;
  }>;
  image: string;
  gallery: string[];
  noteTop: string;
  noteHeart: string;
  noteBase: string;
  ingredients: string;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  status: "published" | "draft";
  inStock: boolean;
  tags: string[];
};

const EMPTY: ProductFormData = {
  name:"", subtitle:"", description:"", longDescription:"",
  category:"summer", originalPrice:undefined, discount:0,
  stock:0, variants:[{ size:"50ml", price:0, sku:"", isDefault:true, isActive:true }], image:"", gallery:[],
  noteTop:"", noteHeart:"", noteBase:"", ingredients:"",
  isBestSeller:false, isNew:false, isFeatured:false,
  status:"published", inStock:true, tags:[],
};

function Input({ value, onChange, placeholder, type="text", error }: { value:string|number; onChange:(v:string)=>void; placeholder?:string; type?:string; error?:string }) {
  const [f,setF] = useState(false);
  return (
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)} placeholder={placeholder}
      style={{ padding:"10px 13px", border:`1px solid ${error?"#cc4444":f?"#B8965A":"#EDE8DC"}`, backgroundColor:"#FAFAF7", ...S.b, fontSize:13, color:"#1A1A18", outline:"none", transition:"border-color 0.2s", width:"100%", boxSizing:"border-box" as const }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows=3 }: { value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number }) {
  const [f,setF] = useState(false);
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      placeholder={placeholder} rows={rows}
      style={{ padding:"10px 13px", border:`1px solid ${f?"#B8965A":"#EDE8DC"}`, backgroundColor:"#FAFAF7", ...S.b, fontSize:13, color:"#1A1A18", outline:"none", resize:"vertical" as const, width:"100%", boxSizing:"border-box" as const, minHeight:rows*24+20 }}
    />
  );
}

export function ProductForm({ initial={}, onSubmit, submitLabel, loading }: { initial?:Partial<ProductFormData>; onSubmit:(d:ProductFormData)=>void; submitLabel:string; loading?:boolean }) {
  const [form, setForm] = useState<ProductFormData>({...EMPTY,...initial, variants:initial.variants ?? EMPTY.variants});
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData,string>>>({});
  const [images, setImages] = useState<string[]>(
    initial.gallery?.length ? initial.gallery : initial.image ? [initial.image] : []
  );
  const [urlInput, setUrlInput] = useState("");
  const [mainIdx, setMainIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProductFormData>(k:K, v:ProductFormData[K]) => {
    setForm(f=>({...f,[k]:v}));
    setErrors(e=>({...e,[k]:undefined}));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Product name is required";
    const availableVariants = form.variants.filter((variant) => variant.isActive);
    if (availableVariants.length === 0) e.variants = "Make at least one size available";
    if (availableVariants.filter((variant) => variant.isDefault).length !== 1) e.variants = "Choose one available default size";
    if (availableVariants.some((variant) => parseSizeMilliliters(variant.size) === null || variant.price <= 0 || !variant.sku.trim())) {
      e.variants = "Each available size needs a positive ML size, price, and SKU";
    }
    const sizes = availableVariants.map((variant) => normalizeSizeLabel(variant.size));
    const skus = availableVariants.map((variant) => variant.sku.trim().toLowerCase());
    if (new Set(sizes).size !== sizes.length || new Set(skus).size !== skus.length) {
      e.variants = "Available size names and SKUs must be unique";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const updateVariant = (index:number, changes:Partial<ProductFormData["variants"][number]>) => {
    set("variants", form.variants.map((variant, i) => i === index ? { ...variant, ...changes } : variant));
  };

  const setDefaultVariant = (index:number) => {
    set("variants", form.variants.map((variant, i) => ({ ...variant, isDefault: i === index })));
  };

  const toggleVariantAvailability = (index:number, isActive:boolean) => {
    let variants = form.variants.map((variant, i) => i === index ? { ...variant, isActive } : variant);
    if (!isActive && variants[index].isDefault) {
      const fallback = variants.findIndex((variant, i) => i !== index && variant.isActive);
      variants = variants.map((variant, i) => ({ ...variant, isDefault: i === fallback }));
    }
    set("variants", variants);
  };

  const removeVariant = (index:number) => {
    const removedDefault = form.variants[index]?.isDefault;
    let variants = form.variants.filter((_, i) => i !== index);
    if (removedDefault && variants.length > 0 && !variants.some((variant) => variant.isDefault && variant.isActive)) {
      const fallback = variants.findIndex((variant) => variant.isActive);
      variants = variants.map((variant, i) => ({ ...variant, isDefault: i === fallback }));
    }
    set("variants", variants);
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url || images.includes(url)) return;
    setImages(p => [...p, url]);
    if (images.length === 0) set("image", url);
    setUrlInput("");
  };

  const removeImage = (i: number) => {
    setImages(p => {
      const next = p.filter((_,j)=>j!==i);
      const newMain = Math.min(mainIdx, next.length-1);
      setMainIdx(Math.max(0, newMain));
      if (next.length > 0) set("image", next[Math.max(0,newMain)]);
      return next;
    });
  };

  const moveImage = (i: number, dir: -1|1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    setImages(p => {
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    if (mainIdx === i) setMainIdx(j);
    else if (mainIdx === j) setMainIdx(i);
  };

  const setMain = (i: number) => {
    setMainIdx(i);
    set("image", images[i]);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files??[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const url = ev.target?.result as string;
        setImages(p => {
          if (p.length === 0) set("image", url);
          return [...p, url];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const mainImage = images[mainIdx] ?? images[0] ?? form.image;
    onSubmit({ ...form, image: mainImage, gallery: images.length ? images : [mainImage] });
  };

  const card = { backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", padding:"clamp(14px,2vw,24px)" };
  const heading = { ...S.d, fontSize:18, fontWeight:300, color:"#1A1A18", margin:"0 0 18px" };

  return (
    <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Basic Info */}
      <div style={card}>
        <h3 style={heading}>Basic Information</h3>
        <div className="pf-grid2">
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:errors.name?"#cc4444":"#6B6B63", display:"block", marginBottom:5 }}>Product Name *</label>
            <Input value={form.name} onChange={v=>set("name",v)} placeholder="e.g. Golden Light" error={errors.name}/>
            {errors.name && <p style={{ ...S.b, fontSize:11, color:"#cc4444", marginTop:3 }}>{errors.name}</p>}
          </div>
          <div>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Subtitle</label>
            <Input value={form.subtitle} onChange={v=>set("subtitle",v)} placeholder="e.g. Eau de Parfum"/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Short Description</label>
            <Textarea value={form.description} onChange={v=>set("description",v)} placeholder="One-line description for product cards…" rows={2}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Long Description</label>
            <Textarea value={form.longDescription} onChange={v=>set("longDescription",v)} placeholder="Full product description…" rows={5}/>
          </div>
        </div>
      </div>

      {/* Available Sizes */}
      <div style={card}>
        <h3 style={heading}>Available Sizes</h3>
        <p style={{ ...S.b, fontSize:12, color:"#6B6B63", margin:"-8px 0 16px" }}>Each available size uses its own configured price. Removing an existing size from this form deactivates its record and preserves order history.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {form.variants.map((variant,index)=>(
            <div key={variant.id ?? `new-${index}`} className="pf-variant-row" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.3fr auto auto auto", gap:10, alignItems:"end", padding:12, border:"1px solid #EDE8DC", backgroundColor:variant.isActive?"#FAFAF7":"#F5F0E8" }}>
              <span style={{ gridColumn:"1 / -1", ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase", color:"#6B6B63" }}>{variant.id ? "Existing variant · record preserved" : "New variant · saved as a new record"}</span>
              <div>
                <label style={{ ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Size</label>
                <Input value={variant.size} onChange={value=>updateVariant(index,{size:value})} placeholder="50ml"/>
              </div>
              <div>
                <label style={{ ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Catalog Price (EGP)</label>
                <Input type="number" value={variant.price || ""} onChange={value=>updateVariant(index,{price:value?Number(value):0})} placeholder="350"/>
              </div>
              <div>
                <label style={{ ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>SKU</label>
                <Input value={variant.sku} onChange={value=>updateVariant(index,{sku:value})} placeholder="AMBER-50"/>
              </div>
              <label style={{ display:"flex", alignItems:"center", gap:6, minHeight:42, ...S.b, fontSize:11, color:"#1A1A18", whiteSpace:"nowrap" }}>
                <input type="radio" name="default-size" checked={variant.isDefault} disabled={!variant.isActive} onChange={()=>setDefaultVariant(index)}/>
                Default
              </label>
              <label style={{ display:"flex", alignItems:"center", gap:6, minHeight:42, ...S.b, fontSize:11, color:"#1A1A18", whiteSpace:"nowrap" }}>
                <input type="checkbox" checked={variant.isActive} onChange={event=>toggleVariantAvailability(index,event.target.checked)}/>
                Available
              </label>
              <button type="button" onClick={()=>removeVariant(index)} aria-label={`Remove ${variant.size || "size"}`} style={{ width:34, height:40, border:"1px solid #EDE8DC", background:"#F5F0E8", color:"#6B6B63", cursor:"pointer" }}><X size={13}/></button>
            </div>
          ))}
        </div>
        {errors.variants && <p role="alert" style={{ ...S.b, fontSize:11, color:"#cc4444", margin:"10px 0 0" }}>{errors.variants}</p>}
        <button type="button" onClick={()=>set("variants",[...form.variants,{size:"",price:0,sku:"",isDefault:form.variants.length===0,isActive:true}])}
          style={{ display:"flex", alignItems:"center", gap:7, marginTop:14, padding:"9px 13px", border:"1px solid #EDE8DC", backgroundColor:"#F5F0E8", color:"#1A1A18", cursor:"pointer", ...S.m, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase" as const }}>
          <Plus size={12}/> Add Size
        </button>
      </div>

      {/* Pricing & Inventory */}
      <div style={card}>
        <h3 style={heading}>Pricing &amp; Inventory</h3>
        <div className="pf-grid4">
          {([["originalPrice","Compare at price (default size)"],["discount","Discount (%)"],["stock","Stock Units (default size)"]] as [keyof ProductFormData,string][]).map(([k,l])=>(
            <div key={k}>
              <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:errors[k]?"#cc4444":"#6B6B63", display:"block", marginBottom:5 }}>{l}</label>
              <Input type="number" value={(form[k] as number)??""} onChange={v=>set(k, v?Number(v):undefined as ProductFormData[typeof k])} error={errors[k]}/>
              {errors[k] && <p style={{ ...S.b, fontSize:11, color:"#cc4444", marginTop:3 }}>{errors[k]}</p>}
            </div>
          ))}
          <div>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Category</label>
            <select value={form.category} onChange={e=>set("category",e.target.value as ProductFormData["category"])}
              style={{ padding:"10px 13px", border:"1px solid #EDE8DC", backgroundColor:"#FAFAF7", ...S.b, fontSize:13, color:"#1A1A18", outline:"none", cursor:"pointer", width:"100%", appearance:"none" as const }}>
              <option value="summer">Summer Collection</option>
              <option value="winter">Winter Collection</option>
              <option value="bundle">Bundles / Gift Sets</option>
            </select>
          </div>
          <div>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>In Stock</label>
            <select value={form.inStock?"yes":"no"} onChange={e=>set("inStock",e.target.value==="yes")}
              style={{ padding:"10px 13px", border:"1px solid #EDE8DC", backgroundColor:"#FAFAF7", ...S.b, fontSize:13, color:"#1A1A18", outline:"none", cursor:"pointer", width:"100%", appearance:"none" as const }}>
              <option value="yes">In Stock</option>
              <option value="no">Out of Stock</option>
            </select>
          </div>
          <div>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Status</label>
            <select value={form.status} onChange={e=>set("status",e.target.value as "published"|"draft")}
              style={{ padding:"10px 13px", border:"1px solid #EDE8DC", backgroundColor:"#FAFAF7", ...S.b, fontSize:13, color:"#1A1A18", outline:"none", cursor:"pointer", width:"100%", appearance:"none" as const }}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Images */}
      <div style={card}>
        <h3 style={heading}>Product Images</h3>
        {/* Preview grid */}
        {images.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:14 }}>
            {images.map((url,i)=>(
              <div key={`${url}-${i}`} style={{ position:"relative", width:80, flexShrink:0, border:`2px solid ${i===mainIdx?"#B8965A":"transparent"}`, transition:"border-color 0.2s" }}>
                <img src={url} alt="" style={{ display:"block", width:"100%", height:"auto" }}/>
                {/* Main badge */}
                {i===mainIdx && <span style={{ position:"absolute", bottom:2, left:2, ...S.m, fontSize:7, backgroundColor:"#B8965A", color:"#FAFAF7", padding:"1px 4px", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Main</span>}
                {/* Controls overlay */}
                <div className="img-controls" style={{ position:"absolute", inset:0, backgroundColor:"rgba(26,26,24,0.5)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, opacity:0, transition:"opacity 0.15s" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    <button type="button" onClick={()=>moveImage(i,-1)} disabled={i===0} style={{ width:20, height:20, background:"rgba(250,250,247,0.8)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}><ChevronLeft size={10}/></button>
                    <button type="button" onClick={()=>setMain(i)} style={{ width:20, height:20, background:"rgba(250,250,247,0.8)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }} title="Set as main"><Star size={9}/></button>
                    <button type="button" onClick={()=>moveImage(i,1)} disabled={i===images.length-1} style={{ width:20, height:20, background:"rgba(250,250,247,0.8)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}><ChevronRight size={10}/></button>
                  </div>
                  <button type="button" onClick={()=>removeImage(i)} style={{ width:20, height:20, background:"rgba(204,68,68,0.8)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}><X size={9} style={{ color:"#fff" }}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ ...S.b, fontSize:11, color:"#6B6B63", marginBottom:10 }}>Hover image to reorder or set as main. First image is the main product image.</p>
        {/* URL input */}
        <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
          <input type="url" value={urlInput} onChange={e=>setUrlInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addUrl())}
            placeholder="Paste image URL…"
            style={{ flex:1, minWidth:200, padding:"9px 13px", border:"1px solid #EDE8DC", backgroundColor:"#FAFAF7", ...S.b, fontSize:12, color:"#1A1A18", outline:"none" }}
          />
          <button type="button" onClick={addUrl}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", backgroundColor:"#1A1A18", color:"#FAFAF7", border:"none", cursor:"pointer", ...S.m, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase" as const, flexShrink:0 }}>
            <Plus size={11}/> Add URL
          </button>
        </div>
        {/* File upload */}
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFile} style={{ display:"none" }}/>
        <button type="button" onClick={()=>fileRef.current?.click()}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 16px", border:"1px dashed #EDE8DC", backgroundColor:"#F5F0E8", cursor:"pointer", width:"100%", transition:"border-color 0.2s" }}
          onMouseEnter={e=>(e.currentTarget.style.borderColor="#B8965A")}
          onMouseLeave={e=>(e.currentTarget.style.borderColor="#EDE8DC")}>
          <Upload size={13} strokeWidth={1.5} style={{ color:"#B8965A" }}/>
          <span style={{ ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase" as const, color:"#6B6B63" }}>Upload from Device</span>
          <ImageIcon size={12} strokeWidth={1.5} style={{ color:"#EDE8DC" }}/>
        </button>
      </div>

      {/* Fragrance Notes */}
      <div style={card}>
        <h3 style={heading}>Fragrance Notes</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {([["noteTop","Top Notes","e.g. Bergamot, Pink Pepper"],["noteHeart","Heart Notes","e.g. Rose, Jasmine"],["noteBase","Base Notes","e.g. Amber, Sandalwood, Musk"]] as [keyof ProductFormData,string,string][]).map(([k,l,ph])=>(
            <div key={k}>
              <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>{l}</label>
              <Input value={form[k] as string} onChange={v=>set(k,v)} placeholder={ph}/>
            </div>
          ))}
          <div>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Full Ingredients</label>
            <Textarea value={form.ingredients} onChange={v=>set("ingredients",v)} placeholder="Alcohol, Aqua, Parfum…" rows={2}/>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div style={card}>
        <h3 style={heading}>Badges &amp; Visibility</h3>
        <div className="pf-grid3">
          {([["isBestSeller","Best Seller","Badge + Best Sellers section"],["isNew","New Arrival","Badge + New Arrivals section"],["isFeatured","Featured","Featured homepage section"]] as [keyof ProductFormData,string,string][]).map(([k,l,sub])=>{
            const on = form[k] as boolean;
            return (
              <button key={k} type="button" onClick={()=>set(k,!on as ProductFormData[typeof k])}
                style={{ textAlign:"left", padding:"14px 16px", border:`1px solid ${on?"#B8965A":"#EDE8DC"}`, backgroundColor:on?"rgba(184,150,90,0.06)":"#F5F0E8", cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <div style={{ width:14, height:14, border:`2px solid ${on?"#B8965A":"#EDE8DC"}`, backgroundColor:on?"#B8965A":"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0 }}>
                    {on && <span style={{ color:"#FAFAF7", fontSize:9, lineHeight:1 }}>✓</span>}
                  </div>
                  <span style={{ ...S.b, fontSize:13, fontWeight:500, color:on?"#1A1A18":"#6B6B63" }}>{l}</span>
                </div>
                <p style={{ ...S.m, fontSize:9, color:"#6B6B63", margin:0, letterSpacing:"0.08em" }}>{sub}</p>
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:8, marginTop:14 }}>
          {(["published","draft"] as const).map(s=>(
            <button key={s} type="button" onClick={()=>set("status",s)}
              style={{ padding:"8px 18px", border:`1px solid ${form.status===s?"#1A1A18":"#EDE8DC"}`, backgroundColor:form.status===s?"#1A1A18":"#F5F0E8", color:form.status===s?"#FAFAF7":"#6B6B63", cursor:"pointer", ...S.m, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase" as const, transition:"all 0.2s" }}>
              {s==="published"?"Publish":"Save as Draft"}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:10, paddingBottom:8 }}>
        <button type="submit" disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 32px", backgroundColor:"#1A1A18", color:"#FAFAF7", border:"none", cursor:loading?"not-allowed":"pointer", ...S.m, fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase" as const, opacity:loading?0.7:1, transition:"background-color 0.2s" }}
          onMouseEnter={e=>!loading&&((e.currentTarget as HTMLButtonElement).style.backgroundColor="#6B6B63")}
          onMouseLeave={e=>((e.currentTarget as HTMLButtonElement).style.backgroundColor="#1A1A18")}>
          {loading ? <><motion.div animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:"linear"}} style={{ width:13,height:13,border:"1.5px solid rgba(250,250,247,0.4)",borderTopColor:"#FAFAF7",borderRadius:"50%" }}/> Saving…</> : submitLabel}
        </button>
      </div>

      <style>{`
        .pf-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px 20px; }
        .pf-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px 16px; }
        .pf-grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        div:hover > .img-controls { opacity: 1; }
        @media (hover: none) {
          .img-controls { opacity: 1 !important; background-color: rgba(26,26,24,0.35) !important; }
        }
        @media(max-width:900px) { .pf-grid4 { grid-template-columns:1fr 1fr; } }
        @media(max-width:640px) {
          .pf-grid2 { grid-template-columns:1fr !important; }
          .pf-grid4 { grid-template-columns:1fr 1fr !important; }
          .pf-grid3 { grid-template-columns:1fr !important; }
          .pf-variant-row { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>
    </form>
  );
}
