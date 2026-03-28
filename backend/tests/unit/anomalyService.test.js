jest.mock('../../src/db/pool', () => {
  const mockPool = { query: jest.fn() };
  return mockPool;
});

const pool = require('../../src/db/pool');
const svc = require('../../src/services/anomalyService');

function mockQuery(result) {
  pool.query.mockResolvedValueOnce({ rows: result });
}

describe('anomalyService — zero_checkins', () => {
  beforeEach(() => jest.clearAllMocks());

  test('fires when gym is active, within hours, and no check-ins in 2h', async () => {
    mockQuery([{ cnt: '0' }]);
    const result = await svc.checkZeroCheckins({ id: 'gym1' });
    expect(result).toBe(true);
  });

  test('does not fire when there are recent check-ins', async () => {
    mockQuery([{ cnt: '5' }]);
    const result = await svc.checkZeroCheckins({ id: 'gym1' });
    expect(result).toBe(false);
  });

  test('isWithinOperatingHours returns true when current time is within hours', () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const opens = `${String(Math.max(h - 2, 0)).padStart(2, '0')}:00`;
    const closes = `${String(Math.min(h + 2, 23)).padStart(2, '0')}:59`;
    const result = svc.isWithinOperatingHours({ opens_at: opens, closes_at: closes });
    expect(result).toBe(true);
  });

  test('isWithinOperatingHours returns false when outside operating hours', () => {
    const result = svc.isWithinOperatingHours({ opens_at: '00:00', closes_at: '00:01' });
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    if (mins > 1) {
      expect(result).toBe(false);
    } else {
      expect(result).toBe(true);
    }
  });
});

describe('anomalyService — capacity_breach', () => {
  beforeEach(() => jest.clearAllMocks());

  test('fires when occupancy > 90% of capacity', async () => {
    mockQuery([{ cnt: '95' }]);
    const result = await svc.checkCapacityBreach({ id: 'gym1', capacity: 100 });
    expect(result).toBe(95);
  });

  test('does NOT fire at exactly 90% (must be > 90%)', async () => {
    mockQuery([{ cnt: '90' }]);
    const result = await svc.checkCapacityBreach({ id: 'gym1', capacity: 100 });
    expect(result).toBe(false);
  });

  test('does NOT fire below 90%', async () => {
    mockQuery([{ cnt: '85' }]);
    const result = await svc.checkCapacityBreach({ id: 'gym1', capacity: 100 });
    expect(result).toBe(false);
  });

  test('auto-resolves when occupancy drops below 85%', async () => {
    mockQuery([{ cnt: '84' }]);
    const result = await svc.checkCapacityResolved({ id: 'gym1', capacity: 100 });
    expect(result).toBe(true);
  });

  test('does not resolve when still at 85%+', async () => {
    mockQuery([{ cnt: '85' }]);
    const result = await svc.checkCapacityResolved({ id: 'gym1', capacity: 100 });
    expect(result).toBe(false);
  });
});

describe('anomalyService — revenue_drop', () => {
  beforeEach(() => jest.clearAllMocks());

  test('fires when today < 70% of same day last week', async () => {
    mockQuery([{ total: '500' }]);   // today
    mockQuery([{ total: '10000' }]); // last week
    const result = await svc.checkRevenueDrop({ id: 'gym1' });
    expect(result).toBe(true);
  });

  test('does NOT fire when drop is < 30% (today >= 70% of last week)', async () => {
    mockQuery([{ total: '8000' }]);  // today
    mockQuery([{ total: '10000' }]); // last week
    const result = await svc.checkRevenueDrop({ id: 'gym1' });
    expect(result).toBe(false);
  });

  test('does NOT fire when last week revenue is 0', async () => {
    mockQuery([{ total: '0' }]);  // today
    mockQuery([{ total: '0' }]);  // last week
    const result = await svc.checkRevenueDrop({ id: 'gym1' });
    expect(result).toBe(false);
  });

  test('auto-resolves when revenue recovers to within 20% of last week', async () => {
    mockQuery([{ total: '8500' }]);  // today
    mockQuery([{ total: '10000' }]); // last week
    const result = await svc.checkRevenueResolved({ id: 'gym1' });
    expect(result).toBe(true);
  });

  test('does not resolve when revenue is still low', async () => {
    mockQuery([{ total: '2000' }]);  // today
    mockQuery([{ total: '10000' }]); // last week
    const result = await svc.checkRevenueResolved({ id: 'gym1' });
    expect(result).toBe(false);
  });
});
