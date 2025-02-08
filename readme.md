# JSON-Based REST API with Redis & ETag Support and Schema Validation

## Project Overview
This project is a **RESTful API** that can handle **any structured JSON data** using:
- **Express.js** (Backend framework)
- **Redis** (Key-value store for fast storage)
- **AJV** (JSON Schema validation)
- **ETag-based caching** (Prevents redundant data transfer ie, conditional get)

Unlike a traditional backend, this API **does not use a relational databases**. Instead, it stores structured JSON objects in **Redis**, making it highly efficient for read-heavy operations.

## **Installation & Setup**

Clone the Repository
```sh
git clone https://github.com/your-repo.git
cd your-repo
```
Install Dependencies

    npm install

Start Redis Server

    redis-server &

Start the API Server

    npm start

The server runs at

    http://localhost:8000

## API Routes & Sample Calls

### Create a New Plan (POST /api/v1/data)

Request:

    POST http://localhost:8000/api/v1/data
    Content-Type: application/json

Sample JSON Body:

    {
    "planCostShares": {
        "deductible": 2000,
        "_org": "example.com",
        "copay": "23",
        "objectId": "1234vxc2324sdf-501",
        "objectType": "membercostshare"
    },
    "linkedPlanServices": [{
        "linkedService": {
            "_org": "example.com",
            "objectId": "1234520xvc30asdf-502",
            "objectType": "service",
            "name": "Yearly physical"
        },
        "planserviceCostShares": {
            "deductible": 10,
            "_org": "example.com",
            "copay": 0,
            "objectId": "1234512xvc1314asdfs-503",
            "objectType": "membercostshare"
        },
        "_org": "example.com",
        "objectId": "27283xvx9asdff-504",
        "objectType": "planservice"
    }],
    "_org": "example.com",
    "objectId": "12xvxc345ssdsds-510",
    "objectType": "plan",
    "planType": "inNetwork",
    "creationDate": "12-12-2017"
    }

### Retrieve a Plan (GET /api/v1/data/:id)

Request:

    GET http://localhost:8000/api/v1/data/12xvxc345ssdsds-508

### Conditional GET Using ETag (If-None-Match)

Request:

    GET /api/v1/data/12xvxc345ssdsds-508
    Headers:
    If-None-Match: "5d41402abc4b2a76b9719d911017c592"

### Delete a Plan (DELETE /api/v1/data/:id)

Request:

    DELETE /api/v1/data/12xvxc345ssdsds-508

### Redis Commands

Open Redis CLI

    redis-cli

Check if Redis is running

    redis-cli PING

List all stored keys

    redis-cli KEYS *

Retrieve a specific plan from Redis

    redis-cli GET data:<objectId>	

Delete a plan from Redis
    redis-cli DEL data:<objectId>	

Deletes all Redis data

    redis-cli FLUSHALL

