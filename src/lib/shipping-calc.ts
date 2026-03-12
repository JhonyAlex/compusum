import { db } from './db';
import { differenceInHours, isToday, isTomorrow, format } from 'date-fns';

export async function getShippingEstimation(cityId: string) {
  const now = new Date();

  const upcomingRoutes = await db.shippingRoute.findMany({
    where: {
      cities: { some: { id: cityId } },
      isActive: true,
      departureDate: { not: null },
    },
    orderBy: { departureDate: 'asc' },
    take: 8,
  });

  if (!upcomingRoutes.length) {
    return {
      status: 'unavailable',
      message: 'Actualmente no tenemos rutas programadas para esta ciudad. Te contactaremos pronto.',
    };
  }

  const openRoute = upcomingRoutes.find((route) => !route.cutOffTime || route.cutOffTime > now);
  if (!openRoute || !openRoute.departureDate) {
    const firstRoute = upcomingRoutes[0];
    return {
      status: 'cutoff_passed',
      routeId: firstRoute.id,
      message: `El corte para la ruta del ${format(firstRoute.departureDate as Date, 'dd/MM/yyyy')} ya cerró. Contáctanos para confirmar la próxima salida.`,
    };
  }

  const hoursLeft = openRoute.cutOffTime ? Math.max(0, differenceInHours(openRoute.cutOffTime, now)) : null;
  const routeDate = openRoute.departureDate;
  let feedbackMessage = '';

  if (isToday(routeDate)) {
    feedbackMessage = 'Estamos en tu ciudad hoy. Aún puedes ingresar tu pedido para esta ruta.';
  } else if (isTomorrow(routeDate)) {
    feedbackMessage = hoursLeft !== null
      ? `El próximo envío a tu ciudad es mañana. Te quedan ${hoursLeft} horas para que tu pedido entre en esta ruta.`
      : 'El próximo envío a tu ciudad es mañana.';
  } else {
    feedbackMessage = hoursLeft !== null
      ? `El próximo envío a tu ciudad es el ${format(routeDate, 'dd/MM/yyyy')}. Tienes ${hoursLeft} horas para que entre en la ruta.`
      : `El próximo envío a tu ciudad es el ${format(routeDate, 'dd/MM/yyyy')}.`;
  }

  return {
    status: 'available',
    routeId: openRoute.id,
    message: feedbackMessage,
    routeName: openRoute.name,
    departureDate: routeDate,
    cutOffTime: openRoute.cutOffTime,
    estimatedDaysMin: openRoute.estimatedDaysMin,
    estimatedDaysMax: openRoute.estimatedDaysMax,
    hoursLeft,
  };
}
