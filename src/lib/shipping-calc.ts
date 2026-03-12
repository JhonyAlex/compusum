import { db } from './db';
import { differenceInHours, isToday, isTomorrow, format } from 'date-fns';

export async function getShippingEstimation(cityId: string) {
  const now = new Date();

  const nextRoute = await db.shippingRoute.findFirst({
    where: {
      cities: { some: { id: cityId } },
      isActive: true,
      cutOffTime: { gt: now }
    },
    orderBy: { departureDate: 'asc' }
  });

  if (!nextRoute || !nextRoute.departureDate || !nextRoute.cutOffTime) {
    return { message: "Actualmente no tenemos rutas programadas para esta ciudad. Te contactaremos pronto." };
  }

  const hoursLeft = differenceInHours(nextRoute.cutOffTime, now);
  const routeDate = nextRoute.departureDate;
  let feedbackMessage = "";

  if (isToday(routeDate)) {
     feedbackMessage = "¡Estamos en tu ciudad hoy! Ingresa tu pedido antes de que termine el día.";
  } else if (isTomorrow(routeDate)) {
     feedbackMessage = `El próximo envío a tu ciudad es mañana. Te quedan ${hoursLeft} horas para que tu pedido entre en esta ruta.`;
  } else {
     feedbackMessage = `El próximo envío a tu ciudad es el ${format(routeDate, 'dd/MM/yyyy')}. Tienes ${hoursLeft} horas para que entre en la ruta.`;
  }

  return { routeId: nextRoute.id, message: feedbackMessage };
}
