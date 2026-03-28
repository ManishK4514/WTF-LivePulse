const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const GYMS = [
  { name: 'WTF Gyms — Lajpat Nagar',    city: 'New Delhi',  capacity: 220, opens_at: '05:30', closes_at: '22:30', count: 650,  monthly: 0.50, quarterly: 0.30, annual: 0.20, active_pct: 0.88 },
  { name: 'WTF Gyms — Connaught Place',  city: 'New Delhi',  capacity: 180, opens_at: '06:00', closes_at: '22:00', count: 550,  monthly: 0.40, quarterly: 0.40, annual: 0.20, active_pct: 0.85 },
  { name: 'WTF Gyms — Bandra West',      city: 'Mumbai',     capacity: 300, opens_at: '05:00', closes_at: '23:00', count: 750,  monthly: 0.40, quarterly: 0.40, annual: 0.20, active_pct: 0.90 },
  { name: 'WTF Gyms — Powai',            city: 'Mumbai',     capacity: 250, opens_at: '05:30', closes_at: '22:30', count: 600,  monthly: 0.40, quarterly: 0.40, annual: 0.20, active_pct: 0.87 },
  { name: 'WTF Gyms — Indiranagar',      city: 'Bengaluru',  capacity: 200, opens_at: '05:30', closes_at: '22:00', count: 550,  monthly: 0.40, quarterly: 0.40, annual: 0.20, active_pct: 0.89 },
  { name: 'WTF Gyms — Koramangala',      city: 'Bengaluru',  capacity: 180, opens_at: '06:00', closes_at: '22:00', count: 500,  monthly: 0.40, quarterly: 0.40, annual: 0.20, active_pct: 0.86 },
  { name: 'WTF Gyms — Banjara Hills',    city: 'Hyderabad',  capacity: 160, opens_at: '06:00', closes_at: '22:00', count: 450,  monthly: 0.50, quarterly: 0.30, annual: 0.20, active_pct: 0.84 },
  { name: 'WTF Gyms — Sector 18 Noida', city: 'Noida',      capacity: 140, opens_at: '06:00', closes_at: '21:30', count: 400,  monthly: 0.60, quarterly: 0.25, annual: 0.15, active_pct: 0.82 },
  { name: 'WTF Gyms — Salt Lake',        city: 'Kolkata',    capacity: 120, opens_at: '06:00', closes_at: '21:00', count: 300,  monthly: 0.60, quarterly: 0.30, annual: 0.10, active_pct: 0.80 },
  { name: 'WTF Gyms — Velachery',        city: 'Chennai',    capacity: 110, opens_at: '06:00', closes_at: '21:00', count: 250,  monthly: 0.60, quarterly: 0.30, annual: 0.10, active_pct: 0.78 },
];

const FIRST_NAMES = [
  'Rahul','Priya','Ankit','Neha','Vikram','Pooja','Arjun','Sneha','Rohit','Divya',
  'Amit','Kavya','Sanjay','Meera','Karan','Ritu','Varun','Shruti','Aditya','Anjali',
  'Suresh','Nisha','Rajesh','Swati','Deepak','Sonali','Nikhil','Preeti','Manish','Rachna',
  'Gaurav','Pallavi','Akash','Namrata','Harsh','Kritika','Vishal','Monika','Rajan','Seema',
  'Kunal','Aarti','Tushar','Shweta','Vivek','Komal','Sachin','Rina','Shubham','Lakshmi',
  'Pranav','Deepika','Mohit','Geeta','Ayush','Chandni','Tarun','Rashmi','Nitin','Usha',
  'Arun','Bindu','Pradeep','Sarita','Manoj','Rekha','Vinay','Mamta','Sumit','Pinki',
  'Ashish','Nidhi','Hemant','Sunita','Pankaj','Lata','Rajeev','Hema','Sandeep','Alka',
  'Dinesh','Gita','Bhavesh','Rupal','Jitendra','Sarla','Harish','Tara','Naveen','Sushma',
  'Chetan','Saroj','Sunil','Kalpana','Girish','Vidya','Santosh','Sheela','Vijay','Sudha',
];

