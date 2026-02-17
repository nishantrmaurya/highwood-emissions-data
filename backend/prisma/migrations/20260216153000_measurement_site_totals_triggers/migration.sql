-- Canonical conversion to kilograms for site-level aggregate storage.
CREATE OR REPLACE FUNCTION measurement_to_kg(
  p_value NUMERIC,
  p_unit emission_unit,
  p_site_id INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE p_unit
    WHEN 'kg' THEN
      RETURN p_value;
    WHEN 'tonne' THEN
      RETURN p_value * 1000;
    WHEN 'scf' THEN
      RETURN p_value * 0.0192::NUMERIC;
    WHEN 'ppm' THEN
      RETURN p_value * 0.000001::NUMERIC;
    ELSE
      RAISE EXCEPTION 'Unsupported emission unit % for site_id %', p_unit, p_site_id;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION trg_measurement_after_insert_sync_site_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  WITH aggregated AS (
    SELECT
      nr.site_id,
      SUM(measurement_to_kg(nr.emission_value, nr.unit, nr.site_id)) AS delta_kg,
      MAX(nr.measured_at) AS max_measured_at
    FROM new_rows nr
    GROUP BY nr.site_id
  )
  UPDATE site s
  SET
    total_emissions_to_date = s.total_emissions_to_date + a.delta_kg,
    current_compliance_status = CASE
      WHEN (s.total_emissions_to_date + a.delta_kg) > s.emission_limit THEN 'limit_exceeded'::compliance_status
      ELSE 'within_limit'::compliance_status
    END,
    last_measurement_at = CASE
      WHEN s.last_measurement_at IS NULL THEN a.max_measured_at
      ELSE GREATEST(s.last_measurement_at, a.max_measured_at)
    END
  FROM aggregated a
  WHERE s.id = a.site_id;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION trg_measurement_after_delete_sync_site_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  WITH affected_sites AS (
    SELECT DISTINCT site_id
    FROM old_rows
  ),
  deleted_agg AS (
    SELECT
      site_id,
      SUM(measurement_to_kg(emission_value, unit, site_id)) AS delta_kg
    FROM old_rows
    GROUP BY site_id
  ),
  latest_measurement AS (
    SELECT
      a.site_id,
      MAX(m.measured_at) AS max_measured_at
    FROM affected_sites a
    LEFT JOIN measurement m ON m.site_id = a.site_id
    GROUP BY a.site_id
  )
  UPDATE site s
  SET
    total_emissions_to_date = s.total_emissions_to_date - COALESCE(d.delta_kg, 0),
    current_compliance_status = CASE
      WHEN (s.total_emissions_to_date - COALESCE(d.delta_kg, 0)) > s.emission_limit THEN 'limit_exceeded'::compliance_status
      ELSE 'within_limit'::compliance_status
    END,
    last_measurement_at = lm.max_measured_at
  FROM affected_sites a
  LEFT JOIN deleted_agg d ON d.site_id = a.site_id
  LEFT JOIN latest_measurement lm ON lm.site_id = a.site_id
  WHERE s.id = a.site_id;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION trg_measurement_after_update_sync_site_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  WITH old_agg AS (
    SELECT
      site_id,
      SUM(measurement_to_kg(emission_value, unit, site_id)) AS delta_kg
    FROM old_rows
    GROUP BY site_id
  ),
  new_agg AS (
    SELECT
      site_id,
      SUM(measurement_to_kg(emission_value, unit, site_id)) AS delta_kg
    FROM new_rows
    GROUP BY site_id
  ),
  affected_sites AS (
    SELECT site_id FROM old_agg
    UNION
    SELECT site_id FROM new_agg
  ),
  latest_measurement AS (
    SELECT
      a.site_id,
      MAX(m.measured_at) AS max_measured_at
    FROM affected_sites a
    LEFT JOIN measurement m ON m.site_id = a.site_id
    GROUP BY a.site_id
  )
  UPDATE site s
  SET
    total_emissions_to_date = s.total_emissions_to_date + COALESCE(n.delta_kg, 0) - COALESCE(o.delta_kg, 0),
    current_compliance_status = CASE
      WHEN (s.total_emissions_to_date + COALESCE(n.delta_kg, 0) - COALESCE(o.delta_kg, 0)) > s.emission_limit THEN 'limit_exceeded'::compliance_status
      ELSE 'within_limit'::compliance_status
    END,
    last_measurement_at = lm.max_measured_at
  FROM affected_sites a
  LEFT JOIN old_agg o ON o.site_id = a.site_id
  LEFT JOIN new_agg n ON n.site_id = a.site_id
  LEFT JOIN latest_measurement lm ON lm.site_id = a.site_id
  WHERE s.id = a.site_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS measurement_after_insert_site_totals ON measurement;
CREATE TRIGGER measurement_after_insert_site_totals
AFTER INSERT ON measurement
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION trg_measurement_after_insert_sync_site_totals();

DROP TRIGGER IF EXISTS measurement_after_delete_site_totals ON measurement;
CREATE TRIGGER measurement_after_delete_site_totals
AFTER DELETE ON measurement
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT
EXECUTE FUNCTION trg_measurement_after_delete_sync_site_totals();

DROP TRIGGER IF EXISTS measurement_after_update_site_totals ON measurement;
CREATE TRIGGER measurement_after_update_site_totals
AFTER UPDATE ON measurement
REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION trg_measurement_after_update_sync_site_totals();

-- Backfill totals and last measurement timestamp for existing data.
WITH unit_conversion_factors AS (
  SELECT *
  FROM (
    VALUES
      ('kg'::emission_unit, 1::NUMERIC),
      ('tonne'::emission_unit, 1000::NUMERIC),
      ('scf'::emission_unit, 0.0192::NUMERIC),
      ('ppm'::emission_unit, 0.000001::NUMERIC)
  ) AS v(unit, factor_to_kg)
),
site_aggregates AS (
  SELECT
    s.id AS site_id,
    ROUND(
      COALESCE(
        SUM(
          CASE
            WHEN m.id IS NULL THEN 0
            ELSE m.emission_value * u.factor_to_kg
          END
        ),
        0
      ),
      6
    ) AS total_kg,
    MAX(m.measured_at) AS max_measured_at
  FROM site s
  LEFT JOIN measurement m ON m.site_id = s.id
  LEFT JOIN unit_conversion_factors u ON u.unit = m.unit
  GROUP BY s.id
)
UPDATE site s
SET
  total_emissions_to_date = sa.total_kg,
  current_compliance_status = CASE
    WHEN sa.total_kg > s.emission_limit THEN 'limit_exceeded'::compliance_status
    ELSE 'within_limit'::compliance_status
  END,
  last_measurement_at = sa.max_measured_at
FROM site_aggregates sa
WHERE s.id = sa.site_id;

CREATE INDEX IF NOT EXISTS measurement_site_id_measured_at_desc_idx
ON measurement (site_id, measured_at DESC);

-- Monitoring helper: rows returned here indicate aggregate drift.
CREATE OR REPLACE FUNCTION site_emission_total_drift(
  threshold NUMERIC DEFAULT 0.000001
)
RETURNS TABLE (
  site_id INTEGER,
  stored_total_kg NUMERIC,
  computed_total_kg NUMERIC,
  delta_kg NUMERIC
)
LANGUAGE sql
STABLE
AS $$
WITH unit_conversion_factors AS (
  SELECT *
  FROM (
    VALUES
      ('kg'::emission_unit, 1::NUMERIC),
      ('tonne'::emission_unit, 1000::NUMERIC),
      ('scf'::emission_unit, 0.0192::NUMERIC),
      ('ppm'::emission_unit, 0.000001::NUMERIC)
  ) AS v(unit, factor_to_kg)
),
computed AS (
  SELECT
    s.id AS site_id,
    ROUND(
      COALESCE(
        SUM(
          CASE
            WHEN m.id IS NULL THEN 0
            ELSE m.emission_value * u.factor_to_kg
          END
        ),
        0
      ),
      6
    ) AS computed_total_kg
  FROM site s
  LEFT JOIN measurement m ON m.site_id = s.id
  LEFT JOIN unit_conversion_factors u ON u.unit = m.unit
  GROUP BY s.id
)
SELECT
  s.id AS site_id,
  s.total_emissions_to_date AS stored_total_kg,
  c.computed_total_kg,
  ROUND(c.computed_total_kg - s.total_emissions_to_date, 6) AS delta_kg
FROM site s
JOIN computed c ON c.site_id = s.id
WHERE ABS(c.computed_total_kg - s.total_emissions_to_date) > threshold
ORDER BY ABS(c.computed_total_kg - s.total_emissions_to_date) DESC;
$$;
