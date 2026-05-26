import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
      planType: string;
      freeExamsUsed: number;
      oneTimeExamsRemaining: number;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image: string;
    planType: string;
    freeExamsUsed: number;
    oneTimeExamsRemaining: number;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    name: string;
    picture: string;
    planType: string;
    freeExamsUsed: number;
    oneTimeExamsRemaining: number;
    role: string;
  }
}
