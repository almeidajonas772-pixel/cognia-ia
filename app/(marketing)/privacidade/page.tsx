import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/nav";
import { POLICY_VERSION } from "@/lib/privacy/versions";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a COGNI IA coleta, usa, compartilha e protege os seus dados pessoais, conforme a LGPD.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <article className="prose prose-cogni">
        <h1>Política de Privacidade</h1>
        <p>
          <em>Versão {POLICY_VERSION}.</em> Esta política descreve como a{" "}
          {SITE.name} trata dados pessoais, em conformidade com a Lei nº
          13.709/2018 (LGPD).
        </p>

        <h2>1. Dados que coletamos</h2>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail e credenciais de acesso
            (senha nunca é armazenada em texto puro; a autenticação é feita pelo
            Supabase Auth).
          </li>
          <li>
            <strong>Uso da plataforma:</strong> progresso de estudo, conversas
            com a IA, redações enviadas, itens favoritados, histórico de
            atividade.
          </li>
          <li>
            <strong>Pagamento:</strong> quando você assina o Premium, o
            processamento é feito pelo Mercado Pago; recebemos apenas o status da
            transação e um identificador — <strong>não</strong> armazenamos
            número de cartão.
          </li>
          <li>
            <strong>Técnicos:</strong> páginas visitadas e tipo de dispositivo
            (agregado, sem cookies de terceiros por padrão). O endereço IP é
            usado apenas de forma efêmera para segurança e é guardado somente
            como <em>hash</em> irreversível.
          </li>
        </ul>

        <h2>2. Para que usamos</h2>
        <ul>
          <li>Prestar e personalizar o serviço de estudos.</li>
          <li>Processar assinaturas e prevenir fraudes/abuso.</li>
          <li>
            Medir uso de forma agregada para melhorar a plataforma (análise só
            com o seu consentimento).
          </li>
          <li>Cumprir obrigações legais e responder solicitações de titulares.</li>
        </ul>

        <h2>3. Base legal</h2>
        <p>
          Execução de contrato (art. 7º, V), consentimento (art. 7º, I — cookies
          de análise e marketing), legítimo interesse (segurança e prevenção a
          fraude) e cumprimento de obrigação legal.
        </p>

        <h2>4. Compartilhamento</h2>
        <p>
          Compartilhamos dados apenas com operadores necessários ao
          funcionamento: provedor de banco/autenticação (Supabase), processador
          de pagamento (Mercado Pago), provedores de IA (OpenAI e Google, para
          gerar respostas e transcrever imagens) e, se você consentir, Google
          Analytics. Não vendemos dados pessoais.
        </p>

        <h2>5. Seus direitos (art. 18)</h2>
        <p>
          Você pode acessar, corrigir, portar e excluir seus dados, além de
          revogar consentimentos. Na área logada, use{" "}
          <Link href="/perfil/privacidade">Perfil → Privacidade e dados</Link>{" "}
          para exportar todos os seus dados em JSON ou solicitar a exclusão da
          conta (com carência de 30 dias). Também é possível escrever para o
          nosso encarregado (DPO) pelo e-mail{" "}
          <a href="mailto:privacidade@cogniai.com.br">privacidade@cogniai.com.br</a>.
        </p>

        <h2>6. Retenção</h2>
        <p>
          Mantemos os dados enquanto a conta existir. Após a exclusão, os dados
          são apagados; registros mínimos podem ser retidos quando exigido por
          lei (ex.: obrigações fiscais de pagamentos). Telemetria e logs de
          análise são descartados automaticamente após 90 dias.
        </p>

        <h2>7. Segurança</h2>
        <p>
          Tráfego cifrado (TLS), armazenamento com controle de acesso por linha
          (RLS), verificação em duas etapas opcional, limitação de requisições e
          trilha de auditoria de eventos sensíveis.
        </p>

        <h2>8. Menores</h2>
        <p>
          A plataforma é destinada a estudantes de ensino médio e pré-vestibular.
          Para menores de 18 anos, o uso deve contar com autorização dos
          responsáveis.
        </p>

        <h2>9. Alterações</h2>
        <p>
          Podemos atualizar esta política; a versão vigente é indicada no topo.
          Mudanças relevantes serão comunicadas na plataforma.
        </p>

        <p>
          <Link href="/termos">Termos de Uso</Link>
        </p>
      </article>
    </div>
  );
}
