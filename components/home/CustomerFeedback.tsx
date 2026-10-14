'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import type { CustomerFeedbackImage } from '@/src/types/domain';

export function CustomerFeedback({ images }: { images: CustomerFeedbackImage[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(images.length > 1);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateButtons = () => {
      setCanGoBack(rail.scrollLeft > 8);
      setCanGoForward(
        rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 8
      );
    };

    updateButtons();

    rail.addEventListener('scroll', updateButtons, { passive: true });

    const observer = new ResizeObserver(updateButtons);
    observer.observe(rail);

    return () => {
      rail.removeEventListener('scroll', updateButtons);
      observer.disconnect();
    };
  }, [images.length]);

  if (images.length === 0) return null;

  const updateButtons = () => {
    const rail = railRef.current;
    if (!rail) return;

    setCanGoBack(rail.scrollLeft > 8);
    setCanGoForward(
      rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 8
    );
  };

  const move = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction * rail.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  return (
    <section
      style={{
        background: '#FAFAF7',
        padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 40px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 34 }}>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: '.25em',
              textTransform: 'uppercase',
              color: '#6B6B63',
              margin: '0 0 10px',
            }}
          >
            Customer feedback
          </p>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 300,
              lineHeight: 1.1,
              color: '#1A1A18',
              margin: 0,
            }}
          >
            What Our Customers Say
          </h2>
        </header>

        <div
          className="customer-feedback-controls"
          aria-label="Customer feedback gallery controls"
        >
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => move(-1)}
            aria-label="Previous customer feedback image"
            className="customer-feedback-arrow"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            disabled={!canGoForward}
            onClick={() => move(1)}
            aria-label="Next customer feedback image"
            className="customer-feedback-arrow"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <div
          ref={railRef}
          onScroll={updateButtons}
          className="customer-feedback-rail"
          aria-label="Customer feedback images"
          tabIndex={0}
        >
          {images.map((image) => (
            <figure
              key={image.id}
              className="customer-feedback-card"
              style={{
                margin: 0,
                border: '1px solid #EDE8DC',
                background: 'transparent',
                padding: 0,
                alignSelf: 'flex-start',
              }}
            >
              <Image
                src={image.imageUrl}
                alt="Customer feedback"
                loading="lazy"
                width={800}
                height={1000}
                sizes="(max-width: 760px) 82vw, (max-width: 900px) 33vw, 25vw"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </figure>
          ))}
        </div>
      </div>

      <style>{`
        .customer-feedback-controls {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 14px;
        }

        .customer-feedback-arrow {
          width: 36px;
          height: 36px;
          border: 1px solid #D9D1C2;
          background: #F5F0E8;
          color: #1A1A18;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: border-color .18s ease, color .18s ease;
        }

        .customer-feedback-arrow:hover:not(:disabled) {
          border-color: #B8965A;
          color: #B8965A;
        }

        .customer-feedback-arrow:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        .customer-feedback-rail {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scroll-snap-type: x mandatory;
          scroll-padding: 2px;
          padding: 0 2px 12px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .customer-feedback-rail::-webkit-scrollbar {
          display: none;
        }

        .customer-feedback-card {
          flex: 0 0 calc((100% - 48px) / 4);
          min-width: 0;
          height: auto;
          scroll-snap-align: start;
        }

        .customer-feedback-card img {
          display: block;
          width: 100%;
          height: auto;
          max-width: 100%;
          object-fit: contain;
        }

        @media (max-width: 900px) and (min-width: 761px) {
          .customer-feedback-card {
            flex-basis: calc((100% - 32px) / 3);
          }
        }

        @media (max-width: 760px) {
          .customer-feedback-controls {
            display: none;
          }

          .customer-feedback-rail {
            gap: 14px;
            scroll-padding: 0 20px;
            padding: 0 20px 10px;
            margin: 0 -20px;
          }

          .customer-feedback-card {
            flex-basis: 82vw;
          }
        }
      `}</style>
    </section>
  );
}