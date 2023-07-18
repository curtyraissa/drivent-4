import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import { listBooking, createBooking, editBooking } from '@/controllers';

const bookingRouter = Router();

bookingRouter.get('', authenticateToken, listBooking)
bookingRouter.post('', authenticateToken, createBooking)
bookingRouter.put('/:bookingId', authenticateToken, editBooking);

export { bookingRouter };