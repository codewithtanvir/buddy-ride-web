// Health check script for production monitoring
const http = require("http");

const healthCheckUrl =
  process.env.HEALTH_CHECK_URL || "http://localhost:4173/health";

function healthCheck() {
  return new Promise((resolve, reject) => {
    const req = http.get(healthCheckUrl, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const healthData = JSON.parse(data);
            console.log("✅ Health Check Passed");
            console.log("Status:", healthData.status);
            console.log("Timestamp:", healthData.timestamp);

            if (healthData.checks) {
              Object.entries(healthData.checks).forEach(([key, check]) => {
                const icon =
                  check.status === "pass"
                    ? "✅"
                    : check.status === "warn"
                    ? "⚠️"
                    : "❌";
                console.log(`${icon} ${key}: ${check.message}`);
              });
            }

            resolve(healthData);
          } catch (error) {
            console.log("✅ Health Check Passed (Simple Response)");
            console.log("Response:", data);
            resolve({ status: "healthy" });
          }
        } else {
          reject(
            new Error(`Health check failed with status: ${res.statusCode}`)
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Health check request failed: ${error.message}`));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Health check timed out after 5 seconds"));
    });
  });
}

// Run health check
healthCheck()
  .then((result) => {
    console.log("\n🎉 Application is healthy and ready for production!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Health Check Failed:");
    console.error(error.message);
    console.error("\nPlease check:");
    console.error("1. Application is running");
    console.error("2. Health endpoint is accessible");
    console.error("3. All services are functioning correctly");
    process.exit(1);
  });
