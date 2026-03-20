import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oniefy - Política de Privacidade",
  description: "Política de Privacidade do Oniefy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Política de Privacidade
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Última atualização: 15 de março de 2026
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:space-y-1">

        <p>
          O Oniefy (&quot;nós&quot;, &quot;nosso&quot; ou &quot;aplicativo&quot;) respeita sua
          privacidade e se compromete a proteger seus dados pessoais. Esta política explica como
          coletamos, usamos, armazenamos e protegemos suas informações, em conformidade com a
          Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018) e as diretrizes da Apple App Store.
        </p>

        <h2>1. Dados que coletamos</h2>

        <h3>1.1 Dados fornecidos por você</h3>
        <ul>
          <li>Nome e endereço de e-mail (cadastro)</li>
          <li>Dados financeiros inseridos manualmente: contas, transações, orçamentos, patrimônio</li>
          <li>Dados importados via arquivos (CSV, OFX, XLSX)</li>
          <li>Documentos e comprovantes enviados ao aplicativo</li>
          <li>Preferências de configuração (moeda, categorias, divisões)</li>
        </ul>

        <h3>1.2 Dados coletados automaticamente</h3>
        <ul>
          <li>Dados de autenticação (tokens de sessão, MFA)</li>
          <li>Metadados de uso (páginas visitadas, horário de acesso)</li>
          <li>Informações do dispositivo (tipo de navegador, sistema operacional)</li>
        </ul>

        <h3>1.3 Dados que NÃO coletamos</h3>
        <ul>
          <li>Não acessamos suas contas bancárias diretamente</li>
          <li>Não coletamos dados de localização</li>
          <li>Não coletamos dados de contatos ou agenda</li>
          <li>Não fazemos tracking publicitário</li>
        </ul>

        <h2>2. Como usamos seus dados</h2>
        <ul>
          <li>Fornecer e manter as funcionalidades do aplicativo</li>
          <li>Gerar relatórios, gráficos e análises financeiras pessoais</li>
          <li>Enviar notificações relacionadas às suas finanças (vencimentos, alertas)</li>
          <li>Proteger a segurança da sua conta (autenticação, detecção de anomalias)</li>
          <li>Melhorar o produto com base em dados agregados e anonimizados de uso</li>
        </ul>

        <h2>3. Base legal (LGPD)</h2>
        <p>
          O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais
          previstas na LGPD:
        </p>
        <ul>
          <li>
            <strong>Consentimento</strong> (Art. 7, I): ao criar sua conta, você consente com o
            tratamento dos dados descritos nesta política.
          </li>
          <li>
            <strong>Execução de contrato</strong> (Art. 7, V): o tratamento é necessário para
            fornecer os serviços contratados.
          </li>
          <li>
            <strong>Legítimo interesse</strong> (Art. 7, IX): para melhorias do produto com dados
            anonimizados.
          </li>
        </ul>

        <h2>4. Armazenamento e segurança</h2>
        <ul>
          <li>
            Seus dados são armazenados em infraestrutura Supabase (PostgreSQL) com criptografia
            em trânsito (TLS 1.3) e em repouso (AES-256).
          </li>
          <li>
            Dados sensíveis selecionados possuem criptografia ponta a ponta (E2E) com chave
            derivada exclusiva por usuário.
          </li>
          <li>
            Autenticação multifator (MFA/TOTP) é obrigatória para todas as contas.
          </li>
          <li>
            Políticas de Row Level Security (RLS) garantem que cada usuário acessa apenas seus
            próprios dados.
          </li>
        </ul>

        <h2>5. Compartilhamento de dados</h2>
        <p>
          Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins
          comerciais ou publicitários.
        </p>
        <p>Seus dados podem ser compartilhados apenas nos seguintes casos:</p>
        <ul>
          <li>Com provedores de infraestrutura (Supabase, Vercel) para operação do serviço</li>
          <li>Quando exigido por lei ou ordem judicial</li>
          <li>Com seu consentimento explícito</li>
        </ul>

        <h2>6. Retenção de dados</h2>
        <ul>
          <li>Dados financeiros: mantidos enquanto sua conta estiver ativa</li>
          <li>Dados de conta excluída: removidos em até 7 dias após exclusão</li>
          <li>Transações excluídas (soft-delete): removidas após 90 dias</li>
          <li>Logs de notificação: removidos após 90 dias</li>
        </ul>

        <h2>7. Seus direitos (LGPD)</h2>
        <p>Você tem direito a:</p>
        <ul>
          <li>
            <strong>Acesso:</strong> consultar quais dados pessoais tratamos sobre você
          </li>
          <li>
            <strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados
          </li>
          <li>
            <strong>Eliminação:</strong> solicitar a exclusão dos seus dados pessoais
          </li>
          <li>
            <strong>Portabilidade:</strong> exportar seus dados em formato estruturado (JSON ou CSV)
            via Configurações &gt; Dados e Privacidade
          </li>
          <li>
            <strong>Revogação:</strong> revogar consentimento a qualquer momento
          </li>
          <li>
            <strong>Oposição:</strong> opor-se a tratamento baseado em legítimo interesse
          </li>
        </ul>
        <p>
          Para exercer qualquer desses direitos, utilize a função de exportação e exclusão de conta
          disponível diretamente no aplicativo (Configurações &gt; Segurança), ou entre em contato
          pelo e-mail abaixo.
        </p>

        <h2>8. Exclusão de conta e dados</h2>
        <p>
          Você pode solicitar a exclusão completa da sua conta e dados a qualquer momento pelo
          aplicativo (Configurações &gt; Segurança &gt; Excluir conta). A exclusão segue um
          período de carência de 7 dias, durante o qual é possível reverter a decisão. Após
          esse período, todos os dados são removidos permanentemente, incluindo a revogação de
          tokens de autenticação de provedores sociais (Google, Apple).
        </p>

        <h2>9. Cookies e tecnologias similares</h2>
        <p>
          O Oniefy utiliza apenas cookies essenciais para autenticação e manutenção de sessão.
          Não utilizamos cookies de rastreamento, analytics de terceiros ou pixels de publicidade.
        </p>

        <h2>10. Alterações nesta política</h2>
        <p>
          Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças relevantes
          por meio do aplicativo. Recomendamos revisar esta página regularmente.
        </p>

        <h2>11. Contato</h2>
        <p>
          Para dúvidas, solicitações ou exercício de direitos previstos na LGPD, entre em contato:
        </p>
        <p>
          <strong>E-mail:</strong> privacidade@oniefy.com
        </p>

        <div className="mt-12 flex items-center justify-center gap-4 rounded-lg border bg-card p-4">
          <a
            href="/terms"
            className="text-sm font-medium text-primary hover:underline"
          >
            Termos de Uso
          </a>
          <span className="text-muted-foreground">|</span>
          <a
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voltar ao Oniefy
          </a>
        </div>
      </div>
    </div>
  );
}
