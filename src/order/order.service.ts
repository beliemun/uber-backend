import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entites/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderOutput, CreateOrderInput } from './dto/create-order.dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entites/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dto/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dto/get-order.dto';
import { EditOrderInput } from './dto/edit-order.dto';

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
      if (!restaurant) {
        throw new Error('Restaurant not found.');
      }

      let totalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        console.log(item);
        // forEach는 return을 해도 실행을 막을 수 없기 때문에 for of 문을 사용.
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });
        if (!dish) {
          throw new Error('Dish not found.');
        }

        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption.extra) {
            totalPrice += dishOption.extra;
          } else {
            const dishOptionChoice = dishOption.choices.find(
              (optionChoice) => optionChoice.name === itemOption.choice,
            );
            if (dishOptionChoice) {
              totalPrice += dishOptionChoice.extra;
            }
          }
        }
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }

      await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          totalPrice,
          items: orderItems,
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

  async getOrders(
    { id, role }: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[] = [];
      switch (role) {
        case UserRole.Client:
          orders = await this.orders.find({
            where: {
              customer: { id },
              ...(status && { status }),
            },
          });
          break;
        case UserRole.Driver:
          orders = await this.orders.find({
            where: {
              driver: { id },
              ...(status && { status }),
            },
          });
          break;
        case UserRole.Owner:
          const restaurants = await this.restaurants.find({
            where: { ownerId: id },
            order: { createdAt: 'ASC' },
            take: 1,
            relations: ['orders'],
          });
          orders = restaurants.map((restaurant) => restaurant.orders).flat();
          if (status) {
            orders = orders.filter((order) => order.status === status);
          }
          break;
      }

      return {
        ok: true,
        orders,
      };
    } catch (e) {
      return {
        ok: true,
        error: e.message,
      };
    }
  }

  canSeeOrder(user: User, order: Order) {
    return (
      (user.role === UserRole.Client && user.id === order.customerId) ||
      (user.role === UserRole.Driver && user.id === order.driverId) ||
      (user.role === UserRole.Owner && user.id == order.restaurant.ownerId)
    );
  }

  canEditOrder(user: User, status: OrderStatus) {
    if (user.role === UserRole.Client) {
      return false;
    }
    if (user.role === UserRole.Owner) {
      if (status !== OrderStatus.Pending && status !== OrderStatus.Cooking) {
        return false;
      }
    }
    if (user.role === UserRole.Driver) {
      if (status !== OrderStatus.Cooked && status !== OrderStatus.PickedUp) {
        return false;
      }
    }
    return true;
  }

  async getOrder(user: User, { id }: GetOrderInput): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: { id },
        relations: ['restaurant'],
      });
      if (!order) {
        throw new Error('Order not found.');
      }
      if (!this.canSeeOrder(user, order)) {
        throw new Error('You can not do that.');
      }
      return {
        ok: true,
        order,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async editOrder(
    user: User,
    { id, status }: EditOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: { id },
        relations: ['restaurant'],
      });
      if (!order) {
        throw new Error('Order not found.');
      }
      if (!this.canSeeOrder(user, order) || !this.canEditOrder(user, status)) {
        console.log('Error');
        throw new Error('You can not do that.');
      }
      await this.orders.save({ id: order.id, status });
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
