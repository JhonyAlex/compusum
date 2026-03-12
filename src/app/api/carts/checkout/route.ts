import { NextResponse } from 'next/server';
import { processCheckout } from '@/lib/checkout';

export async function POST(req: Request) {
  try {
    const checkoutData = await req.json();

    if (!checkoutData.items || checkoutData.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!checkoutData.cityId || !checkoutData.cartId) {
      return NextResponse.json({ error: 'cityId and cartId are required' }, { status: 400 });
    }

    const result = await processCheckout(checkoutData);

    return NextResponse.json({
        message: 'Checkout successful',
        orderNumber: result.order.orderNumber,
        route: result.route
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || 'An error occurred during checkout' }, { status: 500 });
  }
}
