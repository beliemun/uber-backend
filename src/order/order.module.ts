import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entites/order.entity';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Restaurant])],
  providers: [OrderResolver, OrderService],
})
export class OrderModule {}
