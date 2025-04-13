import { redis } from '../config/redis.js';
import { schema } from '../models/planSchema.js';
import { generateEtag } from '../utils/etagGenerator.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { verifyGoogleToken } from '../utils/authMiddleware.js';
import rabbit from "../services/rabbitmq.service.js"

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);

export const createPlan = async (req, res) => {
  try {

    const user = await verifyGoogleToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

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

    console.log(">>>>>>>>> Puting in rabbit")
    // Store in elastic index
    rabbit.producer({
      operation: "STORE",
      body: data
    });
    console.log(">>>>>>>>> Done Puting in rabbit")

    // Generate ETag
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
  try {
    const user = await verifyGoogleToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const key = `data:${req.params.id}`;
    const data = await redis.get(key);

    if (!data) {
      return res.status(404).json({
        message: `Plan with ID: ${req.params.id} not found`,
      });
    }

    const parsedData = JSON.parse(data);
    const etag = generateEtag(parsedData);

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
    const user = await verifyGoogleToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const key = `data:${req.params.id}`;
    const exists = await redis.exists(key);

    if (!exists) {
      return res.status(404).json({
        message: `Plan with ID: ${req.params.id} not found`,
      });
    }

    const data = await redis.get(key);

    const parsed = JSON.parse(data);
    // const currentEtag = generateEtag(parsed);

    // if (req.headers["if-match"] && req.headers["if-match"] !== currentEtag) {
    //   return res.status(412).json({
    //     message: "Precondition Failed: Data has changed",
    //   });
    // }

    await redis.del(key);

     // Delete from Elastic via Rabbit
     rabbit.producer({
      operation: "DELETE",
      body: parsed
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({
      message: 'Error deleting plan',
      error: error.message
    });
  }
};

export const patchPlan = async (req, res) => {
  try {
    const user = await verifyGoogleToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const key = `data:${req.params.id}`;
    const existingData = await redis.get(key);

    if (!existingData) {
      return res.status(404).json({ message: `Plan with ID: ${req.params.id} not found` });
    }

    const parsedData = JSON.parse(existingData);
    const currentEtag = generateEtag(parsedData);

    if (!req.headers["if-match"]) {
      return res.status(428).json({
        error: "Precondition Required",
        message: "If-Match header is required for updates",
      });
    }
    
    // Check If-Match header
    if (req.headers["if-match"] && req.headers["if-match"] !== currentEtag) {
      return res.status(412).json({ message: "Precondition Failed: Data has changed" });
    }

  const mergedData = {
    ...parsedData,
    ...req.body
  };
  
  // Handle the linkedPlanServices array specially
  if (req.body.linkedPlanServices && req.body.linkedPlanServices.length > 0) {
    // Create a map of existing services by objectId for easy lookup
    const existingServicesMap = new Map();
    parsedData.linkedPlanServices.forEach(service => {
      existingServicesMap.set(service.objectId, service);
    });
    
    // Initialize with existing services
    const updatedServices = [...parsedData.linkedPlanServices];
    
    // Process each service in the request body
    req.body.linkedPlanServices.forEach(newService => {
      const existingServiceIndex = updatedServices.findIndex(
        service => service.objectId === newService.objectId
      );
      
      if (existingServiceIndex >= 0) {
        // Update existing service
        updatedServices[existingServiceIndex] = {
          ...updatedServices[existingServiceIndex],
          ...newService
        };
      } else {
        // Add new service
        updatedServices.push(newService);
      }
    });
    
    // Set the updated services array
    mergedData.linkedPlanServices = updatedServices;
  }

    if (!validate(mergedData)) {
      return res.status(400).json({ message: 'Validation failed', errors: validate.errors });
    }

    await redis.set(key, JSON.stringify(mergedData));

    rabbit.producer({
      operation: "STORE",
      body: mergedData
    });

    const newEtag = generateEtag(mergedData);

    res.header('ETag', newEtag);
    return res.status(200).json(mergedData);
    // return res.status(200).json({ message: `Plan with ID: ${req.params.id} merged successfully` });
  } catch (error) {
    return res.status(500).json({ message: 'Error merging plan', error: error.message });
  }
};
