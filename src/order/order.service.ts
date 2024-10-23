import { Inject, Injectable } from '@nestjs/common';
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
import { PubSub } from 'graphql-subscriptions';
import {
  COOKED_ORDER,
  PENDING_ORDER,
  PUB_SUB,
  UPDATE_ORDER,
} from 'src/common/common.constants';
import { TakeOrderInput } from './dto/take-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
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

      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          totalPrice,
          items: orderItems,
        }),
      );

      await this.pubSub.publish(PENDING_ORDER, {
        order,
        ownerId: restaurant.ownerId,
      });

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
      if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
        return false;
      }
    }
    if (user.role === UserRole.Driver) {
      if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
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
        throw new Error('You can not do that.');
      }
      //  repository의 save는 완전한 order를 반환하지 않기 떄문에 order를 전달할 때 주의 한다.
      await this.orders.save({ id: order.id, status });

      order.status = status;
      if (user.role === UserRole.Owner && status === OrderStatus.Cooked) {
        // Driver에게만 전달.
        this.pubSub.publish(COOKED_ORDER, { order });
      }
      // 모두에게 전달.
      await this.pubSub.publish(UPDATE_ORDER, { order });
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

  async takeOrder(driver: User, { id }: TakeOrderInput) {
    try {
      const order = await this.orders.findOne({ where: { id } });
      if (!order) {
        throw new Error('Order not found.');
      }
      if (order.driver) {
        throw new Error('Driver already exists.');
      }
      order.driver = driver;
      await this.orders.save([
        {
          id,
          driver,
        },
      ]);
      await this.pubSub.publish(UPDATE_ORDER, { order });
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
