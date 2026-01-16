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
  }
}
