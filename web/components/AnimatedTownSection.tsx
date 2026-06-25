"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedTownSection({
  town,
  children
}: {
  town: string;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<"rest" | "out">("rest");
  const prev = useRef(town);

  useEffect(() => {
    if (prev.current === town) return;
    prev.current = town;
    setPhase("out");
    const t = setTimeout(() => setPhase("rest"), 80);
    return () => clearTimeout(t);
  }, [town]);

  return (
    <div
      className={phase === "out" ? "opacity-0 translate-y-2 scale-[0.99]" : "opacity-100 translate-y-0 scale-100"}
      style={{
        transition: phase === "out"
          ? "opacity 100ms ease-in, transform 100ms ease-in"
          : "opacity 380ms cubic-bezier(0,0,0.2,1), transform 380ms cubic-bezier(0,0,0.2,1)"
      }}
    >
      {children}
    </div>
  );
}
