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
import { PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';

export const pubsub = new PubSub();

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrderService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => CreateOrderOutput)
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ) {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Query(() => GetOrdersOutput)
  getOrders(
    @AuthUser() user: User,
    @Args('input') GetOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(user, GetOrdersInput);
  }

  @Query(() => GetOrderOutput)
  getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.ordersService.getOrder(user, getOrderInput);
  }

  @Mutation(() => EditOrderOutput)
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
  pendingOder() {
    return this.pubSub.asyncIterator(PENDING_ORDER);
  }
}
