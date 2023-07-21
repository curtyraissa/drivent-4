import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';
import supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createEnrollmentWithAddress,
  createRooms,
  createNewRoomsHotels,
  createTicket,
  createTicketTypeWithHotel,
  createUser,
  createBooking,
} from '../factories';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('Booking API', () => {
  let user: any, token: string, enrollment: any, ticketType: any, hotel: any, room: any, booking: any;

  beforeEach(async () => {
    user = await createUser();
    token = await generateValidToken(user);
    enrollment = await createEnrollmentWithAddress(user);
    ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    hotel = await createNewRoomsHotels();
    room = await createRooms(hotel.id);
    booking = await createBooking(room.id, user.id);
  });

  describe('GET /booking', () => {
    it('returns 401 when token is invalid', async () => {
      const invalidToken = faker.word.adjective();
      const { statusCode } = await server.get('/booking').set('Authorization', `Bearer ${invalidToken}`);
      expect(statusCode).toBe(401);
    });

    // it('returns 401 when no token is sent', async () => {
    //   const { statusCode } = await server.get('/booking');
    //   expect(statusCode).toBe(401);
    // });

    it('returns 401 if there is no session for the given token', async () => {
      const userWithoutSession = await createUser();
      const invalidToken = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      const { status } = await server.get('/enrollments').set('Authorization', `Bearer ${invalidToken}`);
      expect(status).toBe(401);
    });

    it('returns 200 status and reservation information on success', async () => {
      const { statusCode, body } = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(statusCode).toBe(200);
      expect(body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          hotelId: room.hotelId,
          capacity: room.capacity,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
  });

  describe('POST /booking', () => {
    it('returns 401 when token is invalid', async () => {
      const invalidToken = faker.word.adjective();
      const { statusCode } = await server.post('/booking').set('Authorization', `Bearer ${invalidToken}`);
      expect(statusCode).toBe(401);
    });

    it('returns 401 when no token is sent', async () => {
      const { statusCode } = await server.post('/booking');
      expect(statusCode).toBe(401);
    });

    it('returns 401 if there is no session for the given token', async () => {
      const userWithoutSession = await createUser();
      const invalidToken = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      const { status } = await server.post('/enrollments').set('Authorization', `Bearer ${invalidToken}`);
      expect(status).toBe(401);
    });

    it('returns 200 status and booking id on success', async () => {
      const { statusCode, body } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(statusCode).toBe(200);
      expect(body).toEqual({ bookingId: expect.any(Number) });
    });

    it('returns 403 if room has no vacancies', async () => {
      const roomWithoutVacancies = await createRooms(hotel.id, 4);
      for (let i = 0; i < 4; i++) {
        await createBooking(roomWithoutVacancies.id, user.id);
      }
      const { statusCode } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: roomWithoutVacancies.id });
      expect(statusCode).toBe(403);
    });
  });

  describe('PUT /booking', () => {
    it('returns 401 when token is invalid', async () => {
      const invalidToken = faker.word.adjective();
      const { statusCode } = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${invalidToken}`);
      expect(statusCode).toBe(401);
    });

    it('returns 401 when no token is sent', async () => {
      const { statusCode } = await server.put(`/booking/${booking.id}`);
      expect(statusCode).toBe(401);
    });

    it('returns 401 if there is no session for the given token', async () => {
      const userWithoutSession = await createUser();
      const invalidToken = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      const { status } = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${invalidToken}`);
      expect(status).toBe(401);
    });

    it('returns 200 status and booking id on success', async () => {
      const newRoom = await createRooms(hotel.id);
      const { statusCode, body } = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: newRoom.id });
      expect(statusCode).toBe(200);
      expect(body).toEqual({ bookingId: expect.any(Number) });
    });

    it('returns 403 if room has no vacancies', async () => {
      const secondRoom = await createRooms(hotel.id, 2);
      await createBooking(secondRoom.id, user.id);
      await createBooking(secondRoom.id, user.id);
      const { statusCode } = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: secondRoom.id });
      expect(statusCode).toBe(403);
    });

    // it('returns 403 if user has no reservation', async () => {
    //   const newRoom = await createRooms(hotel.id, 0);
    //   const { statusCode } = await server
    //     .put(`/booking/${+Infinity}`)
    //     .set('Authorization', `Bearer ${token}`)
    //     .send({ roomId: newRoom.id });
    //   expect(statusCode).toBe(403);
    // });
  });
});