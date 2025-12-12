import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addMonths, set } from "date-fns";

const prisma = new PrismaClient();

const seedMembers = [
  { name: "Vishnu", email: "vishnu@example.com", role: "ADMIN" },
  { name: "Kiran", email: "kiran@example.com", role: "ADMIN" },
  { name: "Sumesh", email: "sumesh@example.com" },
  { name: "Ajith", email: "ajith@example.com" },
  { name: "Sajith", email: "sajith@example.com" },
  { name: "suresh", email: "suresh@example.com" },
  { name: "Saritha", email: "saritha@example.com" },
  { name: "Dyan", email: "dyan@example.com" },
  { name: "Renju", email: "renju@example.com" },
  { name: "Nandhu", email: "nandhu@example.com" },
  { name: "Abhilash", email: "abilash@example.com" }
];

const payoutOrder = ["Abhilash", "Sumesh", "Vishnu", "Dyan"];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.month.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.chitty.deleteMany();

  // Create a chitty
  const chitty = await prisma.chitty.create({
    data: { name: "Main Chitty" }
  });

  const hashed = await bcrypt.hash("password123", 10);
  
  // Create Vishnu first (admin)
  const vishnu = await prisma.user.create({
    data: {
      name: "Vishnu",
      email: "vishnu@example.com",
      role: "ADMIN",
      password: hashed,
      chittyId: chitty.id
    }
  });

  // Create Kiran (admin)
  const kiran = await prisma.user.create({
    data: {
      name: "Kiran",
      email: "kiran@example.com",
      role: "ADMIN",
      password: hashed,
      chittyId: chitty.id
    }
  });

  // Create settings for Vishnu (admin)
  await prisma.setting.create({
    data: {
      chittyId: chitty.id,
      adminId: vishnu.id,
      monthlyAmount: 5000,
      monthsCount: 11,
      startDate: new Date("2025-09-01"),
      dueDay: 10,
      allowOverCollection: false,
      maxMembers: 10 // monthsCount - 1
    }
  });

  // Create settings for Kiran (admin)
  await prisma.setting.create({
    data: {
      chittyId: chitty.id,
      adminId: kiran.id,
      monthlyAmount: 5000,
      monthsCount: 11,
      startDate: new Date("2025-09-01"),
      dueDay: 10,
      allowOverCollection: false,
      maxMembers: 10 // monthsCount - 1
    }
  });

  // Create all other members with Vishnu as parent admin
  const otherMembers = seedMembers.filter((m) => m.name !== "Vishnu" && m.name !== "Kiran");
  const users = await Promise.all([
    vishnu,
    kiran,
    ...otherMembers.map((m) =>
      prisma.user.create({
        data: {
          name: m.name,
          email: m.email,
          role: (m as any).role || "MEMBER",
          password: hashed,
          chittyId: chitty.id,
          parentAdminId: vishnu.id // Assign Vishnu as parent admin
        }
      })
    )
  ]);

  const abhilashId = users.find((u) => u.name === "Abhilash")?.id;
  const sumeshId = users.find((u) => u.name === "Sumesh")?.id;
  const vishnuId = users.find((u) => u.name === "Vishnu")?.id;
  const dyanId = users.find((u) => u.name === "Dyan")?.id;
  const payoutSequence = [abhilashId, sumeshId, vishnuId, dyanId].filter(Boolean);

  const start = new Date("2025-09-01");
  const months: { id: number; index: number; name: string }[] = [];

  for (let i = 0; i < 11; i++) {
    const startDate = addMonths(start, i);
    const dueDate = set(startDate, { date: 10, hours: 0, minutes: 0, seconds: 0 });
    const name = startDate.toLocaleString("default", { month: "short", year: "numeric" });
    const month = await prisma.month.create({
      data: {
        index: i + 1,
        name,
        startDate,
        dueDate,
        target: 50000,
        chittyId: chitty.id,
        lotReceiverId: payoutSequence[i % payoutSequence.length] || null
      }
    });
    months.push({ id: month.id, index: month.index, name: month.name });
  }

  const sepMonth = months.find((m) => m.index === 1);
  if (sepMonth && vishnuId) {
    await prisma.payment.createMany({
      data: [
        {
          memberId: vishnuId,
          monthId: sepMonth.id,
          chittyId: chitty.id,
          monthIndex: sepMonth.index,
          amount: 2500,
          method: "cash",
          note: "Partial payment",
          date: new Date("2025-09-05")
        },
        {
          memberId: vishnuId,
          monthId: sepMonth.id,
          chittyId: chitty.id,
          monthIndex: sepMonth.index,
          amount: 2500,
          method: "cash",
          note: "Second partial",
          date: new Date("2025-09-09")
        }
      ]
    });
  }

  if (sepMonth && abhilashId) {
    await prisma.payment.create({
      data: {
        memberId: abhilashId,
        monthId: sepMonth.id,
        chittyId: chitty.id,
        monthIndex: sepMonth.index,
        amount: 5000,
        method: "upi",
        note: "Full payment",
        date: new Date("2025-09-06")
      }
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

