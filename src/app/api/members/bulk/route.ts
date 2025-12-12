import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { members } = body;

  if (!Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: "Members array is required" }, { status: 400 });
  }

  // Validate all members have name and phone
  for (const member of members) {
    if (!member.name || !member.phone) {
      return NextResponse.json({ error: "All members must have name and phone" }, { status: 400 });
    }
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

    if (currentMemberCount + members.length > settings.maxMembers) {
      return NextResponse.json(
        { error: `Adding ${members.length} members would exceed the limit of ${settings.maxMembers}. You can only add ${settings.maxMembers - currentMemberCount} more member(s).` },
        { status: 400 }
      );
    }
  }

  // Create all members in a transaction
  try {
    // Hash all passwords first
    const membersWithHashedPasswords = await Promise.all(
      members.map(async (member, index) => {
        // Generate a unique email for members
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const nameSlug = member.name.replace(/\s+/g, '-').toLowerCase().substring(0, 20);
        const memberEmail = `member-${timestamp}-${index}-${random}-${nameSlug}@chitty.local`;
        // Generate a random password (members won't use it)
        const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        return {
          name: member.name.trim(),
          email: memberEmail,
          phone: member.phone.trim(),
          password: hashedPassword
        };
      })
    );

    const createdMembers = await prisma.$transaction(
      membersWithHashedPasswords.map((memberData) =>
        prisma.user.create({
          data: {
            name: memberData.name,
            email: memberData.email,
            phone: memberData.phone,
            role: "MEMBER",
            password: memberData.password,
            chittyId: session.chittyId,
            parentAdminId: session.id
          }
        })
      )
    );

    return NextResponse.json({ 
      members: createdMembers,
      added: createdMembers.length
    });
  } catch (error: any) {
    console.error("Bulk member creation error:", error);
    return NextResponse.json(
      { error: "Failed to create members. Some members may have been created. Please check and try again." },
      { status: 500 }
    );
  }
}

