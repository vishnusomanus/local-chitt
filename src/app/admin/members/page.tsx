import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MemberForm } from "@/components/MemberForm";
import { BulkMemberForm } from "@/components/BulkMemberForm";
import { AdminForm } from "@/components/AdminForm";
import { MemberFormToggle } from "@/components/MemberFormToggle";

export default async function MembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const adminSession = await requireAdmin();
  const currentUser = await prisma.user.findUnique({ where: { id: adminSession.id } });
  const isVishnu = currentUser?.name === "Vishnu";

  // Get admin's settings to show member limit
  const settings = await prisma.setting.findUnique({
    where: { adminId: adminSession.id }
  });

  // Admins can only see their own members
  const regularMembers = await prisma.user.findMany({
    where: { 
      chittyId: adminSession.chittyId, 
      deletedAt: null,
      parentAdminId: adminSession.id,
      role: "MEMBER"
    },
    orderBy: { name: "asc" },
    include: { parentAdmin: { select: { name: true } } }
  });

  // Get all admins in the chitty (for display)
  const admins = await prisma.user.findMany({
    where: { 
      chittyId: adminSession.chittyId, 
      deletedAt: null,
      role: "ADMIN"
    },
    orderBy: { name: "asc" }
  });

  const currentMemberCount = regularMembers.length;
  const maxMembers = settings?.maxMembers || (settings?.monthsCount ? settings.monthsCount - 1 : 0);
  const canAddMore = maxMembers === 0 || currentMemberCount < maxMembers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Members & Admins</h1>
          <p className="mt-1 text-slate-400">Manage participants and administrators in your chitty</p>
        </div>
      </div>

      {/* Stats Cards */}
      {settings && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <p className="text-sm font-medium text-slate-400">Installments</p>
              <p className="mt-2 text-2xl font-bold text-slate-100">{settings.monthsCount}</p>
              <p className="mt-1 text-xs text-slate-500">Total duration</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <p className="text-sm font-medium text-slate-400">Installment Amount</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">₹{settings.monthlyAmount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">Per month per member</p>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-xl border p-6 shadow-lg transition-all ${
            canAddMore 
              ? "border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
              : "border-amber-500/50 bg-gradient-to-br from-amber-950/50 to-slate-950 hover:border-amber-400 hover:shadow-amber-500/20"
          }`}>
            <div className={`absolute inset-0 transition-opacity group-hover:opacity-100 ${
              canAddMore
                ? "bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0"
                : "bg-gradient-to-br from-amber-500/10 to-transparent opacity-50"
            }`} />
            <div className="relative">
              <p className="text-sm font-medium text-slate-400">Members</p>
              <p className={`mt-2 text-2xl font-bold ${canAddMore ? "text-slate-100" : "text-amber-400"}`}>
                {currentMemberCount} / {maxMembers || "∞"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {canAddMore ? `${maxMembers - currentMemberCount} slots available` : "Limit reached"}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-blue-500/50 hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <p className="text-sm font-medium text-slate-400">Total Amount</p>
              <p className="mt-2 text-2xl font-bold text-blue-400">
                ₹{(settings.monthlyAmount * settings.monthsCount).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Per member total</p>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
          <MemberFormToggle disabled={!canAddMore} />
        </div>
        {isVishnu && (
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
            <AdminForm />
          </div>
        )}
      </div>

      {/* Admins Section */}
      {admins.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Admins</h2>
            <p className="mt-1 text-sm text-slate-400">Administrators in this chitty</p>
          </div>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 transition-all hover:border-blue-500/50 hover:bg-slate-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{admin.name}</p>
                    <p className="text-xs text-slate-400">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-300">{admin.phone || "-"}</span>
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-400">
                    {admin.role}
                  </span>
                  <span className="text-slate-400">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Section */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">My Members</h2>
            <p className="mt-1 text-sm text-slate-400">Members you have added to this chitty</p>
          </div>
          {regularMembers.length > 0 && (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-400">
              {regularMembers.length} member{regularMembers.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {regularMembers.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-sm text-slate-400">No members yet</p>
            <p className="mt-1 text-xs text-slate-500">Add your first member using the form above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {regularMembers.map((member) => (
              <div
                key={member.id}
                className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.phone || "No phone"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                    {member.role}
                  </span>
                  <span className="text-slate-400">
                    {new Date(member.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

