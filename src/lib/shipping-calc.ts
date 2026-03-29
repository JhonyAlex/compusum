import { db } from './db';
import { differenceInHours } from 'date-fns';
import { getNextRouteDeparture, buildRouteMessage } from './route-schedule';

export async function getShippingEstimation(cityId: string) {
  const now = new Date();

  // Busca la ruta activa asignada a esta ciudad
  const city = await db.city.findUnique({
    where: { id: cityId },
    include: {
      shippingRoute: true,
    },
  });

  if (!city || !city.shippingRoute || !city.shippingRoute.isActive) {
    return {
      status: 'unavailable',
      message: 'Actualmente no tenemos rutas programadas para esta ciudad. Te contactaremos pronto.',
    };
  }

  const route = city.shippingRoute;
  const departureDaysOfWeek = route.departureDaysOfWeek || [1]; // fallback a lunes si no existe

  try {
    const { nextDepartureDate, daysUntilDeparture, dayName } = getNextRouteDeparture(now, departureDaysOfWeek);

    // Verifica si el cutoff ha pasado
    if (route.cutOffTime && route.cutOffTime <= now) {
      return {
        status: 'cutoff_passed',
        routeId: route.id,
        message: `El corte para la próxima salida (${dayName}) ya cerró. Contáctanos para confirmar.`,
      };
    }

    const hoursLeft = route.cutOffTime ? Math.max(0, differenceInHours(route.cutOffTime, now)) : null;

    const feedbackMessage = buildRouteMessage(
      daysUntilDeparture,
      dayName,
      route.estimatedDaysMin,
      route.estimatedDaysMax
    );

    return {
      status: 'available',
      routeId: route.id,
      message: feedbackMessage,
      routeName: route.name,
      nextDepartureDate,
      daysUntilDeparture,
      cutOffTime: route.cutOffTime,
      hoursLeft,
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Error al calcular la ruta. Por favor intenta de nuevo.',
    };
  }
}
