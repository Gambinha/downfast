import {Server, Socket} from "socket.io";

export class SocketInit {
    private static _instance: SocketInit;

    public sockets = {};

    socketIo: Server;

    constructor(io: Server) {
        this.socketIo = io;

        this.socketIo.on("connection", (socket: Socket) => {
            console.log("User connected " + socket.id);

            socket.on("connectInit", (sessionId) => {
                this.sockets[sessionId] = socket.id;
            })

            socket.on("disconnect", () => {
                console.log("user disconnected " + socket.id);
                
                this.deleteByVal(socket.id);
                console.log(this.sockets);
            })
        });

        SocketInit._instance = this;
    }

    public deleteByVal(val: string) {
        for (var key in this.sockets) {
            if (this.sockets[key] == val) delete this.sockets[key];
        }
    }

    public static getInstance(): SocketInit {
        return SocketInit._instance;
    }

    public publishEvent(event: string, data: any, sessionId: string) {
        const thisSocketId = this.sockets[sessionId];
        console.log(sessionId);
        console.log(thisSocketId);

        this.socketIo.to(thisSocketId).emit(event, data);
    }
}