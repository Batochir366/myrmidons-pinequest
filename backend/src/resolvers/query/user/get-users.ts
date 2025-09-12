import { QueryResolvers } from "../../../generated";
import { UserModel } from "../../../models/user/user";

export const getUsers: QueryResolvers["getUsers"] = async () => {
  const users = await (UserModel as any).find().exec();

  return users.map((user) => ({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    age: user.age,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
};
