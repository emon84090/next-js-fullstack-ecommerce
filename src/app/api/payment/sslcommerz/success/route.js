// app/api/payment/sslcommerz/success/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const tran_id = formData.get("tran_id");

    if (!tran_id) {
      return NextResponse.redirect(
        new URL("/order/error", process.env.NEXT_PUBLIC_BASE_URL),
        { status: 303 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { transactionNumber: tran_id },
    });

    if (!order) {
      const redirectUrl = new URL(
        "/orders/pending",
        process.env.NEXT_PUBLIC_BASE_URL
      );
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    return NextResponse.redirect(
      new URL(`/orders/confirm/${order.id}`, process.env.NEXT_PUBLIC_BASE_URL),
      { status: 303 }
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL("/order/error", process.env.NEXT_PUBLIC_BASE_URL),
      { status: 303 }
    );
  }
}
