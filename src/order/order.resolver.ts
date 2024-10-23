import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Order } from './entites/order.entity';
import { OrderService } from './order.service';
import { CreateOrderOutput, CreateOrderInput } from './dto/create-order.dto';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { GetOrdersInput, GetOrdersOutput } from './dto/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dto/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dto/edit-order.dto';
import { PubSub } from 'graphql-subscriptions';
import { Role } from 'src/auth/role.decorator';
import { Inject } from '@nestjs/common';
import {
  COOKED_ORDER,
  PENDING_ORDER,
  PUB_SUB,
  UPDATE_ORDER,
} from 'src/common/common.constants';
import { UpdateOrderInput } from './dto/update-order.dto';
import { TakeOrderInput, TakeOrderOutput } from './dto/take-order.dto';

export const pubsub = new PubSub();

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrderService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => CreateOrderOutput)
  @Role(['Client'])
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ) {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Query(() => GetOrdersOutput)
  @Role(['Any'])
  getOrders(
    @AuthUser() user: User,
    @Args('input') GetOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(user, GetOrdersInput);
  }

  @Query(() => GetOrderOutput)
  @Role(['Any'])
  getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.ordersService.getOrder(user, getOrderInput);
  }

  @Mutation(() => EditOrderOutput)
  @Role(['Any'])
  editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<GetOrderOutput> {
    return this.ordersService.editOrder(user, editOrderInput);
  }

  @Subscription(() => Order, {
    filter: ({ ownerId }, _, { user }) => {
      // 고객이 주문한 식당의 주인(ownerId)과, 리스닝을 하고 있는 식당의 주인(user)이 같아야 패스.
      return user.id === ownerId;
    },
    resolve: ({ order }) => {
      return order;
    },
  })
  @Role(['Owner'])
  pendingOrder() {
    return this.pubSub.asyncIterator(PENDING_ORDER);
  }

  @Subscription(() => Order, {
    filter: () => {
      return true;
    },
    resolve: ({ order }) => {
      return order;
    },
  })
  @Role(['Driver'])
  cookedOrder() {
    return this.pubSub.asyncIterator(COOKED_ORDER);
  }

  @Subscription(() => Order, {
    filter: (
      { order }: { order: Order },
      { input: { id } }: { input: UpdateOrderInput }, // Lisner가 Update 받을 Order의 Id
      { user }: { user: User }, // Listener의 Context
    ) => {
      console.log(user.id, order.customerId);
      console.log(user.id, order.driverId);
      console.log(user.id, order.restaurant.ownerId);
      if (
        user.id !== order.customerId &&
        user.id !== order.driverId &&
        user.id !== order.restaurant.ownerId
      ) {
        return false;
      }
      return id === order.id; // 해당 주문이 Listnet가 원하는 주문인 경우
    },
    resolve: ({ order }) => {
      return order;
    },
  })
  @Role(['Any'])
  updateOrder(@Args('input') updateOrderInput: UpdateOrderInput) {
    console.log('UPDATE_ORDER');
    return this.pubSub.asyncIterator(UPDATE_ORDER);
  }

  @Mutation(() => TakeOrderOutput)
  @Role(['Driver'])
  takeOrder(
    @AuthUser() driver: User,
    @Args('input') takeOrderInput: TakeOrderInput,
  ) {
    return this.ordersService.takeOrder(driver, takeOrderInput);
  }
}
