import { type NextRequest } from "next/server";
import { proxyBackend } from "@/app/api/_lib/backend";

export async function GET() {
  return proxyBackend("/site", { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  return proxyBackend("/site", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
