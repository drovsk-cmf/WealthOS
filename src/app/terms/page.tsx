import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Oniefy - Termos de Uso",
  description: "Termos de Uso do Oniefy",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Termos de Uso
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Última atualização: 19 de março de 2026
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:space-y-1">

        <p>
          Estes Termos de Uso (&quot;Termos&quot;) regem o acesso e a utilização do
          aplicativo Oniefy (&quot;Serviço&quot;, &quot;aplicativo&quot; ou &quot;nós&quot;),
          operado por WealthOS Tecnologia S/A, CNPJ 00.000.000/0001-00 (&quot;Operador&quot;). Ao criar uma conta ou
          utilizar o Serviço, você (&quot;Usuário&quot;) declara que leu, compreendeu e
          concorda integralmente com estes Termos e com
          a <Link href="/privacy" className="underline">Política de Privacidade</Link>.
        </p>

        <h2>1. Descrição do Serviço</h2>
        <p>
          O Oniefy é uma plataforma de gestão financeira e patrimonial para uso pessoal e
          familiar. O Serviço permite registrar transações, gerenciar contas e orçamentos,
          acompanhar patrimônio e obter projeções fiscais. O Oniefy opera como ferramenta
          organizacional e informativa.
        </p>

        <h2>2. Capacidade e elegibilidade</h2>
        <p>
          Para utilizar o Serviço, você deve ter pelo menos 18 anos de idade ou ser
          emancipado nos termos da legislação brasileira. Ao criar uma conta, você declara
          possuir capacidade civil plena para contratar.
        </p>

        <h2>3. Conta do Usuário</h2>

        <h3>3.1 Cadastro</h3>
        <p>
          O cadastro exige nome, endereço de e-mail válido e autenticação via provedor
          externo (Google) ou credenciais próprias com autenticação multifator (MFA/TOTP).
          Você é responsável pela veracidade das informações fornecidas.
        </p>

        <h3>3.2 Segurança da conta</h3>
        <p>
          Você é responsável por manter a confidencialidade das suas credenciais de acesso,
          incluindo senha e dispositivo de MFA. Qualquer atividade realizada sob suas
          credenciais será considerada de sua responsabilidade. Em caso de acesso não
          autorizado, notifique-nos imediatamente pelo e-mail indicado na seção 14.
        </p>

        <h3>3.3 Uma conta por pessoa</h3>
        <p>
          Cada pessoa física deve manter uma única conta. A criação de múltiplas contas para
          a mesma pessoa poderá resultar em suspensão ou encerramento.
        </p>

        <h2>4. Uso permitido</h2>
        <p>O Serviço destina-se exclusivamente a:</p>
        <ul>
          <li>Gestão financeira pessoal e familiar do Usuário</li>
          <li>Registro de transações, contas, ativos e obrigações reais do Usuário</li>
          <li>Consulta de indicadores econômicos públicos e projeções tributárias</li>
        </ul>

        <h2>5. Uso proibido</h2>
        <p>É expressamente vedado:</p>
        <ul>
          <li>Utilizar o Serviço para fins comerciais, institucionais ou em nome de terceiros sem autorização</li>
          <li>Tentar acessar dados de outros usuários ou contornar mecanismos de segurança</li>
          <li>Fazer engenharia reversa, descompilar ou copiar o código-fonte do aplicativo</li>
          <li>Utilizar o Serviço para atividades ilícitas, lavagem de dinheiro ou evasão fiscal</li>
          <li>Importar dados fabricados ou fraudulentos com o objetivo de gerar relatórios enganosos</li>
          <li>Sobrecarregar intencionalmente a infraestrutura do Serviço (ataques DoS, scraping abusivo)</li>
        </ul>

        <h2>6. Dados e conteúdo do Usuário</h2>

        <h3>6.1 Propriedade</h3>
        <p>
          Todos os dados financeiros, documentos e informações inseridos por você no Serviço
          permanecem de sua propriedade. O Oniefy não reivindica nenhum direito de propriedade
          sobre o conteúdo do Usuário.
        </p>

        <h3>6.2 Licença de uso</h3>
        <p>
          Ao inserir dados no Serviço, você concede ao Oniefy uma licença limitada, não
          exclusiva e revogável para armazenar, processar e exibir esses dados exclusivamente
          com a finalidade de fornecer as funcionalidades contratadas. Essa licença se extingue
          automaticamente com a exclusão da sua conta.
        </p>

        <h3>6.3 Portabilidade e exportação</h3>
        <p>
          Você pode exportar seus dados a qualquer momento em formato estruturado (JSON ou CSV)
          por meio de Configurações &gt; Dados e Privacidade. Para detalhes sobre tratamento
          de dados pessoais, consulte
          a <Link href="/privacy" className="underline">Política de Privacidade</Link>.
        </p>

        <h2>7. Isenção de responsabilidade financeira e fiscal</h2>

        <h3>7.1 Não é consultoria</h3>
        <p>
          O Oniefy é uma ferramenta de organização. O Serviço NÃO constitui e NÃO substitui
          consultoria financeira, contábil, tributária ou jurídica profissional. Nenhum dado,
          relatório, projeção ou indicador apresentado pelo Serviço deve ser interpretado como
          recomendação de investimento, planejamento tributário ou orientação patrimonial.
        </p>

        <h3>7.2 Projeções fiscais</h3>
        <p>
          As projeções de IRPF, INSS e demais cálculos tributários apresentados pelo Serviço
          são estimativas baseadas nos dados inseridos pelo Usuário e nos parâmetros vigentes
          publicados pelo governo federal. Essas projeções possuem caráter meramente informativo.
          O Oniefy não garante a exatidão, completude ou adequação dos cálculos para fins de
          declaração ou recolhimento de tributos. A responsabilidade pela apuração e pagamento
          de tributos é exclusivamente do Usuário.
        </p>

        <h3>7.3 Precisão dos dados</h3>
        <p>
          A qualidade dos relatórios e projeções depende diretamente da precisão e completude
          dos dados inseridos pelo Usuário. O Oniefy não verifica, audita ou valida as
          informações financeiras fornecidas.
        </p>

        <h3>7.4 Índices econômicos</h3>
        <p>
          Os índices econômicos exibidos (IPCA, Selic, CDI, cotações de moedas) são obtidos
          de fontes públicas oficiais (Banco Central do Brasil, IBGE) e de terceiros
          (Frankfurter/ECB, CoinGecko). O Oniefy não garante a disponibilidade, pontualidade
          ou precisão dessas fontes externas.
        </p>

        <h2>8. Não é instituição financeira</h2>
        <p>
          O Oniefy NÃO é banco, corretora, distribuidora, administradora de fundos,
          instituição de pagamento ou qualquer outra entidade regulada pelo Banco Central do
          Brasil, pela Comissão de Valores Mobiliários (CVM) ou pela Superintendência de
          Seguros Privados (SUSEP). O Serviço não realiza operações financeiras, não custodia
          ativos, não intermedia transações e não tem acesso a contas bancárias do Usuário.
        </p>

        <h2>9. Propriedade intelectual</h2>
        <p>
          O código-fonte, design, marca, logotipo e demais elementos do Oniefy são de
          propriedade exclusiva do Operador, protegidos pela legislação brasileira de
          propriedade intelectual (Lei 9.610/1998 e Lei 9.279/1996). A utilização do Serviço
          não transfere ao Usuário nenhum direito sobre esses elementos além da licença de
          uso pessoal prevista nestes Termos.
        </p>

        <h2>10. Disponibilidade e modificações do Serviço</h2>

        <h3>10.1 Disponibilidade</h3>
        <p>
          O Oniefy se empenha em manter o Serviço disponível de forma contínua, mas não garante
          disponibilidade ininterrupta. Interrupções podem ocorrer por manutenção programada,
          atualizações, falhas de infraestrutura ou eventos fora do nosso controle.
        </p>

        <h3>10.2 Modificações</h3>
        <p>
          Reservamo-nos o direito de modificar, suspender ou descontinuar funcionalidades do
          Serviço a qualquer momento. Mudanças relevantes serão comunicadas com antecedência
          razoável por meio do aplicativo ou e-mail. O Usuário poderá exportar seus dados e
          encerrar a conta caso discorde das alterações.
        </p>

        <h2>11. Limitação de responsabilidade</h2>
        <p>
          Na extensão máxima permitida pela legislação aplicável:
        </p>
        <ul>
          <li>
            O Oniefy não se responsabiliza por perdas financeiras, danos diretos, indiretos,
            incidentais ou consequentes decorrentes do uso ou impossibilidade de uso do Serviço.
          </li>
          <li>
            O Oniefy não se responsabiliza por decisões financeiras, fiscais ou patrimoniais
            tomadas pelo Usuário com base em dados, relatórios ou projeções do Serviço.
          </li>
          <li>
            O Oniefy não se responsabiliza por perdas causadas por acesso não autorizado à
            conta do Usuário decorrente de negligência na guarda de credenciais.
          </li>
          <li>
            A responsabilidade total do Oniefy, por qualquer causa, está limitada ao valor
            pago pelo Usuário nos 12 meses anteriores ao evento, ou R$ 100,00, o que for maior.
          </li>
        </ul>

        <h2>12. Encerramento e exclusão</h2>

        <h3>12.1 Pelo Usuário</h3>
        <p>
          Você pode encerrar sua conta a qualquer momento em Configurações &gt; Segurança &gt;
          Excluir conta. A exclusão segue período de carência de 7 dias, durante o qual é
          possível cancelar. Após a carência, todos os dados são removidos permanentemente
          conforme descrito na Política de Privacidade.
        </p>

        <h3>12.2 Pelo Oniefy</h3>
        <p>
          Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos,
          com notificação prévia de 15 dias quando possível. Em casos de violação grave
          (segurança, fraude, atividade ilícita), a suspensão poderá ser imediata. O Usuário
          terá acesso para exportar seus dados durante o período de notificação.
        </p>

        <h2>13. Legislação aplicável e foro</h2>
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil, incluindo
          a Lei Geral de Proteção de Dados (Lei 13.709/2018), o Código de Defesa do Consumidor
          (Lei 8.078/1990) e o Marco Civil da Internet (Lei 12.965/2014). Fica eleito o foro
          da comarca de Goiânia, Estado de Goiás, para dirimir quaisquer controvérsias, com
          renúncia expressa a qualquer outro, por mais privilegiado que seja.
        </p>

        <h2>14. Alterações nestes Termos</h2>
        <p>
          Podemos atualizar estes Termos periodicamente. Mudanças substanciais serão
          comunicadas com pelo menos 15 dias de antecedência por meio do aplicativo ou e-mail.
          O uso continuado do Serviço após a entrada em vigor das alterações constitui
          aceitação dos novos Termos. Caso discorde, você poderá exportar seus dados e
          encerrar a conta antes da data de vigência.
        </p>

        <h2>15. Disposições gerais</h2>
        <ul>
          <li>
            <strong>Integralidade:</strong> estes Termos, junto com
            a <Link href="/privacy" className="underline">Política de Privacidade</Link>,
            constituem o acordo integral entre o Usuário e o Oniefy.
          </li>
          <li>
            <strong>Independência das cláusulas:</strong> se qualquer disposição for considerada
            inválida ou inexequível, as demais permanecerão em vigor.
          </li>
          <li>
            <strong>Tolerância:</strong> a não exigência do cumprimento de qualquer dispositivo
            destes Termos não constitui renúncia ao direito de exigi-lo no futuro.
          </li>
          <li>
            <strong>Cessão:</strong> o Usuário não pode ceder ou transferir sua conta ou
            direitos sob estes Termos sem consentimento prévio e por escrito do Operador.
          </li>
        </ul>

        <h2>16. Contato</h2>
        <p>
          Para dúvidas sobre estes Termos ou sobre o Serviço:
        </p>
        <p>
          <strong>E-mail:</strong> contato@oniefy.com
        </p>

        <div className="mt-12 flex items-center justify-center gap-4 rounded-lg border bg-card p-4">
          <Link
            href="/privacy"
            className="text-sm font-medium text-primary hover:underline"
          >
            Política de Privacidade
          </Link>
          <span className="text-muted-foreground">|</span>
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voltar ao Oniefy
          </Link>
        </div>
      </div>
    </div>
  );
}
