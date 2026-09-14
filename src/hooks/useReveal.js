import { useEffect, useRef } from 'react';

/**
 * useReveal — attach to any element to fade/slide it in on first scroll into view.
 * Adds `is-visible` once; IntersectionObserver disconnects after reveal.
 * Respects prefers-reduced-motion via CSS (elements render visible, no transform).
 */
export default function useReveal(options) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px', ...(options || {}) },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
