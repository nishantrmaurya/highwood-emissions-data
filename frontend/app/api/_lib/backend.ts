import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function proxyBackend(
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": contentType || "text/plain",
    },
  });
}
