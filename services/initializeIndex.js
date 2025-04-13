import { client } from './elasticServiceConnection.js';

const INDEX_NAME = "planindex";

export const initializeIndex = async () => {
  try {
    const indexExists = await client.indices.exists({ index: INDEX_NAME });

    if (!indexExists.body) {
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          settings: {
            index: {
              number_of_shards: 1,
              number_of_replicas: 1
            }
          },
          mappings: {
            properties: {
              objectId: { type: "keyword" },
              objectType: { type: "keyword" },
              _org: { type: "keyword" },
              planType: { type: "keyword" },
              creationDate: { type: "date", format: "MM-dd-yyyy" },
              planCostShares: {
                properties: {
                  copay: { type: "integer" },
                  deductible: { type: "integer" },
                  _org: { type: "keyword" },
                  objectId: { type: "keyword" },
                  objectType: { type: "keyword" }
                }
              },
              linkedService: {
                properties: {
                  name: { type: "text" },
                  objectId: { type: "keyword" },
                  objectType: { type: "keyword" },
                  _org: { type: "keyword" }
                }
              },
              planserviceCostShares: {
                properties: {
                  copay: { type: "integer" },
                  deductible: { type: "integer" },
                  _org: { type: "keyword" },
                  objectId: { type: "keyword" },
                  objectType: { type: "keyword" }
                }
              },
              plan_join: {
                type: "join",
                eager_global_ordinals: true,
                relations: {
                  plan: ["planCostShares", "linkedPlanServices"],
                  linkedPlanServices: ["linkedService", "planserviceCostShares"]
                }
              }
            }
          }
        }
      });

      console.log(`Created index '${INDEX_NAME}' with correct parent-child mappings.`);
    } else {
      console.log(`Index '${INDEX_NAME}' already exists.`);
    }

    return { status: 200, message: 'Index is ready' };
  } catch (error) {
    console.error('Error initializing index:', error);
    return { status: 500, message: 'Failed to initialize index' };
  }
};
