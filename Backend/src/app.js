import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express( );

const allowedOrigins = [
  'http://localhost:3000',
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
import generalRouter from './routes/general.routes.js'

app.use('/general',generalRouter)



export  {app} ;