import app from "./app";
import { connectDB } from "./database";
import config from './config';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`🚀 Server running at http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }

};
startServer();
