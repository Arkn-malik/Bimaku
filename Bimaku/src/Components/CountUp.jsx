import { useEffect, useRef, useState } from "react";

const kurangiGerak = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function CountUp({ value, duration = 900, delay = 0 }) {
  const diam = kurangiGerak();
  const [tampil, setTampil] = useState(diam ? value : 0);
  const dari = useRef(diam ? value : 0);
  const pertama = useRef(true);

  useEffect(() => {
    if (kurangiGerak()) { dari.current = value; setTampil(value); return; }

    let raf = 0;
    let mulai = null;
    const awal = dari.current;
    const selisih = value - awal;

    const t = setTimeout(() => {
      pertama.current = false;
      const langkah = (now) => {
        if (mulai === null) mulai = now;
        const p = Math.min(1, (now - mulai) / duration);
        const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const v = Math.round(awal + selisih * e);
        dari.current = v;
        setTampil(v);
        if (p < 1) raf = requestAnimationFrame(langkah);
      };
      raf = requestAnimationFrame(langkah);
    }, pertama.current ? delay : 0);

    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [value]); 

  return <>{tampil}</>;
}
