import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entites/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderOutput, CreateOrderInput } from './dto/create-order.dto';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entites/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });

      items.forEach(async (item) => {
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });
        if (!dish) {
          throw new Error('Dish not found.');
        }
        await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
      });

      //   const order = await this.orders.save(
      //     this.orders.create({
      //       customer,
      //       restaurant

      //     }),
      //   );
      //   console.log(order);
      if (!restaurant) {
        throw new Error('Restaurant not found.');
      }
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
}
