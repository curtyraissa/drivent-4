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

  if (!bookingId) {
    // Erro de solicitação inválida (400) - bookingId está ausente
    return res.sendStatus(400);
  }

  try {
    const { roomId } = req.body as Record<string, number>;

    const booking = await bookingService.getBookingByUserId(userId);

    if (!booking || booking.userId !== userId) {
      // Erro de acesso proibido (403) - usuário não tem reserva
      return res.sendStatus(403);
    }

    await bookingService.checkBookingValidity(roomId);

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
  //   if (error instanceof badRequestError) {
  //     // Erro de solicitação inválida (400)
  //     return res.sendStatus(400);
  //   }
  //   if (error instanceof forbiddenError) {
  //     // Erro de acesso proibido (403)
  //     return res.sendStatus(403);
  //   }
  //   if (error instanceof notFoundError) {
  //     // Erro de recurso não encontrado (404)
  //     return res.sendStatus(404);
  //   }
  //   if (error instanceof unauthorizedError) {
  //     // Erro de autenticação não autorizada (401)
  //     return res.sendStatus(401);
  //   }
  //   // Erro interno do servidor (500)
  //   return res.sendStatus(500);
  // }
  next(error);
}}
