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
  editBooking: async ({ bookingId, roomId, userId }: { bookingId: number; roomId: number; userId: number }) => {
    
    // const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    // if (!enrollment) throw forbiddenError();
    // const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
    // if (ticket.TicketType.isRemote || !ticket.TicketType.includesHotel || ticket.status !== 'PAID') {
    //   throw forbiddenError();
    // }
    const bookingExist = await bookingRepository.listByUserId(userId);
    if (!bookingExist) throw forbiddenError();
    
      const room = await bookingRepository.listByIdRoom(roomId);
      if (!room) throw notFoundError();
      // if (room.capacity < 1) throw forbiddenError();
    
      const full = await bookingRepository.list1ByRoomId(roomId);
      if (full) throw forbiddenError();
    
      const result = await bookingRepository.editBooking(userId, roomId, bookingId);
    
      return { bookingId: result.id };
  },
};

export default bookingService;
