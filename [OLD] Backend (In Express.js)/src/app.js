import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express( );

const allowedOrigins = [
  'http://localhost:3001',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true
}));



// Parse cookies
app.use(cookieParser());



app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true}));

app.use(express.static("public"));



// genralRoutes
import updatesArticle from './routes/updatedArticles.route.js'
import oldArticles from './routes/oldArticles.route.js'

app.use('/old',oldArticles)
app.use('/updated',updatesArticle)



export  {app} ;