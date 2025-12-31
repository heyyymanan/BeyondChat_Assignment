import mongoose from "mongoose";



const connectDataBase = async () => {
    try {

        const connectionInstance = await mongoose.connect(`${process.env.MDB_URI}/BeyondChat`);

        console.log(`\nDatabase Connected Successfully !`);

    } catch (error) {

        console.log("MongoDB Connection Failed",error);
        process.exit(1);

    }
    
}

export default connectDataBase;