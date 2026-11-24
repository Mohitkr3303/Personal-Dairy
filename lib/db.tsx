import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);

const mongodb_url = process.env.MONGODB_URL;

let isConnected = false;

export async function dbConnect() {
  try {
    if (!mongodb_url) {
      throw new Error("MONGODB_URL is not defined");
    }

    if(isConnected){
        console.log("Mongo DB is Connected Successfully");
        return
    }

    const connectionInstance = await mongoose.connect(mongodb_url);
    isConnected = connectionInstance.connections[0].readyState === 1
  } catch (error) {
    console.error("Failed to connect to mongodb: ", error);
  }
}
