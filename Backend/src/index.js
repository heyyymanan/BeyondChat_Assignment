import {getOldestFiveArticles} from "./scrapper/scrapper.js";

console.log("running...");

const links = await getOldestFiveArticles()

console.log(links)

