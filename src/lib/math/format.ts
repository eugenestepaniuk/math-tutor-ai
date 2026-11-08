import { parseEquation, type Expression } from "./parser";

function expressionTex(node: Expression): string {
  switch (node.kind) {
    case "number": return String(node.value);
    case "variable": return node.name;
    case "group": return `\\left(${expressionTex(node.inner)}\\right)`;
    case "negative": return `-${expressionTex(node.inner)}`;
    case "binary": {
      const a = expressionTex(node.left);
      const b = expressionTex(node.right);
      if (node.operator === "/") return `\\frac{${a}}{${b}}`;
      if (node.operator === "*") {
        const coefficient = node.left.kind === "number" || (node.left.kind === "negative" && node.left.inner.kind === "number");
        return coefficient && (node.right.kind === "variable" || node.right.kind === "group") ? `${a}${b}` : `${a} \\cdot ${b}`;
      }
      return `${a} ${node.operator} ${b}`;
    }
  }
}

// Only parser-owned nodes produce TeX; student input is never treated as TeX/HTML.
export function equationToTex(equation: string): string | null {
  try {
    const parsed = parseEquation(equation);
    return `${expressionTex(parsed.left)} = ${expressionTex(parsed.right)}`;
  } catch { return null; }
}
