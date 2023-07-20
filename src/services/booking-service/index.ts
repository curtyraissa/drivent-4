import bookingRepository from '../../repositories/booking-repository';
import { notFoundError, forbiddenError, badRequestError } from '@/errors';
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

    // Verifica se o ticket existe, se está reservado, se inclui hospedagem e se foi pago
    if (
      !ticket ||
      ticket.status === 'RESERVED' ||
      ticket.TicketType.isRemote ||
      !ticket.TicketType.includesHotel 
      // || ticket.status !== 'PAID'
    ) {
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
    if(!roomId) throw badRequestError
    await bookingService.verifyEnrollmentTicket(userId); // Verifica o ticket de matrícula antes de criar a reserva
    await bookingService.checkBookingValidity(roomId); // Verifica a validade da reserva antes de criar

    return bookingRepository.createBooking({ roomId, userId });
  },


  //Atualiza uma reserva existente com o id, roomId e userId fornecidos
  editBooking: async ({ id, roomId, userId }: { id: number; roomId: number; userId: number }) => {
    if (!roomId) throw badRequestError();

    // const bookingx = await bookingService.getBookingByUserId(userId);
    // if (!bookingx || bookingx.userId !== userId) {
    //     throw forbiddenError// Erro de acesso proibido (403) - usuário não tem reserva
    //   }

    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) throw forbiddenError();

    const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

    // Verifica se o ticket existe, se está reservado, se inclui hospedagem e se foi pago
    if (
      !ticket ||
      ticket.status === 'RESERVED' ||
      ticket.TicketType.isRemote ||
      !ticket.TicketType.includesHotel 
      || ticket.status !== 'PAID'
    ) {
      throw forbiddenError();
    }

  // await bookingService.checkBookingValidity(roomId);
  const room = await bookingRepository.listByIdRoom(roomId);
    const bookings = await bookingRepository.listByRoomId(roomId);
    if (!room) throw forbiddenError();
    if (room.capacity <= bookings.length) throw forbiddenError();
  const booking = await bookingRepository.listByUserId(userId);

  if (!booking || booking.userId !== userId) throw forbiddenError();
  
  const full = await bookingRepository.listByUserId(roomId);
    if (full) throw forbiddenError();

    return bookingRepository.editBooking({ id, roomId, userId });
  },
};

export default bookingService;
