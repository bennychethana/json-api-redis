import express from 'express';
import dotenv from 'dotenv';
import planRoutes from './routes/planRoutes.js';

dotenv.config();

const app = express();
app.set("etag", "strong");
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(planRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});