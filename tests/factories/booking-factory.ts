import faker from '@faker-js/faker';
import { prisma } from '@/config';

export async function createBooking(roomId: number, userId: number) {
  return await prisma.booking.create({
    data: {
      roomId,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.future(),
      userId,
    },
  });
}

export async function updateInfos(roomId: number, id: number) {
  return await prisma.booking.update({
    data: {
      roomId,
      updatedAt: faker.date.future(),
    },
    where: {
      id,
    },
  });
}

export async function createRooms(hotelId: number, capacity?: number) {
  return await prisma.room.create({
    data: {
      hotelId,
      capacity: capacity ?? faker.datatype.number({ min: 2 }),
      name: faker.commerce.department(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.future(),
    },
  });
}

export async function capacityRoom(id: number, entry: boolean) {
  return await prisma.room.update({
    data: {
      capacity: entry ? { decrement: 1 } : { increment: 1 },
    },
    where: {
      id,
    },
  });
}

export async function createNewRoomsHotels() {
  const hotel = await prisma.hotel.create({
    data: {
      name: faker.commerce.department(),
      image: faker.image.imageUrl(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.future(),
    },
    include: {
      Rooms: true,
    },
  });
  return hotel;
}