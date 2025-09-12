import { MutationResolvers } from "../../../generated";
import { UserModel } from "../../../models/user/user";

export const createUser: MutationResolvers["createUser"] = async (
  _,
  { input: { email, name, age } }
) => {
  const user = await UserModel.findOne({ email });
  if (user) throw new Error("User already exists");
  const newUser = await UserModel.create({ email, name, age });

  return {
    userId: newUser._id.toString(),
    email: newUser.email,
    name: newUser.name,
    age: newUser.age,
    createdAt: newUser.createdAt.toISOString(),
    updatedAt: newUser.updatedAt.toISOString(),
  };
};
