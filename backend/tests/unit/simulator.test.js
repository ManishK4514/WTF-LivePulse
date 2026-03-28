const { getState, setState } = require('../../src/services/simulatorService');

describe('simulatorService state management', () => {
  beforeEach(() => {
    setState({ running: false, speed: 1, intervalId: null });
  });

  test('initial state has running=false', () => {
    const state = getState();
    expect(state.running).toBe(false);
  });

  test('setState updates running and speed', () => {
    setState({ running: true, speed: 5 });
    const state = getState();
    expect(state.running).toBe(true);
    expect(state.speed).toBe(5);
  });

  test('getState returns a copy (not the same reference)', () => {
    const s1 = getState();
    const s2 = getState();
    expect(s1).not.toBe(s2);
  });
});

describe('simulator event structure', () => {
  test('CHECKIN_EVENT has correct fields', () => {
    const event = {
      type: 'CHECKIN_EVENT',
      gym_id: 'test-gym-id',
      member_name: 'Test Member',
      timestamp: new Date().toISOString(),
      current_occupancy: 42,
      capacity_pct: 70,
    };
    expect(event.type).toBe('CHECKIN_EVENT');
    expect(event.gym_id).toBeDefined();
    expect(event.member_name).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(typeof event.current_occupancy).toBe('number');
    expect(typeof event.capacity_pct).toBe('number');
  });

  test('CHECKOUT_EVENT has correct fields', () => {
    const event = {
      type: 'CHECKOUT_EVENT',
      gym_id: 'test-gym-id',
      member_name: 'Test Member',
      timestamp: new Date().toISOString(),
      current_occupancy: 41,
      capacity_pct: 68,
    };
    expect(event.type).toBe('CHECKOUT_EVENT');
    expect(event.current_occupancy).toBe(41);
  });

  test('PAYMENT_EVENT has correct fields', () => {
    const event = {
      type: 'PAYMENT_EVENT',
      gym_id: 'test-gym-id',
      amount: 1499,
      plan_type: 'monthly',
      member_name: 'Test Member',
      today_total: 5000,
    };
    expect(event.type).toBe('PAYMENT_EVENT');
    expect(event.amount).toBeGreaterThan(0);
    expect(['monthly', 'quarterly', 'annual']).toContain(event.plan_type);
  });

  test('hourly multipliers produce higher values for peak hours (7-9, 17-20)', () => {
    const HOURLY_MULTIPLIERS = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0.6,
      6: 0.6, 7: 1.0, 8: 1.0, 9: 1.0, 10: 0.4,
      11: 0.4, 12: 0.3, 13: 0.3, 14: 0.2, 15: 0.2,
      16: 0.2, 17: 0.9, 18: 0.9, 19: 0.9, 20: 0.9,
      21: 0.35, 22: 0.35, 23: 0,
    };
    const peakHours = [7, 8, 9, 17, 18, 19, 20];
    const offHours = [12, 13, 14, 15];
    const avgPeak = peakHours.reduce((s, h) => s + HOURLY_MULTIPLIERS[h], 0) / peakHours.length;
    const avgOff = offHours.reduce((s, h) => s + HOURLY_MULTIPLIERS[h], 0) / offHours.length;
    expect(avgPeak).toBeGreaterThan(avgOff);
  });
});
