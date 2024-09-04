const elements = [ "fire", "water", "wind", "electric", "plant"]
const roomData = {}

export const setRoomActionCard = async (roomName: string)=>{
  roomData[roomName] = actionCards()
}

export const getRoomActionCard = async (roomName: string)=>{
  roomData[roomName] = await shuffle(actionCards())
  return roomData[roomName]
}

export const shuffle =(ary: any[])=>{
  return new Promise((resolve,_reject)=>{
    const backupAry: any[]= [...ary]
    const {length} = backupAry
    for(let i=0;i<length;i++ ){
      const random1 = Math.floor(Math.random()*length)
      const random2 = Math.floor(Math.random()*length)
      const backup1 = ary[random1]
      const backup2 = ary[random2]
      ary[random1] = backup2
      ary[random2] = backup1
    }
    resolve(ary)
  })
}

export const cardSet =(setCount: number)=>{
  const result = []
  for(let i=0; i<setCount;i++){
    for(const element of elements){
      result.push(
        ...Array(10).fill(null).map((_v,i)=>{return {element,attack:i+1,defence:0,heal:0,actionPoint: Math.ceil(Math.random()*i+1)}})
      )
    }
  }
  return result
}

export const actionCards =()=> [
  ...cardSet(4),
  ...Array(10).fill(null).map((_v,i)=>{return {element:'defence',attack:0,defence:i+1,heal:0,actionPoint: Math.ceil(Math.random()*i+1)}}),
  ...Array(10).fill(null).map((_v,i)=>{return {element:'heal',attack:0,defence:0,heal:i+1,actionPoint: Math.ceil(Math.random()*i+1)}}),
]