import "dotenv/config";
import { createConnection } from "mariadb";

async function main() {
  let connection;

  try {
    connection = await createConnection({
      host: process.env.DATABASE_HOST ?? "127.0.0.1",
      port: Number(process.env.DATABASE_PORT ?? 3306),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      allowPublicKeyRetrieval: true,
    });

    const result = await connection.query("SELECT DATABASE() AS database_name");

    console.log("Direct driver connection successful!");
    console.log("Connected database:", result[0].database_name);
  } catch (error: any) {
    console.error("Direct driver connection failed.");
    console.error("Error code:", error.code ?? "Not provided");
    console.error("Error message:", error.message ?? "Not provided");
  } finally {
    if (connection) await connection.end();
  }
}

main();
