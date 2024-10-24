import { Module } from '@nestjs/common';
import {
  CatogoryResolver,
  DishResolver,
  RestaurantsResolver,
} from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantsService } from './restaurant.service';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { Dish } from './entities/dish.entity';
import { Order } from 'src/order/entites/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish, Order])],
  providers: [
    RestaurantsResolver,
    RestaurantsService,
    CategoryRepository,
    CatogoryResolver,
    DishResolver,
  ],
})
export class RestaurantsModule {}
