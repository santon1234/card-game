import { Server } from "socket.io";
import { getRoomActionCard } from "../util/blackSmith";

const isProduction = process.env.NODE_ENV == "production";
const origin = isProduction ? 'http://lsw.kr' : '*'


export class ChatSocket{
  private mSocket: Server
  private mRobyUsers:any
  private mRoomIndex: number
  
  constructor(http:any){
    // const { clientsCount } = (io.engine as any)
    this.mSocket = new Server(http,{cors:{ origin,credentials:isProduction}})
    this.mRobyUsers = {}
    this.mRoomIndex = 0
  }
  

  connect(){
    this.mSocket.on("connect", async (socket) => {
      console.log('socket')
      const userInfo = async () => {
        const sockets = await this.mSocket.fetchSockets();
        return sockets.map(({ id  }) => { 
          return { socketId: id } 
        })
      }
      

      this.mRobyUsers[socket.id] = true
      socket.data.roomName = '';

      socket.data.rooms = [...(socket as any).adapter.sids]

      socket.emit("welcome", {
        socketId: socket.id,
        users: userInfo(),
        clientsCount: (await userInfo()).length
      });

      socket.on("make-room", async ({cardDeck})=> {
        socket.data.roomName = socket.id;
        socket.data.master = true
        socket.data.actionCard = await getRoomActionCard(socket.id)
        socket.data.cardDeck = cardDeck

        socket.join(socket.id)
        
        socket.emit('make-room',{roomName: socket.id})
      })

      socket.on("send-message",async({id,chat,time})=>{
        socket.emit('send-message',{id,chat, time})
        socket.broadcast.emit('send-message',{id,chat, time})
      })

      // socket.on("receive-message",async({id,chat,time})=>{
      //   socket.emit('receive-message',{id,chat, time})
      //   socket.broadcast.emit('receive-message',{id,chat, time})
      // })

      socket.on("search-room", async ({roomName,cardDeck} : {roomName:string,cardDeck:any})=> {
        const room = (socket as any).adapter.sids.get(roomName)
        socket.data.cardDeck = cardDeck

        if(!room) {
          socket.emit('search-room',{result: false,msg: '없는 방입니다.'})
          return
        }

        if(room.size===1) {
          socket.data.roomName = roomName
          socket.join(roomName)

          const sockets = await this.mSocket.fetchSockets();
          const otherInfo = sockets.find(e=>{
            return e.data.roomName === roomName && e.id !== socket.id
          })
          
          socket.to(roomName).emit('incomming-user',{
            me: otherInfo.id,
            other: socket.id,
            otherDeck: socket.data.cardDeck,
            clientsCount: 2
          })
          socket.emit('incomming-user',{
            me: socket.id,
            other: otherInfo.id,
            otherDeck: otherInfo.data.cardDeck,
            clientsCount: 2
          })
          socket.emit('search-room',{result: true, msg:'success, find the room'})
        }else{
          socket.emit('search-room',{result: false,msg:'꽉 찬방입니다.'})
        }
      })


      socket.on("get-action-card", async ()=> {
        const sockets = await this.mSocket.fetchSockets();
        const roomName = socket.data.roomName

        let masterSocket = null
        for (let i=0; i<sockets.length;i++){
          if(sockets[i].data.roomName === roomName && sockets[i].data.master){
            masterSocket = sockets[i]
            break
          }
        }
        
        const card = masterSocket.data.actionCard.splice(0,5)
        socket.emit("get-action-card", {card})
      })

      socket.on("get-one-action-card", async ()=> {
        try{
          const sockets = await this.mSocket.fetchSockets();
          const roomName = socket.data.roomName

          let masterSocket = null
          for (let i=0; i<sockets.length;i++){
            if(sockets[i].data.roomName === roomName && sockets[i].data.master){
              masterSocket = sockets[i]
              break
            }
          }

          if(!masterSocket) return 
          
          const card = masterSocket.data.actionCard.splice(0,1)
          socket.emit("get-one-action-card", {card: card[0]}) 
        }catch(e){
          console.log(e)
        }
      })
      
      socket.on("attack-card", async ({idx, attack,enemyIdx}) => {
        socket.to(socket.data.roomName).emit("attack-card", {idx: idx, attack: attack,enemyIdx:enemyIdx}) 
      });
      socket.on("use-heal-card", async ({idx, value}) => {
        socket.to(socket.data.roomName).emit("use-heal-card", {idx: idx, value: value}) 
      });
      socket.on("use-defence-card", async ({idx, value}) => {
        socket.to(socket.data.roomName).emit("use-defence-card", {idx: idx, value: value}) 
      });
    
      socket.on("leave-user", async () => {
        const users = await userInfo()
        let clientsCount = 0
        for(const user of users){
          if(user.socketId!==socket.id)clientsCount +=1
        }

        socket.broadcast.emit("leave-user", {
          socketId: socket.id,
          clientsCount
        });
      });

      socket.on("disconnect", async () => {
        socket.leave(socket.data.roomName)
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.to(room).emit("leave-user", socket.id);
          }
        }

        socket.broadcast.emit("leave-user", {
          socketId: socket.id,
          clientsCount: (await userInfo()).length
        });
      });
    });
  
    this.mSocket.listen(3000);
  }
}



