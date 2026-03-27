import { CorsOptions } from "cors";
import { config } from "./env"; 

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.allowed_urls.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsOptions;