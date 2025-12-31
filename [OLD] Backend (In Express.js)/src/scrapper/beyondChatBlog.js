import axios from "axios"
import { load } from "cheerio"

//returns num
 const getBlogLastPage = (async () => {

    const res = await axios({ method: "get", url: "https://beyondchats.com/blogs/" })

    const $ = load(res.data)

    const pageElemnt = $('.page-numbers')

    const pgNum = []

    pageElemnt.each((_, element) => {
        const text = $(element).text().trim();

        const pg = Number(text)

        if (!isNaN(pg)) {
            pgNum.push(pg)
        }
    })
    return (Math.max(...pgNum));
})

//return array
const getArticleLinksFromPage = (async (page) => {
    
    const res = await axios({
        method: "get",
        url: `https://beyondchats.com/blogs/page/${page}`
        
    })
    
    const $ = load(res.data)
    
    const articleElement = $(".entry-title")
    
    const articleLinks = []
    
    articleElement.each((_, element) => {
        
        const link = $(element).extract(
            {
                links: {
                    selector: 'a',
                    value: 'href',
                }
            }
        )
        
        articleLinks.push(link.links)
        
    })
    
    
    return (articleLinks)
    
    
})

//return array
export const getOldestFiveArticles = (async () => {
    
    const lastPg = await getBlogLastPage()
    
    const Articlelinks = await getArticleLinksFromPage(lastPg);
    
    const OldestFiveArticleLinks = []
    
    if (Articlelinks.length < 5) {
        OldestFiveArticleLinks.push(...Articlelinks)
        const newLinks = await getArticleLinksFromPage(lastPg-1)
        OldestFiveArticleLinks.push(...newLinks.slice(-(5-OldestFiveArticleLinks.length)))

    }
    return OldestFiveArticleLinks
})


