# Domínio 7 — UX e Usabilidade

**Referência normativa:** 10 Heurísticas de Nielsen + ISO 9241-110 (7 Princípios de Diálogo)
**Data da auditoria:** 2026-03-16
**Arquivos analisados:** 48

---

## Achados

### [ALTO] D7.01 — Campo de valor monetário na transação não aceita formato brasileiro (vírgula)
**Arquivo:** `src/components/transactions/transaction-form.tsx` L193-203, L120
**Heurística:** Nielsen #5 — Prevenção de Erros
**Descrição:** O campo de valor da transação usa `type="number"` com `step="0.01"`, que em navegadores com locale pt-BR pode rejeitar vírgula como separador decimal ou produzir resultados inesperados. O `parseFloat(amount)` na L120 não faz `.replace(",", ".")` como fazem corretamente o `BudgetForm` (L74), `AssetForm` (L80-82) e `RecurrenceForm` (L97). Há inconsistência entre formulários: uns aceitam vírgula, outros não.
**Impacto:** Usuário digita "1500,50" no campo de transação e o valor é parseado como `1500` (truncando centavos) ou `NaN`, causando erro ou lançamento com valor errado.
**Correção:** Uniformizar todos os campos monetários para `type="text"` com `inputMode="decimal"` (como já feito em BudgetForm e AssetForm) e aplicar `.replace(",", ".")` antes do `parseFloat`.

---

### [ALTO] D7.02 — Ausência de feedback de sucesso após operações destrutivas e de criação
**Arquivo:** `src/components/transactions/transaction-form.tsx` L163, `src/components/accounts/account-form.tsx` L81, `src/components/budgets/budget-form.tsx` L107, `src/components/assets/asset-form.tsx` L111
**Heurística:** Nielsen #1 — Visibilidade do Status do Sistema
**Descrição:** Todas as operações de criação (transação, conta, orçamento, patrimônio) e as operações destrutivas (estornar transação, desativar conta, excluir orçamento, excluir patrimônio) fecham o diálogo ou resetam o estado imediatamente após sucesso, sem exibir uma mensagem de confirmação (toast/banner). O único feedback visual é o desaparecimento do formulário e a atualização silenciosa da lista.
**Impacto:** Usuário não tem certeza se a operação foi concluída com sucesso, especialmente em conexões lentas onde o mutation pode levar mais tempo. Em estorno de transação, o único feedback é o aparecimento de um badge "Estornado" que pode passar despercebido.
**Correção:** Implementar um sistema de toast notifications (ex: Sonner ou similar) com mensagens como "Transação criada com sucesso", "Conta desativada", etc. O `ImportStepResult` já faz isso bem — padronizar para os demais fluxos.

---

### [ALTO] D7.03 — Transações não podem ser editadas, apenas estornadas
**Arquivo:** `src/app/(app)/transactions/page.tsx` L321-351
**Heurística:** Nielsen #3 — Controle e Liberdade do Usuário
**Descrição:** A lista de transações oferece apenas a ação de "Estornar" (reversão contábil). Não existe botão ou fluxo para editar uma transação existente (corrigir valor, alterar categoria, mudar data, adicionar descrição). O `TransactionForm` recebe apenas `open` e `onClose`, sem prop para dados de edição. Estornar e relançar é um caminho excessivamente penoso para corrigir um simples erro de digitação.
**Impacto:** Para corrigir um lançamento errado (ex: valor com centavos trocados, categoria errada), o usuário precisa estornar a transação e criar uma nova do zero, perdendo o histórico de categorização e notas.
**Correção:** Adicionar fluxo de edição no `TransactionForm` (prop `editData` como já existe em AccountForm, BudgetForm, AssetForm) para campos editáveis (descrição, categoria, data, notas, membro). Valor e tipo podem exigir estorno se afetar saldos.

---

