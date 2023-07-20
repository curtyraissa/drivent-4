import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import bookingService from '../services/booking-service';
import {
  badRequestError,
  forbiddenError,
  unauthorizedError,
  notFoundError
} from '@/errors';

// Rota para listar uma reserva
export const listBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req;
    const booking = await bookingService.getBookingByUserId(userId);
    return res.status(200).send({
      id: booking.id,
      Room: booking.Room,
    });
  } catch (error) {
    next(error);
  }
};


// Rota para criar uma reserva
export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req;
    const { roomId } = req.body as Record<string, number>;

    await bookingService.verifyEnrollmentTicket(userId);
    await bookingService.checkBookingValidity(roomId);
    const booking = await bookingService.createBooking({ roomId, userId });

    return res.status(200).send({
      bookingId: booking.id,
    });
  } catch (error) {
  next(error);
  }
};

// Rota para editar uma reserva
export const editBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { userId } = req;
  const { bookingId } = req.params;
  const { roomId } = req.body as Record<string, number>;
  
  try {
    const update = {
      bookingId: Number(bookingId),
      userId,
      roomId,
    };

    const result = await bookingService.editBooking(update);
    return res.status(200).send(result);
  } catch (error) {
    next(error);
  }
};


