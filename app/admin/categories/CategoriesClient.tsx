"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Check, Tag } from "lucide-react";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/src/actions/category.actions";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

const S = {
  d: { fontFamily:"'Cormorant Garamond',Georgia,serif" },
  b: { fontFamily:"'DM Sans',system-ui,sans-serif" },
  m: { fontFamily:"'DM Mono',monospace" },
} as const;

type Cat = { id: string; slug: string; name: string; description: string | null; imageUrl: string | null; position: number; isActive: boolean; isFeatured: boolean; productCount: number };
type FD = { name: string; slug: string; description: string; imageUrl: string; position: number; isFeatured: boolean; isActive: boolean };
const EMPTY: FD = { name: "", slug: "", description: "", imageUrl: "", position: 0, isFeatured: false, isActive: true };

function inp(focused: boolean, error?: boolean): React.CSSProperties {
  return { padding:"9px 12px", border:`1px solid ${error?"#cc4444":focused?"#B8965A":"#EDE8DC"}`, backgroundColor:"#FAFAF7", ...S.b, fontSize:13, color:"#1A1A18", outline:"none", transition:"border-color 0.2s", width:"100%", boxSizing:"border-box" };
}

function CatForm({ initial = EMPTY, onSave, onCancel, label }: { initial?: FD; onSave:(d:FD)=>Promise<void>; onCancel:()=>void; label:string }) {
  const [form, setForm] = useState<FD>(initial);
  const [focused, setFocused] = useState("");
  const [errors, setErrors] = useState<Partial<FD>>({});
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploadError("");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Images must be 10 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("image", file);
      const response = await fetch("/api/admin/categories/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data?.imageUrl) {
        throw new Error(result.error || "Image upload failed. Please try again.");
      }
      set("imageUrl", result.data.imageUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const set = (k: keyof FD, v: string | number | boolean) => {
    const next = { ...form, [k]: v };
    if (k === "name" && !form.slug) next.slug = String(v).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setForm(next as FD);
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const submit = () => {
    const e: Partial<FD> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.slug.trim()) e.slug = "Required";
    if (Object.keys(e).length) { setErrors(e); return; }
    start(async () => { await onSave(form); });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 16px" }}>
        <div>
          <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:errors.name?"#cc4444":"#6B6B63", display:"block", marginBottom:5 }}>Name *</label>
          <input value={form.name} onChange={e=>set("name",e.target.value)} onFocus={()=>setFocused("name")} onBlur={()=>setFocused("")} placeholder="Summer Collection" style={inp(focused==="name", !!errors.name)} />
          {errors.name && <p style={{ ...S.b, fontSize:11, color:"#cc4444", marginTop:3 }}>{errors.name}</p>}
        </div>
        <div>
          <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:errors.slug?"#cc4444":"#6B6B63", display:"block", marginBottom:5 }}>Slug *</label>
          <input value={form.slug} onChange={e=>set("slug",e.target.value)} onFocus={()=>setFocused("slug")} onBlur={()=>setFocused("")} placeholder="summer" style={inp(focused==="slug", !!errors.slug)} />
          {errors.slug && <p style={{ ...S.b, fontSize:11, color:"#cc4444", marginTop:3 }}>{errors.slug}</p>}
        </div>
      </div>
      <div>
        <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Description</label>
        <input value={form.description} onChange={e=>set("description",e.target.value)} onFocus={()=>setFocused("desc")} onBlur={()=>setFocused("")} placeholder="Short description…" style={inp(focused==="desc")} />
      </div>
      <div>
        <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Category Image</label>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>void uploadImage(e.target.files?.[0])} />
        <button type="button" disabled={uploading || pending} onClick={()=>fileRef.current?.click()} style={{ padding:"8px 14px", border:"1px solid #EDE8DC", backgroundColor:"#F5F0E8", cursor:uploading?"wait":"pointer", ...S.m, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#1A1A18", opacity:uploading?0.65:1 }}>
          {uploading ? "Uploading…" : form.imageUrl ? "Replace Image" : "Upload Image"}
        </button>
        {form.imageUrl && <img src={form.imageUrl} alt="Category image preview" style={{ display:"block", width:180, height:96, objectFit:"cover", marginTop:10, border:"1px solid #EDE8DC" }} />}
        {uploadError && <p role="alert" style={{ ...S.b, fontSize:11, color:"#cc4444", marginTop:6 }}>{uploadError}</p>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 16px" }}>
        <div>
          <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Display Order</label>
          <input type="number" value={form.position} onChange={e=>set("position", e.target.value)} onFocus={()=>setFocused("position")} onBlur={()=>setFocused("")} style={inp(focused==="position")} />
        </div>
        <div>
          <label style={{ ...S.m, fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", display:"block", marginBottom:5 }}>Featured</label>
          <button type="button" onClick={() => setForm((current) => ({ ...current, isFeatured: !current.isFeatured }))} style={{ width:"100%", padding:"9px 12px", border:`1px solid ${form.isFeatured ? "#B8965A" : "#EDE8DC"}`, backgroundColor: form.isFeatured ? "rgba(184,150,90,0.1)" : "#FAFAF7", cursor:"pointer", ...S.b, fontSize:13, color: form.isFeatured ? "#B8965A" : "#1A1A18", textAlign:"left" }}>
            {form.isFeatured ? "Shown on homepage" : "Hidden from homepage"}
          </button>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={{ padding:"8px 18px", border:"1px solid #EDE8DC", backgroundColor:"#F5F0E8", cursor:"pointer", ...S.m, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#6B6B63" }}>Cancel</button>
        <button onClick={submit} disabled={pending || uploading} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px", backgroundColor:"#1A1A18", color:"#FAFAF7", border:"none", cursor:"pointer", ...S.m, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase" as const, opacity:pending?0.7:1 }}>
          <Check size={11} /> {pending ? "Saving…" : label}
        </button>
      </div>
    </div>
  );
}

export function CategoriesClient({ initialCategories }: { initialCategories: Cat[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, startDelete] = useTransition();

  const refresh = () => router.refresh();

  const handleAdd = async (d: FD) => {
    const result = await createCategoryAction({ name:d.name, slug:d.slug, description:d.description||undefined, imageUrl:d.imageUrl||undefined, position:d.position, isActive:d.isActive, isFeatured:d.isFeatured });
    if (result.success) { toast.success(`"${d.name}" created`); setShowAdd(false); refresh(); }
    else toast.error(result.error);
  };

  const handleEdit = async (id: string, d: FD) => {
    const result = await updateCategoryAction(id, { name:d.name, slug:d.slug, description:d.description||undefined, imageUrl:d.imageUrl||undefined, position:d.position, isActive:d.isActive, isFeatured:d.isFeatured });
    if (result.success) { toast.success(`"${d.name}" updated`); setEditId(null); refresh(); }
    else toast.error(result.error);
  };

  const handleDelete = (id: string) => {
    startDelete(async () => {
      const result = await deleteCategoryAction(id);
      if (result.success) { toast.success("Category deleted"); setDeleteId(null); refresh(); }
      else toast.error(result.error);
    });
  };

  return (
    <div style={{ padding:"clamp(16px,3vw,32px)", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ ...S.m, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"#6B6B63", marginBottom:4 }}>Admin</p>
          <h1 style={{ ...S.d, fontSize:"clamp(22px,4vw,32px)", fontWeight:300, color:"#1A1A18", margin:0 }}>Categories</h1>
        </div>
        {!showAdd && (
          <button onClick={()=>setShowAdd(true)} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", backgroundColor:"#1A1A18", color:"#FAFAF7", border:"none", cursor:"pointer", ...S.m, fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase" }}>
            <Plus size={13} strokeWidth={2} /> Add Category
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} transition={{duration:0.25}} style={{overflow:"hidden"}}>
            <div style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", padding:"clamp(14px,2vw,24px)" }}>
              <p style={{ ...S.d, fontSize:18, fontWeight:300, color:"#1A1A18", margin:"0 0 18px" }}>New Category</p>
              <CatForm onSave={handleAdd} onCancel={()=>setShowAdd(false)} label="Add Category" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {initialCategories.map(cat => (
          <div key={cat.id} style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", overflow:"hidden" }}>
            <div style={{ position:"relative", height:110, backgroundColor:"#F5F0E8", overflow:"hidden" }}>
              {cat.imageUrl
                ? <img src={cat.imageUrl} alt={cat.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><Tag size={28} strokeWidth={1} style={{ color:"#EDE8DC" }} /></div>
              }
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(26,26,24,0.5) 0%, transparent 60%)" }} />
              <div style={{ position:"absolute", bottom:8, left:12 }}>
                <span style={{ ...S.m, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(250,250,247,0.7)" }}>/{cat.slug}</span>
              </div>
            </div>

            {editId === cat.id ? (
              <div style={{ padding:"clamp(12px,2vw,18px)" }}>
                <CatForm
                  initial={{ name:cat.name, slug:cat.slug, description:cat.description??"", imageUrl:cat.imageUrl??"", position:cat.position, isFeatured:cat.isFeatured, isActive:cat.isActive }}
                  onSave={d => handleEdit(cat.id, d)}
                  onCancel={() => setEditId(null)}
                  label="Save Changes"
                />
              </div>
            ) : (
              <div style={{ padding:"clamp(12px,2vw,16px)" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                  <div style={{ minWidth:0 }}>
                    <p style={{ ...S.d, fontSize:18, fontWeight:300, color:"#1A1A18", margin:"0 0 4px" }}>{cat.name}</p>
                    <p style={{ ...S.b, fontSize:12, color:"#6B6B63", margin:"0 0 6px", lineHeight:1.5 }}>{cat.description || "No description"}</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:6 }}>
                      <span style={{ ...S.m, fontSize:9, letterSpacing:"0.1em", color:"#B8965A" }}>{cat.productCount} products</span>
                      {cat.isFeatured && <span style={{ ...S.m, fontSize:9, letterSpacing:"0.1em", color:"#B8965A" }}>Featured</span>}
                    </div>
                    <span style={{ ...S.m, fontSize:9, letterSpacing:"0.1em", color:"#6B6B63" }}>Order {cat.position}</span>
                  </div>
                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                    <button onClick={()=>setEditId(cat.id)} style={{ width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #EDE8DC",backgroundColor:"#F5F0E8",cursor:"pointer",color:"#6B6B63",transition:"all 0.15s" }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#1A1A18";(e.currentTarget as HTMLButtonElement).style.color="#1A1A18";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#EDE8DC";(e.currentTarget as HTMLButtonElement).style.color="#6B6B63";}}>
                      <Pencil size={12} strokeWidth={1.5} />
                    </button>
                    {deleteId === cat.id ? (
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={()=>handleDelete(cat.id)} style={{ width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #cc4444",backgroundColor:"#cc4444",cursor:"pointer",color:"#FAFAF7" }}>
                          <Check size={11} strokeWidth={2} />
                        </button>
                        <button onClick={()=>setDeleteId(null)} style={{ width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #EDE8DC",backgroundColor:"#F5F0E8",cursor:"pointer",color:"#6B6B63" }}>
                          <X size={11} strokeWidth={1.5} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={()=>setDeleteId(cat.id)} style={{ width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #EDE8DC",backgroundColor:"#F5F0E8",cursor:"pointer",color:"#6B6B63",transition:"all 0.15s" }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#cc4444";(e.currentTarget as HTMLButtonElement).style.color="#cc4444";}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#EDE8DC";(e.currentTarget as HTMLButtonElement).style.color="#6B6B63";}}>
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {initialCategories.length === 0 && !showAdd && (
        <div style={{ textAlign:"center", padding:"48px 24px" }}>
          <Tag size={32} strokeWidth={1} style={{ color:"#EDE8DC", marginBottom:12 }} />
          <p style={{ ...S.d, fontSize:20, fontWeight:300, color:"#1A1A18", marginBottom:6 }}>No categories yet</p>
          <p style={{ ...S.b, fontSize:13, color:"#6B6B63" }}>Add your first category to organise the catalogue.</p>
        </div>
      )}
    </div>
  );
}
