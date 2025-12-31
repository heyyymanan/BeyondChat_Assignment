import { Router } from "express";
import { getAllArticles,deleteArticle,getArticleById } from "../controllers/orignalArticles.controller.js";
import { updateOldestArticlesFromGoogle } from "../controllers/updatedArticles.controller.js";

const router = Router();

router.post("/updateOld", updateOldestArticlesFromGoogle);
router.get("/", getAllArticles);
router.get("/:id", getArticleById);
router.delete("/:id", deleteArticle);


export default router