import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from './links.module.css';

export const metadata: Metadata = {
  title: 'links | Juan Pablo Huston',
  description: 'links to instagram, vimeo, and home page of juan pablo huston.',
};

export default function LinksPage() {
  return (
    <div className={styles.container}>
      {/* Background Image */}
      <Image
        className={styles.backgroundImage}
        src="/images/links-bg.jpg"
        alt="Juan Pablo Huston Background"
        fill
        priority
        sizes="100vw"
        quality={90}
      />
      
      {/* Dark tint overlay for readability */}
      <div className={styles.overlay} />

      {/* Centered links container */}
      <main className={styles.content}>
        <a
          href="https://www.instagram.com/juanpablohuston/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkItem}
          id="link-instagram"
        >
          instagram
        </a>
        <a
          href="https://vimeo.com/user51667030"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkItem}
          id="link-vimeo"
        >
          vimeo
        </a>
        <Link
          href="/"
          className={styles.linkItem}
          id="link-home"
        >
          juanpablohuston.com
        </Link>
      </main>
    </div>
  );
}
