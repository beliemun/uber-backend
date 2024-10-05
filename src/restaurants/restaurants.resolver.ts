import { Args, Mutation, Query } from '@nestjs/graphql';
import { Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  @Query(() => [Restaurant]) // graphql 생성을 위한 코드
  restaurants(@Args('veganOnly') vaganOnly: boolean): Restaurant[] {
    return [];
  }

  @Mutation(() => Boolean)
  createRestaurant(
    @Args() createRestaurantDto: CreateRestaurantDto,
  ): boolean {
    console.log(createRestaurantDto);
    return true;
  }
}
