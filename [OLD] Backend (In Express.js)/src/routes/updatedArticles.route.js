
import { Router } from "express";
import { fetchNSaveOld } from "../controllers/scrapOldNSave.controller.js";
import { getAllUpdatedArticles } from "../controllers/updatedArticles.controller.js";

 const router = Router()

router.post("/scrape", fetchNSaveOld);
router.get("/", getAllUpdatedArticles);


export default router