import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantInput } from './dto/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import { EditRestaurantInput } from './dto/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { DeleteRestaurantInput } from './dto/delete-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
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

  async allCategories() {
    const categories = await this.categories.find()
    try {
      return {
        ok: true,
        categories
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }

  async countRestaurant(category:Category) :Promise<number>{
    return await this.restaurants.count({where:{category}})
  }
}
