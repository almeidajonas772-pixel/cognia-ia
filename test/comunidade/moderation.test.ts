import { describe, it, expect, beforeEach } from "vitest";
import { moderateContent } from "@/lib/comunidade/moderation";

// Sem OPENAI_API_KEY o provedor é o mock (live=false) → moderação = heurística pura.
beforeEach(() => {
  process.env.OPENAI_API_KEY = "";
});

describe("comunidade.moderateContent (heurística offline)", () => {
  it("aprova texto normal de estudo", async () => {
    const r = await moderateContent(
      "Alguém pode explicar a diferença entre ligação iônica e covalente? Não entendi a aula."
    );
    expect(r.status).toBe("aprovado");
    expect(r.reason).toBeNull();
  });

  it("bloqueia linguagem ofensiva", async () => {
    const r = await moderateContent("você é um idiota e não sabe nada");
    expect(r.status).toBe("bloqueado");
    expect(r.reason).toBeTruthy();
  });

  it("encaminha spam/propaganda para revisão", async () => {
    const r = await moderateContent("GANHE DINHEIRO fácil, clique aqui e faça renda extra hoje");
    expect(r.status).toBe("revisao");
  });

  it("encaminha para revisão quando há muitos links", async () => {
    const r = await moderateContent(
      "veja https://a.com https://b.com https://c.com https://d.com"
    );
    expect(r.status).toBe("revisao");
    expect(r.reason).toMatch(/links/i);
  });

  it("encaminha para revisão texto quase todo em maiúsculas", async () => {
    const r = await moderateContent(
      "ESSA PROVA FOI ABSURDAMENTE DIFICIL E EU NAO CONSEGUI TERMINAR NADA MESMO"
    );
    expect(r.status).toBe("revisao");
  });

  it("bloqueio da heurística não é revertido", async () => {
    const r = await moderateContent("that is spam mas também: imbecil");
    expect(r.status).toBe("bloqueado");
  });
});
