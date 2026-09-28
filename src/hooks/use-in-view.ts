import { useEffect, useRef, useState } from "react";

/**
 * Detecta quando um elemento entra na viewport.
 * Retorna [ref, inView] — quando inView vira true, o elemento "emerge".
 * Ao sair da viewport, inView volta para false (efeito de submergir).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit & { once?: boolean },
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (options?.once) observer.disconnect();
        } else if (!options?.once) {
          setInView(false);
        }
      },
      {
        threshold: options?.threshold ?? 0.15,
        rootMargin: options?.rootMargin ?? "0px 0px -10% 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.once, options?.threshold, options?.rootMargin]);

  return [ref, inView] as const;
}
