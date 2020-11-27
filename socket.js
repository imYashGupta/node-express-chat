let io;
module.exports ={
    init:httpServer => {
        io = require("socket.io")(httpServer);
        return io;
    },
    io:() => {
        if(!io){
            throw new Error("io not defined.")
        }
        return io; 
    }
    
}