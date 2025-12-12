import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import { DeletePaymentButton } from "@/components/DeletePaymentButton";
import { Pagination } from "@/components/Pagination";

const ITEMS_PER_PAGE = 20;

export default async function PaymentsPage({
  searchParams
}: {
  searchParams: { page?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const currentPage = Number(searchParams.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // For admins, get their member IDs first
  let adminMemberIds: number[] = [];
  if (session.role === "ADMIN") {
    const adminMembers = await prisma.user.findMany({
      where: { parentAdminId: session.id, chittyId: session.chittyId, role: "MEMBER" },
      select: { id: true }
    });
    adminMemberIds = adminMembers.map(m => m.id);
  }

  const whereClause = {
    chittyId: session.chittyId,
    ...(session.role === "ADMIN" 
      ? adminMemberIds.length > 0 
        ? { memberId: { in: adminMemberIds } }
        : { memberId: -1 } // No members, so no payments
      : { memberId: session.id }),
    isDeleted: false
  };

  const [payments, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where: whereClause,
      include: { member: true, month: true },
      orderBy: { date: "desc" },
      skip,
      take: ITEMS_PER_PAGE
    }),
    prisma.payment.count({
      where: whereClause
    })
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-slate-400">
            {session.role === "ADMIN"
              ? "All recorded payments"
              : "Your payments and history"}
            {totalCount > 0 && (
              <span className="ml-2">({totalCount} total)</span>
            )}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950">
        <div className="grid grid-cols-6 gap-4 border-b border-slate-800 px-4 py-2 text-sm text-slate-400">
          <span>Member</span>
          <span>Month</span>
          <span>Amount</span>
          <span>Date</span>
          <span>Method</span>
          <span>Actions</span>
        </div>
        {payments.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-400">No payments recorded.</p>
        ) : (
          <>
            {payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-6 gap-4 border-b border-slate-900 px-4 py-2 text-sm items-center">
                <span className="font-medium text-slate-100">{payment.member.name}</span>
                <span className="text-slate-300">{payment.month.name}</span>
                <span className="text-emerald-400">{formatCurrency(payment.amount)}</span>
                <span className="text-slate-400">
                  {new Date(payment.date).toLocaleDateString()}
                </span>
                <span className="text-slate-300">{payment.method}</span>
                <div>
                  {(session.role === "ADMIN" || payment.memberId === session.id) && (
                    <DeletePaymentButton paymentId={payment.id} />
                  )}
                </div>
              </div>
            ))}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/payments"
            />
          </>
        )}
      </div>
    </div>
  );
}

