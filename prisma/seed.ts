import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.reservation.deleteMany();
  await prisma.nurse.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.workday.deleteMany();
  await prisma.timezone.deleteMany();
  await prisma.reminderConfig.deleteMany();
  await prisma.emailTemplate.deleteMany();

  // Create sample employees
  const emp1 = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP001',
      name: '田中医師',
      email: 'tanaka@clinic.example.com',
      department: '内科',
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP002',
      name: '佐藤看護師',
      email: 'satoh@clinic.example.com',
      department: '看護部',
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP003',
      name: '鈴木看護師',
      email: 'suzuki@clinic.example.com',
      department: '看護部',
    },
  });

  const emp4 = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP004',
      name: '伊藤医師',
      email: 'itoh@clinic.example.com',
      department: '外科',
    },
  });

  // Create sample doctors
  const doc1 = await prisma.doctor.create({
    data: {
      employeeId: emp1.id,
      title: '内科医',
      minDurationMin: 15,
      defaultDurationMin: 30,
      maxDurationMin: 60,
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      employeeId: emp4.id,
      title: '外科医',
      minDurationMin: 30,
      defaultDurationMin: 45,
      maxDurationMin: 120,
    },
  });

  // Create sample nurses
  const nurse1 = await prisma.nurse.create({
    data: {
      employeeId: emp2.id,
      title: '看護師',
    },
  });

  const nurse2 = await prisma.nurse.create({
    data: {
      employeeId: emp3.id,
      title: '看護師',
    },
  });

  // Create sample workdays
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.workday.create({
    data: {
      doctorId: doc1.id,
      date: today,
      startTime: '09:00',
      endTime: '18:00',
    },
  });

  await prisma.workday.create({
    data: {
      doctorId: doc1.id,
      date: tomorrow,
      startTime: '09:00',
      endTime: '18:00',
    },
  });

  // Create sample reservations
  const startTime = new Date(today);
  startTime.setHours(10, 0, 0, 0);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 30);

  await prisma.reservation.create({
    data: {
      employeeId: emp1.id,
      doctorId: doc1.id,
      nurseId: nurse1.id,
      startUtc: startTime,
      endUtc: endTime,
      status: 'confirmed',
    },
  });

  const startTime2 = new Date(tomorrow);
  startTime2.setHours(14, 0, 0, 0);
  const endTime2 = new Date(startTime2);
  endTime2.setMinutes(endTime2.getMinutes() + 45);

  await prisma.reservation.create({
    data: {
      employeeId: emp4.id,
      doctorId: doc2.id,
      nurseId: nurse2.id,
      startUtc: startTime2,
      endUtc: endTime2,
      status: 'confirmed',
    },
  });

  // Create sample email template
  await prisma.emailTemplate.create({
    data: {
      name: 'reservation-confirmation',
      subject: '予約確認: {{doctorName}}医師',
      body: '{{employeeName}}様\n\nご予約ありがとうございます。\n\n医師: {{doctorName}}\n予約日時: {{appointmentTime}}\n\nご来院をお待ちしております。',
    },
  });

  // Create sample reminder config
  await prisma.reminderConfig.create({
    data: {
      daysBefore: 1,
      hourBefore: 24,
    },
  });

  console.log('✅ Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
