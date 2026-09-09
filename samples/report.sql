-- Monthly totals per customer, completed shipments only.
CREATE TABLE IF NOT EXISTS shipment_totals (
    customer_id  uuid        NOT NULL,
    month        date        NOT NULL,
    total_cents  bigint      NOT NULL DEFAULT 0,
    line_count   integer     NOT NULL,
    PRIMARY KEY (customer_id, month)
);

INSERT INTO shipment_totals (customer_id, month, total_cents, line_count)
SELECT
    s.customer_id,
    date_trunc('month', s.service_date)::date        AS month,
    SUM(l.quantity * l.rate_cents)                    AS total_cents,
    COUNT(*)                                          AS line_count
FROM shipments AS s
JOIN lines     AS l ON l.shipment_id = s.id
WHERE s.status = 'completed'
  AND s.service_date >= CURRENT_DATE - INTERVAL '12 months'
  AND s.currency IN ('USD', 'CAD')
GROUP BY s.customer_id, date_trunc('month', s.service_date)
HAVING SUM(l.quantity) > 0
ON CONFLICT (customer_id, month) DO UPDATE
    SET total_cents = EXCLUDED.total_cents,
        line_count  = EXCLUDED.line_count;

/* Sanity check: nothing should be negative. */
SELECT COUNT(*) FILTER (WHERE total_cents < 0) AS negatives, MAX(month) AS latest
FROM shipment_totals;
