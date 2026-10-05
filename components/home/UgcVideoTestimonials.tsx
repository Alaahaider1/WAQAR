'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { GoldDivider } from '@/components/ui/GoldDivider';
import { FadeIn } from '@/components/ui/FadeIn';
import type { PublicUgcVideo } from '@/src/types/domain';

export function UgcVideoTestimonials({ videos }: { videos: PublicUgcVideo[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(videos.length > 1);
  const updateButtons = () => {
    const rail = railRef.current;
    if (!rail) return;
    setCanGoBack(rail.scrollLeft > 8);
    setCanGoForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 8);
  };
  const move = (direction: -1 | 1) => railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * 0.8, behavior: 'smooth' });

  return <section style={{ backgroundColor:'#F5F0E8', overflow:'hidden' }}>
    <GoldDivider />
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'80px 0' }}>
      <FadeIn style={{ textAlign:'center', padding:'0 24px', marginBottom:42 }}>
        <p style={{ fontFamily:"'DM Mono', monospace", fontSize:10, letterSpacing:'.25em', textTransform:'uppercase', color:'#6B6B63', marginBottom:12 }}>In their own words</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:'clamp(2rem, 4vw, 3.2rem)', fontWeight:300, color:'#1A1A18', lineHeight:1.1, margin:0 }}>Seen. Worn. <em>Remembered.</em></h2>
      </FadeIn>
      {videos.length === 0 ? <div style={{ textAlign:'center', padding:'20px 24px 8px' }}><Video size={25} strokeWidth={1} style={{ color:'#B8965A', marginBottom:10 }} /><p style={{ fontFamily:"'DM Sans', system-ui, sans-serif", fontSize:14, lineHeight:1.7, color:'#6B6B63', margin:'0 auto', maxWidth:420 }}>Customer stories are being collected. Please return soon.</p></div> : <>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'0 40px', marginBottom:14 }} className="ugc-video-controls">
          <button type="button" disabled={!canGoBack} onClick={()=>move(-1)} aria-label="Previous customer video" className="ugc-video-arrow"><ChevronLeft size={17}/></button>
          <button type="button" disabled={!canGoForward} onClick={()=>move(1)} aria-label="Next customer video" className="ugc-video-arrow"><ChevronRight size={17}/></button>
        </div>
        <div ref={railRef} onScroll={updateButtons} className="ugc-video-rail" aria-label="Customer video testimonials">
          {videos.map((video, index) => <article key={`${video.videoUrl}-${index}`} className="ugc-video-card">
            <div className="ugc-video-frame"><video controls playsInline preload="none" src={video.videoUrl} aria-label={`Video testimonial${video.customerName ? ` from ${video.customerName}` : ''}`} /></div>
            {(video.customerName || video.caption) && <div style={{ padding:'14px 2px 0' }}>{video.customerName && <p style={{ fontFamily:"'DM Sans', system-ui, sans-serif", fontSize:14, fontWeight:500, color:'#1A1A18', margin:0 }}>{video.customerName}</p>}{video.caption && <p style={{ fontFamily:"'DM Sans', system-ui, sans-serif", fontSize:13, color:'#6B6B63', lineHeight:1.55, margin:'4px 0 0' }}>{video.caption}</p>}</div>}
          </article>)}
        </div>
      </>}
    </div>
    <style>{`
      .ugc-video-rail { display:flex; gap:20px; overflow-x:auto; overscroll-behavior-x:contain; scroll-snap-type:x mandatory; scroll-padding:0 40px; padding:0 40px 12px; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
      .ugc-video-rail::-webkit-scrollbar { display:none; }
      .ugc-video-card { flex:0 0 calc((100% - 40px) / 3); min-width:0; scroll-snap-align:start; }
      .ugc-video-frame { border:1px solid #EDE8DC; border-radius:3px; overflow:hidden; background:#1A1A18; box-shadow:0 12px 28px rgba(26,26,24,.08); }
      .ugc-video-frame video { display:block; width:100%; height:auto; max-height:590px; aspect-ratio:9 / 16; object-fit:contain; background:#1A1A18; }
      .ugc-video-arrow { width:36px; height:36px; border:1px solid #D9D1C2; background:#FAFAF7; color:#1A1A18; display:grid; place-items:center; cursor:pointer; transition:all .18s ease; }
      .ugc-video-arrow:hover:not(:disabled) { border-color:#B8965A; color:#B8965A; }
      .ugc-video-arrow:disabled { opacity:.35; cursor:not-allowed; }
      @media(max-width:760px) { .ugc-video-rail { gap:14px; scroll-padding:0 20px; padding:0 20px 10px; } .ugc-video-card { flex-basis:82vw; } .ugc-video-controls { display:none !important; } }
      @media(min-width:761px) and (max-width:1023px) { .ugc-video-card { flex-basis:calc((100% - 20px) / 2); } }
    `}</style>
  </section>;
}
