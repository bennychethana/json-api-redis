import express from 'express';
import dotenv from 'dotenv';
import planRoutes from './routes/planRoutes.js';
import {elasticServiceConnection} from './services/elasticServiceConnection.js';
import rabbit from './services/rabbitmq.service.js';
import { initializeIndex } from './services/initializeIndex.js';

dotenv.config();

const app = express();
app.set("etag", "strong");
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(planRoutes);

app.listen(PORT, async () => {
  try {
    // Initialize Elasticsearch
    const esConnection = await elasticServiceConnection();
    if (esConnection.status === 200) {
      console.log('Connected to Elasticsearch');
      
      // Initialize index with parent-child mapping
      await initializeIndex();

      // Initialize RabbitMQ
      await rabbit.setupRabbitMQ();
      // Start the RabbitMQ consumer
      await rabbit.consumer();    

      console.log('Elasticsearch index initialized');
    } else {
      console.error('Failed to connect to Elasticsearch');
    }
    
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Service initialization error:', error);
  }
});