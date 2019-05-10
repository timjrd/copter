"use strict";

let canvas = null;
let time0  = null;
let mouse  = {};
let mouse_ = {};
let trace  = [];
let frozen = 0;
let state  = "ready";

function init() {
    canvas = document.getElementsByTagName("canvas").item(0);
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    
    mouse.x = canvas.width  / 2;
    mouse.y = canvas.height / 2;

    mouse_.x = mouse.x;
    mouse_.y = mouse.y
    
    canvas.onmouseenter = function(e) {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
    };
    canvas.onmousemove = function(e) {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
    };
    canvas.onclick = function(e) {
	if (state === "ready")
	{
	    state  = "running";
	    frozen = null;
	    time0  = null;
	}
	else if (state === "over")
	{
	    state  = "ready";
	    frozen = 0;
	    time0  = null;
	    trace  = [];
	}
    };

    window.requestAnimationFrame(tick);
}

function tick(time) {
    if (time0 === null)
	time0 = time;

    const dt  = 0.5;
    const clk = clock();
    const t0  = clk * dt;
    const ctx = canvas.getContext("2d");
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    if (frozen === null)
	track(t0, mouse);

    draw(ctx, t0);

    const mt = t0 + (mouse.x / canvas.width);
    if (mouse.y < ymin(mt) || mouse.y > ymax(mt))
    {
	state = "over";
	frozen = clk;
    }
    
    window.requestAnimationFrame(tick);
}

function draw(ctx, t0) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle   = color(155, 255, t0*10);
    ctx.strokeStyle = color(155, 255, t0*10);
    drawtrace(ctx, t0);
    
    ctx.fillStyle   = color(155, 255, t0);
    ctx.strokeStyle = color(155, 255, t0);
    path(ctx, t0, -1); ctx.fill();
    path(ctx, t0, +1); ctx.fill();
    
    drawscore(ctx, t0);
}

