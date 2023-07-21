import faker from '@faker-js/faker';
import bookingService from '../services/booking-service';
import bookingRepository from '../repositories/booking-repository';
import enrollmentRepository from '../repositories/enrollment-repository';
import ticketsRepository from '../repositories/tickets-repository';

jest.mock('../repositories/booking-repository');
jest.mock('../repositories/enrollment-repository');
jest.mock('../repositories/tickets-repository');

describe('Booking Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBookingByUserId', () => {
    it('should return the booking when it exists', async () => {
      const mockBooking = { id: faker.datatype.number(), roomId: faker.datatype.number(), userId: faker.datatype.number() };
      (bookingRepository.listByUserId as jest.Mock).mockResolvedValue(mockBooking);

      const userId = faker.datatype.number();
      const result = await bookingService.getBookingByUserId(userId);

      expect(result).toEqual(mockBooking);
      expect(bookingRepository.listByUserId).toHaveBeenCalledWith(userId);
    });

    it('should throw a 404 Not Found when the booking does not exist', async () => {
      (bookingRepository.listByUserId as jest.Mock).mockResolvedValue(undefined);

      const userId = faker.datatype.number();

      try {
        await bookingService.getBookingByUserId(userId);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }

      expect(bookingRepository.listByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('verifyEnrollmentTicket', () => {
    it('should throw a 403 Forbidden when the enrollment does not exist', async () => {
      (enrollmentRepository.findWithAddressByUserId as jest.Mock).mockResolvedValue(undefined);

      const userId = faker.datatype.number();

      try {
        await bookingService.verifyEnrollmentTicket(userId);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(403);
      }

      expect(enrollmentRepository.findWithAddressByUserId).toHaveBeenCalledWith(userId);
    });

    it('should throw a 403 Forbidden when the ticket is not valid', async () => {
      const mockEnrollment = { id: faker.datatype.number() };
      (enrollmentRepository.findWithAddressByUserId as jest.Mock).mockResolvedValue(mockEnrollment);

      const mockTicket = { status: 'RESERVED', TicketType: { isRemote: true, includesHotel: false } };
      (ticketsRepository.findTicketByEnrollmentId as jest.Mock).mockResolvedValue(mockTicket);

      const userId = faker.datatype.number();

      try {
        await bookingService.verifyEnrollmentTicket(userId);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(403);
      }

      expect(enrollmentRepository.findWithAddressByUserId).toHaveBeenCalledWith(userId);
      expect(ticketsRepository.findTicketByEnrollmentId).toHaveBeenCalledWith(mockEnrollment.id);
    });

    it('should not throw when the ticket is valid', async () => {
      const mockEnrollment = { id: faker.datatype.number() };
      (enrollmentRepository.findWithAddressByUserId as jest.Mock).mockResolvedValue(mockEnrollment);

      const mockTicket = { status: 'PAID', TicketType: { isRemote: false, includesHotel: true } };
      (ticketsRepository.findTicketByEnrollmentId as jest.Mock).mockResolvedValue(mockTicket);

      const userId = faker.datatype.number();

      await expect(bookingService.verifyEnrollmentTicket(userId)).resolves.not.toThrow();
      expect(enrollmentRepository.findWithAddressByUserId).toHaveBeenCalledWith(userId);
      expect(ticketsRepository.findTicketByEnrollmentId).toHaveBeenCalledWith(mockEnrollment.id);
    });
  });

  describe('checkBookingValidity', () => {
    it('should throw a 404 Not Found when the room does not exist', async () => {
      (bookingRepository.listByIdRoom as jest.Mock).mockResolvedValue(undefined);

      const roomId = faker.datatype.number();

      try {
        await bookingService.checkBookingValidity(roomId);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }

      expect(bookingRepository.listByIdRoom).toHaveBeenCalledWith(roomId);
    });

    it('should throw a 403 Forbidden when the room is already full', async () => {
      const mockRoom = { id: faker.datatype.number(), capacity: 2 };
      const mockBookings = [{ id: faker.datatype.number() }, { id: faker.datatype.number() }];
      (bookingRepository.listByIdRoom as jest.Mock).mockResolvedValue(mockRoom);
      (bookingRepository.listByRoomId as jest.Mock).mockResolvedValue(mockBookings);

      const roomId = faker.datatype.number();

      try {
        await bookingService.checkBookingValidity(roomId);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(403);
      }

      expect(bookingRepository.listByIdRoom).toHaveBeenCalledWith(roomId);
      expect(bookingRepository.listByRoomId).toHaveBeenCalledWith(roomId);
    });

    it('should not throw when the room has available capacity', async () => {
      const mockRoom = { id: faker.datatype.number(), capacity: 3 };
      const mockBookings = [{ id: faker.datatype.number() }, { id: faker.datatype.number() }];
      (bookingRepository.listByIdRoom as jest.Mock).mockResolvedValue(mockRoom);
      (bookingRepository.listByRoomId as jest.Mock).mockResolvedValue(mockBookings);

      const roomId = faker.datatype.number();

      await expect(bookingService.checkBookingValidity(roomId)).resolves.not.toThrow();
      expect(bookingRepository.listByIdRoom).toHaveBeenCalledWith(roomId);
      expect(bookingRepository.listByRoomId).toHaveBeenCalledWith(roomId);
    });
  });

  describe('createBooking', () => {
    it('should throw a 400 Bad Request when roomId is missing', async () => {
      const params = { userId: faker.datatype.number(), roomId: undefined as any };

      try {
        await bookingService.createBooking(params);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('should call verifyEnrollmentTicket and checkBookingValidity before creating the booking', async () => {
      const mockEnrollmentTicket = jest.spyOn(bookingService, 'verifyEnrollmentTicket');
      const mockBookingValidity = jest.spyOn(bookingService, 'checkBookingValidity');

      const mockRoom = { id: faker.datatype.number(), capacity: 3 };
      const mockBookings = [{ id: faker.datatype.number() }, { id: faker.datatype.number() }];
      (bookingRepository.listByIdRoom as jest.Mock).mockResolvedValue(mockRoom);
      (bookingRepository.listByRoomId as jest.Mock).mockResolvedValue(mockBookings);

      const params = { userId: faker.datatype.number(), roomId: faker.datatype.number() };

      await bookingService.createBooking(params);

      expect(mockEnrollmentTicket).toHaveBeenCalledWith(params.userId);
      expect(mockBookingValidity).toHaveBeenCalledWith(params.roomId);
      expect(bookingRepository.createBooking).toHaveBeenCalledWith(params);
    });

    it('should create the booking when all conditions are met', async () => {
      const mockRoom = { id: faker.datatype.number(), capacity: 3 };
      const mockBookings = [{ id: faker.datatype.number() }, { id: faker.datatype.number() }];
      (bookingRepository.listByIdRoom as jest.Mock).mockResolvedValue(mockRoom);
      (bookingRepository.listByRoomId as jest.Mock).mockResolvedValue(mockBookings);

      const params = { userId: faker.datatype.number(), roomId: faker.datatype.number() };
      const mockResult = { id: faker.datatype.number(), roomId: params.roomId, userId: params.userId };
      (bookingRepository.createBooking as jest.Mock).mockResolvedValue(mockResult);

      const result = await bookingService.createBooking(params);

      expect(result).toEqual(mockResult);
      expect(bookingRepository.createBooking).toHaveBeenCalledWith(params);
    });
  });

  describe('editBooking', () => {
    it('should throw a 403 Forbidden when the booking does not exist', async () => {
      (bookingRepository.listByUserId as jest.Mock).mockResolvedValue(undefined);

      const params = { bookingId: faker.datatype.number(), userId: faker.datatype.number(), roomId: faker.datatype.number() };

      try {
        await bookingService.editBooking(params);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(403);
      }

      expect(bookingRepository.listByUserId).toHaveBeenCalledWith(params.userId);
    });

    it('should throw a 404 Not Found when the room does not exist', async () => {
      const mockUserId = faker.datatype.number();
      (bookingRepository.listByUserId as jest.Mock).mockResolvedValue({ id: faker.datatype.number() });
      (bookingRepository.listByIdRoom as jest.Mock).mockResolvedValue(undefined);

      const params = { bookingId: faker.datatype.number(), userId: mockUserId, roomId: faker.datatype.number() };

      try {
        await bookingService.editBooking(params);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }

      expect(bookingRepository.listByUserId).toHaveBeenCalledWith(mockUserId);
      expect(bookingRepository.listByIdRoom).toHaveBeenCalledWith(params.roomId);
    });

    it('should throw a 403 Forbidden when the room is already full', async () => {
      const mockUserId = faker.datatype.number();
      const mockBookingExist = { id: faker.datatype.number() };
      const mockRoom = { id: faker.datatype.number(), capacity: 2 };
      (bookingRepository.listByUserId as jest.Mock).mockResolvedValue(mockBookingExist);
      (bookingRepository.listByIdRoom as jest.Mock).mockResolvedValue(mockRoom);
      (bookingRepository.list1ByRoomId as jest.Mock).mockResolvedValue({ id: faker.datatype.number() });

      const params = { bookingId: faker.datatype.number(), userId: mockUserId, roomId: faker.datatype.number() };

      try {
        await bookingService.editBooking(params);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.statusCode).toBe(403);
      }

      expect(bookingRepository.listByUserId).toHaveBeenCalledWith(mockUserId);
      expect(bookingRepository.listByIdRoom).toHaveBeenCalledWith(params.roomId);
      expect(bookingRepository.list1ByRoomId).toHaveBeenCalledWith(params.roomId);
    });

    it('should edit the booking when all conditions are met', async () => {
      const mockUserId = faker.datatype.number();
      const mockBookingExist = { id: faker.datatype.number() };
      const mockRoom = { id: faker.datatype.number(), capacity: 3 };
      (bookingRepository.listByUserId as jest.Mock).mockResolvedValue(mockBookingExist);
      (bookingRepository.listByIdRoom as jest.Mock).mockResolvedValue(mockRoom);
      (bookingRepository.list1ByRoomId as jest.Mock).mockResolvedValue(undefined);
      const mockResult = { id: faker.datatype.number(), userId: params.userId, roomId: params.roomId };
      (bookingRepository.editBooking as jest.Mock).mockResolvedValue(mockResult);

      const params = { bookingId: faker.datatype.number(), userId: mockUserId, roomId: faker.datatype.number() };

      const result = await bookingService.editBooking(params);

      expect(result).toEqual({ bookingId: mockResult.id });
      expect(bookingRepository.listByUserId).toHaveBeenCalledWith(mockUserId);
      expect(bookingRepository.listByIdRoom).toHaveBeenCalledWith(params.roomId);
      expect(bookingRepository.list1ByRoomId).toHaveBeenCalledWith(params.roomId);
      expect(bookingRepository.editBooking).toHaveBeenCalledWith(params.userId, params.roomId, params.bookingId);
    });
  });
});
