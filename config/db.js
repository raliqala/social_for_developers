const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

mongoose.set('useCreateIndex', true)
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected...");
  } catch (err) {
    console.error(err.message);
    //if connection fails exit
    process.exit(1);
  }
};

module.exports = connectDB;
