-- members indexes
CREATE INDEX idx_members_gym_id ON members (gym_id);
CREATE INDEX idx_members_churn_risk ON members (last_checkin_at) WHERE status = 'active';

-- checkins indexes
CREATE INDEX idx_checkins_time_brin ON checkins USING BRIN (checked_in);
CREATE INDEX idx_checkins_live_occupancy ON checkins (gym_id, checked_out) WHERE checked_out IS NULL;
CREATE INDEX idx_checkins_member ON checkins (member_id, checked_in DESC);

-- payments indexes
CREATE INDEX idx_payments_gym_date ON payments (gym_id, paid_at DESC);
CREATE INDEX idx_payments_date ON payments (paid_at DESC);

-- anomalies index
CREATE INDEX idx_anomalies_active ON anomalies (gym_id, detected_at DESC) WHERE resolved = FALSE;

-- materialized view for peak hours heatmap
CREATE MATERIALIZED VIEW gym_hourly_stats AS
SELECT
  gym_id,
  EXTRACT(DOW FROM checked_in)::INTEGER AS day_of_week,
  EXTRACT(HOUR FROM checked_in)::INTEGER AS hour_of_day,
  COUNT(*) AS checkin_count
FROM checkins
WHERE checked_in >= NOW() - INTERVAL '7 days'
GROUP BY gym_id, day_of_week, hour_of_day;

CREATE UNIQUE INDEX ON gym_hourly_stats (gym_id, day_of_week, hour_of_day);
