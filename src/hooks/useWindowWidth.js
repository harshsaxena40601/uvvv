import { useEffect, useState } from "react";
export default function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => { const onR = () => setW(window.innerWidth); window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR); }, []);
  return w;
}
