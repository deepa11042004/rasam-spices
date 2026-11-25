/**
 * Serves admin-uploaded dish images that were stored by the earlier
 * disk-based implementation, as "/media/dishes/<file>".
 *
 * The files now live with the backend, so this route simply forwards the
 * request to it and streams the image back. That keeps every URL saved in the
 * database working. New uploads are stored in Vercel Blob and never come here.
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Expect exactly ["dishes", "<file>"]. Anything else is not ours to serve.
  if (!Array.isArray(segments) || segments.length !== 2 || segments[0] !== "dishes") {
    return new Response("Not found", { status: 404 });
  }

  try {
    const upstream = await fetch(
      `${BACKEND_URL}/media/dishes/${encodeURIComponent(segments[1])}`,
      { cache: "no-store" },
    );

    if (!upstream.ok || !upstream.body) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
