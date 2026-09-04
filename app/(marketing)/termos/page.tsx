import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/nav";
import { TERMS_VERSION } from "@/lib/privacy/versions";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Condições de uso da plataforma ${SITE.name}.`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <article className="prose prose-cogni">
        <h1>Termos de Uso</h1>
        <p>
          <em>Versão {TERMS_VERSION}.</em> Ao criar uma conta na {SITE.name} você
          concorda com estes termos.
        </p>

        <h2>1. O serviço</h2>
        <p>
          A {SITE.name} é uma plataforma de estudos com apoio de inteligência
          artificial para ENEM e vestibulares. Há um plano Gratuito com limites
          de uso e um plano Premium por assinatura (mensal ou anual).
        </p>

        <h2>2. Conteúdo gerado por IA</h2>
        <p>
          As respostas, resumos, questões e correções são geradas
          automaticamente e podem conter imprecisões. Não substituem o estudo
          pelo material oficial nem orientação de um professor. Confira sempre
          informações críticas.
        </p>

        <h2>3. Conta e uso aceitável</h2>
        <ul>
          <li>Você é responsável por manter suas credenciais em segurança.</li>
          <li>
            É proibido usar a plataforma para fraude acadêmica, automação
            abusiva, engenharia reversa, ou qualquer atividade ilícita.
          </li>
          <li>
            Conteúdo enviado à comunidade deve respeitar as regras de convivência;
            publicações impróprias podem ser moderadas ou removidas.
          </li>
        </ul>

        <h2>4. Assinatura e cancelamento</h2>
        <p>
          A cobrança é recorrente até o cancelamento, feito a qualquer momento em{" "}
          <Link href="/perfil/assinatura">Perfil → Assinatura</Link>. O acesso
          Premium permanece até o fim do período já pago. Reembolsos seguem o
          Código de Defesa do Consumidor.
        </p>

        <h2>5. Propriedade intelectual</h2>
        <p>
          O material didático autoral da plataforma é protegido. Você pode usá-lo
          para estudo pessoal, mas não redistribuí-lo comercialmente.
        </p>

        <h2>6. Encerramento</h2>
        <p>
          Você pode excluir sua conta em{" "}
          <Link href="/perfil/privacidade">Perfil → Privacidade e dados</Link>.
          Podemos suspender contas que violem estes termos.
        </p>

        <h2>7. Limitação de responsabilidade</h2>
        <p>
          O serviço é fornecido &quot;como está&quot;. Na máxima extensão
          permitida por lei, a {SITE.name} não se responsabiliza por resultados
          de provas ou por indisponibilidades temporárias.
        </p>

        <h2>8. Foro e contato</h2>
        <p>
          Aplica-se a legislação brasileira. Contato:{" "}
          <a href="mailto:suporte@cogniai.com.br">suporte@cogniai.com.br</a>.
        </p>

        <p>
          <Link href="/privacidade">Política de Privacidade</Link>
        </p>
      </article>
    </div>
  );
}
