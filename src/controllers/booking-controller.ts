import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import bookingService from '../services/booking-service';
import { badRequestError, forbiddenError } from '@/errors';

//Rota para listar uma reserva.
export const listBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req;
    const booking = await bookingService.getBookingByUserId(userId);
    return res.status(200).send({
      id: booking.id,
      Room: booking.Room,
    });
  } catch (error) {
    if (error instanceof badRequestError || error instanceof forbiddenError) {
      return res.sendStatus(400);
    }

    next(error);
  }
};

//Rota para criar uma reserva.

export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req;
    const { roomId } = req.body as Record<string, number>;

    if (!roomId) throw badRequestError();

    await bookingService.verifyEnrollmentTicket(userId);
    await bookingService.checkBookingValidity(roomId);

    const booking = await bookingService.createBooking({ roomId, userId });

    return res.status(200).send({
      bookingId: booking.id,
    });
  } catch (error) {
    if (error instanceof badRequestError || error instanceof forbiddenError) {
      return res.sendStatus(400);
    }

    next(error);
  }
};

//Rota para editar uma reserva.

export const editBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { userId } = req;
  const bookingId = Number(req.params.bookingId);

  if (!bookingId) return res.sendStatus(400);

  try {
    const { roomId } = req.body as Record<string, number>;
    await bookingService.checkBookingValidity(roomId);
    const booking = await bookingService.getBookingByUserId(userId);

    if (!booking || booking.userId !== userId) throw forbiddenError();

    await bookingService.editBooking({
      id: booking.id,
      roomId,
      userId,
    });

    return res.status(200).send({
      bookingId: booking.id,
    });
  } catch (error) {
    if (error instanceof badRequestError || error instanceof forbiddenError) {
      return res.sendStatus(400);
    }

    next(error);
  }
};
