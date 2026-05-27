"use client";

import { useState, useEffect } from "react";

export default function StatusBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      return `${h}:${m}`;
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="px-5 pt-3 flex justify-between text-[11px] text-ink-3">
      <span>{time}</span>
      <span>● ● ●</span>
    </div>
  );
}