### [MÉDIO] D7.04 — Rótulos de moeda fixos em "R$" apesar do suporte a USD/EUR
**Arquivo:** `src/components/transactions/transaction-form.tsx` L191, `src/components/accounts/account-form.tsx` L179, `src/components/budgets/budget-form.tsx` L157, `src/components/assets/asset-form.tsx` L152-159, `src/components/recurrences/recurrence-form.tsx` L208
**Heurística:** Nielsen #2 — Correspondência entre Sistema e Mundo Real
**Descrição:** O onboarding permite selecionar USD ou EUR como moeda padrão (`src/app/(auth)/onboarding/page.tsx` L54-58), mas todos os labels de campo monetário estão fixos como "Valor (R$)", "Saldo inicial (R$)", "Valor orçado (R$)", etc. A função `formatCurrency` em `src/lib/utils/index.ts` L18-23 também está fixa em BRL.
**Impacto:** Usuário que selecionou USD ou EUR vê "R$" nos labels e nos valores formatados, gerando confusão sobre a moeda do lançamento.
**Correção:** Tornar os labels de moeda dinâmicos com base na preferência do usuário (ex: ler `default_currency` do perfil). Ajustar `formatCurrency` para aceitar o código de moeda como parâmetro.

---

### [MÉDIO] D7.05 — Sem busca ou filtro nas páginas de contas, patrimônio, categorias e contas a pagar
**Arquivo:** `src/app/(app)/accounts/page.tsx` L75-243, `src/app/(app)/assets/page.tsx` L136-330, `src/app/(app)/categories/page.tsx` L59-199, `src/app/(app)/bills/page.tsx` L121-331
**Heurística:** Nielsen #6 — Reconhecimento em vez de Lembrança
**Descrição:** A página de transações possui busca por texto e filtros (tipo, conta, data). Porém, as páginas de contas, patrimônio, categorias e contas a pagar não oferecem nenhum mecanismo de busca ou filtro. À medida que o número de registros cresce, localizar um item específico exige scroll manual.
**Impacto:** Usuário com 10+ contas, 20+ bens patrimoniais ou muitas categorias precisa percorrer a lista inteira para encontrar um item, o que reduz a eficiência.
**Correção:** Adicionar pelo menos um campo de busca por texto nas listas com potencial de crescimento (contas, patrimônio, contas a pagar).

---

### [MÉDIO] D7.06 — Diálogo de cópia de orçamento não fecha com ESC e não usa focus trap
**Arquivo:** `src/app/(app)/budgets/page.tsx` L455-492
**Heurística:** Nielsen #3 — Controle e Liberdade do Usuário
**Descrição:** O diálogo de confirmação de cópia de orçamento (`confirmCopy`) é um modal customizado que não utiliza o hook `useEscapeClose` disponível em `src/lib/hooks/use-dialog-helpers.ts`. O backdrop fecha ao clicar, mas a tecla ESC não funciona. Outros modais no app (conexões, plano de contas) usam `useEscapeClose`. Adicionalmente, nenhum dos modais customizados da aplicação implementa focus trap (armadilha de foco), permitindo que Tab navegue para elementos atrás do modal.
**Impacto:** Inconsistência de interação — o usuário que está habituado a fechar diálogos com ESC encontra comportamento diferente neste modal específico. A falta de focus trap afeta acessibilidade e pode confundir usuários de teclado.
**Correção:** Adicionar `useEscapeClose(confirmCopy, () => { setConfirmCopy(false); setCopyError(""); })`. Implementar focus trap em todos os modais customizados (ou migrar para componente Dialog reutilizável).

---

