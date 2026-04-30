import { BaseModel } from "@/core/base.model.js";

class CategoryModel extends BaseModel {
  constructor() { super("categories"); }
}

export const Categories = new CategoryModel();
export default Categories;
