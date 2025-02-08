import { redis } from '../config/redis.js';
import { schema } from '../models/planSchema.js';
import { generateEtag } from '../utils/etagGenerator.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);

export const createPlan = async (req, res) => {
  try {
    const data = req.body;

    if (!validate(data)) {
      console.error('Validation errors:', validate.errors);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validate.errors
      });
    }

    const key = `data:${data.objectId}`;
    const exists = await redis.exists(key);
    
    if (exists) {
      return res.status(409).json({
        message: 'Object ID already exists',
      });
    }

    // Store in Redis
    await redis.set(key, JSON.stringify(data));

    // Generate ETag
    console.log('data1 for etag:', data);
    const etag = generateEtag(data);

    // Set Headers
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
       .header('Pragma', 'no-cache')
       .header('X-Content-Type-Options', 'nosniff')
       .header('ETag', etag);

    return res.status(201).json({
      message: `Plan with ID: ${data.objectId} created successfully`,
      planId: data.objectId,
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({
      message: 'Error creating plan',
      error: error.message
    });
  }
};


export const getPlan = async (req, res) => {
  console.log("Fetching plan with ID:", req.params.id);
  try {
    const key = `data:${req.params.id}`;
    const data = await redis.get(key);

    if (!data) {
      return res.status(404).json({
        message: `Plan with ID: ${req.params.id} not found`,
      });
    }

    const parsedData = JSON.parse(data);
    console.log('data2 for etag:', parsedData);
    const etag = generateEtag(parsedData);
    console.log('ETag:', etag);
    console.log('Request ETag:', req.headers["if-none-match"]);

    if (req.headers["if-none-match"] === etag) {
      return res.status(304).send();
    }

    res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
       .header('Pragma', 'no-cache')
       .header('X-Content-Type-Options', 'nosniff')
       .header('ETag', etag);

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return res.status(500).json({
      message: 'Error fetching plan',
      error: error.message
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const key = `data:${req.params.id}`;
    const exists = await redis.exists(key);

    if (!exists) {
      return res.status(404).json({
        message: `Plan with ID: ${req.params.id} not found`,
      });
    }

    await redis.del(key);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({
      message: 'Error deleting plan',
      error: error.message
    });
  }
};