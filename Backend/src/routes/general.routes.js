import { Router } from "express";
import { getAllArticles,deleteArticle,getArticleById } from "../controllers/orignalArticles.controller.js";
import { updateOldestArticlesFromGoogle } from "../controllers/UpdatedArticles.controller.js";
import { fetchNSaveOld } from "../controllers/scrapOldNSave.controller.js";

 const router = Router()

router.post("/scrape", fetchNSaveOld);
router.post("/updateOld", updateOldestArticlesFromGoogle);
router.get("/", getAllArticles);
router.get("/:id", getArticleById);
router.delete("/:id", deleteArticle);


export default router