const LAST_NAMES = [
  'Sharma','Mehta','Verma','Singh','Gupta','Joshi','Patel','Nair','Reddy','Kumar',
  'Mishra','Agarwal','Bose','Chatterjee','Das','Pillai','Menon','Iyer','Rao','Shah',
  'Malhotra','Kapoor','Khanna','Srivastava','Tiwari','Pandey','Dubey','Shukla','Yadav','Banerjee',
  'Mukherjee','Ghosh','Choudhury','Sen','Basu','Dutta','Roy','Chakraborty','Bhattacharya','Paul',
  'Desai','Jain','Trivedi','Parikh','Modi','Bhatt','Dave','Vyas','Chokshi','Thakkar',
  'Naidu','Gowda','Hegde','Shetty','Kamath','Shenoy','Bhat','Rao','Pai','Nayak',
  'Krishnan','Rajan','Subramaniam','Venkat','Murthy','Sundaram','Balaji','Ramesh','Ganesh','Suresh',
  'Bhatia','Sethi','Arora','Anand','Walia','Dhillon','Grewal','Sandhu','Gill','Bajwa',
  'Saxena','Chandra','Varma','Dewan','Bajaj','Khatri','Suri','Kohli','Taneja','Mehra',
  'Khan','Qureshi','Ansari','Siddiqui','Rahman','Sheikh','Mirza','Hussain','Ali','Ahmed',
];

const PLAN_AMOUNTS = { monthly: 1499, quarterly: 3999, annual: 11999 };

const HOURLY_MULTIPLIERS = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0.6,
  6: 0.6, 7: 1.0, 8: 1.0, 9: 1.0, 10: 0.4,
  11: 0.4, 12: 0.3, 13: 0.3, 14: 0.2, 15: 0.2,
  16: 0.2, 17: 0.9, 18: 0.9, 19: 0.9, 20: 0.9,
  21: 0.35, 22: 0.35, 23: 0,
};

const DAY_MULTIPLIERS = { 0: 0.45, 1: 1.0, 2: 0.95, 3: 0.90, 4: 0.95, 5: 0.85, 6: 0.70 };

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function weighted(options) {
  const r = Math.random();
  let sum = 0;
  for (const [val, prob] of options) {
    sum += prob;
    if (r < sum) return val;
  }
  return options[options.length - 1][0];
}

