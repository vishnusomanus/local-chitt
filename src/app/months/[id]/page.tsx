import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { monthCollection } from "@/lib/chitty";
import { formatCurrency } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import { BulkPaymentToggle } from "@/components/BulkPaymentToggle";
import { PayoutForm } from "@/components/PayoutForm";
import { BulkDeletePayments } from "@/components/BulkDeletePayments";
import { EditPayoutButton } from "@/components/EditPayoutButton";

export default async function MonthDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = Number(params.id);

  // Admins can only see their own members
  const memberWhere: any = {
    chittyId: session.chittyId,
    deletedAt: null,
    name: { not: "Nanma" },
    role: "MEMBER"
  };
  
  if (session.role === "ADMIN") {
    memberWhere.parentAdminId = session.id;
  }

  // Get admin's member IDs for filtering payments
  let adminMemberIds: number[] = [];
  if (session.role === "ADMIN") {
    const adminMembers = await prisma.user.findMany({
      where: memberWhere,
      select: { id: true }
    });
    adminMemberIds = adminMembers.map(m => m.id);
  }

  // Build payment where clause
  const paymentWhere: any = {
    monthId: id,
    chittyId: session.chittyId,
    isDeleted: false
  };

  if (session.role === "ADMIN") {
    if (adminMemberIds.length > 0) {
      paymentWhere.memberId = { in: adminMemberIds };
    } else {
      paymentWhere.memberId = -1; // No members, so no payments
    }
  } else {
    paymentWhere.memberId = session.id;
  }

  const month = await prisma.month.findFirst({
    where: { id, chittyId: session.chittyId },
    include: {
      payments: { 
        where: paymentWhere, 
        include: { member: true }, 
        orderBy: { date: "desc" } 
      },
      payout: { include: { receiver: true } },
      lotReceiver: true
    }
  });

  if (!month) return notFound();

  const members = await prisma.user.findMany({ 
    where: memberWhere,
    orderBy: { name: "asc" } 
  });
  const totals = await monthCollection(id, session.chittyId, session.role === "ADMIN" ? session.id : undefined);
  
  // Filter out members who have fully paid for this month
  const fullyPaidMemberIds = new Set(
    Object.values(totals.perMember)
      .filter((m) => m.pending === 0)
      .map((m) => m.member.id)
  );
  const availableMembers = members.filter((m) => !fullyPaidMemberIds.has(m.id));

  // Filter out members who have already received a payout in any previous month
  const memberIds = members.map(m => m.id);
  const existingPayouts = await prisma.payout.findMany({
    where: {
      chittyId: session.chittyId,
      receiverId: { in: memberIds }
    },
    select: { receiverId: true }
  });
  const membersWithPayout = new Set(existingPayouts.map(p => p.receiverId));
  const eligibleForPayout = members.filter(m => !membersWithPayout.has(m.id));
  
  // If default member is fully paid, use first available member or session id
  const defaultMember = availableMembers.length > 0 && !fullyPaidMemberIds.has(session.id)
    ? session.id
    : availableMembers[0]?.id || session.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{month.name}</h1>
          <p className="text-slate-400">
            Target {formatCurrency(totals.target || month.target)} — Due on {new Date(month.dueDate).toDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Collected</p>
          <p className="text-xl font-semibold text-emerald-400">
            {formatCurrency(totals.totalCollected)}
          </p>
          <p className="text-sm text-amber-400">
            Pending {formatCurrency(totals.pendingTotal)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950">
            <BulkDeletePayments
              payments={month.payments.map(p => ({
                id: p.id,
                memberId: p.memberId,
                member: { name: p.member.name },
                amount: p.amount,
                method: p.method,
                date: p.date,
                note: p.note
              }))}
              monthId={month.id}
              isAdmin={session.role === "ADMIN"}
              currentUserId={session.id}
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
              <h2 className="text-lg font-semibold">Pending members</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 px-4 py-3 text-sm">
              {totals.pendingMembers.map((p) => (
                <div key={p.id} className="rounded border border-slate-800 px-3 py-2">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-amber-400">{formatCurrency(p.pending)}</p>
                </div>
              ))}
              {totals.pendingMembers.length === 0 && (
                <p className="text-slate-400">No pending members.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <BulkPaymentToggle
            monthId={month.id}
            members={availableMembers.length > 0 ? availableMembers : members}
            defaultMemberId={defaultMember}
            isAdmin={session.role === "ADMIN"}
            isMonthClosed={session.role === "ADMIN" 
              ? totals.totalCollected >= (totals.target || month.target)
              : month.isClosed}
          />
          {session.role === "ADMIN" && (
            <>
              {/* Show payout form if no payout exists, or if payout exists but receiver is not from this admin's members */}
              {(!month.payout || !members.some(m => m.id === month.payout?.receiverId)) && (
                <PayoutForm
                  monthId={month.id}
                  members={eligibleForPayout}
                  defaultReceiverId={month.lotReceiverId && eligibleForPayout.some(m => m.id === month.lotReceiverId) ? month.lotReceiverId : undefined}
                />
              )}
              {/* Show payout details if payout exists and receiver is from this admin's members */}
              {month.payout && members.some(m => m.id === month.payout?.receiverId) && (
            <div className="space-y-3">
              <div className="rounded border border-slate-800 bg-slate-950 p-4 text-sm">
                <p className="text-slate-400">Payout recorded</p>
                <p className="text-lg font-semibold text-emerald-400">
                  {formatCurrency(month.payout.amount)}
                </p>
                <p className="text-slate-300">{month.payout.receiver.name}</p>
                <p className="text-slate-400">
                  {new Date(month.payout.date).toLocaleDateString()}
                </p>
                {month.payout.note && (
                  <p className="mt-2 text-slate-400">{month.payout.note}</p>
                )}
              </div>
              <EditPayoutButton
                monthId={month.id}
                members={(() => {
                  // Include current receiver even if they've received payout before, plus eligible members
                  const currentReceiver = members.find(m => m.id === month.payout.receiverId);
                  const membersList = [...eligibleForPayout];
                  if (currentReceiver && !membersList.some(m => m.id === currentReceiver.id)) {
                    membersList.push(currentReceiver);
                  }
                  return membersList.length > 0 ? membersList : members;
                })()}
                currentPayout={{
                  receiverId: month.payout.receiverId,
                  amount: month.payout.amount,
                  note: month.payout.note
                }}
              />
            </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

