'use client';

import { useRef, useState, useTransition } from 'react';
import { Check, Pencil, Plus, Trash2, Upload, Video } from 'lucide-react';
import { createUgcVideoAction, deleteUgcVideoAction, updateUgcVideoAction } from '@/src/actions/ugc-video.actions';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import type { AdminUgcVideo } from '@/src/types/domain';
import { createBrowserClient } from '@/src/lib/supabase/client';

const S = { d:{fontFamily:"'Cormorant Garamond',Georgia,serif"}, b:{fontFamily:"'DM Sans',system-ui,sans-serif"}, m:{fontFamily:"'DM Mono',monospace"} } as const;
type Form = { videoUrl: string; customerName: string; caption: string; position: number; isVisible: boolean };
const blank: Form = { videoUrl:'', customerName:'', caption:'', position:0, isVisible:true };
const input: React.CSSProperties = { width:'100%', boxSizing:'border-box', padding:'10px 12px', border:'1px solid #EDE8DC', background:'#FAFAF7', color:'#1A1A18', outline:'none', ...S.b, fontSize:13 };
const isSupportedVideo = (file: File) => file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
const extensionFor = (file: File) => {
  const extensions: Record<string, string> = { 'video/mp4':'mp4', 'application/mp4':'mp4', 'video/x-m4v':'mp4', 'video/webm':'webm', 'video/quicktime':'mov' };
  return extensions[file.type.toLowerCase()] ?? file.name.toLowerCase().match(/\.(mp4|webm|mov)$/)?.[1] ?? null;
};
const MIME_BY_EXTENSION: Record<string, string> = { mp4:'video/mp4', webm:'video/webm', mov:'video/quicktime' };
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const UGC_BUCKET = 'ugc-videos';

