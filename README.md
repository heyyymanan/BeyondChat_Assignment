# 🚀[Assignment] BeyondChats – AI Content Management Dashboard

A production-style content pipeline that scrapes legacy articles, enriches them using AI, and streams real-time backend progress logs to a modern dashboard.

This project demonstrates backend-heavy engineering, real-world API constraints, and graceful system design under limited resources.

---

## ✨ Key Features

### 📰 Content Pipeline
* **Scrape old blog articles automatically**
* Store original articles in MongoDB
* Rewrite articles using **Google Gemini AI**
* Maintain original + AI-enhanced versions

### ⚡ Real-Time Processing (SSE)
* Uses **Server-Sent Events (SSE)** for long-running tasks
* Live backend logs streamed to the frontend
* Progress bar + stage-based updates
* Same log viewer reused for:
    * AI article rewriting
    * Old article scraping

### 🧠 AI Intelligence
* HTML-aware rewriting (preserves structure)
* SEO-oriented enhancements
* Reference-based enrichment from Google search results
* **Automatic model fallback** on rate limits

### 🗂 Dashboard
* Clean, dark-mode UI
* Side-by-side **Original vs AI Enhanced** article view
* Context-aware delete actions
* Live status indicators
* Zero page refreshes

---

## 🧩 Tech Stack

### Frontend
* **Next.js** (App Router)
* React
* Tailwind CSS
* Lucide Icons
* Server-Sent Events (EventSource)

### Backend
* **Next.js Route Handlers**
* MongoDB + Mongoose
* Google Gemini API
* Cheerio (HTML parsing)
* Axios (scraping)
* SerpAPI (article discovery)

---

## 📁 Project Structure

```plaintext
assignment/
├── app/
│   ├── api/
│   │   ├── articles/
│   │   ├── updated-articles/
│   │   ├── update-articles/        # SSE – AI rewriting
│   │   ├── scrape-old-articles/    # SSE – scraping
│   └── page.js                     # Dashboard
│
├── lib/
│   ├── db.js
│   ├── rewriteWithLLM.js
│   ├── logger.js                   # SSE logger
│   └── scrapers/
│
├── models/
│   ├── Article.js
│   └── UpdatedArticle.js
│
├── public/
├── .env
└── README.md

```

## ⚙️ Environment Setup
1. Clone the repository
Bash

git clone <repo-url>
cd assignment
2. Install dependencies
Bash

npm install
3. Create .env file
Create a file named .env in the root directory and add your keys:

Code snippet

# MongoDB
MDB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net

# Gemini AI
GOOGLE_API_KEY=your_gemini_api_key

# SerpAPI
SERP_API_KEY=your_serpapi_key
Note: Do not commit .env. It is excluded via .gitignore.

4. Run the project
Bash

npm run dev
Open: http://localhost:3000

## 🔄 How the System Works
Scraping Old Articles
Fetches the oldest blog pages

Extracts article links

Scrapes article HTML

Stores articles in MongoDB

Streams logs to UI via SSE

AI Article Rewriting
Fetches oldest unprocessed articles

Searches related articles via Google

Scrapes reference HTML

Sends structured prompt to Gemini

Stores AI-enhanced version

Streams each step live to frontend

## 📡 Real-Time Logs (SSE)
All long-running operations emit structured events:

JSON

{
  "timestamp": "2025-01-01T10:15:30Z",
  "stage": "REWRITING_WITH_LLM",
  "message": "Sending content to Gemini"
}
The frontend displays:

Live logs

Progress bar

Current processing stage

Error messages (if any)

## ⚠️ Gemini API Free Tier – Rate Limit Notice
This project uses Google Gemini API (Free Tier).

Free Tier Constraints (per model)
~20 requests per day

Very low requests per minute

Exceeding limits returns:

HTTP 429 – RESOURCE_EXHAUSTED
How Rate Limits Are Handled
Automatic model fallback:

gemini-2.5-flash

gemini-2.5-flash-lite

gemini-3-flash

Each model is tried once per article.

No infinite retries.

Rate-limit events are logged and shown in UI.

Articles are skipped gracefully if all models are unavailable.

Production Note
With a paid Gemini plan:

Rate limits are significantly higher

Model switching becomes rare

No architectural changes are required

## 🧪 Development Notes
In Next.js dev mode, SSE routes may execute twice.

This can temporarily increase API usage.

This behavior does not occur in production builds.

🗑 Delete Behavior
Original tab: Deletes the original article.

AI Enhanced tab: Deletes only the AI-generated version.

Context-aware actions reduce accidental deletion.

## 📌 Design Philosophy
Backend-first architecture

Real-time observability

Graceful failure handling

Production-oriented decisions

Transparent system behavior

## 👨‍💻 Author
Manan Vyas BCA | Backend & Systems Enthusiast

Focused on building real-world systems, not just demos.