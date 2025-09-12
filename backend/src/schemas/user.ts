import { gql } from "apollo-server-cloud-functions";

export const userTypeDefs = gql`
  type User {
    userId: ID!
    name: String!
    email: String!
    age: Int
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getUsers: [User!]!
    getUser(userId: ID!): User
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(userId: ID!, input: UpdateUserInput!): User!
    deleteUser(userId: ID!): Boolean!
  }

  input CreateUserInput {
    name: String!
    email: String!
    age: Int
  }

  input UpdateUserInput {
    name: String!
    email: String!
    age: Int
  }
`;
