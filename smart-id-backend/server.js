import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import seedPermissions from "./src/config/seedPermissions.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedPermissions();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
