import { prisma } from "./prisma";
import { Payment, User } from "@prisma/client";
import { startOfDay } from "date-fns";

type PaymentSummary = {
  member: User;
  paid: number;
  pending: number;
  payments: Payment[];
};

export async function getSettings(adminId: number, chittyId: number) {
  if (!adminId) {
    // Fallback for non-admin users - get first admin's settings in the chitty
    const firstAdmin = await prisma.user.findFirst({
      where: { chittyId, role: "ADMIN", deletedAt: null }
    });
    if (firstAdmin) {
      adminId = firstAdmin.id;
    } else {
      throw new Error("No admin found for this chitty");
    }
  }

  const setting = await prisma.setting.upsert({
    where: { adminId },
    update: {},
    create: {
      chittyId,
      adminId,
      monthlyAmount: 5000,
      monthsCount: 11,
      startDate: new Date("2025-09-01"),
      dueDay: 10,
      maxMembers: 10 // monthsCount - 1
    }
  });
  return setting;
}

export async function getCurrentMonth(chittyId: number) {
  const today = startOfDay(new Date());
  const month = await prisma.month.findFirst({
    where: { chittyId, startDate: { lte: today } },
    orderBy: { startDate: "desc" }
  });
  if (month) return month;
  return prisma.month.findFirst({ where: { chittyId }, orderBy: { startDate: "asc" } });
}

export async function monthCollection(monthId: number, chittyId: number, parentAdminId?: number) {
  const memberWhere: any = {
    chittyId,
    deletedAt: null,
    name: { not: "Nanma" },
    role: "MEMBER"
  };
  
  // If parentAdminId is provided, only get members of that admin
  if (parentAdminId) {
    memberWhere.parentAdminId = parentAdminId;
  }

  // Get admin ID for settings - use parentAdminId if provided, otherwise find first admin
  let settingsAdminId = parentAdminId;
  if (!settingsAdminId) {
    const firstAdmin = await prisma.user.findFirst({
      where: { chittyId, role: "ADMIN", deletedAt: null }
    });
    settingsAdminId = firstAdmin?.id || 0;
  }

  const [settings, payments, members] = await Promise.all([
    getSettings(settingsAdminId, chittyId),
    prisma.payment.findMany({
      where: { monthId, chittyId, isDeleted: false },
      include: { member: true }
    }),
    prisma.user.findMany({ 
      where: memberWhere
    })
  ]);

  const perMember: Record<number, PaymentSummary> = {};
  for (const member of members) {
    perMember[member.id] = { member, paid: 0, pending: settings.monthlyAmount, payments: [] };
  }

  // Track member IDs for filtering
  const memberIds = new Set(members.map(m => m.id));
  
  for (const p of payments) {
    // Skip payments for members that are not in the filtered members list
    // This can happen if a payment was made by a member from a different admin
    // or a member that was deleted/filtered out
    if (!memberIds.has(p.memberId)) {
      continue;
    }
    perMember[p.memberId].paid += p.refunded ? 0 : p.amount;
    perMember[p.memberId].pending = Math.max(
      0,
      settings.monthlyAmount - perMember[p.memberId].paid
    );
    perMember[p.memberId].payments.push(p);
  }

  // Calculate total collected only from filtered members' payments
  const totalCollected = payments
    .filter((p) => !p.refunded && !p.isDeleted && memberIds.has(p.memberId))
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = Math.max(0, settings.monthlyAmount * members.length - totalCollected);

  const pendingMembers = Object.values(perMember)
    .filter((m) => m.pending > 0)
    .map((m) => ({ id: m.member.id, name: m.member.name, pending: m.pending }));

  // Calculate target for this admin's members
  const target = settings.monthlyAmount * members.length;

  return {
    perMember,
    totalCollected,
    pendingTotal,
    pendingMembers,
    target
  };
}