function VideoForm({ initial = blank, submitLabel, onSave, onCancel }: { initial?: Form; submitLabel: string; onSave: (value: Form) => Promise<boolean>; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const uploadedRef = useRef<{ path: string } | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(current => ({ ...current, [key]: value }));
  const removeUploadedFile = async () => {
    const uploaded = uploadedRef.current;
    uploadedRef.current = null;
    if (!uploaded) return;
    const { error } = await createBrowserClient().storage.from(UGC_BUCKET).remove([uploaded.path]);
    if (error) console.error('[ugc-videos] unable to clean up unsaved upload', error);
  };
  const upload = async (file: File) => {
    if (uploadingRef.current || pending) return;
    if (!(file instanceof File)) { toast.error('UGC upload failed: selected value is not a file.'); return; }
    if (!file.name || file.size === 0) { toast.error('UGC upload failed: selected video is empty.'); return; }
    if (!isSupportedVideo(file)) { toast.error('Choose an MP4, WebM, or MOV video file.'); return; }
    if (file.size > MAX_VIDEO_BYTES) { toast.error('Video files must be 50 MiB or smaller.'); return; }
    const extension = extensionFor(file);
    if (!extension) { toast.error('Choose an MP4, WebM, or MOV video file.'); return; }
    uploadingRef.current = true;
    setUploading(true);
    try {
      const path = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
      const storage = createBrowserClient().storage.from(UGC_BUCKET);
      const { error } = await storage.upload(path, file, { contentType: MIME_BY_EXTENSION[extension], cacheControl: '31536000', upsert: false });
      if (error) throw error;
      const { data } = storage.getPublicUrl(path);
      if (!data.publicUrl) throw new Error('Public UGC URL was not created');
      await removeUploadedFile();
      uploadedRef.current = { path };
      setForm(current => ({ ...current, videoUrl: data.publicUrl }));
      toast.success('Video uploaded. Add its details and save.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Video upload failed'); }
    finally { uploadingRef.current = false; setUploading(false); }
  };
  const submit = () => {
    if (uploadingRef.current || pending) return;
    if (!form.videoUrl) { toast.error('Upload a video before saving.'); return; }
    startTransition(() => { void (async () => {
      if (await onSave(form)) uploadedRef.current = null;
      else {
        await removeUploadedFile();
        setForm(current => ({ ...current, videoUrl: initial.videoUrl ?? '' }));
      }
    })(); });
  };
  return <div style={{ display:'grid', gap:12 }}>
    <div>
      <label style={{ ...S.m, fontSize:9, letterSpacing:'.16em', textTransform:'uppercase', color:'#6B6B63', display:'block', marginBottom:6 }}>Video *</label>
      {form.videoUrl ? <div style={{ display:'flex', gap:10, alignItems:'center' }}><video src={form.videoUrl} controls preload="metadata" style={{ width:100, height:120, objectFit:'cover', background:'#1A1A18' }} /><button type="button" disabled={uploading||pending} onClick={() => fileRef.current?.click()} style={{ ...input, width:'auto', cursor:'pointer' }}>{uploading ? 'Uploading…' : 'Replace video'}</button></div> : <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading||pending} style={{ width:'100%', minHeight:100, border:'1px dashed #B8965A', background:'#F5F0E8', cursor:'pointer', color:'#6B6B63', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}><Upload size={18} color="#B8965A" /><span style={{ ...S.m, fontSize:9, letterSpacing:'.14em', textTransform:'uppercase' }}>{uploading ? 'Uploading…' : 'Upload UGC video'}</span></button>}
      <input ref={fileRef} type="file" accept="video/*,.mp4,.webm,.mov" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} hidden />
    </div>
    <div className="ugc-admin-grid"><div><label style={{...S.m,fontSize:9,letterSpacing:'.16em',textTransform:'uppercase',color:'#6B6B63',display:'block',marginBottom:6}}>Customer name</label><input value={form.customerName} onChange={e=>set('customerName',e.target.value)} style={input} /></div><div><label style={{...S.m,fontSize:9,letterSpacing:'.16em',textTransform:'uppercase',color:'#6B6B63',display:'block',marginBottom:6}}>Display order</label><input type="number" min="0" value={form.position} onChange={e=>set('position',Number(e.target.value))} style={input} /></div></div>
    <div><label style={{...S.m,fontSize:9,letterSpacing:'.16em',textTransform:'uppercase',color:'#6B6B63',display:'block',marginBottom:6}}>Caption</label><textarea value={form.caption} maxLength={280} rows={3} onChange={e=>set('caption',e.target.value)} style={{...input,resize:'vertical'}} /></div>
    <button type="button" onClick={()=>set('isVisible',!form.isVisible)} style={{ ...input, cursor:'pointer', textAlign:'left', color:form.isVisible?'#B8965A':'#6B6B63' }}>{form.isVisible ? 'Visible on storefront' : 'Hidden from storefront'}</button>
    <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}><button type="button" disabled={uploading||pending} onClick={() => { void removeUploadedFile().finally(onCancel); }} style={{padding:'9px 15px',border:'1px solid #EDE8DC',background:'#F5F0E8',cursor:'pointer',...S.m,fontSize:9,textTransform:'uppercase',letterSpacing:'.12em'}}>Cancel</button><button type="button" disabled={pending||uploading} onClick={submit} style={{padding:'9px 15px',border:0,background:'#1A1A18',color:'#FAFAF7',cursor:'pointer',...S.m,fontSize:9,textTransform:'uppercase',letterSpacing:'.12em'}}><Check size={12} /> {pending?'Savingâ€¦':submitLabel}</button></div>
    <style>{` .ugc-admin-grid { display:grid; grid-template-columns:1fr 130px; gap:12px; } @media(max-width:560px){.ugc-admin-grid{grid-template-columns:1fr;}} `}</style>
  </div>;
}

