CREATE TABLE public.dashboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  source_updated_at text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dashboard_snapshots TO authenticated;
GRANT ALL ON public.dashboard_snapshots TO service_role;
ALTER TABLE public.dashboard_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view dashboard snapshots" ON public.dashboard_snapshots FOR SELECT TO authenticated USING (true);

CREATE TABLE public.stock_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_at timestamptz NOT NULL,
  source_date text,
  value_amount double precision NOT NULL,
  forecast_amount double precision NOT NULL,
  weight_tons double precision NOT NULL,
  balance_units double precision NOT NULL,
  item_count integer NOT NULL,
  reserved_tons double precision,
  reserved_amount double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (imported_at)
);
GRANT SELECT ON public.stock_history TO authenticated;
GRANT ALL ON public.stock_history TO service_role;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view stock history" ON public.stock_history FOR SELECT TO authenticated USING (true);

CREATE TABLE public.dashboard_settings (
  key text PRIMARY KEY,
  numeric_value double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dashboard_settings TO authenticated;
GRANT ALL ON public.dashboard_settings TO service_role;
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view dashboard settings" ON public.dashboard_settings FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_dashboard_snapshots_updated_at BEFORE UPDATE ON public.dashboard_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_history_updated_at BEFORE UPDATE ON public.stock_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dashboard_settings_updated_at BEFORE UPDATE ON public.dashboard_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_snapshots;
