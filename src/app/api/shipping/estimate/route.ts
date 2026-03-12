import { NextResponse } from 'next/server';
import { getShippingEstimation } from '@/lib/shipping-calc';

export async function POST(req: Request) {
  try {
    const { cityId } = await req.json();

    if (!cityId) {
      return NextResponse.json({ error: 'cityId is required' }, { status: 400 });
    }

    const estimation = await getShippingEstimation(cityId);

    return NextResponse.json(estimation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