export function UgcVideosClient({ initialVideos }: { initialVideos: AdminUgcVideo[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const saveNew = async (data: Form) => {
    const result = await createUgcVideoAction(data);
    if (result.success) {
      toast.success('UGC video saved');
      setAdding(false);
      router.refresh();
      return true;
    }
    toast.error(result.error);
    return false;
  };

  const saveEdit = async (id: string, data: Form) => {
    const result = await updateUgcVideoAction(id, data);
    if (result.success) {
      toast.success('UGC video updated');
      setEditing(null);
      router.refresh();
      return true;
    }
    toast.error(result.error);
    return false;
  };

  const remove = async (id: string) => {
    const result = await deleteUgcVideoAction(id);
    if (result.success) {
      toast.success('UGC video deleted');
      setDeleting(null);
      router.refresh();
    } else toast.error(result.error);
  };

  const cardAction = (label: string, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    flex: '1 1 0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minWidth: 0,
    minHeight: 40,
    padding: '9px 12px',
    border: `1px solid ${color}`,
    background: label === 'Delete' ? '#FFF8F7' : '#F5F0E8',
    color: label === 'Delete' ? '#A22' : '#1A1A18',
    cursor: 'pointer',
    ...S.m,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
  });

  return <div style={{ padding: 'clamp(16px,3vw,32px)', display: 'grid', gap: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <p style={{ ...S.m, fontSize: 9, letterSpacing: '.25em', textTransform: 'uppercase', color: '#6B6B63', margin: '0 0 4px' }}>Storefront content</p>
        <h1 style={{ ...S.d, fontSize: 'clamp(24px,4vw,34px)', fontWeight: 300, color: '#1A1A18', margin: 0 }}>UGC Videos</h1>
      </div>
      {!adding && <button type="button" onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: '#1A1A18', color: '#FAFAF7', border: 0, cursor: 'pointer', ...S.m, fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase' }}><Plus size={13} /> Add video</button>}
    </div>

    {adding && <div style={{ background: '#FAFAF7', border: '1px solid #EDE8DC', padding: 'clamp(14px,2vw,24px)' }}>
      <h2 style={{ ...S.d, fontSize: 20, fontWeight: 300, margin: '0 0 16px' }}>New UGC video</h2>
      <VideoForm submitLabel="Save video" onSave={saveNew} onCancel={() => setAdding(false)} />
    </div>}

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
      {initialVideos.map(video => <article key={video.id} style={{ minWidth: 0, background: '#FAFAF7', border: '1px solid #EDE8DC', overflow: 'hidden' }}>
        {editing === video.id ? <div style={{ padding: 16 }}>
          <VideoForm initial={{ videoUrl: video.videoUrl, customerName: video.customerName ?? '', caption: video.caption ?? '', position: video.position, isVisible: video.isVisible }} submitLabel="Save changes" onSave={data => saveEdit(video.id, data)} onCancel={() => setEditing(null)} />
        </div> : <>
          <video src={video.videoUrl} controls preload="metadata" style={{ width: '100%', height: 250, objectFit: 'cover', display: 'block', background: '#1A1A18' }} />
          <div style={{ padding: 14 }}>
            <p style={{ ...S.b, fontWeight: 500, fontSize: 14, color: '#1A1A18', margin: 0 }}>{video.customerName || 'Unnamed customer'}</p>
            {video.caption && <p style={{ ...S.b, fontSize: 12, color: '#6B6B63', lineHeight: 1.5, margin: '5px 0' }}>{video.caption}</p>}
            <p style={{ ...S.m, fontSize: 9, letterSpacing: '.1em', color: video.isVisible ? '#B8965A' : '#6B6B63', margin: '8px 0 0' }}>{video.isVisible ? 'VISIBLE' : 'HIDDEN'} · ORDER {video.position}</p>
          </div>
        </>}

        <div style={{ display: 'flex', width: '100%', boxSizing: 'border-box', gap: 8, padding: '0 14px 14px' }}>
          <button type="button" onClick={() => setEditing(editing === video.id ? null : video.id)} aria-label="Edit video" style={cardAction('Edit', '#B8965A')}><Pencil size={14} /> EDIT</button>
          <button type="button" onClick={() => setDeleting(video.id)} aria-label="Delete video" style={cardAction('Delete', '#B33')}><Trash2 size={14} /> DELETE</button>
        </div>

        {deleting === video.id && <div role="alertdialog" aria-label="Confirm UGC video deletion" style={{ display: 'grid', gap: 10, margin: '0 14px 14px', padding: 12, border: '1px solid #E8B7B2', background: '#FFF8F7' }}>
          <span style={{ ...S.b, fontSize: 12, lineHeight: 1.5, color: '#6B2824' }}>Delete this UGC video? The video file and its testimonial data will be permanently removed.</span>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setDeleting(null)} style={{ border: '1px solid #EDE8DC', background: '#FAFAF7', padding: '8px 12px', cursor: 'pointer', ...S.m, fontSize: 10, textTransform: 'uppercase' }}>Cancel</button>
            <button type="button" onClick={() => void remove(video.id)} style={{ border: 0, background: '#A22', color: '#fff', padding: '8px 12px', cursor: 'pointer', ...S.m, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Confirm delete</button>
          </div>
        </div>}
      </article>)}
    </div>

    {initialVideos.length === 0 && !adding && <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <Video size={32} color="#B8965A" strokeWidth={1} />
      <p style={{ ...S.d, fontSize: 21, fontWeight: 300, margin: '12px 0 5px' }}>No UGC videos yet</p>
      <p style={{ ...S.b, fontSize: 13, color: '#6B6B63', margin: 0 }}>Upload the first customer video to feature it on the homepage.</p>
    </div>}
  </div>;
}
