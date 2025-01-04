import {PrismaClient } from "@prisma/client"

declare global {
    var prisma: PrismaClient | undefined;
}
  
export const db =globalThis.prisma || new PrismaClient

if(process.env.NODE_ENV !=='production'){
    globalThis.prisma =db;
}

//globalThis.prisma: this global variable ensures that the prisma client instance is reused across hot reloads during development. without this, each time your app reloads,  a new instance of prisma cliedn will be created, postential leading to conntetion issue