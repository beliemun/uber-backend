import {
  Field,
  Float,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { IsEnum, IsNumber } from 'class-validator';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  Cooked = 'Cooked',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    eager: true,
  })
  @Field(() => User, { nullable: true })
  customer?: User;

  @RelationId((order: Order) => order.restaurant)
  customerId: number;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    eager: true,
  })
  @Field(() => User, { nullable: true })
  driver?: User;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.orders, {
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;

  @ManyToMany(() => OrderItem, { eager: true })
  @Field(() => [OrderItem])
  @JoinTable()
  items: OrderItem[];

  @Column({ nullable: true })
  @Field(() => Float, { nullable: true })
  @IsNumber()
  totalPrice?: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field(() => OrderStatus, { defaultValue: OrderStatus.Pending })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
