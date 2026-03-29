import { NextResponse } from "next/server";

export function GET() {
  // Use a relative Location header to avoid leaking internal hosts like 0.0.0.0.
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: "/logo.svg",
    },
  });
}
