import { type NextRequest } from "next/server";
import { proxyBackend } from "@/app/api/_lib/backend";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();

  return proxyBackend(`/sites/${id}/measurements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
