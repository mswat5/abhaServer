import express from "express";
import dotenv from "dotenv";
import abhaRoutes from "./routes/abharoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/", abhaRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