export async function dashboardData(userId: number, role: string, chittyId: number, parentAdminId?: number) {
  const adminId = role === "ADMIN" && parentAdminId ? parentAdminId : userId;
  const [settings, months, currentMonth] = await Promise.all([
    getSettings(adminId, chittyId),
    prisma.month.findMany({
      where: { chittyId },
      orderBy: { index: "asc" },
      include: { payout: true }
    }),
    getCurrentMonth(chittyId)
  ]);

  const { totalCollected, pendingTotal, pendingMembers } = currentMonth
    ? await monthCollection(currentMonth.id, chittyId, parentAdminId)
    : { totalCollected: 0, pendingTotal: 0, pendingMembers: [] };

  // For admins, only show payments from their members
  const paymentWhere: any = {
    chittyId,
    isDeleted: false
  };
  
  if (role === "ADMIN") {
    if (parentAdminId) {
      // Get member IDs for this admin
      const adminMemberIds = await prisma.user.findMany({
        where: { parentAdminId, chittyId, role: "MEMBER" },
        select: { id: true }
      });
      paymentWhere.memberId = { in: adminMemberIds.map(m => m.id) };
    }
  } else {
    paymentWhere.memberId = userId;
  }

  const payments = await prisma.payment.findMany({
    where: paymentWhere,
    include: { month: true },
    orderBy: { date: "desc" },
    take: 5
  });

  const memberWhere: any = {
    chittyId,
    deletedAt: null,
    name: { not: "Nanma" },
    role: "MEMBER"
  };
  
  if (parentAdminId) {
    memberWhere.parentAdminId = parentAdminId;
  }

  const members = await prisma.user.findMany({
    where: memberWhere
  });

  // For admins, only show payouts where the receiver is one of their members
  const payoutWhere: any = {
    chittyId
  };
  
  if (role === "ADMIN" && parentAdminId) {
    // Get member IDs for this admin (including the admin themselves if they can receive payouts)
    const adminMemberIds = members.map(m => m.id);
    payoutWhere.receiverId = { in: adminMemberIds };
  } else if (role === "MEMBER") {
    // For members, only show their own payouts
    payoutWhere.receiverId = userId;
  }

  const payouts = await prisma.payout.findMany({
    where: payoutWhere,
    include: { receiver: true, month: true },
    orderBy: { month: { index: "desc" } },
    take: 5
  });

  // Get member IDs for filtering payments
  const memberIds = members.map(m => m.id);
  const memberSums = await prisma.payment.groupBy({
    by: ["memberId"],
    _sum: { amount: true },
    where: { 
      chittyId, 
      isDeleted: false, 
      refunded: false,
      memberId: { in: memberIds }
    }
  });
  const memberSummary = members.map((m) => {
    const paid = memberSums.find((s) => s.memberId === m.id)?._sum.amount || 0;
    const remaining = Math.max(0, settings.monthlyAmount * settings.monthsCount - paid);
    return {
      member: m,
      paid,
      remaining
    };
  });

  // Calculate completed months based on admin's members
  // For admins, count months where all their members have paid their monthly amount
  // For regular users, count months where they have paid
  let completedMonths = 0;
  if (role === "ADMIN" && parentAdminId) {
    // For admin: count months where all their members have fully paid
    // Always use admin-specific calculation, even if no members (will be 0)
    const memberIds = new Set(members.map(m => m.id));
    const expectedMonthlyAmount = settings.monthlyAmount;
    
    if (memberIds.size > 0) {
      // Get all payments for this admin's members across all months
      const allPayments = await prisma.payment.findMany({
        where: {
          chittyId,
          memberId: { in: Array.from(memberIds) },
          isDeleted: false,
          refunded: false
        },
        select: {
          monthId: true,
          memberId: true,
          amount: true
        }
      });

      // Group payments by month and member
      const paymentsByMonth = new Map<number, Map<number, number>>();
      for (const payment of allPayments) {
        if (!paymentsByMonth.has(payment.monthId)) {
          paymentsByMonth.set(payment.monthId, new Map());
        }
        const monthPayments = paymentsByMonth.get(payment.monthId)!;
        monthPayments.set(
          payment.memberId,
          (monthPayments.get(payment.memberId) || 0) + payment.amount
        );
      }

      // Count months where all members have paid at least the expected amount
      for (const month of months) {
        const monthPayments = paymentsByMonth.get(month.id);
        if (monthPayments) {
          const allPaid = Array.from(memberIds).every(memberId => {
            const paid = monthPayments.get(memberId) || 0;
            return paid >= expectedMonthlyAmount;
          });
          if (allPaid) {
            completedMonths++;
          }
        }
      }
    }
    // If no members, completedMonths remains 0 (correct for admin with no members)
  } else if (role === "MEMBER") {
    // For member: count months where they have fully paid
    const userPayments = await prisma.payment.groupBy({
      by: ["monthId"],
      _sum: { amount: true },
      where: {
        chittyId,
        memberId: userId,
        isDeleted: false,
        refunded: false
      }
    });

    const paymentsByMonth = new Map(
      userPayments.map(p => [p.monthId, p._sum.amount || 0])
    );

    for (const month of months) {
      const paid = paymentsByMonth.get(month.id) || 0;
      if (paid >= settings.monthlyAmount) {
        completedMonths++;
      }
    }
  } else {
    // Fallback: use global closed months
    completedMonths = months.filter((m) => m.isClosed).length;
  }

  return {
    settings,
    months,
    currentMonth,
    currentMonthTotal: totalCollected,
    currentMonthPending: pendingTotal,
    pendingMembers,
    payments,
    payouts,
    memberSummary,
    completedMonths
  };
}

