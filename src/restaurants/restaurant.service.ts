import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantInput } from './dto/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ) {
    try {
      const restaurant = this.restaurants.create(createRestaurantInput);

      const categoryName = createRestaurantInput.categoryName
        .trim()
        .toLowerCase()
        .replace(/ +/g, ' ');
      const categorySlug = categoryName.replace(/ /g, '-');
      let category = await this.categories.findOne({
        where: { slug: categorySlug },
      });
      if (!category) {
        category = await this.categories.save(
          this.categories.create({
            name: categoryName,
            slug: categorySlug,
          }),
        );
      }

      // restaurant는 아직 owner가 배정되지 않았아. 이대로 save하면 오류 발생.
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
}
