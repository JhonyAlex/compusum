import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: id } = await params;
    await db.product.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 404 });
  }
}
