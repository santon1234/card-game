import * as http from "http";
import { Server } from "socket.io";

export async function SocketIO(app: http.Server) {
  const isProduction = process.env.NODE_ENV;
  const io = new Server(app, {
    pingTimeout: 1000,
    path: "/socket",
    cors: {
      origin: isProduction ? "https://www.lsw.kr" : "http://www.lsw.kr",
    },
  });

  io.on("connection", async (socket) => {
    console.log(`==> id [ ${socket.id} ]`);

    const sockets = await io.fetchSockets();

    const users = () =>
      sockets.map(({ id, data }) => {
        return { id, data };
      });

    socket.emit("imComeIn", users());
    socket.broadcast.emit("usersComeIn", { socketId: socket.id });

    socket.on("disconnection", (data: any) => {
      console.log("disconnection", data);
    });
  });
}
