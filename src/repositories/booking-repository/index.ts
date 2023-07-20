import { PrismaClient } from '@prisma/client';
// import { Booking } from '@prisma/client';
import { CreateBookingParams } from '../../protocols';
// export type UpdateBookingParams = Omit<Booking, 'createdAt' | 'updatedAt'> & { bookingId: number };

const prisma = new PrismaClient();

const bookingRepository = {
  // Cria uma reserva com o roomId e userId fornecidos
  createBooking: async ({ roomId, userId }: CreateBookingParams) => {
    return prisma.booking.create({
      data: {
        roomId,
        userId,
      },
    });
  },

  // Lista as reservas pelo roomId, incluindo os detalhes do quarto
  listByRoomId: async (roomId: number) => {
    return prisma.booking.findMany({
      where: {
        roomId,
      },
      include: {
        Room: true,
      },
    });
  },

  list1ByRoomId: async (roomId: number) => {
    return prisma.booking.findFirst({
      where: {
        roomId,
      },
    });
  },

  // Lista uma reserva pelo userId, incluindo os detalhes do quarto
  listByUserId: async (userId: number) => {
    return prisma.booking.findFirst({
      where: {
        userId,
      },
      include: {
        Room: true,
      },
    });
  },

  // Atualiza uma reserva com o id, roomId e userId fornecidos
  editBooking: async (userId: number, roomId: number, bookingId: number) => {
    return prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        roomId,
        userId,
        updatedAt: new Date(),
      },
    });
  },

  // Lista os quartos pelo hotelId fornecido
  listByHotelId: async (hotelId: number) => {
    return prisma.room.findMany({
      where: {
        hotelId,
      },
    });
  },
  
  // Lista um quarto pelo id do quarto fornecido
  listByIdRoom: async (roomId: number) => {
    return prisma.room.findFirst({
      where: {
        id: roomId,
      },
    });
  },
};

export default bookingRepository;
