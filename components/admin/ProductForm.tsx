"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Plus, ImageIcon, ChevronLeft, ChevronRight, Star } from "lucide-react";

const S = { d:{fontFamily:"'Cormorant Garamond',Georgia,serif"}, b:{fontFamily:"'DM Sans',system-ui,sans-serif"}, m:{fontFamily:"'DM Mono',monospace"} } as const;

export type ProductFormData = {
  name: string;
  subtitle: string;
  description: string;
  longDescription: string;
  category: "summer" | "winter" | "bundle";
  price: number;
  originalPrice?: number;
  discount: number;
  stock: number;
  sku: string;
  size: string;
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
  category:"summer", price:0, originalPrice:undefined, discount:0,
  stock:0, sku:"", size:"50ml", image:"", gallery:[],
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
  const [form, setForm] = useState<ProductFormData>({...EMPTY,...initial});
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
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (form.price <= 0) e.price = "Price must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
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
          {[["subtitle","Subtitle","e.g. Eau de Parfum",true],["size","Size","e.g. 50ml",true]].map(([k,l,ph,half])=>(
            <div key={k as string} style={{ gridColumn: half?"span 1":"1/-1" }}>
              <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>{l as string}</label>
              <Input value={(form as unknown as Record<string,string|number>)[k as string] as string} onChange={v=>set(k as keyof ProductFormData, v as ProductFormData[keyof ProductFormData])} placeholder={ph as string}/>
            </div>
          ))}
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

      {/* Pricing & Inventory */}
      <div style={card}>
        <h3 style={heading}>Pricing &amp; Inventory</h3>
        <div className="pf-grid4">
          {([["price","Price (EGP) *",true],["originalPrice","Original Price",false],["discount","Discount (%)",false],["stock","Stock Units",false]] as [keyof ProductFormData,string,boolean][]).map(([k,l,req])=>(
            <div key={k}>
              <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:errors[k]?"#cc4444":"#6B6B63", display:"block", marginBottom:5 }}>{l}</label>
              <Input type="number" value={(form[k] as number)??""} onChange={v=>set(k, v?Number(v):undefined as ProductFormData[typeof k])} error={errors[k]}/>
              {errors[k] && <p style={{ ...S.b, fontSize:11, color:"#cc4444", marginTop:3 }}>{errors[k]}</p>}
            </div>
          ))}
          <div>
            <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:errors.sku?"#cc4444":"#6B6B63", display:"block", marginBottom:5 }}>SKU *</label>
            <Input value={form.sku} onChange={v=>set("sku",v)} placeholder="ML-EXAMPLE-50" error={errors.sku}/>
            {errors.sku && <p style={{ ...S.b, fontSize:11, color:"#cc4444", marginTop:3 }}>{errors.sku}</p>}
          </div>
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
              <div key={`${url}-${i}`} style={{ position:"relative", width:80, height:80, backgroundColor:"#F5F0E8", flexShrink:0, border:`2px solid ${i===mainIdx?"#B8965A":"transparent"}`, transition:"border-color 0.2s" }}>
                <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
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
        }
      `}</style>
    </form>
  );
}
