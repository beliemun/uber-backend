import { Injectable } from '@nestjs/common';
import { LessThan, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from 'src/payments/dto/create-payment.dto';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { GetPaymentsOutput } from './dto/get-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    { restaurantId, transactionId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        throw new Error('Restaurant not found.');
      }
      if (owner.id !== restaurant.ownerId) {
        throw new Error('You are not allowed to do this.');
      }

      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.isPromoted = true;
      restaurant.promotedUntil = date;
      await this.restaurants.save(restaurant);

      await this.payments.save(
        this.payments.create({
          restaurant,
          transactionId,
          user: owner,
        }),
      );

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    const payments = await this.payments.find({ where: { userId: user.id } });
    if (payments.length === 0) {
      throw new Error('Payments not found.');
    }
    try {
      return {
        ok: true,
        payments,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async checkPromotedRestaurants() {
    const restaurants = await this.restaurants.find({
      where: { isPromoted: true, promotedUntil: LessThan(new Date()) },
    });
    for (const restaurnt of restaurants) {
      restaurnt.isPromoted = false;
      restaurnt.promotedUntil = null;
      await this.restaurants.save(restaurnt);
    }
  }
}
