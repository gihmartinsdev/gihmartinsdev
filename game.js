(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  if (!ctx) { $('description').textContent = 'Este navegador não oferece Canvas. Tente outro navegador.'; return; }
  const W = 900, H = 340, GROUND = 276, SCALE = 3;
  const cat = window.PIXEL_CAT;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state = 'ready', player, obstacles, elapsed, distance, spawnIn, last = 0, best = 0, time = 0;
  try { best = Math.max(0, Number(localStorage.getItem('gih-pixel-paws-best')) || 0); } catch (_) {}
  $('best').textContent = pad(best);
  function pad(n) { return String(Math.floor(n)).padStart(5, '0'); }
  function setup() {
    player = { x: 105, y: GROUND - 66, vy: 0, grounded: true };
    obstacles = []; elapsed = 0; distance = 0; spawnIn = 1.6;
    $('score').textContent = '00000';
  }
  function overlay(label, title, description, action) {
    $('overline').textContent = label; $('headline').textContent = title;
    $('description').textContent = description; $('start').textContent = action;
    $('overlay').hidden = false;
  }
  function start() {
    setup(); state = 'running'; $('overlay').hidden = true;
    $('pause').disabled = false; $('pause').textContent = 'Ⅱ PAUSAR';
    $('jump').textContent = '↑ PULAR'; $('status').textContent = 'Jogo iniciado.';
    canvas.focus({preventScroll:true});
  }
  function jump() {
    if (state === 'ready' || state === 'over') { start(); return; }
    if (state === 'paused') { pause(); return; }
    if (player.grounded) { player.vy = -555; player.grounded = false; }
  }
  function pause() {
    if (state === 'running') {
      state = 'paused'; $('pause').textContent = '▶ CONTINUAR';
      overlay('PAUSA PARA UM CAFÉ', 'Respira. Seu gatinho espera.', 'Continue quando estiver pronta.', 'CONTINUAR →');
      $('status').textContent = 'Jogo pausado.';
    } else if (state === 'paused') {
      state = 'running'; $('overlay').hidden = true; $('pause').textContent = 'Ⅱ PAUSAR';
      $('status').textContent = 'Jogo retomado.';
      canvas.focus({preventScroll:true});
    }
  }
  function crash() {
    state = 'over'; const points = Math.floor(distance / 12); const record = points > best;
    best = Math.max(best, points); $('best').textContent = pad(best);
    try { localStorage.setItem('gih-pixel-paws-best', String(best)); } catch (_) {}
    $('pause').disabled = true; $('jump').textContent = '↻ TENTAR DE NOVO';
    overlay(record ? 'NOVO RECORDE / MIAU!' : 'MAIS UMA VIDA, MAIS UMA TENTATIVA', 'Todo gatinho merece um replay.', `Você fez ${points} pontos. Que tal tentar mais uma vez?`, 'JOGAR NOVAMENTE →');
    $('status').textContent = `Fim de jogo. ${points} pontos. Recorde: ${best}.`;
  }
  function collides(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
  function update(dt) {
    elapsed += dt;
    const speed = Math.min(365, 235 + elapsed * 1.6);
    distance += speed * dt;
    player.vy += 1600 * dt; player.y += player.vy * dt;
    if (player.y >= GROUND - 66) { player.y = GROUND - 66; player.vy = 0; player.grounded = true; }
    spawnIn -= dt;
    if (spawnIn <= 0) {
      const plant = Math.random() < .4;
      obstacles.push({x:W+20,y:GROUND-(plant?46:35),w:plant?25:32,h:plant?46:35,plant,passed:false});
      spawnIn = 1.25 + Math.random() * .65;
    }
    const box = {x:player.x+15,y:player.y+9,w:39,h:55};
    for (const ob of obstacles) {
      ob.x -= speed * dt;
      if (collides(box,{x:ob.x+3,y:ob.y+3,w:ob.w-6,h:ob.h-3})) { crash(); break; }
    }
    obstacles = obstacles.filter(o=>o.x > -70);
    $('score').textContent = pad(distance/12);
  }
  function rect(x,y,w,h,color) { ctx.fillStyle=color; ctx.fillRect(Math.round(x),Math.round(y),w,h); }
  function drawCat(x,y,step=0) {
    ctx.save(); ctx.translate(Math.round(x),Math.round(y));
    // Tail swings to the side of the black-and-white sprite.
    rect(3,43+step,21,6,'#202629');rect(0,31+step,6,16,'#202629');rect(0,29+step,6,5,'#b7c3b3');
    for(let row=0;row<cat.rows.length;row++) for(let col=0;col<cat.rows[row].length;col++) {
      const color=cat.colors[cat.rows[row][col]];
      if(color) rect(col*SCALE,row*SCALE,SCALE,SCALE,color);
    }
    // Small alternating paw movement only while running on the ground.
    if(step) {rect(18,63,12,3,'#b5c1b1');rect(39,63,15,3,'#b5c1b1');}
    ctx.restore();
  }
  function render() {
    ctx.imageSmoothingEnabled=false;
    rect(0,0,W,H,'#0e2018');
    const scroll=state==='ready'?0:distance;
    // Tiny binary rain and stars are scenery; reduced-motion removes extra motion.
    ctx.font='10px monospace';ctx.fillStyle='#2c5238';
    for(let i=0;i<24;i++) {
      const x=(i*83)%W, y=reduced?(i*31)%185:(i*31+time*(8+i%5))%210;
      ctx.fillText(i%2?'0':'1',x,y);rect((i*137+45)%W,(i*53)%175,2,2,'#638363');
    }
    rect(750,38,29,29,'#bdcf92');rect(761,31,25,25,'#0e2018');
    // Layered city silhouettes and warm green windows.
    for(let i=0;i<13;i++) {
      let x=i*93-(scroll*.15)%93;
      const bh=46+(i*37)%75;rect(x,GROUND-bh,76,bh,'#172e20');
      for(let r=0;r<3;r++) for(let c=0;c<3;c++) if((i+r+c)%3)rect(x+14+c*18,GROUND-bh+13+r*23,5,8,'#2d4930');
    }
    rect(0,GROUND-9,W,9,'#29492d');rect(0,GROUND,W,5,'#8ab568');rect(0,GROUND+5,W,59,'#17271b');
    for(let i=0;i<24;i++) {let x=i*42-scroll%42;rect(x,GROUND+14+(i%3)*12,9,3,'#304530');}
    for(const ob of obstacles) {
      if(ob.plant) {
        rect(ob.x,GROUND-25,ob.w,7,'#cf9c9f');rect(ob.x+3,GROUND-18,ob.w-6,18,'#896772');
        rect(ob.x+10,ob.y,5,24,'#83ac68');rect(ob.x+3,ob.y+8,12,6,'#a5cb80');rect(ob.x+13,ob.y+3,10,7,'#60864f');
      } else {
        rect(ob.x,ob.y,ob.w,ob.h,'#94784f');rect(ob.x+3,ob.y+3,ob.w-6,4,'#d1b181');
        rect(ob.x+14,ob.y,4,ob.h,'#614d35');rect(ob.x+3,GROUND-4,ob.w-6,3,'#614d35');
      }
    }
    const step = state==='running' && player.grounded && Math.floor(time*10)%2 ? 2:0;
    rect(player.x+13,GROUND+2,44,3,'#0b1710'); drawCat(player.x,player.y,step);
    ctx.font='10px monospace';ctx.fillStyle='#91a884';ctx.fillText('GIH / PLAYER 02',16,H-16);
    ctx.fillStyle='#698566';ctx.fillText('UM SALTO DE CADA VEZ.',W-150,H-16);
  }
  function frame(now) {
    const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;
    if(state==='running') {time+=dt;update(dt);} else if(state==='ready' && !reduced)time+=dt;
    render();requestAnimationFrame(frame);
  }
  $('start').addEventListener('click',()=>state==='paused'?pause():start());
  $('jump').addEventListener('click',jump);$('pause').addEventListener('click',pause);
  $('restart').addEventListener('click',start);
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus();jump();});
  document.addEventListener('keydown',e=>{
    if(e.target && /^(INPUT|TEXTAREA|BUTTON|A)$/.test(e.target.tagName))return;
    if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(!e.repeat)jump();}
    if(e.code==='KeyP'&&!e.repeat){e.preventDefault();pause();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause();});
  window.addEventListener('blur',()=>{if(state==='running')pause();});
  setup();requestAnimationFrame(frame);
})();
