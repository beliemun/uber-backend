import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Order } from './entites/order.entity';
import { OrderService } from './order.service';
import { CreateOrderOutput, CreateOrderInput } from './dto/create-order.dto';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly ordersService: OrderService) {}

  @Mutation(() => CreateOrderOutput)
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ) {
    return this.ordersService.createOrder(customer, createOrderInput);
  }
}
