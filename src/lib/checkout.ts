import { db } from './db';
import { hashPassword } from './auth';

export async function processCheckout(checkoutData: any) {
  const { phone, email, name, items, cityId, cartId } = checkoutData;

  // 1. Lógica Upsert: Buscar por teléfono primero, luego por email
  let customer: any = null;
  if (phone) {
    customer = await db.user.findUnique({ where: { phone } });
  }
  if (!customer && email) {
      customer = await db.user.findUnique({ where: { email } });
  }

  let assignedAgentId = null;

  if (customer) {
    // Existe: Respetar su asesor comercial previo (si lo tiene)
    assignedAgentId = customer.assignedAgentId;
  } else {
    // Nuevo: Crear perfil, se deja libre para asignación (o se asigna round-robin)
    // Here we must provide a dummy password because the DB requires it
    customer = await db.user.create({
      data: {
        phone: phone || null,
        email: email || null,
        name: name || 'Nuevo Cliente',
        role: 'CUSTOMER',
        password: await hashPassword(Math.random().toString(36).slice(-8))
      }
    });
  }

  // 2. Encontrar la ruta logística válida más cercana
  const availableRoute = await db.shippingRoute.findFirst({
    where: {
      cities: { some: { id: cityId } },
      cutOffTime: { gt: new Date() }, // El cut-off time aún no ha pasado
      isActive: true
    },
    orderBy: { departureDate: 'asc' }
  });

  // 3. Crear Pedido
  const order = await db.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      cartId, // Requires an existing cart
      customerId: customer.id,
      customerName: customer.name,
      agentId: assignedAgentId,
      cityId,
      routeId: availableRoute?.id,
      subtotal: calculateTotal(items), // Calculado de forma segura en el backend
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName || "Product",
          quantity: item.quantity,
          unitPrice: item.price // Snapshot del precio actual
        }))
      }
    }
  });

  return { order, route: availableRoute };
}

function calculateTotal(items: any[]) {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}
