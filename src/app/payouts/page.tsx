import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export default async function PayoutsPage() {
  const session = await requireUser();
  
  // For admins, only show payouts where the receiver is one of their members
  const payoutWhere: any = {
    chittyId: session.chittyId
  };
  
  if (session.role === "ADMIN") {
    // Get member IDs for this admin
    const adminMembers = await prisma.user.findMany({
      where: { 
        parentAdminId: session.id, 
        chittyId: session.chittyId, 
        role: "MEMBER",
        deletedAt: null
      },
      select: { id: true }
    });
    const adminMemberIds = adminMembers.map(m => m.id);
    
    if (adminMemberIds.length > 0) {
      payoutWhere.receiverId = { in: adminMemberIds };
    } else {
      // No members, so no payouts to show
      payoutWhere.receiverId = -1; // This will return no results
    }
  } else {
    // For members, only show their own payouts
    payoutWhere.receiverId = session.id;
  }
  
  const payouts = await prisma.payout.findMany({
    where: payoutWhere,
    include: { receiver: true, month: true },
    orderBy: { date: "desc" }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <p className="text-slate-400">Recorded lots and receivers.</p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950">
        <div className="grid grid-cols-4 gap-4 border-b border-slate-800 px-4 py-2 text-sm text-slate-400">
          <span>Month</span>
          <span>Receiver</span>
          <span>Amount</span>
          <span>Date</span>
        </div>
        {payouts.map((payout) => (
          <div key={payout.id} className="grid grid-cols-4 gap-4 border-b border-slate-900 px-4 py-2 text-sm">
            <span className="font-medium text-slate-100">{payout.month.name}</span>
            <span className="text-slate-300">{payout.receiver.name}</span>
            <span className="text-emerald-400">{formatCurrency(payout.amount)}</span>
            <span className="text-slate-400">
              {new Date(payout.date).toLocaleDateString()}
            </span>
          </div>
        ))}
        {payouts.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-400">No payouts recorded.</p>
        )}
      </div>
    </div>
  );
}

