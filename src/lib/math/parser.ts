import { MathInputError } from "./rational";

export const MAX_EQUATION_LENGTH = 256;
const MAX_TOKENS = 128;
const MAX_DEPTH = 16;

export type Variable = "x" | "y";
export type Expression =
  | { kind: "number"; value: bigint }
  | { kind: "variable"; name: Variable }
  | { kind: "group"; inner: Expression }
  | { kind: "negative"; inner: Expression }
  | { kind: "binary"; operator: "+" | "-" | "*" | "/"; left: Expression; right: Expression };
export type Equation = { left: Expression; right: Expression; variable: Variable | null };
type Token = { value: string; kind: "number" | "variable" | "symbol" };

function tokenize(input: string): Token[] {
  if (!input.trim()) throw new MathInputError("invalid", "Enter an equation before checking your step.");
  if (input.length > MAX_EQUATION_LENGTH) throw new MathInputError("unsupported", "Keep your equation under 257 characters.");
  const normalized = input.replaceAll("−", "-").replaceAll("×", "*").replaceAll("÷", "/");
  const tokens: Token[] = [];
  let index = 0;
  while (index < normalized.length) {
    const character = normalized[index]!;
    if (/\s/.test(character)) { index++; continue; }
    if (/[0-9]/.test(character)) {
      const start = index;
      while (index < normalized.length && /[0-9]/.test(normalized[index]!)) index++;
      const value = normalized.slice(start, index);
      if (value.length > 9) throw new MathInputError("unsupported", "Use integers with at most 9 digits.");
      tokens.push({ kind: "number", value });
    } else if (character === "x" || character === "y") {
      tokens.push({ kind: "variable", value: character }); index++;
    } else if ("+-*/()[]=".includes(character)) {
      tokens.push({ kind: "symbol", value: character }); index++;
    } else {
      throw new MathInputError("unsupported", "Use x or y, integers, +, -, *, / and brackets. Functions, powers and other symbols are not supported.");
    }
    if (tokens.length > MAX_TOKENS) throw new MathInputError("unsupported", "That equation has too many parts. Try a shorter step.");
  }
  return tokens;
}

class Parser {
  private position = 0;
  constructor(private readonly tokens: Token[]) {}
  private peek() { return this.tokens[this.position]; }
  private take() { return this.tokens[this.position++]; }

  expression(depth = 0): Expression {
    let node = this.term(depth);
    while (this.peek()?.value === "+" || this.peek()?.value === "-") {
      const operator = this.take()!.value as "+" | "-";
      node = { kind: "binary", operator, left: node, right: this.term(depth) };
    }
    return node;
  }

  private term(depth: number): Expression {
    let node = this.factor(depth);
    while (true) {
      const next = this.peek();
      const explicit = next?.value === "*" || next?.value === "/";
      const implicit = next?.kind === "variable" || next?.value === "(" || next?.value === "[";
      if (!explicit && !implicit) return node;
      const operator = explicit ? this.take()!.value as "*" | "/" : "*";
      node = { kind: "binary", operator, left: node, right: this.factor(depth) };
    }
  }

  private factor(depth: number): Expression {
    if (depth > MAX_DEPTH) throw new MathInputError("unsupported", "There are too many nested brackets or signs.");
    const token = this.take();
    if (!token) throw new MathInputError("invalid", "A term is missing. Check both sides of the equation.");
    if (token.kind === "number") return { kind: "number", value: BigInt(token.value) };
    if (token.kind === "variable") return { kind: "variable", name: token.value as Variable };
    if (token.value === "+") return this.factor(depth + 1);
    if (token.value === "-") return { kind: "negative", inner: this.factor(depth + 1) };
    if (token.value === "(" || token.value === "[") {
      const inner = this.expression(depth + 1);
      if (this.take()?.value !== (token.value === "(" ? ")" : "]")) {
        throw new MathInputError("invalid", "Check that each bracket has a matching closing bracket.");
      }
      return { kind: "group", inner };
    }
    throw new MathInputError("invalid", "A term is missing or a symbol is out of place.");
  }

  equation(): Equation {
    const left = this.expression();
    if (this.take()?.value !== "=") throw new MathInputError("invalid", "Use exactly one equals sign with an expression on each side.");
    const right = this.expression();
    if (this.peek()) throw new MathInputError("invalid", "A symbol is out of place. Use exactly one equation.");
    const variables = new Set(this.tokens.filter(token => token.kind === "variable").map(token => token.value));
    if (variables.size > 1) throw new MathInputError("unsupported", "Use only one variable: x or y, not both.");
    return { left, right, variable: (variables.values().next().value as Variable | undefined) ?? null };
  }
}

export function parseEquation(input: string): Equation {
  return new Parser(tokenize(input)).equation();
}

export function fingerprint(node: Expression): string {
  switch (node.kind) {
    case "number": return String(node.value);
    case "variable": return node.name;
    case "group": return fingerprint(node.inner);
    case "negative": return `neg(${fingerprint(node.inner)})`;
    case "binary": return `${node.operator}(${fingerprint(node.left)},${fingerprint(node.right)})`;
  }
}

export function unwrap(node: Expression): Expression {
  return node.kind === "group" ? unwrap(node.inner) : node;
}
