"use client";

import katex from "katex";
import { useEffect, useRef } from "react";
import { equationToTex } from "@/lib/math/format";

function RenderMath({ tex, label }: { tex: string | null; label: string }) {
  const element = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!element.current || tex === null) return;
    katex.render(tex, element.current, {
      throwOnError: false, trust: false, strict: "error",
      output: "htmlAndMathml", maxExpand: 32, maxSize: 3,
    });
  }, [tex]);
  return <span className="math-text" role="math" aria-label={label} ref={element}>{label}</span>;
}

export function MathText({ equation }: { equation: string }) {
  return <RenderMath tex={equationToTex(equation)} label={equation} />;
}

export function DistributiveRule() {
  return <RenderMath tex="a(b+c)=ab+ac" label="a(b + c) = ab + ac" />;
}
