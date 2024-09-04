import express from "express";
const mysql = require('mysql');
import * as jwt from "jsonwebtoken";
import crypto from "crypto-js";

export const shuffle =(ary: any[])=>{
  const backupAry:readonly any[]= ary
  const {length} = backupAry
  for(let i=0;i<length;i++ ){
    const random1 = Math.floor(Math.random()*length)
    const random2 = Math.floor(Math.random()*length)
    const backup1 = backupAry[random1]
    const backup2 = backupAry[random2]
    ary[random1] = backup2
    ary[random2] = backup1
  }
  return ary
}

export const checkToken = (token: string) => {
  return jwt.decode(token);
};

export const getCurrentTime = async () => {
  const fullDate = new Date();
  const month = fullDate.getMonth() + 1;
  const date = fullDate.getDate();

  const year = fullDate.getFullYear();
  const formatMonth = `${month}`.length === 1 ? `0${month}` : month;
  const formatDate = `${date}`.length === 1 ? `0${date}` : date;

  const fd = `${year}-${formatMonth}-${formatDate}`;
  const h = fullDate.getHours() + 9;
  const m = fullDate.getMinutes();
  const time = `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m}`;
  return `${fd} ${time}`;
};

export const getUserInfo = async (userIdx: number) => {
  const { error, results, _fields } = await Query(`
    SELECT idx,userId, userName,teamId FROM
      auth
    WHERE
      idx='${userIdx}'
    `);
  const result =
    results?.length === 1
      ? { ok: true, result: results[0], error }
      : { ok: false, result: [], error };
  return result;
};

/**
 * @param id decode된 아이디
 * @param pw decode된 비밀번호
 * @returns -{ok: boolean, result: [], error:''}
 */
export const checkAccount = async (id: string, pw: string) => {
  const { error, results } = await Query(`
    SELECT idx , userId, userName , teamId FROM
        auth
    WHERE
        userId='${id}'
      AND
        password ='${pw}'
    `);

  const result =
    results?.length === 1
      ? { ok: true, result: results[0], error }
      : { ok: false, result: [], error };
  return result;
};

export const Query = (sqlString: string) => {
  return new Promise<any>((resolve, _reject) => {
    const isDevMode = process.env.NODE_ENV == "production";
    const host = isDevMode ? "mainpage-mysql-1" : "api/lsw.kr";
    const port = isDevMode ? 3306 : 3310;

    const connection = mysql.createConnection({
      host:'mainpage-mysql-1',
      port:3306,
      user: "todo",
      password: "1234",
      database: "auth",
      multipleStatements: true,
    });

    connection.connect(function (err) {
      console.log("DBConnected!");
      if (err) {
        console.log("error when connecting to db:", err);
      }
    });

    connection.query(
      sqlString,
      function (error , results, fields) {
        resolve({ error, results, fields });
      }
    );
    connection.end();
  });
};
