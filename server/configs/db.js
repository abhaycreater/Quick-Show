import mongoose from "mongoose";
import dns from 'dns'

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async ()=>{
    try{
        mongoose.connection.on('connected',()=> console.log('Database Connected')
        )
        await mongoose.connect(`${process.env.MONGOOSE_DB}/quickshow`)
    }catch(error){
        console.log(error.message);
        
    }
}

export default connectDB;