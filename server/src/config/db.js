import mongoose from 'mongoose';
/*
* This code is used to connect to the MongoDB database.
*
*/
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google's DNS

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