async function batchInsert(client, table, columns, rows) {
  if (rows.length === 0) return;
  const BATCH = 1000;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const placeholders = chunk.map((_, ri) =>
      `(${columns.map((_, ci) => `$${ri * columns.length + ci + 1}`).join(',')})`
    ).join(',');
    const values = chunk.flat();
    await client.query(
      `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
      values
    );
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT COUNT(*) FROM gyms');
    if (parseInt(rows[0].count) > 0) {
      console.log('Database already seeded, skipping.');
      return;
    }

    console.log('Starting seed...');
    await client.query('BEGIN');

    // ── Gyms ──────────────────────────────────────────────────────────────────
    console.log('Inserting gyms...');
    const gymRows = await Promise.all(GYMS.map(async (g) => {
      const r = await client.query(
        `INSERT INTO gyms (name, city, capacity, opens_at, closes_at)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [g.name, g.city, g.capacity, g.opens_at, g.closes_at]
      );
      return { ...g, id: r.rows[0].id };
    }));

    const gymByName = {};
    for (const g of gymRows) gymByName[g.name] = g;

    // ── Members ───────────────────────────────────────────────────────────────
    console.log('Inserting members...');
    const memberRows = [];
    const now = new Date();

    for (const gym of gymRows) {
      for (let i = 0; i < gym.count; i++) {
        const isActive = Math.random() < gym.active_pct;
        const status = isActive ? 'active' : (Math.random() < 0.7 ? 'inactive' : 'frozen');
        const plan_type = weighted([
          ['monthly', gym.monthly],
          ['quarterly', gym.quarterly],
          ['annual', gym.annual],
        ]);
        const member_type = Math.random() < 0.8 ? 'new' : 'renewal';
        const daysAgo = rand(1, 90);
        const joined_at = new Date(now - daysAgo * 86400000);
        const durationDays = plan_type === 'monthly' ? 30 : plan_type === 'quarterly' ? 90 : 365;
        const plan_expires_at = new Date(joined_at.getTime() + durationDays * 86400000);
        const name = randomName();
        const email = `${name.toLowerCase().replace(/ /g, '.')}${rand(1, 999)}@example.com`;
        const phone = `+91${rand(7000000000, 9999999999)}`;

        memberRows.push([
          gym.id, name, email, phone, plan_type, member_type,
          status, joined_at.toISOString(), plan_expires_at.toISOString()
        ]);
      }
    }

    await batchInsert(client, 'members',
      ['gym_id','name','email','phone','plan_type','member_type','status','joined_at','plan_expires_at'],
      memberRows
    );

    // Fetch all members with their gym info
    const { rows: allMembers } = await client.query(
      `SELECT m.id, m.gym_id, m.status, m.plan_type, m.member_type, m.joined_at,
              g.opens_at, g.closes_at, g.name AS gym_name
       FROM members m JOIN gyms g ON g.id = m.gym_id`
    );

    const membersByGym = {};
    for (const m of allMembers) {
      if (!membersByGym[m.gym_id]) membersByGym[m.gym_id] = [];
      membersByGym[m.gym_id].push(m);
    }

    const activeMembers = allMembers.filter(m => m.status === 'active');
    const activeMembersByGym = {};
    for (const m of activeMembers) {
      if (!activeMembersByGym[m.gym_id]) activeMembersByGym[m.gym_id] = [];
      activeMembersByGym[m.gym_id].push(m);
    }

    // ── Checkins (90 days history) ─────────────────────────────────────────────
    console.log('Generating checkin history (~270k rows, this takes ~30s)...');
    const checkinRows = [];
    const twoHoursAgo = new Date(now - 2 * 3600000);

    for (let daysBack = 90; daysBack >= 1; daysBack--) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - daysBack);

      const dow = dayStart.getDay();
      const dayMult = DAY_MULTIPLIERS[dow];

      for (const gym of gymRows) {
        const gymMembers = activeMembersByGym[gym.id] || [];
        if (gymMembers.length === 0) continue;

        const [openH, openM] = gym.opens_at.split(':').map(Number);
        const [closeH, closeM] = gym.closes_at.split(':').map(Number);

        for (let hour = openH; hour <= Math.min(closeH, 22); hour++) {
          const mult = HOURLY_MULTIPLIERS[hour] * dayMult;
          if (mult === 0) continue;

          const expectedCheckins = Math.round(gymMembers.length * 0.03 * mult);
          const shuffled = gymMembers.slice().sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, expectedCheckins);

          for (const member of selected) {
            const checkedInDate = new Date(dayStart);
            checkedInDate.setHours(hour, rand(0, 59), rand(0, 59), 0);

            const isHistorical = checkedInDate < twoHoursAgo;
            let checkedOut = null;
            if (isHistorical) {
              checkedOut = new Date(checkedInDate.getTime() + rand(45, 90) * 60000);
            }

            checkinRows.push([
              member.id, gym.id,
              checkedInDate.toISOString(),
              checkedOut ? checkedOut.toISOString() : null
            ]);
          }
        }
      }

      if (daysBack % 10 === 0) {
        process.stdout.write(`  Progress: ${90 - daysBack}/90 days processed, ${checkinRows.length} checkins queued\r`);
      }
    }

    console.log(`\nInserting ${checkinRows.length} checkins in batches...`);
    await batchInsert(client, 'checkins', ['member_id','gym_id','checked_in','checked_out'], checkinRows);
    console.log('Checkins inserted.');

    // Update last_checkin_at for all members
    console.log('Updating member last_checkin_at...');
    await client.query(`
      UPDATE members m
      SET last_checkin_at = sub.latest
      FROM (
        SELECT member_id, MAX(checked_in) AS latest
        FROM checkins
        GROUP BY member_id
      ) sub
      WHERE m.id = sub.member_id
    `);

    // ── Churn risk members ─────────────────────────────────────────────────────
    console.log('Creating churn risk scenarios...');

    // HIGH risk: 150 members, last checkin 47–58 days ago
    const { rows: highRiskCandidates } = await client.query(`
      SELECT id FROM members
      WHERE status = 'active'
      ORDER BY RANDOM()
      LIMIT 200
    `);

    let highUpdated = 0;
    for (const m of highRiskCandidates.slice(0, 150)) {
      const daysAgo = rand(47, 58);
      const churnDate = new Date(now - daysAgo * 86400000);
      await client.query(
        `UPDATE members SET last_checkin_at = $1 WHERE id = $2`,
        [churnDate.toISOString(), m.id]
      );
      // ensure a checkins row exists with that timestamp
      const { rows: gymRow } = await client.query('SELECT gym_id FROM members WHERE id = $1', [m.id]);
      if (gymRow.length > 0) {
        const checkedOut = new Date(churnDate.getTime() + rand(45, 90) * 60000);
        await client.query(
          `INSERT INTO checkins (member_id, gym_id, checked_in, checked_out) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [m.id, gymRow[0].gym_id, churnDate.toISOString(), checkedOut.toISOString()]
        );
      }
      highUpdated++;
    }

    // CRITICAL risk: 80 members, last checkin > 60 days ago
    for (const m of highRiskCandidates.slice(150, 200)) {
      const daysAgo = rand(62, 75);
      const churnDate = new Date(now - daysAgo * 86400000);
      await client.query(
        `UPDATE members SET last_checkin_at = $1 WHERE id = $2`,
        [churnDate.toISOString(), m.id]
      );
      const { rows: gymRow } = await client.query('SELECT gym_id FROM members WHERE id = $1', [m.id]);
      if (gymRow.length > 0) {
        const checkedOut = new Date(churnDate.getTime() + rand(45, 90) * 60000);
        await client.query(
          `INSERT INTO checkins (member_id, gym_id, checked_in, checked_out) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [m.id, gymRow[0].gym_id, churnDate.toISOString(), checkedOut.toISOString()]
        );
      }
    }

    // Need 80 total CRITICAL — grab more if needed
    const { rows: moreCritical } = await client.query(`
      SELECT id FROM members
      WHERE status = 'active'
        AND id NOT IN (${highRiskCandidates.map(r => `'${r.id}'`).join(',')})
      ORDER BY RANDOM()
      LIMIT 30
    `);
    for (const m of moreCritical) {
      const daysAgo = rand(62, 75);
      const churnDate = new Date(now - daysAgo * 86400000);
      await client.query(
        `UPDATE members SET last_checkin_at = $1 WHERE id = $2`,
        [churnDate.toISOString(), m.id]
      );
      const { rows: gymRow } = await client.query('SELECT gym_id FROM members WHERE id = $1', [m.id]);
      if (gymRow.length > 0) {
        const checkedOut = new Date(churnDate.getTime() + rand(45, 90) * 60000);
        await client.query(
          `INSERT INTO checkins (member_id, gym_id, checked_in, checked_out) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [m.id, gymRow[0].gym_id, churnDate.toISOString(), checkedOut.toISOString()]
        );
      }
    }

    // ── Payments ──────────────────────────────────────────────────────────────
    console.log('Inserting payments...');
    const paymentRows = [];
    for (const m of allMembers) {
      const joined = new Date(m.joined_at);
      const jitter = (Math.random() * 600 - 300) * 1000; // ±5 min
      const paid_at = new Date(joined.getTime() + jitter);
      paymentRows.push([
        m.id, m.gym_id, PLAN_AMOUNTS[m.plan_type], m.plan_type,
        m.member_type, paid_at.toISOString()
      ]);
      if (m.member_type === 'renewal') {
        const paid_at2 = new Date(paid_at.getTime() - rand(25, 35) * 86400000);
        paymentRows.push([
          m.id, m.gym_id, PLAN_AMOUNTS[m.plan_type], m.plan_type,
          'renewal', paid_at2.toISOString()
        ]);
      }
    }
    await batchInsert(client, 'payments',
      ['member_id','gym_id','amount','plan_type','payment_type','paid_at'],
      paymentRows
    );

    // ── Anomaly test scenarios ─────────────────────────────────────────────────
    console.log('Setting up anomaly test scenarios...');

    // Scenario A: Velachery — zero open check-ins, most recent > 2h10m old
    const velachery = gymRows.find(g => g.name.includes('Velachery'));
    if (velachery) {
      await client.query(
        `UPDATE checkins SET checked_out = NOW()
         WHERE gym_id = $1 AND checked_out IS NULL`,
        [velachery.id]
      );
      // Ensure most recent checkin > 2h10m ago
      await client.query(
        `UPDATE checkins SET checked_in = NOW() - INTERVAL '2 hours 15 minutes',
                            checked_out = NOW() - INTERVAL '1 hour 30 minutes'
         WHERE id = (
           SELECT id FROM checkins WHERE gym_id = $1 ORDER BY checked_in DESC LIMIT 1
         )`,
        [velachery.id]
      );
      console.log('  Velachery: zero open check-ins scenario set.');
    }

    // Scenario B: Bandra West — 280 open check-ins within last 90 min
    const bandra = gymRows.find(g => g.name.includes('Bandra West'));
    if (bandra) {
      const bandraMembers = (activeMembersByGym[bandra.id] || []).slice(0, 295);
      const openCheckinRows = [];
      for (const m of bandraMembers.slice(0, 280)) {
        const checkedIn = new Date(now - rand(5, 89) * 60000);
        openCheckinRows.push([m.id, bandra.id, checkedIn.toISOString(), null]);
      }
      await batchInsert(client, 'checkins', ['member_id','gym_id','checked_in','checked_out'], openCheckinRows);
      console.log(`  Bandra West: ${openCheckinRows.length} open check-ins inserted.`);
    }

    // Scenario C: Salt Lake — revenue drop
    const saltLake = gymRows.find(g => g.name.includes('Salt Lake'));
    if (saltLake) {
      // 9 payments 7 days ago (same weekday), totalling ≥ ₹15k
      const sevenDaysAgo = new Date(now - 7 * 86400000);
      sevenDaysAgo.setHours(10, 0, 0, 0);
      const saltMembers = (membersByGym[saltLake.id] || []).slice(0, 20);

      for (let i = 0; i < 9; i++) {
        const m = saltMembers[i % saltMembers.length];
        const paid_at = new Date(sevenDaysAgo.getTime() + i * 600000);
        await client.query(
          `INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [m.id, saltLake.id, 1999, 'monthly', 'new', paid_at.toISOString()]
        );
      }
      // 1 payment today totalling ≤ ₹3k
      const todayStart = new Date(now);
      todayStart.setHours(8, 0, 0, 0);
      await client.query(
        `INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [saltMembers[0].id, saltLake.id, 1499, 'monthly', 'new', todayStart.toISOString()]
      );
      console.log('  Salt Lake: revenue drop scenario set.');
    }

    // ── Refresh materialized view ──────────────────────────────────────────────
    console.log('Refreshing materialized view...');
    await client.query('REFRESH MATERIALIZED VIEW gym_hourly_stats');

    await client.query('COMMIT');
    console.log('Seed complete!');

    // Print validation counts
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM gyms'),
      client.query('SELECT COUNT(*) FROM members'),
      client.query("SELECT COUNT(*) FROM members WHERE status = 'active'"),
      client.query('SELECT COUNT(*) FROM checkins'),
      client.query('SELECT COUNT(*) FROM checkins WHERE checked_out IS NULL'),
      client.query('SELECT COUNT(*) FROM payments'),
    ]);
    console.log('Validation:');
    console.log(`  gyms:            ${counts[0].rows[0].count} (expected 10)`);
    console.log(`  members:         ${counts[1].rows[0].count} (expected 5000)`);
    console.log(`  active members:  ${counts[2].rows[0].count} (expected 4100-4400)`);
    console.log(`  checkins:        ${counts[3].rows[0].count} (expected 250000-300000)`);
    console.log(`  open checkins:   ${counts[4].rows[0].count} (expected 100-350)`);
    console.log(`  payments:        ${counts[5].rows[0].count} (expected 5000-6000)`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
