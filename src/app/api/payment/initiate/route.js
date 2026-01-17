import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { NextResponse } from "next/server";
import { initiateSslcommerzPayment } from "../lib/sslcommerz";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cartId, shippingAddressId, paymentMethod } = await request.json();

    if (!cartId || !shippingAddressId || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [cart, address, deliveryFeeRecord] = await Promise.all([
      prisma.cart.findUnique({
        where: { id: cartId, userId: user.id },
        include: { items: { include: { product: true } } },
      }),
      prisma.address.findUnique({
        where: { id: shippingAddressId, userId: user.id },
      }),
      prisma.deliveryFee.findFirst({
        where: {
          country: user.country,
          OR: [{ city: user.city }, { city: null }],
        },
      }),
    ]);

    if (!cart || !address) {
      return NextResponse.json(
        { error: "Invalid cart or address" },
        { status: 400 }
      );
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = deliveryFeeRecord?.amount || 150;
    const orderTotal = subtotal + deliveryFee;

    let redirectUrl;
    let paymentResult;

    switch (paymentMethod.toUpperCase()) {
      case "SSLCOMMERZ":
        paymentResult = await initiateSslcommerzPayment(
          orderTotal,
          cartId,
          shippingAddressId,
          user,
          address
        );
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported payment method" },
          { status: 400 }
        );
    }

    if (paymentResult.success) {
      return NextResponse.json({ redirectUrl: paymentResult.redirectUrl });
    } else {
      return NextResponse.json({ error: paymentResult.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Server error during payment initiation" },
      { status: 500 }
    );
  }
}
