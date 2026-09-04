import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheIncr,
  cached,
  bust,
  cacheBackend,
} from "@/lib/cache";

// Sem UPSTASH_* o back-end é a memória do processo.
describe("cache (back-end de memória)", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("usa o back-end de memória nos testes", () => {
    expect(cacheBackend).toBe("memory");
  });

  it("get/set/del básico", async () => {
    await cacheSet("k1", { a: 1 }, 60);
    expect(await cacheGet<{ a: number }>("k1")).toEqual({ a: 1 });
    await cacheDel("k1");
    expect(await cacheGet("k1")).toBeNull();
  });

  it("expira após o TTL", async () => {
    vi.useFakeTimers();
    await cacheSet("ttl", "v", 1);
    expect(await cacheGet("ttl")).toBe("v");
    vi.advanceTimersByTime(1500);
    expect(await cacheGet("ttl")).toBeNull();
  });

  it("cached() memoiza e só chama a origem uma vez", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const a = await cached("memo", 60, fn);
    const b = await cached("memo", 60, fn);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cached() deduplica chamadas concorrentes", async () => {
    let resolve: ((v: number) => void) | undefined;
    const fn = vi.fn().mockImplementation(
      () => new Promise<number>((r) => (resolve = r))
    );
    const p1 = cached("inflight", 60, fn);
    const p2 = cached("inflight", 60, fn);
    await vi.waitFor(() => expect(resolve).toBeTypeOf("function"));
    resolve!(7);
    expect(await p1).toBe(7);
    expect(await p2).toBe(7);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("bust(prefixo) remove só as chaves com o prefixo", async () => {
    await cacheSet("blog:list", 1, 60);
    await cacheSet("blog:post:x", 2, 60);
    await cacheSet("outro:coisa", 3, 60);
    await bust("blog:");
    expect(await cacheGet("blog:list")).toBeNull();
    expect(await cacheGet("blog:post:x")).toBeNull();
    expect(await cacheGet("outro:coisa")).toBe(3);
  });

  it("cacheIncr conta dentro da janela e reinicia após expirar", async () => {
    vi.useFakeTimers();
    expect(await cacheIncr("rl:x", 2)).toBe(1);
    expect(await cacheIncr("rl:x", 2)).toBe(2);
    expect(await cacheIncr("rl:x", 2)).toBe(3);
    vi.advanceTimersByTime(2500);
    expect(await cacheIncr("rl:x", 2)).toBe(1);
  });
});
