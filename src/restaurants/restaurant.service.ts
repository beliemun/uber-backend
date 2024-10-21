import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Like, Repository } from 'typeorm';
import { CreateRestaurantInput } from './dto/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import { EditRestaurantInput } from './dto/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { DeleteRestaurantInput } from './dto/delete-restaurant.dto';
import { GetCategoryInput, GetCategoryOutput } from './dto/get-category.dto';
import {
  GetRestaurantsInput,
  GetRestaurantsOutput,
} from './dto/get-restaurants.dto';
import {
  GetRestaurantInput,
  GetRestaurantOutput,
} from './dto/get-restaurant.dto';
import {
  SearchRestaurantsInput,
  SearchRestaurantsOutput,
} from './dto/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dto/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dto/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dto/delete-dish.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    private readonly categories: CategoryRepository,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ) {
    try {
      const restaurant = this.restaurants.create(createRestaurantInput);
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      // staurant는 아직 owner가 배정되지 않았아. 이대로 save하면 오류 발생.
      // create는 db에 저장하지 않고 instance만 생성하기 때문에 그 뒤에 owner를 지정해 준다.
      restaurant.owner = owner;
      restaurant.category = category;

      await this.restaurants.save(restaurant);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async editRestaurant(owner: User, editRestaurant: EditRestaurantInput) {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: editRestaurant.restaurantId },
      });
      if (!restaurant) {
        throw new Error('Restaurant not found.');
      }
      if (owner.id !== restaurant.ownerId) {
        throw new Error("You can't edit a restaurant that you don't own");
      }
      let category: Category = null;
      if (editRestaurant.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurant.categoryName,
        );
      }
      await this.restaurants.save([
        {
          id: editRestaurant.restaurantId,
          ...editRestaurant,
          ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async deleteRestuarant(owner: User, { restaurantId }: DeleteRestaurantInput) {
    const restaurant = await this.restaurants.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new Error('Restaurant not found.');
    }
    if (owner.id !== restaurant.ownerId) {
      throw new Error("You can't edit a restaurant that you don't own");
    }
    await this.restaurants.delete(restaurantId);
    try {
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async getRestaurant({
    restaurantId,
  }: GetRestaurantInput): Promise<GetRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
        relations: ['menu'],
      });
      console.log(restaurant);
      if (!restaurant) {
        throw new Error('Restaurant not found.');
      }
      return {
        ok: true,
        restaurant,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async getRestaurants({
    page,
  }: GetRestaurantsInput): Promise<GetRestaurantsOutput> {
    try {
      const [restaurants, totalItems] = await this.restaurants.findAndCount({
        take: 10,
        skip: (page - 1) * 10,
        order: { createdAt: 'asc' },
      });
      return {
        ok: true,
        restaurants,
        totalPages: Math.ceil(totalItems / 10),
        totalItems,
      };
    } catch (e) {
      return {
        ok: true,
        error: e.message,
      };
    }
  }

  async searchRestaurants({
    query,
    page,
  }: SearchRestaurantsInput): Promise<SearchRestaurantsOutput> {
    try {
      const [restaurants, totalItems] = await this.restaurants.findAndCount({
        where: {
          name: ILike(`%${query}%`), // Like는 대소문자를 구분하고, ILike는 구분하지 않음.
        },
        take: 10,
        skip: (page - 1) * 10,
        order: { createdAt: 'ASC' },
      });
      return {
        ok: true,
        restaurants,
        totalItems,
        totalPages: Math.ceil(totalItems / 10),
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async getCategories() {
    const categories = await this.categories.find();
    try {
      return {
        ok: true,
        categories,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async getCategory({
    slug,
    page,
  }: GetCategoryInput): Promise<GetCategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug },
        // relations: ['restaurants'], 이렇게 하면 관련된 레스토랑이 많을 경우 DB가 저세상에 갈 수 있음
      });
      if (!category) {
        throw new Error('Category not found.');
      }
      const restaurants = await this.restaurants.find({
        where: { category: { id: category.id } },
        take: 10,
        skip: (page - 1) * 10,
      });

      const totalCount = await this.countRestaurant(category);
      return {
        ok: true,
        category,
        restaurants,
        totalPages: Math.ceil(totalCount / 10),
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async countRestaurant(category: Category): Promise<number> {
    return await this.restaurants.count({
      where: { category: { id: category.id } },
    });
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createDishInput.restaurantId },
      });
      if (!restaurant) {
        throw new Error('Dish not found.');
      }
      if (owner.id !== restaurant.ownerId) {
        throw new Error(
          "You can't create a dish in a restaurant that you don't own.",
        );
      }
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: editDishInput.dishId },
      });
      if (!dish) {
        throw new Error('Dish not found.');
      }
      const restaurant = await this.restaurants.findOne({
        where: { id: dish.restaurantId },
        select: ['ownerId'],
      });
      if (owner.id !== restaurant.ownerId) {
        throw new Error("You can't do that.");
      }
      await this.dishes.save({
        id: editDishInput.dishId,
        ...editDishInput,
      });
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: dishId },
      });
      if (!dish) {
        throw new Error('Dish not found.');
      }
      const restaurant = await this.restaurants.findOne({
        where: { id: dish.restaurantId },
        select: ['ownerId'],
      });
      if (owner.id !== restaurant.ownerId) {
        throw new Error("You can't do that.");
      }
      await this.dishes.delete(dishId);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }
}
