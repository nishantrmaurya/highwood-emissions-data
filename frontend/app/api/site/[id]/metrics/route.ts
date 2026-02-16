import { proxyBackend } from "@/app/api/_lib/backend";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyBackend(`/site/${id}/metrics`, { method: "GET" });
}
