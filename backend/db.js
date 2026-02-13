import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI in .env");

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || "autoguide_ai",
  });

  console.log("✅ MongoDB connected:", mongoose.connection.name);
}



