const fs = require('fs');
const path = require('path');

// List of allowed origins
const allowedOrigins = [
    "https://designifyai.replit.app",
    "https://designifyai.com",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
  ];

exports.handler = async (event) => {
// Set CORS headers to allow cross-origin requests
    const origin = event.headers.origin;
    let headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS, DELETE, HEAD",
    "Content-Type": "application/json" //sets for all responses
    };

    // Check if the request's origin is in our list of allowed origins
    if (allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }
    else {
    // Optionally use a wildcard or specify a default policy for non-matched origins
    headers["Access-Control-Allow-Origin"] = '*'; // to be checked in production
    console.log("Origin is not part of CORS allowed sites", origin);
    }

    // Handling OPTIONS method for preflight requests
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({message: "You can use GET, POST, PATCH, DELETE and HEAD"}),
        };
    }

    // Dynamically import the lambda-rate-limiter module
    const ip = event.headers['x-forwarded-for'] || event.requestContext?.identity?.sourceIp;
    let rateLimit;
    try {
        const rateLimiterModule = await import("lambda-rate-limiter");
        const rateLimiter = rateLimiterModule.default({
            interval: 60 * 1000, // 60,000 ms == 1 minute
            uniqueTokenPerInterval: 500, // Max unique tokens (e.g., IPs) to track
        });
        rateLimit = rateLimiter.check.bind(rateLimiter, 10, "IP");
        } catch (error) {
        console.error("Failed to import lambda-rate-limiter", error);
        return {
            statusCode: 429, // HTTP status code for Too Many Requests
            headers,
            body: JSON.stringify({ message: `Unable to import lambda-rate-limiter. Verify implementation` }),
        };
    }

    try {
        // Check and apply rate limiting based on the IP address
        await rateLimit(ip);
        } catch (error) {
        // If an error is thrown, it means the rate limit has been exceeded
        console.error(`Rate limit exceeded for IP: ${ip} or ${error}`);
        return {
            statusCode: 429, // HTTP status code for Too Many Requests
            headers,
            body: JSON.stringify({ message: `Rate limit of 10 requests per ${rateLimit.interval} ms exceeded. Please try again later.` }),
        };
    }
    // Route function based on GET or POST method call
    if (event.httpMethod == "POST") {
        // Parse POST request body for update
        const body = JSON.parse(event.body);
        const email = body.email;
        if (email) {
            // Append the email to the users.txt file two folders out from the current directory
        fs.appendFileSync(path.join(__dirname, '../../users.txt'), email + '\n');
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Signup Successful!' }),
            headers: { 'Content-Type': 'application/json' }
        };
        } else {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'The form is missing arguments!' }),
            headers: { 'Content-Type': 'application/json' }
        };
        }
    }
};


