import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { name, email, password } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if user already exists in any chitty
  const existingUser = await prisma.user.findFirst({
    where: { email, deletedAt: null }
  });
  if (existingUser) {
    return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
  }

  const totalUsers = await prisma.user.count({ where: { deletedAt: null } });
  const isFirstUser = totalUsers === 0;
  
  let chittyId: number;
  let role: string;

  if (isFirstUser) {
    // First user becomes admin and creates a new chitty
    const chitty = await prisma.chitty.create({
      data: { name: `${name}'s Chitty` }
    });
    chittyId = chitty.id;
    role = "ADMIN";
  } else {
    // For now, new users join the first chitty as members
    // In a real multi-tenant system, you'd need an invite/join mechanism
    const firstChitty = await prisma.chitty.findFirst();
    if (!firstChitty) {
      return NextResponse.json({ error: "No chitty available" }, { status: 500 });
    }
    chittyId = firstChitty.id;
    role = "MEMBER";
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, chittyId }
  });

  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
}

