const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({ connectionString: env.DATABASE_URL });

async function seedRealisticData() {
  await client.connect();
  console.log('Connected to PostgreSQL for realistic DB seeding...');

  // 1. Fetch available plans
  const plansRes = await client.query('SELECT id, name, type, price FROM plans WHERE is_active = true');
  const plans = plansRes.rows;
  console.log(`Found ${plans.length} active plans in DB.`);

  // 2. Realistic Schools / Tenants list across Indian states
  const schoolsData = [
    { name: 'Bright Future School', city: 'Pune', state: 'Maharashtra', plan: 'School (Advance)', max_students: 2500, max_teachers: 120, domain: 'brightfuture.edu.in' },
    { name: 'Sunrise International Academy', city: 'Ahmedabad', state: 'Gujarat', plan: 'School (Advance)', max_students: 1800, max_teachers: 95, domain: 'sunriseintl.org' },
    { name: 'Green Valley High School', city: 'Bengaluru', state: 'Karnataka', plan: 'School (Standard)', max_students: 1200, max_teachers: 70, domain: 'greenvalley.edu.in' },
    { name: 'Delhi Public Excellence Academy', city: 'New Delhi', state: 'Delhi', plan: 'School (Advance)', max_students: 3200, max_teachers: 160, domain: 'dpea-delhi.ac.in' },
    { name: 'Rajasthan Heritage Vidyalaya', city: 'Jaipur', state: 'Rajasthan', plan: 'School (Standard)', max_students: 1100, max_teachers: 60, domain: 'rhv-jaipur.edu.in' },
    { name: 'St. Xavier Convent School', city: 'Kolkata', state: 'West Bengal', plan: 'School (Standard)', max_students: 1400, max_teachers: 80, domain: 'stxaviers-kolkata.org' },
    { name: 'Apex Global STEM School', city: 'Hyderabad', state: 'Telangana', plan: 'School (Advance)', max_students: 2100, max_teachers: 110, domain: 'apexstem.edu.in' },
    { name: 'National Model Matric School', city: 'Coimbatore', state: 'Tamil Nadu', plan: 'School (Basic)', max_students: 950, max_teachers: 45, domain: 'nmms-cbe.org' },
    { name: 'Cambridge Valley School', city: 'Dehradun', state: 'Uttarakhand', plan: 'School (Standard)', max_students: 1350, max_teachers: 75, domain: 'cambridgevalley.ac.in' },
    { name: 'Shining Stars Academy', city: 'Indore', state: 'Madhya Pradesh', plan: 'School (Basic)', max_students: 850, max_teachers: 40, domain: 'shiningstars.edu.in' },
    { name: 'Little Angels Higher Secondary', city: 'Gwalior', state: 'Madhya Pradesh', plan: 'School (Basic)', max_students: 720, max_teachers: 35, domain: 'littleangels.edu.in' },
    { name: 'Modern Vidya Mandir', city: 'Surat', state: 'Gujarat', plan: 'School (Standard)', max_students: 1600, max_teachers: 85, domain: 'mvm-surat.edu.in' },
    { name: 'Vibrant Knowledge Institute', city: 'Nagpur', state: 'Maharashtra', plan: 'Institue / Coating', max_students: 600, max_teachers: 30, domain: 'vibrant-nagpur.com' },
    { name: 'Elite IIT-JEE Tutorials', city: 'Kota', state: 'Rajasthan', plan: 'Institue / Coating', max_students: 900, max_teachers: 40, domain: 'elitekota.com' },
    { name: 'Dr. Sharma Physics Academy', city: 'Lucknow', state: 'Uttar Pradesh', plan: 'Solo Tutor', max_students: 250, max_teachers: 5, domain: 'sharmaphysics.in' }
  ];

  const now = new Date();

  for (let idx = 0; idx < schoolsData.length; idx++) {
    const s = schoolsData[idx];
    const createdDaysAgo = Math.floor(idx * 11) + 2;
    const createdAt = new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000);
    const matchedPlan = plans.find(p => p.name === s.plan) || plans[0];

    const settingsObj = {
      city: s.city,
      state: s.state,
      country: 'India',
      academic_year: '2025-26',
      contact_phone: '+91 98765 ' + (10000 + idx)
    };

    const insertTenantQuery = `
      INSERT INTO tenants (
        name, type, tenant_type, email, is_active, subscription_status,
        subscription_plan, current_plan_id, max_students, max_teachers,
        settings, branding, domain, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
      ON CONFLICT DO NOTHING;
    `;

    await client.query(insertTenantQuery, [
      s.name,
      s.plan.includes('Institue') ? 'INSTITUTE' : s.plan.includes('Solo') ? 'PERSONAL_TEACHER' : 'INSTITUTE',
      s.plan.includes('Solo') ? 'independent_teacher' : s.plan.includes('Institue') ? 'institute' : 'school',
      'principal@' + s.domain,
      true,
      'active',
      s.plan,
      matchedPlan?.id || null,
      s.max_students,
      s.max_teachers,
      JSON.stringify(settingsObj),
      JSON.stringify({ primaryColor: '#0284C7', secondaryColor: '#10B981' }),
      s.domain,
      createdAt
    ]);
  }

  // Fetch all tenants
  const allTenantsRes = await client.query('SELECT id, name, created_at, settings FROM tenants');
  const allTenants = allTenantsRes.rows;
  console.log(`Total tenants in DB now: ${allTenants.length}`);

  // 3. Seed Auth Users and User Profiles
  console.log('Seeding students and teachers into auth.users and user_profiles...');
  const studentIds = [];
  let totalStudentsAdded = 0;
  let totalTeachersAdded = 0;

  for (const t of allTenants) {
    const studentCount = Math.floor(Math.random() * 8) + 12; // 12-20 students per tenant
    for (let i = 0; i < studentCount; i++) {
      const daysAgo = Math.floor(Math.random() * 150) + 1;
      const userCreated = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const userId = crypto.randomUUID();
      const email = `student_${t.id.slice(0, 4)}_${userId.slice(0, 5)}@bebrilliant.in`;
      
      // Create auth user first
      await client.query(`
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, created_at, updated_at)
        VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, crypt('Student@123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', $3, $3)
        ON CONFLICT (id) DO NOTHING;
      `, [userId, email, userCreated]);

      studentIds.push(userId);

      await client.query(`
        INSERT INTO user_profiles (id, email, first_name, last_name, role, tenant_id, is_active, created_at)
        VALUES ($1, $2, 'Student', $3, 'student', $4, true, $5)
        ON CONFLICT (id) DO NOTHING;
      `, [userId, email, `${i + 1}`, t.id, userCreated]);
      totalStudentsAdded++;
    }

    // 3-5 teachers
    for (let j = 0; j < 3; j++) {
      const daysAgo = Math.floor(Math.random() * 150) + 5;
      const userCreated = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const userId = crypto.randomUUID();
      const email = `faculty_${t.id.slice(0, 4)}_${userId.slice(0, 5)}@bebrilliant.in`;

      await client.query(`
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, created_at, updated_at)
        VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, crypt('Faculty@123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', $3, $3)
        ON CONFLICT (id) DO NOTHING;
      `, [userId, email, userCreated]);

      await client.query(`
        INSERT INTO user_profiles (id, email, first_name, last_name, role, tenant_id, is_active, created_at)
        VALUES ($1, $2, 'Faculty', $3, 'teacher', $4, true, $5)
        ON CONFLICT (id) DO NOTHING;
      `, [userId, email, `${j + 1}`, t.id, userCreated]);
      totalTeachersAdded++;
    }
  }
  console.log(`Created ${totalStudentsAdded} students and ${totalTeachersAdded} teachers.`);

  // 4. Seed Payments across trailing 6 months
  console.log('Seeding multi-month payments in payments table...');
  const amounts = [14999, 24999, 48000, 50000, 75000, 99999, 125000];
  let totalPaymentsAdded = 0;

  for (const t of allTenants) {
    for (let m = 0; m < 5; m++) {
      const payDate = new Date(now.getFullYear(), now.getMonth() - m, Math.floor(Math.random() * 20) + 5);
      const amt = amounts[(m + totalPaymentsAdded) % amounts.length];
      await client.query(`
        INSERT INTO payments (tenant_id, amount, status, type, created_at)
        VALUES ($1, $2, 'success', 'subscription', $3);
      `, [t.id, amt, payDate]);
      totalPaymentsAdded++;
    }
  }
  console.log(`Created ${totalPaymentsAdded} payment records.`);

  // 5. Seed Exams & Exam Attempts
  console.log('Seeding exams and attempts...');
  const examTitles = [
    'Unit Assessment - Physics & Mechanics',
    'Quarterly Mathematics Benchmark Test',
    'CBSE Term 1 Chemistry Practice Exam',
    'Biology & Genetics Diagnostic Assessment',
    'All-India Talent Search Mock Exam',
    'Std 10 Board Preparatory Exam',
    'Std 12 Computer Science Practical Evaluation'
  ];

  let totalExamsAdded = 0;
  for (const t of allTenants) {
    for (let eIdx = 0; eIdx < 2; eIdx++) {
      const examDate = new Date(now.getTime() - (eIdx * 25 + 2) * 24 * 60 * 60 * 1000);
      const title = examTitles[(eIdx + totalExamsAdded) % examTitles.length];
      
      const examRes = await client.query(`
        INSERT INTO exams (tenant_id, name, is_paid, created_at)
        VALUES ($1, $2, false, $3)
        RETURNING id;
      `, [t.id, title, examDate]);

      if (examRes.rows.length > 0) {
        const examId = examRes.rows[0].id;
        totalExamsAdded++;

        // Add 5-8 attempts
        for (let a = 0; a < 6; a++) {
          const studentId = studentIds[(a + totalExamsAdded) % studentIds.length];
          if (studentId) {
            const status = a % 3 === 0 ? 'in_progress' : 'evaluated';
            const score = Math.floor(Math.random() * 35) + 65;
            await client.query(`
              INSERT INTO exam_attempts (student_id, exam_id, status, total_score, start_time, end_time)
              VALUES ($1, $2, $3, $4, $5, $5);
            `, [studentId, examId, status, score, examDate]);
          }
        }
      }
    }
  }
  console.log(`Created ${totalExamsAdded} exams with attempts.`);

  // 6. Seed Audit Logs
  console.log('Seeding recent audit logs...');
  const auditActions = [
    { action: 'new_school_registered', module: 'tenants' },
    { action: 'subscription_upgraded', module: 'billing' },
    { action: 'new_faculty_added', module: 'rbac' },
    { action: 'omr_results_processed', module: 'exams' },
    { action: 'payment_received', module: 'finance' },
    { action: 'support_ticket_resolved', module: 'support' }
  ];

  for (let al = 0; al < 6; al++) {
    const act = auditActions[al];
    const logDate = new Date(now.getTime() - (al * 35 + 5) * 60 * 1000); // within last 4 hours
    await client.query(`
      INSERT INTO audit_logs (action, module, severity, created_at, details)
      VALUES ($1, $2, 'info', $3, $4);
    `, [act.action, act.module, logDate, JSON.stringify({ verified: true })]);
  }

  console.log('--- ALL REALISTIC SEED DATA INSERTED INTO DATABASE ---');
  await client.end();
}

seedRealisticData().catch(console.error);
