import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

async function getDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch account totals
  const { data: accounts } = await supabase
    .from("accounts")
    .select("current_balance, projected_balance, type, is_active")
    .eq("is_active", true);

  const totalBalance =
    accounts?.reduce((sum, a) => sum + Number(a.current_balance), 0) ?? 0;
  const totalProjected =
    accounts?.reduce((sum, a) => sum + Number(a.projected_balance), 0) ?? 0;

  // Count active accounts
  const activeAccounts = accounts?.length ?? 0;

  return {
    totalBalance,
    totalProjected,
    activeAccounts,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const cards = [
    {
      title: "Saldo Atual",
      value: formatCurrency(data?.totalBalance ?? 0),
      description: "Transações pagas",
      color: "text-foreground",
    },
    {
      title: "Saldo Previsto",
      value: formatCurrency(data?.totalProjected ?? 0),
      description: "Incluindo pendentes",
      color: "text-muted-foreground",
    },
    {
      title: "Contas Ativas",
      value: String(data?.activeAccounts ?? 0),
      description: "Contas bancárias e carteiras",
      color: "text-foreground",
    },
    {
      title: "Fase Atual",
      value: "Fase 0",
      description: "Setup inicial concluído",
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral das suas finanças
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {card.title}
            </p>
            <p className={`mt-2 text-2xl font-bold ${card.color}`}>
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Próximos Passos</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Fase 0: Setup inicial - Concluído
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            Fase 1: Auth + Segurança (MFA, biometria)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted" />
            Fase 1.5: Schema Contábil (partida dobrada)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted" />
            Fase 2: Módulo Financeiro (CRUD transações)
          </li>
        </ul>
      </div>
    </div>
  );
}
