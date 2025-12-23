import { useEffect, useState } from "react";

/**
 * 追蹤頁面滾動位置的 hook
 * @returns 當前滾動位置（px）
 */
export function useScroll(): number {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return scrollY;
}
