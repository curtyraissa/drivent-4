import bookingRepository from '../../repositories/booking-repository';
import { notFoundError, forbiddenError } from '@/errors';
import enrollmentRepository from '../../repositories/enrollment-repository';
import ticketsRepository from '../../repositories/tickets-repository';

const bookingService = {
  // Obtém uma reserva com base no ID do usuário
  getBookingByUserId: async (userId: number) => {
    const booking = await bookingRepository.listByUserId(userId);
    if (!booking) throw notFoundError();

    return booking;
  },

  // Verifica a validade do ticket de matrícula
  verifyEnrollmentTicket: async (userId: number) => {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) throw forbiddenError();

    const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

    // Verifica se o ticket existe, se está reservado e se inclui hospedagem
    if (!ticket || ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
      throw forbiddenError();
    }
  },

  // Verifica a validade da reserva
  checkBookingValidity: async (roomId: number) => {
    const room = await bookingRepository.listByIdRoom(roomId);
    const bookings = await bookingRepository.listByRoomId(roomId);

    if (!room) throw notFoundError();
    if (room.capacity <= bookings.length) throw forbiddenError();
  },

  // Cria uma nova reserva com o roomId e userId fornecidos
  createBooking: async ({ roomId, userId }: { roomId: number; userId: number }) => {
    return bookingRepository.createBooking({ roomId, userId });
  },

  // Atualiza uma reserva existente com o id, roomId e userId fornecidos
  editBooking: async ({ id, roomId, userId }: { id: number; roomId: number; userId: number }) => {
    return bookingRepository.editBooking({ id, roomId, userId });
  },
};

export default bookingService;