### [MÉDIO] D7.07 — Sem possibilidade de duplicar transação ou criar recorrência a partir de transação existente
**Arquivo:** `src/app/(app)/transactions/page.tsx` L248-376, `src/components/recurrences/recurrence-form.tsx` L39-301
**Heurística:** Nielsen #7 — Flexibilidade e Eficiência de Uso
**Descrição:** A lista de transações não oferece ação de "Duplicar" para criar uma nova transação baseada em uma existente (pré-preenchendo formulário). Também não existe caminho para transformar uma transação avulsa em recorrência — recorrências só podem ser criadas do zero via `bills/page.tsx`.
**Impacto:** Usuários avançados com muitas transações similares (ex: lançamentos mensais que não são exatamente recorrentes) precisam digitar todos os campos repetidamente. Para profissionais de alta renda com múltiplas fontes de renda e despesas fixas, essa repetição é significativa.
**Correção:** Adicionar ação "Duplicar" na lista de transações que abre o `TransactionForm` pré-preenchido. Adicionar ação "Criar recorrência" que popula o `RecurrenceForm` com dados da transação.

---

### [MÉDIO] D7.08 — Mensagens de erro do Supabase podem aparecer em inglês
**Arquivo:** `src/app/(auth)/forgot-password/page.tsx` L26-27, `src/app/(auth)/register/page.tsx` L79-80, `src/app/(auth)/onboarding/page.tsx` L122-123
**Heurística:** Nielsen #9 — Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar de Erros
**Descrição:** Erros do Supabase Auth são exibidos diretamente via `error.message` sem tradução. Por exemplo, em `forgot-password/page.tsx` L26, `resetError.message` é exibido cru. O Supabase retorna mensagens como "Invalid email", "User already registered", "Password should be at least 6 characters" em inglês. O login server-side (`/api/auth/login`) já trata isso com mensagens customizadas, mas os fluxos de registro, redefinição de senha e onboarding expõem as mensagens originais.
**Impacto:** Usuário brasileiro vê mensagens de erro em inglês, quebrando a experiência linguística do app.
**Correção:** Criar um mapeamento de erros conhecidos do Supabase para mensagens em português (similar ao `TIMEOUT_MESSAGES` em `login/page.tsx` L12-15). Aplicar em todos os fluxos de autenticação.

---

### [MÉDIO] D7.09 — Página de política de privacidade referenciada mas inexistente
**Arquivo:** `src/app/(auth)/register/page.tsx` L196-198
**Heurística:** Nielsen #10 — Ajuda e Documentação
**Descrição:** A página de registro contém o link `<Link href="/privacy">Política de Privacidade</Link>`, mas não existe uma rota `/privacy` no diretório `src/app/`. O link resultaria em 404. Este é um requisito da App Store (guideline 5.1.1) para apps que coletam dados financeiros.
**Impacto:** Usuário clica no link e encontra página inexistente, reduzindo a confiança no produto. Para publicação na App Store, a ausência pode resultar em rejeição da review.
**Correção:** Criar a página `/privacy` com a política de privacidade. Enquanto não estiver pronta, redirecionar para URL externa ou exibir conteúdo inline.

---

### [MÉDIO] D7.10 — Sem tooltip ou ajuda contextual para funcionalidades complexas
**Arquivo:** `src/components/connections/reconciliation-panel.tsx` L89-289, `src/app/(app)/chart-of-accounts/page.tsx` L140-350, `src/app/(app)/tax/page.tsx` L44-383
**Heurística:** Nielsen #10 — Ajuda e Documentação
**Descrição:** Funcionalidades avançadas como Conciliação Bancária, Plano de Contas e Fiscal/IRPF não possuem tooltips ou textos de ajuda contextual que expliquem o conceito ao usuário. O Plano de Contas tem um box informativo no final ("Como funciona"), mas a conciliação não explica o que é "conciliar" nem orienta o fluxo (selecionar uma pendente + uma importada). A página fiscal tem termos como "tax_treatment", "dedutivel_integral" que são labels técnicos.
**Impacto:** Profissionais de alta renda (público-alvo) que não são contadores podem não entender os conceitos de conciliação ou classificação fiscal sem orientação, aumentando o abandono dessas funcionalidades.
**Correção:** Adicionar cards informativos no topo das telas complexas (padrão do box "Como funciona" usado no Plano de Contas e Centros de Custo). Para a conciliação, adicionar texto instrucional acima das colunas.

