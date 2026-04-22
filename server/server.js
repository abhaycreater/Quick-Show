import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./Ingest/index.js";
import showRouter from "./routes/show.routes.js";
import bookingRouter from "./routes/bookings.routes.js";
import adminRouter from "./routes/admin.routes.js";
import userRouter from "./routes/user.Routes.js";
import { stripeWebhooks } from "./controllers/stripeWebhook.js";

const app = express();
const port = 3000;

await connectDB();

//stripe webhook route
app.use('/api/stripe',express.raw({type: 'application/json'}),stripeWebhooks)

// middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// routes
app.get("/", (req, res) => res.send("server is Live"));

// ✅ FIXED ROUTE
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/show', showRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/admin' , adminRouter)
app.use('/api/user',userRouter)

app.listen(port, () => {
  console.log(`server Live On Port http://localhost:${port}`);
});