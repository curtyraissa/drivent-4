import { NextFunction, Response } from 'express';
import httpStatus from 'http-status';
import enrollmentRepository from '../repositories/enrollment-repository';
import ticketsRepository from '../repositories/tickets-repository';
import { AuthenticatedRequest } from '@/middlewares';
import bookingRepository from '@/repositories/booking-repository';
import { notFoundError } from '@/errors';
import { badRequestError } from '@/errors/bad-request-error';
import { forbiddenError } from '@/errors/forbidden-error';

// Rota para listar uma reserva
export async function listBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Função para obter uma reserva de um determinado usuário
    async function getBookingByUserId(userId: number) {
      const booking = await bookingRepository.listByUserId(userId);
      if (!booking) throw notFoundError();

      return booking;
    }

    const { userId } = req;
    const booking = await getBookingByUserId(userId);
    return res.status(httpStatus.OK).send({
      id: booking.id,
      Room: booking.Room,
    });
  } catch (error) {
    if (error instanceof badRequestError) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }

    if (error instanceof forbiddenError) {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }

    next(error);
  }
}

// Rota para criar uma reserva
export async function createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Função para verificar a validade do ticket de matrícula
    async function verifyEnrollmentTicket(userId: number) {
      const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
      if (!enrollment) throw forbiddenError();

      const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

      if (!ticket || ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
        throw forbiddenError();
      }
    }

    // Função para verificar a validade da reserva
    async function checkBookingValidity(roomId: number) {
      const room = await bookingRepository.listByIdRoom(roomId);
      const bookings = await bookingRepository.listByRoomId(roomId);

      if (!room) throw notFoundError();
      if (room.capacity <= bookings.length) throw forbiddenError();
    }

    const { userId } = req;
    const { roomId } = req.body as Record<string, number>;

    if (!roomId) throw badRequestError();

    await verifyEnrollmentTicket(userId);
    await checkBookingValidity(roomId);

    const booking = await bookingRepository.createBooking({ roomId, userId });

    return res.status(httpStatus.OK).send({
      bookingId: booking.id,
    });
  } catch (error) {
    if (error instanceof badRequestError) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }

    if (error instanceof forbiddenError) {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }

    next(error);
  }
}

// Rota para editar uma reserva
export async function editBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { userId } = req;
  const bookingId = Number(req.params.bookingId);
  if (!bookingId) return res.sendStatus(httpStatus.BAD_REQUEST);

  try {
    // Função para obter uma reserva de um determinado usuário
    async function getBookingByUserId(userId: number) {
      const booking = await bookingRepository.listByUserId(userId);
      if (!booking) throw notFoundError();

      return booking;
    }

    // Função para verificar a validade da reserva
    async function checkBookingValidity(roomId: number) {
      const room = await bookingRepository.listByIdRoom(roomId);
      const bookings = await bookingRepository.listByRoomId(roomId);

      if (!room) throw notFoundError();
      if (room.capacity <= bookings.length) throw forbiddenError();
    }

    const { roomId } = req.body as Record<string, number>;
    await checkBookingValidity(roomId);
    const booking = await getBookingByUserId(userId);

    if (!booking || booking.userId !== userId) throw forbiddenError();

    await bookingRepository.editBooking({
      id: booking.id,
      roomId,
      userId,
    });

    return res.status(httpStatus.OK).send({
      bookingId: booking.id,
    });
  } catch (error) {
    if (error instanceof badRequestError) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }

    if (error instanceof forbiddenError) {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }

    next(error);
  }
}
