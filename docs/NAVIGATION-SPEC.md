# ONIEFY - Estrutura de Navegação

## Decisão Final (02/04/2026)

```
[Início]  [Movimentações]  [Patrimônio]  [Orçamento]  [Mais]
                                                    + Sininho (topo direito)
```

---

## Tabs

### Tab 1: Início
Briefing diário da Onie.
- Saudação da Onie com orb animado
- Patrimônio líquido (número grande, variação MoM)
- Cash-flow resumido (receitas - despesas do mês)
- Cards de alerta (vencimentos, duplicatas, parcelas, reajustes)
- Atalho contextual: na época do IRPF (mar-mai), Onie promove acesso direto a Impostos

### Tab 2: Movimentações
Tudo que é fluxo de dinheiro.
- Extrato consolidado (todas as contas)
- Receitas e despesas
- Cartões de crédito e faturas
- Parcelas em andamento
- Dívidas bancárias e financiamentos (sub-seção: são movimentações recorrentes com saldo devedor)
- Filtros: por conta, categoria, período, membro da família

### Tab 3: Patrimônio
Tudo que o usuário possui.
- Bens físicos (imóveis, veículos) com custo de manutenção
- Investimentos consolidados (ações, renda fixa, cripto, previdência)
- Seguros e proteção
- Reserva de emergência
- Solvência: LCR, runway, D/E (cockpit de fôlego)
- Net worth histórico (gráfico)

### Tab 4: Orçamento
Tudo que é planejamento e futuro.
- Orçamento por categoria (planejado vs. real)
- Metas de economia (savings goals)
- Calendário financeiro (vencimentos, concentração)
- Projeções (receitas/despesas futuras, AI forecasting)
- Provisão sazonal
- Simulações (calculadoras TVM)

### Tab 5: Mais
Hub organizado (não lixão). Cada item com ícone e descrição.
- **Impostos / IRPF** (primeiro item, destaque visual)
- Diagnóstico financeiro (11 métricas)
- Calculadoras (7 tabs)
- Assinaturas e recorrências
- Relatórios e exportações
- Membros da família
- Importação (email, faturas, OFX)
- Categorias e regras
- Configurações e perfil
- Acesso ao contador (E35)

---

## Sininho (topo direito)

Persistente em todas as telas. Não é tab.

- Badge numérico (vermelho): ações pendentes (duplicatas para resolver, parcelas para confirmar)
- Ponto vermelho (sem número): informativos (alertas de vencimento, insights)
- Toque abre overlay/modal, não navega para outra página
- "Inbox zero": quando todas as pendências resolvidas, sininho sem badge

---

## Decisões

| # | Decisão | Motivo |
|---|---------|--------|
| 1 | 5 tabs, não 4 ou 6 | 5 é o limite ergonômico. Menos = muito aglomerado. Mais = confuso. |
| 2 | "Mais" em vez de "Perfil" | Perfil sugere configurações. "Mais" é hub funcional onde Impostos vive com destaque. |
| 3 | Impostos dentro de "Mais" como 1º item | Uso intenso 2 meses/ano (mar-mai). Nos outros 10, não justifica tab permanente. Frequência vence. |
| 4 | Sininho libera 1 posição de tab | Pendências saem da navegação principal. Atenção fica no topo. |
| 5 | Dívidas dentro de Movimentações | Dívida é movimentação recorrente com saldo. Não justifica tab própria. |
| 6 | Diagnóstico e Calculadoras dentro de "Mais" | Uso esporádico. Power users encontram; iniciantes não precisam no dia 1. |
| 7 | Na época do IRPF, Onie promove atalho direto no Início | Contexto temporal resolve o problema de Impostos não ter tab própria. |
