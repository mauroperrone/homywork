// server/routes.ts
import { Router } from "express";
import meRoute from "./meRoute";
import propertiesRoute from "./propertiesRoute";

const router = Router();

router.use(meRoute);
router.use(propertiesRoute);

export default router;
