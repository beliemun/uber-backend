import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(private dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  async getOrCreate(name: string) {
    const categoryName = name.trim().toLowerCase().replace(/ +/g, ' ');
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.findOne({where:{slug:categorySlug}})
    if (!category) {
      category = await this.save(
        this.create({
          name: categoryName,
          slug: categorySlug,
        }),
      );
    }
    return category;
  }
}