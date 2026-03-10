-- ============================================
-- WealthOS - Migration 007: Workflow RPCs
-- ============================================
-- Phase 6: WKF-01 to WKF-04
-- ============================================

-- ─── 1. auto_create_workflow_for_account ─────────────────────
-- WKF-01: Called after account creation. Creates appropriate
-- workflow based on account type.

CREATE OR REPLACE FUNCTION auto_create_workflow_for_account(
  p_user_id UUID,
  p_account_id UUID,
  p_account_type TEXT,
  p_account_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wf_type workflow_type;
  v_wf_name TEXT;
  v_wf_id UUID;
  v_tasks_template JSONB;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Determine workflow type from account type
  CASE p_account_type
    WHEN 'checking', 'savings' THEN
      v_wf_type := 'bank_statement';
      v_wf_name := 'Extrato ' || p_account_name;
      v_tasks_template := '[
        {"task_type": "upload_document", "description": "Upload do extrato bancário"},
        {"task_type": "categorize_transactions", "description": "Conferir categorização dos lançamentos"}
      ]'::JSONB;
    WHEN 'credit_card' THEN
      v_wf_type := 'card_statement';
      v_wf_name := 'Fatura ' || p_account_name;
      v_tasks_template := '[
        {"task_type": "upload_document", "description": "Upload da fatura do cartão"},
        {"task_type": "categorize_transactions", "description": "Conferir categorização dos lançamentos"}
      ]'::JSONB;
    WHEN 'investment' THEN
      v_wf_type := 'investment_update';
      v_wf_name := 'Atualização ' || p_account_name;
      v_tasks_template := '[
        {"task_type": "update_balance", "description": "Atualizar saldo/posição do investimento"}
      ]'::JSONB;
    ELSE
      -- No workflow for cash/other types
      RETURN json_build_object('status', 'skipped', 'reason', 'Tipo de conta não requer workflow');
  END CASE;

  -- Check if workflow already exists for this account
  IF EXISTS (
    SELECT 1 FROM workflows
    WHERE user_id = p_user_id AND related_account_id = p_account_id AND is_active = true
  ) THEN
    RETURN json_build_object('status', 'exists', 'reason', 'Workflow já existe para esta conta');
  END IF;

  -- Create workflow
  INSERT INTO workflows (user_id, name, workflow_type, periodicity, related_account_id, day_of_period)
  VALUES (p_user_id, v_wf_name, v_wf_type, 'monthly', p_account_id, 1)
  RETURNING id INTO v_wf_id;

  RETURN json_build_object(
    'status', 'created',
    'workflow_id', v_wf_id,
    'workflow_type', v_wf_type,
    'name', v_wf_name,
    'tasks_template', v_tasks_template
  );
END;
$$;

GRANT EXECUTE ON FUNCTION auto_create_workflow_for_account(UUID, UUID, TEXT, TEXT) TO authenticated;


-- ─── 2. generate_tasks_for_period ────────────────────────────
-- WKF-01/WKF-02: Generate tasks for all active workflows
-- for a given period (month). Idempotent: skips if tasks
-- already exist for the period.

CREATE OR REPLACE FUNCTION generate_tasks_for_period(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  p_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_wf RECORD;
  v_task_def JSONB;
  v_created INT := 0;
  v_skipped INT := 0;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_period_start := make_date(p_year, p_month, 1);
  v_period_end := (v_period_start + interval '1 month')::DATE;

  FOR v_wf IN
    SELECT * FROM workflows
    WHERE user_id = p_user_id AND is_active = true
  LOOP
    -- Skip if tasks already exist for this workflow+period
    IF EXISTS (
      SELECT 1 FROM workflow_tasks
      WHERE workflow_id = v_wf.id
        AND period_start = v_period_start
        AND period_end = v_period_end
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Generate tasks based on workflow type
    CASE v_wf.workflow_type
      WHEN 'bank_statement', 'card_statement' THEN
        INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
        VALUES
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'upload_document',
           'Upload do extrato/fatura: ' || v_wf.name),
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'categorize_transactions',
           'Conferir categorização: ' || v_wf.name);
        v_created := v_created + 2;

      WHEN 'loan_payment' THEN
        INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
        VALUES
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'update_balance',
           'Atualizar saldo do financiamento: ' || v_wf.name);
        v_created := v_created + 1;

      WHEN 'investment_update' THEN
        INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
        VALUES
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'update_balance',
           'Atualizar posição: ' || v_wf.name);
        v_created := v_created + 1;

      WHEN 'fiscal_review' THEN
        INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
        VALUES
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'review_fiscal',
           'Revisão fiscal: ' || v_wf.name);
        v_created := v_created + 1;
    END CASE;
  END LOOP;

  RETURN json_build_object(
    'status', 'ok',
    'period', v_period_start,
    'tasks_created', v_created,
    'workflows_skipped', v_skipped
  );
END;
$$;

GRANT EXECUTE ON FUNCTION generate_tasks_for_period(UUID, INT, INT) TO authenticated;


-- ─── 3. complete_workflow_task ────────────────────────────────
-- WKF-02/WKF-03/WKF-04: Mark a task as completed with optional result data.

CREATE OR REPLACE FUNCTION complete_workflow_task(
  p_user_id UUID,
  p_task_id UUID,
  p_status TEXT DEFAULT 'completed',
  p_result_data JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_all_done BOOLEAN;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_task
  FROM workflow_tasks
  WHERE id = p_task_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarefa não encontrada';
  END IF;

  -- Update task
  UPDATE workflow_tasks
  SET
    status = p_status::task_status,
    completed_at = CASE WHEN p_status IN ('completed', 'skipped') THEN now() ELSE NULL END,
    result_data = COALESCE(p_result_data, result_data)
  WHERE id = p_task_id;

  -- Check if all tasks for this workflow+period are done
  SELECT NOT EXISTS (
    SELECT 1 FROM workflow_tasks
    WHERE workflow_id = v_task.workflow_id
      AND period_start = v_task.period_start
      AND period_end = v_task.period_end
      AND status NOT IN ('completed', 'skipped')
  ) INTO v_all_done;

  -- If all done, update workflow last_completed_at
  IF v_all_done THEN
    UPDATE workflows
    SET last_completed_at = now(), updated_at = now()
    WHERE id = v_task.workflow_id;
  END IF;

  RETURN json_build_object(
    'status', 'ok',
    'task_id', p_task_id,
    'new_status', p_status,
    'all_period_tasks_done', v_all_done
  );
END;
$$;

GRANT EXECUTE ON FUNCTION complete_workflow_task(UUID, UUID, TEXT, JSONB) TO authenticated;