---

### [MÉDIO] D7.11 — Indicador de última sincronização ausente no layout principal
**Arquivo:** `src/app/(app)/layout.tsx` L90-244
**Heurística:** Nielsen #1 — Visibilidade do Status do Sistema
**Descrição:** O layout exibe banner offline quando não há conexão (L232-239), mas quando online não exibe nenhum indicador de quando os dados foram sincronizados pela última vez. O campo `last_sync_at` existe nas conexões bancárias, mas não há timestamp global de última sincronização/fetch de dados visível ao usuário.
**Impacto:** Usuário não sabe se está vendo dados atualizados ou em cache. Em cenário pós-offline, não há indicação de que os dados já foram resincronizados.
**Correção:** Adicionar indicador sutil na sidebar ou header mostrando "Atualizado há X min" baseado no timestamp do último fetch bem-sucedido.

---

### [BAIXO] D7.12 — Botões de ação primária com padrão visual inconsistente entre formulários
**Arquivo:** `src/components/transactions/transaction-form.tsx` L428-438, `src/components/budgets/budget-form.tsx` L218-233, `src/components/assets/asset-form.tsx` L203-211
**Heurística:** Nielsen #4 — Consistência e Padrões
**Descrição:** O botão de salvar transação muda de cor conforme o tipo (terracotta para despesa, verdant para receita, info-slate para transferência — L429-434), enquanto todos os demais formulários usam `bg-primary` consistentemente. Além disso, o layout dos botões varia: TransactionForm usa `flex gap-2` com botões `flex-1`, BudgetForm e AssetForm usam `flex justify-end gap-3` com botões de largura auto.
**Impacto:** Inconsistência visual menor que pode gerar microconfusão sobre hierarquia de ações. A mudança de cor no botão de transação por tipo é um design deliberado (reforço semântico), mas o layout divergente dos botões é um descuido.
**Correção:** Unificar o layout dos botões de ação (ambos os padrões são válidos, mas escolher um e aplicar em todos). Manter a cor contextual do botão de transação como exceção documentada.

---

### [BAIXO] D7.13 — Placeholder do campo de valor sugere formato com vírgula mas input aceita ponto
**Arquivo:** `src/components/accounts/account-form.tsx` L189, `src/components/transactions/transaction-form.tsx` L202
**Heurística:** Nielsen #5 — Prevenção de Erros
**Descrição:** O campo de saldo inicial em `account-form.tsx` L189 exibe `placeholder="0,00"` mas usa `type="number"` com `step="0.01"`, que em browsers com locale en-US espera ponto como separador decimal. O mesmo ocorre no campo de valor da transação (`transaction-form.tsx` L202). O placeholder sugere vírgula, mas o campo pode rejeitar esse formato dependendo do locale do navegador.
**Impacto:** Confusão menor — o placeholder orienta o formato com vírgula, mas o campo pode não aceitar vírgula em todos os navegadores.
**Correção:** Alinhar placeholder e tipo de input: se `type="number"`, placeholder deveria ser "0.00". Melhor solução é migrar para `type="text"` + `inputMode="decimal"` com placeholder "0,00" (conforme D7.01).

---

### [BAIXO] D7.14 — Cópia de orçamento usa `setTimeout` para abrir diálogo, causando possível race condition
**Arquivo:** `src/app/(app)/budgets/page.tsx` L291-296
**Heurística:** Nielsen #5 — Prevenção de Erros
**Descrição:** O botão "Copiar para o próximo mês" navega para o mês seguinte e usa `setTimeout(() => setConfirmCopy(true), 100)` para abrir o diálogo de confirmação. Este delay de 100ms é uma tentativa de aguardar o re-render, mas não garante que o estado do mês foi atualizado. Se o render demorar mais que 100ms, o diálogo pode exibir o mês errado.
**Impacto:** Em dispositivos lentos, o diálogo pode abrir mostrando referência ao mês errado. Risco baixo mas existente.
**Correção:** Usar `useEffect` que observa a mudança de `currentMonth` para abrir o diálogo, eliminando o timeout arbitrário.

