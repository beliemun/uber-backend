import { Module } from '@nestjs/common';
import { RestaurantsResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant])],
    providers:[RestaurantsResolver, RestaurantService]
})
export class RestaurantsModule {}
