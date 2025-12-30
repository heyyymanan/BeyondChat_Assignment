import {app} from "./app.js"
import connectDataBase from "./Mongo/connect.js";



connectDataBase()
.then(()=>{
  app.on("error", (error)=>{
    console.log("Error : ",error);
    throw error;
  })
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`Server Is Running At Port ${process.env.PORT}`)
  })
})
.catch((err) =>{
  console.log("MongoDB Connection Failed.", err);
})