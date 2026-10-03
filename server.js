const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'infoorbitworld.media@gmail.com';

fs.mkdirSync(DATA_DIR, {recursive:true});
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({stories:[],subscribers:[],messages:[]}, null, 2));

app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'100kb'}));
app.use(express.urlencoded({extended:false, limit:'100kb'}));
app.use(express.static(PUBLIC_DIR, {extensions:['html']}));

function readData(){
  try { return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); }
  catch { return {stories:[],subscribers:[],messages:[]}; }
}
function writeData(data){ fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2)); }
function clean(v,max=500){ return String(v ?? '').trim().slice(0,max); }
function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function admin(req,res,next){
  const token=req.get('x-admin-token');
  if(!process.env.ADMIN_TOKEN || token!==process.env.ADMIN_TOKEN) return res.status(401).json({error:'Unauthorized'});
  next();
}

let mailer=null;
if(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD){
  mailer=nodemailer.createTransport({service:'gmail',auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}});
}

app.get('/api/health',(req,res)=>res.json({ok:true,service:'InfoOrbit API',time:new Date().toISOString()}));
app.get('/api/stories',(req,res)=>{
  const d=readData(); res.json({stories:d.stories.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});
});
app.get('/api/subscribers/count',(req,res)=>res.json({count:readData().subscribers.length}));

app.post('/api/subscribe',(req,res)=>{
  const email=clean(req.body.email,254).toLowerCase();
  if(!validEmail(email)) return res.status(400).json({error:'Please enter a valid email address.'});
  const d=readData();
  if(!d.subscribers.some(x=>x.email===email)){
    d.subscribers.push({email,createdAt:new Date().toISOString()}); writeData(d);
  }
  res.json({ok:true,message:'You are subscribed to InfoOrbit.'});
});

app.post('/api/contact',async(req,res)=>{
  const name=clean(req.body.name,120), email=clean(req.body.email,254).toLowerCase(), message=clean(req.body.message,4000);
  if(!name || !validEmail(email) || !message) return res.status(400).json({error:'Name, valid email, and message are required.'});
  const d=readData(); d.messages.push({name,email,message,createdAt:new Date().toISOString()}); writeData(d);
  if(mailer){
    try{ await mailer.sendMail({from:process.env.GMAIL_USER,to:CONTACT_EMAIL,replyTo:email,subject:`InfoOrbit contact from ${name}`,text:`Name: ${name}\nEmail: ${email}\n\n${message}`}); }
    catch(e){ console.error('Mail delivery failed:',e.message); }
  }
  res.json({ok:true,message:'Message received. We will get back to you.'});
});

app.post('/api/admin/stories',admin,(req,res)=>{
  const title=clean(req.body.title,180), summary=clean(req.body.summary,800), category=clean(req.body.category,40)||'World';
  if(!title||!summary) return res.status(400).json({error:'Title and summary are required.'});
  const d=readData(); const story={id:Date.now().toString(36),title,summary,category,createdAt:new Date().toISOString()};
  d.stories.push(story); writeData(d); res.status(201).json(story);
});
app.delete('/api/admin/stories/:id',admin,(req,res)=>{
  const d=readData(); const before=d.stories.length; d.stories=d.stories.filter(x=>x.id!==req.params.id); writeData(d);
  res.json({ok:true,deleted:before-d.stories.length});
});
app.get('/api/admin/messages',admin,(req,res)=>res.json({messages:readData().messages}));
app.get('/api/admin/subscribers',admin,(req,res)=>res.json({subscribers:readData().subscribers}));

app.get('*',(req,res)=>res.sendFile(path.join(PUBLIC_DIR,'index.html')));
app.listen(PORT,()=>console.log(`InfoOrbit running on port ${PORT}`));
