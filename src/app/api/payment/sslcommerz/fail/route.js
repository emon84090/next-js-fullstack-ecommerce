import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    let params = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      params = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      params = typeof json === "object" ? json : {};
    } else {
      const text = await req.text();
      params = Object.fromEntries(new URLSearchParams(text));
    }

    console.log("[SSLCommerz][FAIL] payload:", params);

    const allowed = [
      "tran_id",
      "val_id",
      "amount",
      "currency",
      "status",
      "error",
    ];
    const redirectParams = new URLSearchParams();

    for (const [k, v] of Object.entries(params)) {
      if (allowed.includes(k) || k.startsWith("cus_") || k === "card_type") {
        redirectParams.set(k, String(v));
      }
    }

    if ([...redirectParams].length === 0) {
      redirectParams.set("status", "FAILED");
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    const redirectPath = `/payment/sslcommerz/fail?${redirectParams.toString()}`;
    const redirectUrl = `${cleanBaseUrl}${redirectPath}`;

    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("[SSLCommerz][FAIL] error:", err);
    return NextResponse.json(
      { error: "internal_server_error", details: err.message },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ ok: true, route: "sslcommerz/fail" });
}
