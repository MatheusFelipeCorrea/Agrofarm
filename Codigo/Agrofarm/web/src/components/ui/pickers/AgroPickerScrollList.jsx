import { useEffect, useRef } from "react";

export default function AgroPickerScrollList({ className = "", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (event) => {
      event.stopPropagation();
      if (el.scrollHeight <= el.clientHeight) return;

      const maxScroll = el.scrollHeight - el.clientHeight;
      const next = el.scrollTop + event.deltaY;
      const canScrollDown = event.deltaY > 0 && el.scrollTop < maxScroll;
      const canScrollUp = event.deltaY < 0 && el.scrollTop > 0;

      if (canScrollDown || canScrollUp) {
        event.preventDefault();
        el.scrollTop = Math.max(0, Math.min(maxScroll, next));
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={ref} className={`agro-picker-scroll max-h-32 overflow-y-auto pr-0.5 ${className}`.trim()}>
      {children}
    </div>
  );
}
