import { Args, Mutation, Parent, Query, ResolveField } from '@nestjs/graphql';
import { Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dto/create-restaurant.dto';
import { RestaurantService } from './restaurant.service';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/role.decorator';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dto/edit-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dto/delete-restaurant.dto';
import { GetCategoriesOutput } from './dto/get-categories.dto';
import { Category } from './entities/category.entity';
import { GetCategoryInput, GetCategoryOutput } from './dto/get-category.dto';
import {
  GetRestaurantsInput,
  GetRestaurantsOutput,
} from './dto/get-restaurants.dto';
import {
  GetRestaurantInput,
  GetRestaurantOutput,
} from './dto/get-restaurant.dto';
import { SearchRestaurantsInput, SearchRestaurantsOutput } from './dto/search-restaurant.dto';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => CreateRestaurantOutput)
  @Role(['Owner'])
  createRestaurant(
    @AuthUser() owner: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(
      owner,
      createRestaurantInput,
    );
  }

  @Mutation(() => EditRestaurantOutput)
  @Role(['Owner'])
  editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation(() => DeleteRestaurantOutput)
  @Role(['Owner'])
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestuarant(
      owner,
      deleteRestaurantInput,
    );
  }

  @Query(() => GetRestaurantOutput)
  getRestaurant(
    @Args('input') getRestaurantInput: GetRestaurantInput,
  ): Promise<GetRestaurantOutput> {
    return this.restaurantService.getRestaurant(getRestaurantInput);
  }

  @Query(() => GetRestaurantsOutput)
  getRestaurants(
    @Args('input') getRestaurantsInput: GetRestaurantsInput,
  ): Promise<GetRestaurantsOutput> {
    return this.restaurantService.getRestaurants(getRestaurantsInput);
  }

  @Query(()=>SearchRestaurantsOutput)
  searchRestaurants(
    @Args('input') searchRestaurantsInput:SearchRestaurantsInput
  ) {
    return this.restaurantService.searchRestaurants(searchRestaurantsInput)
  }
}

@Resolver(() => Category)
export class CatogoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // DB나 Entity에 존재하지 않는 Dinamic Field, 계산해서 Output으로 보여주기 위해 사용됨
  @ResolveField(() => Number)
  restuarantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.countRestaurant(category);
  }

  @Query(() => GetCategoriesOutput)
  getCategories(): Promise<GetCategoriesOutput> {
    return this.restaurantService.getCategories();
  }

  @Query(() => GetCategoryOutput)
  getCatogory(
    @Args('input') getCategoryInput: GetCategoryInput,
  ): Promise<GetCategoryOutput> {
    return this.restaurantService.getCategory(getCategoryInput);
  }
}