function drawtrace(ctx, t) {
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";

    if (trace.length > 0)
    {
	ctx.beginPath();
	let r = tracet(0, t);
	ctx.moveTo(r.x, r.y);
	for (let i = 0; i < trace.length; i++)
	{
	    let r = tracet(i, t);
	    ctx.lineTo(r.x, r.y);
	}
	ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, ctx.lineWidth/2, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, ctx.lineWidth + pos(fm(2,0,0,t)) * ctx.lineWidth, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.stroke();

    if (state === "over")
    {
	const now = performance.now() / 1000;
	ctx.beginPath();
	ctx.arc(trace[trace.length-1].x, trace[trace.length-1].y, 10 + pos(fm(1,0,0,now)) * ctx.lineWidth * 30, 0, Math.PI*2, true); 
	ctx.closePath();
	ctx.fill();
    }
}

function drawscore(ctx, t) {
    const k  = 0.05;
    const dx = mouse.x - mouse_.x;
    const dy = mouse.y - mouse_.y;
    mouse_.x = mouse_.x + dx * k;
    mouse_.y = mouse_.y + dy * k;
    const x = mouse_.x;
    const y = mouse_.y;
    
    let time = clock();
    let min  = Math.floor(time / 60 );
    let sec  = Math.floor(time      ) % 60;
    let ten  = Math.floor(time * 10 ) % 10;
    let hun  = Math.floor(time * 100) % 10;

    let now = performance.now() / 1000;

    ctx.font = "bold 25px sans-serif";
    ctx.textAlign="start";
    ctx.textBaseline="middle";
    
    drawtext(ctx, min, x + 50*2, y, t, now+1);
    drawtext(ctx, sec, x + 50*3, y, t, now+2);
    drawtext(ctx, ten, x + 50*4, y, t, now+3);
    drawtext(ctx, hun, x + 50*5, y, t, now+4);

    ctx.textAlign="end";
    let str = "";
    if (state === "ready")
	str = "click to start";
    else if (state === "over")
	str = "click to restart";

    const xx = Math.cos(now * 2 * Math.PI) * 10;
    const yy = Math.sin(now * 2 * Math.PI) * 10;
    
    drawtext(ctx, str, x - 50*2 + xx, y + yy, t, now+5);
}

function drawtext(ctx, str, x, y, t, now)
{
    ctx.fillStyle = color(155, 255, (t+now)*10);
    ctx.fillText(str, x, y);
}

function path(ctx, t0, s) {
    const steps = 100;

    ctx.beginPath();
    ctx.moveTo(-1, s * (canvas.height + 1));

    for (let i = -1; i <= steps + 1; i++)
    {
	const x = i * (canvas.width / steps);
	const t = t0 + (i / steps);
	
	ctx.lineTo(x, (s < 0) ? ymin(t) : ymax(t));
    }

    ctx.lineTo(canvas.width + 1, s * (canvas.height + 1));
    ctx.closePath();
}

function ymin(t) {
    const half = canvas.height / 2;
    const c = half + center(t) * half;
    const w = half * widthN(t);
    return c - w;
}

function ymax(t) {
    const half = canvas.height / 2;
    const c = half + center(t) * half;
    const w = half * widthS(t);
    return c + w;
}

function pos(x) {
    return (x + 1) / 2;
}

function inv(x) {
    return 1 / (x + 1);
}

function widthN(t) {
    return width(t, ( 4 * fm(1.5, 0.6, 1, t)
                      + 3 * fm(0.12, 0.86, 1.2, t)
                      + 2 * fm(0.6 , 1.3 , 1.5, t)
                      + 1 * fm(1.2 , 4   , 1.5, t) ) / 10 );
}

function widthS(t) {
    return width(t, ( 4 * fm(1.3, 0.4, 1, t)
                      + 3 * fm(0.11, 0.84, 1.2, t)
                      + 2 * fm(0.62, 1.2 , 1.5, t)
                      + 1 * fm(1   , 4.5 , 1.5, t) ) / 10 );
}

const dtwc = 0.01;
const kw   = 0.6;

function width(t, x) {
    const min = kw * inv(0.1  * t);
    const max = kw * inv(dtwc * t);
    const w = min + pos(x) * (max - min);

    return (t < 1) ? 1.1 : inv(t-1) + (1 - inv(t-1)) * w;
}

function center(t) {
    const k = (1 - kw) + kw * (1 - inv(dtwc * t));
    
    const c = ( 4 * fm(0.04, 0.5, 1, t)
                + 3 * fm(0.1, 0.85, 1.2, t)
                + 2 * fm(0.5, 1.1 , 1.5, t)
                + 1 * fm(1.1, 5   , 1.5, t) ) / 10;

    return (t < 1) ? 0 : (1 - inv(t-1)) * c * k;
}

function fm(hzc, hzm, im, t) {
    return Math.sin(2*Math.PI * hzc * t + im * Math.sin(2*Math.PI * hzm * t));
}

function color(min, max, t) {
    const r = min + (max-min) * pos(fm(0.01 , 0.025, 1  , t));
    const g = min + (max-min) * pos(fm(0.012, 0.027, 1.1, t));
    const b = min + (max-min) * pos(fm(0.017, 0.084, 1.2, t));

    return "rgb(" + r + "," + g + "," + b + ")";
}

function track(t, m) {
    let r = {};
    r.x = m.x;
    r.y = m.y;
    r.t = t;

    trace.push(r);
    
    if (t - trace[0].t > 1)
	trace.shift();
}

function tracet(i, t) {
    const dt = t - trace[i].t;
    const dx = canvas.width * dt;
    
    let r = {};
    r.x = trace[i].x - dx;
    r.y = trace[i].y;

    return r;
}

function clock() {
    if (frozen === null)
	return (performance.now() - time0) / 1000;
    else
	return frozen;
}
