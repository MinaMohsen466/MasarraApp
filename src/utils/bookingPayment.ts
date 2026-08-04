/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Payment predicates shared by Order History, My Events and the profile
 * counters.
 *
 * A booking has two independent axes: `status` (did the vendor accept it) and
 * `paymentStatus` (did the customer pay). `status === 'confirmed'` only means
 * the vendor approved it — the customer then has a 24h window to pay, after
 * which the server's cleanup cron cancels the whole booking. Treating
 * "confirmed" as "paid" is what let an unpaid order render a paid receipt and
 * show up as a real event.
 *
 * These live in one module on purpose: the profile counters have to apply the
 * exact same rule as the screens they link to, or the numbers disagree with
 * the lists.
 */

export const isFreeBooking = (booking: any) => booking?.totalPrice === 0;

/**
 * True when this specific service line has been paid for (or costs nothing).
 * Mirrors the server's `paymentStatus` virtual, which also counts a zero-price
 * line as paid.
 */
export const isPaidOrFreeService = (serviceEntry: any, booking: any) => {
  return (
    serviceEntry?.price === 0 ||
    isFreeBooking(booking) ||
    serviceEntry?.paymentStatus === 'paid' ||
    booking?.paymentStatus === 'paid'
  );
};

/**
 * The rows My Events renders: one per upcoming, non-cancelled, paid service.
 * Unpaid ones are still orders awaiting payment and belong in Order History.
 */
export const isActiveEventService = (
  serviceEntry: any,
  booking: any,
  now: Date = new Date(),
) => {
  if (serviceEntry?.status === 'cancelled') return false;
  if (!isPaidOrFreeService(serviceEntry, booking)) return false;

  const eventDate = serviceEntry?.eventDate || booking?.eventDate;
  if (!eventDate) return true;

  // An event counts as "passed" only after its day ends.
  const eventDay = new Date(eventDate);
  eventDay.setHours(23, 59, 59, 999);
  return eventDay >= now;
};
