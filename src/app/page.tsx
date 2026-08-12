'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import imagesManifest from '../../public/images/manifest.json';

interface GalleryImage {
  id: string;
  title: string;
  width: number;
  height: number;
  src: string;
  thumbnail: string;
}

const PUBLICACION_IMAGES: GalleryImage[] = [
  {
    id: 'pub1',
    title: 'diario de los nuevos 20\'s - 1',
    width: 1200,
    height: 1800,
    src: '/images/pub-1.jpg',
    thumbnail: '/images/pub-1.jpg',
  },
  {
    id: 'pub2',
    title: 'diario de los nuevos 20\'s - 2',
    width: 1200,
    height: 1800,
    src: '/images/pub-2.jpg',
    thumbnail: '/images/pub-2.jpg',
  },
  {
    id: 'pub5',
    title: 'diario de los nuevos 20\'s - 3',
    width: 1200,
    height: 1800,
    src: '/images/pub-5.jpg',
    thumbnail: '/images/pub-5.jpg',
  },
];

interface PublicationCarouselProps {
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  onZoom: () => void;
}

function PublicationCarousel({ currentIndex, setCurrentIndex, onZoom }: PublicationCarouselProps) {
  const pointerDownX = useRef<number | null>(null);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % PUBLICACION_IMAGES.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + PUBLICACION_IMAGES.length) % PUBLICACION_IMAGES.length);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerDownX.current === null) return;
    const diffX = e.clientX - pointerDownX.current;
    
    if (diffX > 50) {
      setCurrentIndex((prev) => (prev - 1 + PUBLICACION_IMAGES.length) % PUBLICACION_IMAGES.length);
    } else if (diffX < -50) {
      setCurrentIndex((prev) => (prev + 1) % PUBLICACION_IMAGES.length);
    }
    pointerDownX.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rx = -(y / (rect.height / 2)) * 15;
    const ry = (x / (rect.width / 2)) * 15;

    card.style.setProperty('--rx', rx.toFixed(2));
    card.style.setProperty('--ry', ry.toFixed(2));
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', '0');
    card.style.setProperty('--ry', '0');
  };

  return (
    <div className={styles.carouselContainer}>
      <div
        className={styles.carouselWrapper}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerDownX.current = null; }}
      >
        <button
          className={`${styles.carouselNavBtn} ${styles.carouselNavPrev}`}
          onClick={handlePrev}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          aria-label="Previous image"
        >
          &lt;
        </button>

        {PUBLICACION_IMAGES.map((img, index) => {
          let cardClass = styles.carouselCard;
          let isCurrent = false;

          if (index === currentIndex) {
            cardClass += ` ${styles.carouselCardCurrent}`;
            isCurrent = true;
          } else if (index === (currentIndex + 1) % PUBLICACION_IMAGES.length) {
            cardClass += ` ${styles.carouselCardNext}`;
          } else {
            cardClass += ` ${styles.carouselCardPrev}`;
          }

          return (
            <div
              key={img.id}
              className={cardClass}
              onClick={isCurrent ? onZoom : () => setCurrentIndex(index)}
              onPointerMove={isCurrent ? handlePointerMove : undefined}
              onPointerLeave={isCurrent ? handlePointerLeave : undefined}
              style={
                isCurrent
                  ? {
                      transition: 'transform 0.1s ease-out, opacity 0.6s ease, z-index 0.6s ease',
                    }
                  : undefined
              }
            >
              <Image
                src={img.src}
                alt={img.title}
                fill
                className={styles.carouselCardImage}
                sizes="(max-width: 768px) 140px, 200px"
                priority
              />
            </div>
          );
        })}

        <button
          className={`${styles.carouselNavBtn} ${styles.carouselNavNext}`}
          onClick={handleNext}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          aria-label="Next image"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [coverActive, setCoverActive] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'trabajo' | 'personal' | 'publicacion'>('trabajo');
  const [activeTrabajoIdx, setActiveTrabajoIdx] = useState(0);
  const [activePersonalIdx, setActivePersonalIdx] = useState(0);
  const [activePublicacionIdx, setActivePublicacionIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [lightboxActive, setLightboxActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [contactActive, setContactActive] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: 'Hola, estoy interesadx en comprar tu libro' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || 'error al enviar el mensaje.');
      }
    } catch {
      setErrorMsg('error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLElement>(null);

  // Scroll main gallery to top when changing category
  useEffect(() => {
    if (galleryRef.current) {
      galleryRef.current.scrollTop = 0;
    }
  }, [activeCategory]);

  // Check viewport width to determine active view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Play/pause the publication video when category or viewport changes
  useEffect(() => {
    if (activeCategory === 'publicacion') {
      if (!isMobile && videoRef.current) {
        videoRef.current.play().catch(err => console.log('Autoplay prevented:', err));
      }
      if (isMobile && mobileVideoRef.current) {
        mobileVideoRef.current.play().catch(err => console.log('Autoplay prevented:', err));
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (mobileVideoRef.current) {
        mobileVideoRef.current.pause();
      }
    }
  }, [activeCategory, isMobile]);

  // Countdown Timer for Publication Launch
  const [countdownText, setCountdownText] = useState('');

  useEffect(() => {
    // Target date: August 21, 2026 at 08:00 AM (GMT-5 timezone)
    const targetDate = new Date('2026-08-21T08:00:00-05:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setCountdownText('lanzado');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdownText(`lanzamiento en ${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);


  const personalImages: GalleryImage[] = imagesManifest.personal || [];
  const trabajoImages: GalleryImage[] = imagesManifest.trabajo || [];

  const currentImages =
    activeCategory === 'personal'
      ? personalImages
      : activeCategory === 'publicacion'
      ? PUBLICACION_IMAGES
      : trabajoImages;

  const currentIdx =
    activeCategory === 'personal'
      ? activePersonalIdx
      : activeCategory === 'publicacion'
      ? activePublicacionIdx
      : activeTrabajoIdx;

  const currentImage = currentImages[currentIdx] || null;

  // Handle image transitions (fade out, switch index, fade in)
  const navigateImage = (direction: 'next' | 'prev') => {
    if (currentImages.length === 0) return;
    setIsFading(true);
    setTimeout(() => {
      let nextIdx = currentIdx;
      if (direction === 'next') {
        nextIdx = (currentIdx + 1) % currentImages.length;
      } else {
        nextIdx = (currentIdx - 1 + currentImages.length) % currentImages.length;
      }

      if (activeCategory === 'personal') {
        setActivePersonalIdx(nextIdx);
      } else if (activeCategory === 'publicacion') {
        setActivePublicacionIdx(nextIdx);
      } else {
        setActiveTrabajoIdx(nextIdx);
      }
      setIsFading(false);
    }, 200);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (coverActive) {
        if (e.key === 'Enter' || e.key === ' ') {
          setCoverActive(false);
        }
        return;
      }

      if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'Escape') {
        setLightboxActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [coverActive, activeCategory, activePersonalIdx, activeTrabajoIdx, currentImages]);

  // Prevent scroll when lightbox, contact form, or cover is active on desktop
  useEffect(() => {
    if (lightboxActive || contactActive || (coverActive && window.innerWidth > 768)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [lightboxActive, coverActive, contactActive]);

  // Swipe gesture detection
  const [pointerStart, setPointerStart] = useState<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!coverActive) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setPointerStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStart || !coverActive) return;
    const diffX = e.clientX - pointerStart.x;
    const diffY = e.clientY - pointerStart.y;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    // Any swipe direction of more than 30px will trigger entry
    if (distance > 30) {
      setCoverActive(false);
    }
    setPointerStart(null);
  };

  const handlePointerCancel = () => {
    setPointerStart(null);
  };

  // Support trackpad/wheel scroll as a swipe action
  useEffect(() => {
    if (!coverActive) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 10 || Math.abs(e.deltaX) > 10) {
        setCoverActive(false);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [coverActive]);

  const handleMenuClick = (category: 'trabajo' | 'personal' | 'publicacion') => {
    setActiveCategory(category);
    setMobileMenuOpen(false);
  };

  return (
    <div className={styles.mainLayout}>
      {/* Cover / Landing Section */}
      <div
        className={`${styles.coverContainer} ${!coverActive ? styles.hidden : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <Image
          className={styles.coverBackground}
          src="/images/cover.webp"
          alt="Juan Pablo Huston Cover"
          fill
          priority
        />
        <div className={styles.coverContent}>
          <div className={styles.coverSubtitle}>
            desliza en cualquier dirección para entrar
          </div>
          <h1 className={styles.coverTitle}>
            Juan Pablo Huston
          </h1>
        </div>
      </div>

      {/* Desktop Left Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logoName}>Juan Pablo Huston</h2>
        </div>

        <nav className={styles.navigationMenu}>
          <button
            className={`${styles.menuItem} ${activeCategory === 'trabajo' ? styles.menuItemActive : ''}`}
            onClick={() => handleMenuClick('trabajo')}
          >
            Trabajo
          </button>
          <button
            className={`${styles.menuItem} ${activeCategory === 'personal' ? styles.menuItemActive : ''}`}
            onClick={() => handleMenuClick('personal')}
          >
            Personal
          </button>
          <button
            className={`${styles.menuItem} ${activeCategory === 'publicacion' ? styles.menuItemActive : ''}`}
            onClick={() => handleMenuClick('publicacion')}
          >
            Publicación
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.placeholderText}>
            juan pablo huston<br />
            fotografía y dirección<br />
            bogotá, colombia
          </div>
          <div className={styles.socialLinks}>
            <a
              href="https://www.instagram.com/juanpablohuston/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramLink}
              aria-label="Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a
              href="https://vimeo.com/user51667030"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramLink}
              aria-label="Vimeo"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 12a11.02 11.02 0 0 1-5.47 9.59c-2 .88-4 .77-5.94-.33-2.4-1.35-3.3-3.63-3.66-6-.35-2.29-.63-4.57-1.1-6.85a3.8 3.8 0 0 0-2.13-2.82C3.41 5 2.13 5.39 1 6.16l-.5-1.1c1.35-1.22 3.12-1.92 4.9-1.92A4.65 4.65 0 0 1 8.87 5.7c.66 2 .92 4.09 1.45 6.16.43 1.7.9 3.4 1.82 4.9.48.78 1.1 1.1 2.05.9 1-.22 1.76-1.07 2.37-1.88a25 25 0 0 0 3-4.8 23.36 23.36 0 0 0 1.79-5.69A2.08 2.08 0 0 1 23 7.82V12z"></path>
              </svg>
            </a>
          </div>
          <div className={styles.placeholderText}>
            © 2026 todos los derechos reservados.
          </div>
        </div>
      </aside>

      {/* Mobile Sticky Header */}
      <header className={`${styles.mobileHeader} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <h2 className={styles.mobileTitle} onClick={() => setCoverActive(true)}>
          Juan Pablo Huston
        </h2>
        <button className={styles.hamburgerBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span className={styles.bar}></span>
          <span className={`${styles.bar} ${styles.barHalf}`}></span>
          <span className={styles.bar}></span>
        </button>
      </header>

      {/* Mobile Navigation Menu */}
      <div className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.open : ''}`}>
        <nav className={styles.mobileNav}>
          <button
            className={`${styles.mobileMenuItem} ${activeCategory === 'trabajo' ? styles.mobileMenuItemActive : ''}`}
            onClick={() => handleMenuClick('trabajo')}
          >
            Trabajo
          </button>
          <button
            className={`${styles.mobileMenuItem} ${activeCategory === 'personal' ? styles.mobileMenuItemActive : ''}`}
            onClick={() => handleMenuClick('personal')}
          >
            Personal
          </button>
          <button
            className={`${styles.mobileMenuItem} ${activeCategory === 'publicacion' ? styles.mobileMenuItemActive : ''}`}
            onClick={() => handleMenuClick('publicacion')}
          >
            Publicación
          </button>
        </nav>

        <div className={styles.mobileMenuFooter}>
          <div className={styles.placeholderText}>
            juan pablo huston<br />
            fotografía y dirección de arte
          </div>
          <div className={styles.socialLinks}>
            <a
              href="https://www.instagram.com/juanpablohuston/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramLink}
              aria-label="Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a
              href="https://vimeo.com/user51667030"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramLink}
              aria-label="Vimeo"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 12a11.02 11.02 0 0 1-5.47 9.59c-2 .88-4 .77-5.94-.33-2.4-1.35-3.3-3.63-3.66-6-.35-2.29-.63-4.57-1.1-6.85a3.8 3.8 0 0 0-2.13-2.82C3.41 5 2.13 5.39 1 6.16l-.5-1.1c1.35-1.22 3.12-1.92 4.9-1.92A4.65 4.65 0 0 1 8.87 5.7c.66 2 .92 4.09 1.45 6.16.43 1.7.9 3.4 1.82 4.9.48.78 1.1 1.1 2.05.9 1-.22 1.76-1.07 2.37-1.88a25 25 0 0 0 3-4.8 23.36 23.36 0 0 0 1.79-5.69A2.08 2.08 0 0 1 23 7.82V12z"></path>
              </svg>
            </a>
          </div>
          <div className={styles.placeholderText}>
            © 2026 todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* Desktop Main Gallery Area */}
      <main
        ref={galleryRef}
        className={`${styles.galleryArea} ${activeCategory === 'publicacion' ? styles.galleryScrollable : ''}`}
      >
        {activeCategory !== 'publicacion' ? (
          <div className={styles.canvasWrapper}>
            {currentImage && (
              <>
                <div className={styles.viewportWrapper} onClick={() => setLightboxActive(true)}>
                  <Image
                    className={`${styles.galleryImage} ${isFading ? styles.fade : ''}`}
                    src={currentImage.src}
                    alt={currentImage.title}
                    width={currentImage.width}
                    height={currentImage.height}
                    priority
                  />
                </div>
                <div className={styles.controlsWrapper}>
                  <button className={styles.controlBtn} onClick={() => navigateImage('prev')}>
                    &lt;
                  </button>
                  <button className={styles.controlBtn} onClick={() => navigateImage('next')}>
                    &gt;
                  </button>
                </div>
                <span className={`${styles.imageMetadata} ${isFading ? styles.fade : ''}`}>
                  {currentImage.title.toLowerCase()}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className={styles.publicationView}>
            <div className={styles.pubCarouselWrapper}>
              {!isMobile && (
                <PublicationCarousel
                  currentIndex={activePublicacionIdx}
                  setCurrentIndex={setActivePublicacionIdx}
                  onZoom={() => setLightboxActive(true)}
                />
              )}
            </div>
            <div className={styles.pubVideoWrapper}>
              {!isMobile && (
                <video
                  ref={videoRef}
                  className={styles.pubVideo}
                  src="/publicacion.mp4"
                  autoPlay
                  loop
                  playsInline
                  controls
                />
              )}
            </div>
            <div className={styles.pubLinksContainer}>
              <a
                href="#"
                className={styles.pubBuyLink}
                onClick={(e) => {
                  e.preventDefault();
                  setContactActive(true);
                }}
              >
                cómo comprar
              </a>
              <a
                href="#"
                className={styles.pubInfoLink}
                onClick={(e) => {
                  e.preventDefault();
                  setContactActive(true);
                }}
              >
                diario de los nuevos 20's <br /> edición especial: corredores de bolsa...
              </a>
            </div>
            {countdownText && (
              <a
                href="#"
                className={styles.pubCountdownLink}
                onClick={(e) => {
                  e.preventDefault();
                  setContactActive(true);
                }}
              >
                {countdownText}
              </a>
            )}
          </div>
        )}
      </main>

      {/* Mobile Stacked Content */}
      {activeCategory !== 'publicacion' ? (
        <div className={styles.mobileGalleryContent}>
          {currentImages.map((img) => (
            <div key={img.id} className={styles.mobileImageCard}>
              <div className={styles.mobileImageWrapper}>
                <Image
                  className={styles.mobileImage}
                  src={img.src}
                  alt={img.title}
                  fill
                  sizes="100vw"
                />
              </div>
              <span className={styles.mobileImageLabel}>{img.title}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.mobilePubSection}>
          <div className={styles.pubCarouselWrapper} style={{ height: '300px' }}>
            {isMobile && (
              <PublicationCarousel
                currentIndex={activePublicacionIdx}
                setCurrentIndex={setActivePublicacionIdx}
                onZoom={() => {}}
              />
            )}
          </div>
          <div className={styles.pubVideoWrapper} style={{ height: '300px', marginTop: '20px' }}>
            {isMobile && (
              <video
                ref={mobileVideoRef}
                className={styles.pubVideo}
                src="/publicacion.mp4"
                autoPlay
                loop
                playsInline
                controls
              />
            )}
          </div>
          <div className={styles.pubLinksContainer}>
            <a
              href="#"
              className={styles.pubBuyLink}
              onClick={(e) => {
                e.preventDefault();
                setContactActive(true);
              }}
            >
              cómo comprar
            </a>
            <a
              href="#"
              className={styles.pubInfoLink}
              onClick={(e) => {
                e.preventDefault();
                setContactActive(true);
              }}
            >
              diario de los nuevos 20's <br /> edición especial: corredores de bolsa...
            </a>
          </div>
          {countdownText && (
            <a
              href="#"
              className={styles.pubCountdownLink}
              onClick={(e) => {
                e.preventDefault();
                setContactActive(true);
              }}
            >
              {countdownText}
            </a>
          )}
        </div>
      )}

      {/* Lightbox Modal (Desktop Only Zoom) */}
      {lightboxActive && currentImage && (
        <div className={styles.lightboxModal}>
          <button className={styles.lightboxClose} onClick={() => setLightboxActive(false)}>
            ✕
          </button>
          <button className={`${styles.lightboxArrow} ${styles.lightboxLeft}`} onClick={() => navigateImage('prev')}>
            &lt;
          </button>
          <div className={styles.lightboxContent} onClick={() => setLightboxActive(false)}>
            <Image
              className={styles.lightboxImage}
              src={currentImage.src}
              alt={currentImage.title}
              width={currentImage.width}
              height={currentImage.height}
            />
          </div>
          <button className={`${styles.lightboxArrow} ${styles.lightboxRight}`} onClick={() => navigateImage('next')}>
            &gt;
          </button>
          <div className={styles.lightboxTitle}>{currentImage.title}</div>
        </div>
      )}

      {/* Contact Form Modal */}
      {contactActive && (
        <div className={styles.contactModal}>
          <div className={styles.contactModalContent}>
            <button 
              className={styles.contactClose} 
              onClick={() => {
                setContactActive(false);
                setSubmitted(false);
                setFormData({ name: '', email: '', message: 'Hola, estoy interesadx en comprar tu libro' });
                setErrorMsg('');
              }}
            >
              ✕
            </button>

            {submitted ? (
              <div className={styles.formSuccess}>
                <h3>mensaje enviado</h3>
                <p>gracias. nos pondremos en contacto contigo lo antes posible.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', message: 'Hola, estoy interesadx en comprar tu libro' });
                  }}
                  className={styles.formSubmitBtn}
                >
                  enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className={styles.contactForm}>
                <div className={styles.formField}>
                  <label htmlFor="nombre">nombre</label>
                  <input
                    id="nombre"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="tu nombre"
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="correo">correo electrónico</label>
                  <input
                    id="correo"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu correo"
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="mensaje">mensaje</label>
                  <textarea
                    id="mensaje"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="escribe tu mensaje..."
                  />
                </div>

                {errorMsg && <div className={styles.formError}>{errorMsg.toLowerCase()}</div>}

                <button type="submit" disabled={loading} className={styles.formSubmitBtn}>
                  {loading ? 'enviando...' : 'enviar'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
