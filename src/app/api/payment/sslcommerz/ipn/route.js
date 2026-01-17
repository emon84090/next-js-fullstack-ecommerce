// app/api/payment/sslcommerz/ipn/route.js

import { getInvoiceWithOrderDetails } from "@/lib/ordershelper/orderhelper";
import { sendInvoiceEmail } from "@/lib/otpinvoice";
import { generatePdfBuffer } from "@/lib/pdfgeneratehelper";
import { prisma } from "@/lib/prisma";
import { sendOrderEmail } from "@/lib/sendOrderEmail";
import { createAdminOrderEmail } from "@/lib/template/createAdminOrderEmail";
import { createCustomerOrderEmail } from "@/lib/template/createCustomerOrderEmail";
import { NextResponse } from "next/server";

async function verifySslcommerzIpn(val_id) {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const baseUrl =
    process.env.SSLCOMMERZ_MODE === "sandbox"
      ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
      : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

  const url = `${baseUrl}?val_id=${encodeURIComponent(
    val_id
  )}&store_id=${storeId}&store_passwd=${storePass}&v=1&format=json`;

  const res = await fetch(url);
  const json = await res.json(); // Check if transaction status is VALID or VALIDATED

  return json.status === "VALID" || json.status === "VALIDATED";
}

async function generateInvoicePdf(order) {
  const invoiceNumber = `INV-${order.id.slice(0, 8)}-${new Date().getTime()}`;
  const mockUrl = `https://your-storage-bucket.com/invoices/${invoiceNumber}.pdf`;
  return { invoiceNumber, url: mockUrl };
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const { tran_id, status, val_id, value_a: customData } = data;

    if (!val_id) {
      return NextResponse.json(
        { success: false, message: "Missing val_id for verification" },
        { status: 400 }
      );
    }

    const isVerified = await verifySslcommerzIpn(val_id);
    if (!isVerified) {
      return NextResponse.json(
        { success: false, message: "IPN verification failed" },
        { status: 403 }
      );
    }

    if (status !== "VALID" && status !== "VALIDATED") {
      return NextResponse.json({
        success: true,
        message: "Transaction not successful",
      });
    } // Prevent duplicate orders

    const existingOrder = await prisma.order.findUnique({
      where: { transactionNumber: tran_id },
    });
    if (existingOrder) {
      return NextResponse.json({
        success: true,
        message: "Order already processed",
      });
    }
    const { cartId, shippingAddressId, userId, paymentMethod } =
      JSON.parse(customData);

    const [cart, address, paymentMethodRecord, user] = await Promise.all([
      prisma.cart.findUnique({
        where: { id: cartId, userId },
        include: { items: { include: { product: true } } },
      }),
      prisma.address.findUnique({
        where: { id: shippingAddressId, userId },
      }),
      prisma.paymentMethod.findUnique({ where: { name: paymentMethod } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (
      !cart ||
      !address ||
      !paymentMethodRecord ||
      !user ||
      cart.items.length === 0
    ) {
      return NextResponse.json({ success: false, error: "Missing data" });
    }

    const deliveryFeeRecord = await prisma.deliveryFee.findFirst({
      where: {
        country: address.country,
        OR: [{ city: address.city }, { city: null }],
      },
    });

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = deliveryFeeRecord?.amount || 150;
    const orderTotal = subtotal + deliveryFee;

    const groupedItems = new Map();
    for (const item of cart.items) {
      const key = item.productId;
      groupedItems.set(key, {
        ...item,
        quantity: (groupedItems.get(key)?.quantity || 0) + item.quantity,
      });
    }
    const uniqueCartItems = Array.from(groupedItems.values());

    const productsInCart = await prisma.product.findMany({
      where: { id: { in: uniqueCartItems.map((item) => item.productId) } },
      select: { id: true, stockAmount: true, name: true },
    });

    for (const item of uniqueCartItems) {
      const product = productsInCart.find((p) => p.id === item.productId);
      if (!product || product.stockAmount < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product?.name || "Unknown"}` },
          { status: 409 }
        );
      }
    }

    const order = await prisma.$transaction(
      async (tx) => {
        const updatePromises = uniqueCartItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stockAmount: { decrement: item.quantity },
              totalSales: { increment: item.quantity },
            },
          })
        );
        await Promise.all(updatePromises);

        const newOrder = await tx.order.create({
          data: {
            userId: user.id,
            shippingAddressId,
            paymentMethodId: paymentMethodRecord.id,
            transactionNumber: tran_id,
            orderTotal,
            deliveryFee,
            status: "PROCESSING",
            isPaid: true,
            isInvoiceGenerated: true,
          },
        });

        await tx.orderItem.createMany({
          data: uniqueCartItems.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            pricePaid: item.product.price,
            productSnapshot: {
              name: item.product.name,
              price: item.product.price,
              selectedSize: item.selectedSize || null,
              selectedColor: item.selectedColor || null,
            },
          })),
        }); // Clear cart

        await tx.cartItem.deleteMany({ where: { cartId } });

        const newInvoiceData = await generateInvoicePdf(newOrder);
        await tx.invoice.create({
          data: {
            invoiceNumber: newInvoiceData.invoiceNumber,
            order: { connect: { id: newOrder.id } },
            invoiceUrl: newInvoiceData.url,
          },
        });

        return newOrder;
      },
      {
        timeout: 10000,
      }
    );

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        paymentMethod: true,
        invoice: true,
        items: {
          select: {
            id: true,
            quantity: true,
            pricePaid: true,
            productSnapshot: true,
          },
        },
      },
    });

    try {
      const invoice = await getInvoiceWithOrderDetails(updatedOrder.invoice.id);
      const pdfBuffer = await generatePdfBuffer(invoice);

      await sendOrderEmail({
        email: user.email,
        subject: "Your Order Confirmation",
        html: createCustomerOrderEmail(updatedOrder, user),
      });

      await sendOrderEmail({
        email: process.env.ADMIN_EMAIL,
        subject: `New Order #${updatedOrder.id} Placed`,
        html: createAdminOrderEmail(updatedOrder, user),
      });

      await sendInvoiceEmail({
        recipientEmail: invoice.order.user.email,
        recipientName: invoice.order.user.name,
        invoiceNumber: invoice.invoiceNumber,
        orderId: invoice.order.id,
        orderTotal: invoice.order.orderTotal,
        pdfBuffer,
      });
    } catch (postProcessingError) {
      console.error(
        "Failed to perform post-order tasks (emails, PDF):",
        postProcessingError
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IPN processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
export async function GET(params) {
  return NextResponse.json({ success: true });
}
