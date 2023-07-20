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
  const bookingId = Number(req.params.bookingId);
  const { roomId } = req.body as Record<string, number>;

  // if (!bookingId) {
  //   // Erro de solicitação inválida (403) - bookingId está ausente
  //   return res.sendStatus(403);
  // }

  try {

    const booking = await bookingService.getBookingByUserId(userId);

    // if (!booking || booking.userId !== userId) {
    //   // Erro de acesso proibido (403) - usuário não tem reserva
    //   return res.sendStatus(403);
    // }

    // await bookingService.checkBookingValidity(roomId);

    // Atualiza a reserva
    const updatedBooking = await bookingService.editBooking({
      id: booking.id,
      roomId,
      userId: booking.userId,
    });

    return res.status(200).send({
      bookingId: updatedBooking.id,
    });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.sendStatus(404);
  }
  return res.sendStatus(403);
}}
