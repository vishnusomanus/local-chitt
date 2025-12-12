import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST as createPayment } from "@/app/api/months/[id]/payments/route";
import { Role } from "@prisma/client";

const mockPrisma = {
  month: {
    findUnique: vi.fn()
  },
  user: {
    findUnique: vi.fn()
  },
  payment: {
    aggregate: vi.fn(),
    create: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  }
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockAuth = { requireUser: vi.fn() };
vi.mock("@/lib/auth", () => mockAuth);

const mockSettings = { getSettings: vi.fn() };
vi.mock("@/lib/chitty", () => mockSettings);

describe("payments route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuth.requireUser.mockResolvedValue({
      id: 1,
      role: Role.ADMIN,
      email: "admin@test.com",
      name: "Admin"
    });
    mockSettings.getSettings.mockResolvedValue({
      allowOverCollection: false
    });
    mockPrisma.month.findUnique.mockResolvedValue({
      id: 10,
      index: 1,
      target: 50000
    });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, name: "Admin" });
    mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    mockPrisma.payment.create.mockResolvedValue({ id: 123 });
  });

  it("blocks over-collection for members", async () => {
    mockAuth.requireUser.mockResolvedValue({
      id: 2,
      role: Role.MEMBER,
      email: "m@test.com",
      name: "Member"
    });
    mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 49000 } });
    const req = new Request("http://localhost/api/months/10/payments", {
      method: "POST",
      body: JSON.stringify({ amount: 2000, method: "cash" })
    });
    const res = await createPayment(req, { params: { id: "10" } });
    expect(res.status).toBe(400);
  });

  it("allows admin to add payment", async () => {
    const req = new Request("http://localhost/api/months/10/payments", {
      method: "POST",
      body: JSON.stringify({ amount: 5000, method: "upi", memberId: 1 })
    });
    const res = await createPayment(req, { params: { id: "10" } });
    expect(res.status).toBe(200);
    expect(mockPrisma.payment.create).toHaveBeenCalled();
  });
});

