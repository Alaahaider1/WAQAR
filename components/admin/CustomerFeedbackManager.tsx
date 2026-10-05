'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageIcon, Trash2, Upload } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { createCustomerFeedbackAction, deleteCustomerFeedbackAction, getAdminCustomerFeedbackAction, moveCustomerFeedbackAction, updateCustomerFeedbackAction } from '@/src/actions/customer-feedback.actions';
import type { CustomerFeedbackImage } from '@/src/types/domain';

const S = { d:{fontFamily:"'Cormorant Garamond',Georgia,serif"}, b:{fontFamily:"'DM Sans',system-ui,sans-serif"}, m:{fontFamily:"'DM Mono',monospace"} } as const;
type UploadResult = { success: true; data: { imageUrl: string; storagePath: string } } | { success: false; error: string; code: string };

export function CustomerFeedbackManager() {
  const [images, setImages] = useState<CustomerFeedbackImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const result = await getAdminCustomerFeedbackAction();
    if (result.success) setImages(result.data); else toast.error(result.error);
    setLoading(false);
  };
  // The loader updates state only after the Server Action promise resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  const upload = async (file: File) => {
    if (!(file instanceof File) || !file.size) { toast.error('Choose a non-empty image file.'); return; }
    if (!(file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name))) { toast.error('Choose a JPG, PNG, or WebP image.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image files must be 10MB or smaller.'); return; }
    setUploading(true);
    try {
      const formData = new FormData(); formData.append('image', file);
      const response = await fetch('/api/admin/customer-feedback/upload', { method: 'POST', body: formData });
      if (!(response.headers.get('content-type') ?? '').includes('application/json')) throw new Error(`Upload endpoint returned ${response.status} instead of JSON.`);
      const result = await response.json() as UploadResult;
      if (!result.success) throw new Error(result.error);
      const created = await createCustomerFeedbackAction(result.data);
      if (!created.success) throw new Error(created.error);
      setImages(current => [...current, created.data]);
      toast.success('Customer feedback screenshot uploaded.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Customer feedback upload failed.'); }
    finally { setUploading(false); }
  };

  const toggle = async (image: CustomerFeedbackImage) => {
    const result = await updateCustomerFeedbackAction(image.id, { isVisible: !image.isVisible });
    if (!result.success) { toast.error(result.error); return; }
    setImages(current => current.map(item => item.id === image.id ? result.data : item));
  };
  const remove = async (image: CustomerFeedbackImage) => {
    if (!window.confirm('Delete this customer feedback screenshot?')) return;
    const result = await deleteCustomerFeedbackAction(image.id);
    if (!result.success) { toast.error(result.error); return; }
    setImages(current => current.filter(item => item.id !== image.id));
    toast.success('Customer feedback screenshot deleted.');
  };
  const move = async (image: CustomerFeedbackImage, direction: -1 | 1) => {
    const result = await moveCustomerFeedbackAction(image.id, direction);
    if (!result.success) { toast.error(result.error); return; }
    setImages(result.data);
  };

  return <section style={{ backgroundColor:'#FAFAF7', border:'1px solid #EDE8DC', padding:'clamp(16px,3vw,28px)' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:12, marginBottom:20, flexWrap:'wrap' }}>
      <div><h2 style={{ ...S.d, fontSize:20, fontWeight:300, color:'#1A1A18', margin:0 }}>Customer Reviews</h2><p style={{ ...S.b, fontSize:12, color:'#6B6B63', margin:'5px 0 0', lineHeight:1.5 }}>Upload screenshots of real customer feedback for the homepage.</p></div>
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 14px', border:0, background:'#1A1A18', color:'#FAFAF7', cursor:uploading?'not-allowed':'pointer', ...S.m, fontSize:9, letterSpacing:'.12em', textTransform:'uppercase' }}><Upload size={12}/>{uploading ? 'Uploading…' : 'Upload screenshot'}</button>
    </div>
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} />
    {loading ? <p style={{ ...S.b, color:'#6B6B63', fontSize:13, margin:0 }}>Loading customer feedback…</p> : images.length === 0 ? <div style={{ padding:'26px 12px', textAlign:'center', border:'1px dashed #EDE8DC', background:'#F5F0E8' }}><ImageIcon size={22} strokeWidth={1} color="#B8965A"/><p style={{ ...S.b, fontSize:13, color:'#6B6B63', margin:'8px 0 0' }}>No customer feedback screenshots yet.</p></div> : <div className="customer-feedback-admin-grid">{images.map((image, index) => <article key={image.id} style={{ border:'1px solid #EDE8DC', background:'#F5F0E8', overflow:'hidden' }}><img src={image.imageUrl} alt="WAQAR customer feedback" style={{ width:'100%', aspectRatio:'4 / 5', objectFit:'contain', display:'block', background:'#fff' }}/><div style={{ padding:9, display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}><span style={{ ...S.m, fontSize:8, letterSpacing:'.12em', color:image.isVisible?'#B8965A':'#6B6B63' }}>{image.isVisible ? 'VISIBLE' : 'HIDDEN'}</span><span style={{ display:'flex', gap:5 }}><button type="button" onClick={() => void move(image, -1)} disabled={index === 0} aria-label="Move feedback screenshot earlier" style={iconButton}><ArrowUp size={13}/></button><button type="button" onClick={() => void move(image, 1)} disabled={index === images.length - 1} aria-label="Move feedback screenshot later" style={iconButton}><ArrowDown size={13}/></button><button type="button" onClick={() => void toggle(image)} aria-label={image.isVisible ? 'Hide feedback screenshot' : 'Show feedback screenshot'} style={iconButton}>{image.isVisible ? <EyeOff size={13}/> : <Eye size={13}/>}</button><button type="button" onClick={() => void remove(image)} aria-label="Delete feedback screenshot" style={{ ...iconButton, color:'#b33' }}><Trash2 size={13}/></button></span></div></article>)}</div>}
    <style>{`.customer-feedback-admin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}`}</style>
  </section>;
}

const iconButton = { width:28, height:28, display:'grid', placeItems:'center', cursor:'pointer', border:'1px solid #EDE8DC', background:'#FAFAF7', color:'#1A1A18' };
