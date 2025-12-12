import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  let session;
  try {
    session = await requireAdmin();
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admins can only see their own members
  const members = await prisma.user.findMany({
    where: { 
      chittyId: session.chittyId, 
      deletedAt: null,
      parentAdminId: session.id,
      role: "MEMBER"
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true, role: true, parentAdminId: true }
  });
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, email, phone, role = "MEMBER", password } = body;

  // Validate based on role
  if (role === "ADMIN") {
    // Only Vishnu can add admins
    const currentUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (!currentUser || currentUser.name !== "Vishnu") {
      return NextResponse.json({ error: "Only Vishnu can add admins" }, { status: 403 });
    }

    // Admins need: name, email, phone, password
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Name, email, phone, and password are required for admins" }, { status: 400 });
    }

    // Check if user already exists in this chitty
    const existing = await prisma.user.findFirst({
      where: { email, chittyId: session.chittyId, deletedAt: null }
    });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists in this chitty" }, { status: 400 });
    }

    // Ensure only one admin per chitty (excluding Vishnu)
    const existingAdmin = await prisma.user.findFirst({
      where: { chittyId: session.chittyId, role: "ADMIN", deletedAt: null, name: { not: "Vishnu" } }
    });
    if (existingAdmin) {
      return NextResponse.json({ error: "Only one additional admin allowed per chitty" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: { name, email, phone, role: "ADMIN", password: hashed, chittyId: session.chittyId }
    });

    return NextResponse.json({ member: admin });
  } else {
    // Members need: name, phone (no email, no password)
    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required for members" }, { status: 400 });
    }

    // Check member count limit based on admin's settings
    const settings = await prisma.setting.findUnique({
      where: { adminId: session.id }
    });

    if (settings && settings.maxMembers) {
      const currentMemberCount = await prisma.user.count({
        where: {
          chittyId: session.chittyId,
          parentAdminId: session.id,
          role: "MEMBER",
          deletedAt: null
        }
      });

      if (currentMemberCount >= settings.maxMembers) {
        return NextResponse.json(
          { error: `Maximum member limit reached. You can only add ${settings.maxMembers} members for ${settings.monthsCount} installments.` },
          { status: 400 }
        );
      }
    }

    // Generate a unique email for members (they don't need to login)
    const memberEmail = `member-${Date.now()}-${Math.random().toString(36).substring(7)}@chitty.local`;
    // Generate a random password (members won't use it)
    const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const hashed = await bcrypt.hash(randomPassword, 10);

    const member = await prisma.user.create({
      data: { 
        name, 
        email: memberEmail, 
        phone, 
        role: "MEMBER", 
        password: hashed, 
        chittyId: session.chittyId,
        parentAdminId: session.id // Assign the creating admin as parent
      }
    });

    return NextResponse.json({ member });
  }
}