---

### [BAIXO] D7.15 — Confirmação de exclusão de categoria não alerta sobre impacto em transações existentes
**Arquivo:** `src/app/(app)/categories/page.tsx` L152-178
**Heurística:** Nielsen #5 — Prevenção de Erros
**Descrição:** A confirmação de exclusão de categoria usa o padrão inline (botão "Confirmar" / "Não") sem informar ao usuário quantas transações estão associadas a essa categoria ou qual será o impacto da exclusão. O mesmo padrão é usado para contas (`accounts/page.tsx` L202-216) e centros de custo (`cost-centers/page.tsx` L317-324).
**Impacto:** Usuário pode excluir uma categoria que está atribuída a dezenas de transações sem perceber que essas transações ficarão sem categorização.
**Correção:** Exibir contagem de transações associadas na mensagem de confirmação (ex: "Esta categoria está associada a 47 transações. Deseja excluir mesmo assim?").

---

### [BAIXO] D7.16 — Tela de Importação não mostra progresso durante parsing de arquivo grande
**Arquivo:** `src/components/connections/import-wizard.tsx` L34-87
**Heurística:** Nielsen #1 — Visibilidade do Status do Sistema
**Descrição:** O upload e parsing de arquivo CSV/OFX/XLSX (`handleFileUpload`) é feito sem indicador de loading visível. O `FileReader.onload` processa o arquivo e muda para o próximo step, mas entre o clique/drop e a transição de step não há spinner ou indicação de progresso. Para arquivos grandes (o limite é 10MB), o parsing pode levar alguns segundos.
**Impacto:** Usuário pode pensar que o upload falhou e clicar novamente ou abandonar o fluxo.
**Correção:** Adicionar estado `isParsing` exibido como spinner na zona de drop durante o processamento do arquivo.

---

## Resumo do domínio

| ID | Severidade | Achado | Esforço |
|---|---|---|---|
| D7.01 | ALTO | Campo de valor monetário na transação não aceita formato brasileiro | Baixo |
| D7.02 | ALTO | Ausência de feedback de sucesso após operações | Médio |
| D7.03 | ALTO | Transações não podem ser editadas, apenas estornadas | Alto |
| D7.04 | MÉDIO | Rótulos de moeda fixos em "R$" apesar do suporte a USD/EUR | Médio |
| D7.05 | MÉDIO | Sem busca ou filtro em contas, patrimônio, categorias, bills | Médio |
| D7.06 | MÉDIO | Diálogo de cópia de orçamento sem ESC close e sem focus trap | Baixo |
| D7.07 | MÉDIO | Sem duplicar transação ou criar recorrência a partir de transação | Médio |
| D7.08 | MÉDIO | Mensagens de erro do Supabase aparecem em inglês | Baixo |
| D7.09 | MÉDIO | Página de política de privacidade referenciada mas inexistente | Baixo |
| D7.10 | MÉDIO | Sem tooltip/ajuda contextual para funcionalidades complexas | Médio |
| D7.11 | MÉDIO | Indicador de última sincronização ausente no layout | Baixo |
| D7.12 | BAIXO | Botões de ação com layout inconsistente entre formulários | Baixo |
| D7.13 | BAIXO | Placeholder sugere vírgula mas input type=number pode rejeitar | Baixo |
| D7.14 | BAIXO | setTimeout para abrir diálogo de cópia de orçamento | Baixo |
| D7.15 | BAIXO | Exclusão de categoria não alerta sobre impacto em transações | Baixo |
| D7.16 | BAIXO | Importação sem indicador de progresso durante parsing | Baixo |

**Total:** 16 achados (0 críticos, 3 altos, 8 médios, 5 baixos)
