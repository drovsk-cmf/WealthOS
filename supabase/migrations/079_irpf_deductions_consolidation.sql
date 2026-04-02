-- Migration 079: E29 — Consolidação saúde + educação IRPF
-- Applied via execute_sql (Session 38)

-- 1. Populate dirpf_group on COA entries
UPDATE public.chart_of_accounts SET dirpf_group = 'saude' 
WHERE internal_code LIKE '5.06.%' AND tax_treatment = 'dedutivel_integral';

UPDATE public.chart_of_accounts SET dirpf_group = 'educacao' 
WHERE internal_code LIKE '5.09.%' AND tax_treatment = 'dedutivel_limitado';

-- 2. RPC to consolidate IRPF deductions by group and family member
CREATE OR REPLACE FUNCTION public.get_irpf_deductions(
  p_user_id uuid,
  p_year integer DEFAULT extract(year FROM current_date)::integer
)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  WITH deductible_txns AS (
    SELECT 
      coa.dirpf_group,
      t.family_member_id,
      COALESCE(fm.name, 'Titular') as member_name,
      ABS(t.amount) as abs_amount
    FROM public.transactions t
    JOIN public.accounts a ON a.id = t.account_id AND a.user_id = p_user_id
    JOIN public.chart_of_accounts coa ON coa.id = a.coa_id
    LEFT JOIN public.family_members fm ON fm.id = t.family_member_id
    WHERE t.user_id = p_user_id
      AND t.amount < 0
      AND extract(year FROM t.date) = p_year
      AND coa.dirpf_group IN ('saude', 'educacao')
  ),
  by_group_member AS (
    SELECT dirpf_group, member_name, SUM(abs_amount) as total
    FROM deductible_txns
    GROUP BY dirpf_group, member_name
  ),
  by_group AS (
    SELECT dirpf_group, SUM(total) as grand_total,
      jsonb_object_agg(member_name, total) as members
    FROM by_group_member
    GROUP BY dirpf_group
  )
  SELECT jsonb_build_object(
    'year', p_year,
    'health', COALESCE(
      (SELECT jsonb_build_object('total', grand_total, 'limit', null, 'by_member', members) 
       FROM by_group WHERE dirpf_group = 'saude'),
      '{"total": 0, "limit": null, "by_member": {}}'::jsonb
    ),
    'education', COALESCE(
      (SELECT jsonb_build_object('total', grand_total, 'limit', 3561.50, 'by_member', members)
       FROM by_group WHERE dirpf_group = 'educacao'),
      '{"total": 0, "limit": 3561.50, "by_member": {}}'::jsonb
    )
  );
$$;
