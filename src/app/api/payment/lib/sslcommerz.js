export async function initiateSslcommerzPayment(
  orderTotal,
  cartId,
  shippingAddressId,
  user,
  address
) {
  try {
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const baseUrl =
      process.env.SSLCOMMERZ_MODE === "sandbox"
        ? "https://sandbox.sslcommerz.com"
        : "https://securepay.sslcommerz.com";

    const tranId = `TXN_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const customData = JSON.stringify({
      cartId,
      shippingAddressId,
      userId: user.id,
      paymentMethod: "SSLCOMMERZ",
    });

    const postData = {
      store_id: storeId,
      store_passwd: storePass,
      total_amount: orderTotal.toFixed(2),
      currency: "BDT",
      tran_id: tranId,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sslcommerz/success`,
      fail_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sslcommerz/fail`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sslcommerz/cancel`,
      ipn_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/sslcommerz/ipn`,
      cus_name: address?.name || user.name || "Customer",
      cus_email: address?.email || user.email || "customer@example.com",
      cus_add1: address?.street || "N/A",
      cus_city: address?.city || "N/A",
      cus_country: address?.country || "Bangladesh",
      cus_phone: address?.phoneNumber || "01700000000",
      shipping_method: "NO",
      product_name: "Order",
      product_category: "General",
      product_profile: "general",
      value_a: customData,
    };

    const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(postData).toString(),
    });

    const result = await response.json();

    if (result.status === "SUCCESS" && result.GatewayPageURL) {
      return { success: true, redirectUrl: result.GatewayPageURL };
    } else {
      return {
        success: false,
        error: result.failedreason || "Failed to initiate payment",
      };
    }
  } catch (error) {
    console.error("SSLCOMMERZ payment error:", error);
    return { success: false, error: "Server error during SSLCOMMERZ payment" };
  }
}
