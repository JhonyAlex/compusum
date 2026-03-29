import { NextResponse } from 'next/server';
import { searchProductSuggestions } from '@/lib/product-search';

// GET /api/products/suggestions?q=term - Quick autocomplete suggestions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await searchProductSuggestions(query, 5);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
