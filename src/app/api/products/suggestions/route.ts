import { NextResponse } from 'next/server';
import { searchProductSuggestions } from '@/lib/product-search';
import { isGlobalCatalogModeEnabled, sanitizeProductsForCatalog } from '@/lib/catalog-mode';
import { attachResolvedPrices } from '@/lib/pricing';
import { getSessionPricingContext } from '@/lib/pricing-context';

// GET /api/products/suggestions?q=term - Quick autocomplete suggestions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const [isCatalogMode, suggestions] = await Promise.all([
      isGlobalCatalogModeEnabled(),
      searchProductSuggestions(query, 5),
    ]);

    // Motor único de precios: resolvedPrice por sesión (batch, sin N+1)
    const pricingCtx = await getSessionPricingContext();
    const pricedSuggestions = await attachResolvedPrices(
      sanitizeProductsForCatalog(suggestions, isCatalogMode),
      pricingCtx
    );

    return NextResponse.json({ suggestions: pricedSuggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
