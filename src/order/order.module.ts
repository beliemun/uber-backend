import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entites/order.entity';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entites/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Restaurant, Dish])],
  providers: [OrderResolver, OrderService],
})
export class OrderModule {}
