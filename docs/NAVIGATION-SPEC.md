# ONIEFY - Estrutura de Navegação v3

## Decisão Final (04/04/2026 — Sessão 42)

```
Desktop sidebar:
[Início]
[Finanças]      Transações, Fluxo de caixa, Recorrências
[Patrimônio]    Contas, Cartões, Bens
[Planejamento]  Orçamento, Metas, Impostos / IRPF
[Inteligência]  Diagnóstico, Calculadoras, Indicadores
───────────────
[Configurações]

Mobile bottom tabs:
[Início] [Finanças] [Patrimônio] [Planejamento] [Inteligência]
Header: [Logo]                    [⚙️ Settings] [🔔 Sininho]
```

---

## Modelo mental

A navegação segue o ciclo financeiro natural do usuário:

**Registrar** (Finanças) → **Posicionar** (Patrimônio) → **Planejar** (Planejamento) → **Analisar** (Inteligência) → retroalimenta ações

---

## Sidebar desktop (4 seções + Settings)

### Seção 1: Finanças
Registro operacional diário.
- Transações (extrato consolidado, filtros, CRUD)
- Fluxo de caixa (Sankey, comparativo anual, granularidade dia/mês/ano)
- Recorrências (assinaturas, parcelas, receitas recorrentes)

### Seção 2: Patrimônio
Posição patrimonial.
- Contas (bancárias, investimento, empréstimos)
- Cartões (limite, fatura, vencimento)
- Bens (imóveis, veículos, eletrônicos + link para garantias)

### Seção 3: Planejamento
Futuro financeiro.
- Orçamento (planejado vs. real por categoria)
- Metas (savings goals com progresso visual)
- Impostos / IRPF (consolidação fiscal, tabelas, provisionamento)

### Seção 4: Inteligência
CFA pessoal. Seção diferenciadora do produto.
- Diagnóstico (11 métricas, Motor JARVIS, scanner R01-R10)
- Calculadoras (8 simuladores: affordability, SAC vs Price, CET, etc.)
- Indicadores (CDI, Selic, IPCA, IGP-M, câmbio)

### Settings (bottom, fixo)
Itens de baixa frequência. Acessível no mobile via ícone no header.
- Pessoal: Perfil (nome, senha, CPF, moeda), Notificações
- Cadastros: Categorias, Divisões (centros de custo), Estrutura familiar, Garantias
- Dados: Importação (CSV/OFX + bulk + conciliação), Tarefas (workflows), Dados e privacidade
- Avançado: Estrutura contábil (plano de contas), Métricas
- Segurança: MFA, sessões, exclusão de conta

---

## Bottom tab bar mobile (5 tabs)

| Tab | Label | Ícone | matchPrefixes |
|-----|-------|-------|---------------|
| 1 | Início | Home | — |
| 2 | Finanças | ArrowLeftRight | /cash-flow, /bills |
| 3 | Patrimônio | Building | /cards, /assets |
| 4 | Planejamento | PieChart | /goals, /tax |
| 5 | Inteligência | Activity | /calculators, /indices |

Settings acessível via ícone de engrenagem no header mobile (ao lado do sininho).

---

## Sininho (topo direito)

Persistente em todas as telas. Não é tab.
- Badge numérico (vermelho): ações pendentes (duplicatas, parcelas, tarefas)
- Ponto vermelho (sem número): informativos (alertas de vencimento, insights)
- Toque abre overlay/modal
- "Inbox zero": sininho sem badge quando tudo resolvido

---

## Decisões e justificativas

| # | Decisão | Motivo |
|---|---------|--------|
| 1 | 4 seções sidebar (não 5) | "Mais" como gaveta violava discoverability. 4 seções com nomes semânticos > 5 com lixeira. |
| 2 | Tab 5 = Inteligência (não Mais) | Seção diferenciadora do produto. Diagnóstico e Calculadoras são drivers de retenção. |
| 3 | Impostos em Planejamento | Planejamento fiscal é planejamento financeiro. Melhor que enterrar em "Mais". |
| 4 | Cartões em Patrimônio (não Finanças) | Cartão é instrumento (tem saldo, limite). Transações do cartão aparecem em Transações. |
| 5 | Settings absorve baixa frequência | Categorias, Importação, Família: configura uma vez, revisita raramente. |
| 6 | /more eliminada | Com sidebar semântico, hub intermediário é redundante. Redirect → /settings. |
| 7 | Cada página = 1 caminho | Eliminada duplicação (antes: mesma página aparecia em sidebar + /more + settings). |
| 8 | Progressive disclosure em forms | Campos avançados (depreciação, moeda, juros, reajuste) colapsados por default. |
| 9 | Na época do IRPF, Onie promove atalho no Início | Contexto temporal complementa a posição fixa em Planejamento. |

---

## Histórico

| Versão | Data | Mudanças |
|--------|------|----------|
| v1 | 23/03/2026 | 4 tabs + hamburger (descartada) |
| v2 | 02/04/2026 | 5 tabs (Início, Movimentações, Patrimônio, Orçamento, Mais) + Sininho |
| v3 | 04/04/2026 | 4 seções semânticas + Inteligência como tab 5. /more eliminada. Progressive disclosure. |
