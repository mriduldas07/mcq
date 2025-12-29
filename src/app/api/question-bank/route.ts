import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await prisma.questionBank.findMany({
      where: {
        teacherId: session.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Question bank API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
