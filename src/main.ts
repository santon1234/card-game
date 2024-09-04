const express = require('express');
const cors = require("cors");
import http from "http";
import { ChatSocket } from "./socket/index";

const isProduction = process.env.NODE_ENV == "production";
const origin = isProduction ? 'https://www.lsw.kr' : '*'
const port =  80;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use( cors({origin}) )


 app.use("/", express.static("public"));

const server = http.createServer({}, app);
server.listen(port, () => console.log(`listening at port ${port}`));

const socket = new ChatSocket(server)
socket.connect()

