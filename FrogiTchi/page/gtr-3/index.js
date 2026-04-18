/**
 * FrogiTchi — index.js
 * Zepp OS 1.0 / GTR 3 — designWidth = 480
 *
 * Vie = (pas_du_jour + pas_fictifs) / objectif * 100
 * Stockage : hmFS → frogitchi.json { goal, d2, fake, date }
 * Communication menu→index : globalData.menuDirty
 */

function mkInterval(ms, cb) { return timer.createTimer(ms, ms, cb, {}) }
function killT(t) { if (t) { try { timer.stopTimer(t) } catch(e) {} } }

const DW = 480, DH = 480, CX = 240, CY = 240
const OFFSCREEN = -300
const GOAL_DEF  = 8000
const FS_FILE   = 'frogitchi.json'

// ─── hmFS helpers ─────────────────────────────────────────────────────────
function str2ab(str) {
  const buf  = new ArrayBuffer(str.length * 2)
  const view = new Uint16Array(buf)
  for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i)
  return buf
}
function fsRead() {
  try {
    const [stat, err] = hmFS.stat(FS_FILE)
    if (err !== 0 || stat.size === 0) return {}
    const buf = new Uint16Array(new ArrayBuffer(stat.size))
    const fd  = hmFS.open(FS_FILE, hmFS.O_RDONLY)
    hmFS.seek(fd, 0, hmFS.SEEK_SET)
    hmFS.read(fd, buf.buffer, 0, stat.size)
    hmFS.close(fd)
    const str = String.fromCharCode.apply(null, buf).replace(/\0/g, '')
    return JSON.parse(str) || {}
  } catch(e) { return {} }
}
function fsWrite(obj) {
  try {
    const str = JSON.stringify(obj)
    const buf = str2ab(str)
    const fd  = hmFS.open(FS_FILE, hmFS.O_RDWR | hmFS.O_CREAT | hmFS.O_TRUNC)
    hmFS.seek(fd, 0, hmFS.SEEK_SET)
    hmFS.write(fd, buf, 0, buf.byteLength)
    hmFS.close(fd)
  } catch(e) {}
}

function gd() { return getApp()._options.globalData }

function todayKey() {
  const d = new Date()
  return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate()
}

// ─── Calcul de vie (jour courant uniquement) ──────────────────────────────
function calcPct(d2, fake, goal) {
  const total  = d2 + fake
  const target = goal
  if (target <= 0) return 100
  return Math.max(0, Math.min(100, Math.floor(total / target * 100)))
}

const STATES = [
  { min:80, img:'frog_happy.png',   col:0x4CAF50 },
  { min:40, img:'frog_neutral.png', col:0xFFC107 },
  { min:10, img:'frog_sad.png',     col:0xFF9800 },
  { min: 0, img:'frog_dead.png',    col:0xF44336 }
]
function getLS(pct) {
  for (let i = 0; i < STATES.length; i++) if (pct >= STATES[i].min) return STATES[i]
  return STATES[STATES.length - 1]
}

function loadData() {
  const data  = fsRead()
  const today = todayKey()
  return {
    goal: data.goal || GOAL_DEF,
    d2:   (data.date === today) ? (data.d2   || 0) : 0,
    fake: (data.date === today) ? (data.fake || 0) : 0,
    date: today
  }
}

// ═══════════════════════════════════════════════════════════════════════════
Page({

  state: {
    pct:0, ls:null,
    wFrog:null, wBarFill:null, wPct:null, wToday:null, wGoal:null,
    hearts:[], heartTimer:null, animStep:0,
    sensor:null, pollTimer:null,
    barX:0, barY:0, barW:0, barH:0
  },

  build() {
    const data = loadData()
    const g    = gd()
    g.goal        = data.goal
    g.d2          = data.d2
    g.fake        = data.fake
    g.menuDirty   = false
    g.currentDate = data.date

    try {
      const sensor = hmSensor.createSensor(hmSensor.id.STEP)
      this.state.sensor = sensor
      const cur = sensor.current || 0
      if (cur > g.d2) {
        g.d2 = cur
        fsWrite({ goal:g.goal, d2:g.d2, fake:g.fake, date:data.date })
      }
    } catch(e) { this.state.sensor = null }

    const s = this.state
    s.pct = calcPct(g.d2, g.fake, g.goal)
    s.ls  = getLS(s.pct)

    this._buildUI()
    this._startPoll()
  },

  onDestroy() {
    killT(this.state.pollTimer)
    killT(this.state.heartTimer)
    const g = gd()
    fsWrite({ goal:g.goal, d2:g.d2, fake:g.fake, date:todayKey() })
  },

  _startPoll() {
    const self = this
    this.state.pollTimer = mkInterval(1000, function() {
      const g = gd()
      const s = self.state
      let changed = false
      const today = todayKey()

      // Changement de jour pendant que l'app tourne → reset fake
      if (g.currentDate && g.currentDate !== today) {
        g.d2        = 0
        g.fake      = 0
        g.currentDate = today
        fsWrite({ goal:g.goal, d2:0, fake:0, date:today })
        changed = true
      }

      if (s.sensor) {
        const cur = s.sensor.current || 0
        if (cur > g.d2) {
          g.d2 = cur
          changed = true
        }
      }

      if (g.menuDirty) {
        g.menuDirty = false
        changed = true
      }

      if (changed) {
        fsWrite({ goal:g.goal, d2:g.d2, fake:g.fake, date:today })
        s.pct = calcPct(g.d2, g.fake, g.goal)
        s.ls  = getLS(s.pct)
        self._refreshUI()
      }
    })
  },

  _buildUI() {
    const s = this.state
    const g = gd()

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x:0, y:0, w:px(DW), h:px(DH), color:0x0D1F0D
    })
    // Grenouille — tap = +1 fictif + cœurs
    s.wFrog = hmUI.createWidget(hmUI.widget.IMG, {
      x:px(CX-82), y:px(CY-142), w:px(164), h:px(164), src:s.ls.img
    })
    s.wFrog.addEventListener(hmUI.event.CLICK_DOWN, () => {
      const g = gd()
      g.fake += 1
      fsWrite({ goal:g.goal, d2:g.d2, fake:g.fake, date:todayKey() })
      const s = this.state
      s.pct = calcPct(g.d2, g.fake, g.goal)
      s.ls  = getLS(s.pct)
      this._refreshUI()
      this._startHeart()
    })

    // Barre de vie
    const barW = px(260), barH = px(20)
    const barX = Math.floor((px(DW) - barW) / 2)
    const barY = px(CY + 60)
    s.barX=barX; s.barY=barY; s.barW=barW; s.barH=barH

    hmUI.createWidget(hmUI.widget.TEXT, {
      x:barX, y:barY-px(24), w:barW, h:px(22),
      text:'VIE', color:0x88CC88, text_size:px(15),
      align_h:hmUI.align.CENTER_H
    })
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x:barX, y:barY, w:barW, h:barH,
      color:0x2A2A2A, radius:Math.floor(barH/2)
    })
    const fw0 = Math.max(0, Math.floor(s.pct/100*barW))
    s.wBarFill = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x:barX, y:barY,
      w:fw0>0 ? Math.max(fw0, barH) : 0,
      h:barH, color:s.ls.col, radius:Math.floor(barH/2)
    })
    s.wPct = hmUI.createWidget(hmUI.widget.TEXT, {
      x:barX, y:barY+barH+px(5), w:barW, h:px(22),
      text:s.pct+'%', color:0xCCCCCC, text_size:px(15),
      align_h:hmUI.align.CENTER_H
    })

    // Textes
    s.wToday = hmUI.createWidget(hmUI.widget.TEXT, {
      x:0, y:px(CY+97), w:px(DW), h:px(26),
      text:this._todayText(), color:0xFFFFFF, text_size:px(20),
      align_h:hmUI.align.CENTER_H
    })
    s.wGoal = hmUI.createWidget(hmUI.widget.TEXT, {
      x:0, y:px(CY+127), w:px(DW), h:px(20),
      text:this._goalText(), color:0x556655, text_size:px(14),
      align_h:hmUI.align.CENTER_H
    })

    // Bouton Menu
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x:px(CX-50), y:px(430), w:px(100), h:px(40), radius:px(20),
      normal_color:0x1A2E1A, press_color:0x2A4A2A,
      text:'Menu', text_size:px(16), color:0x88BB88,
      click_func: () => { hmApp.gotoPage({ url:'page/gtr-3/menu' }) }
    })

    // Cœurs hors écran
    const hPos = [
      {x:CX-65,y:CY-155},{x:CX+25,y:CY-162},
      {x:CX-85,y:CY-115},{x:CX+48,y:CY-132}
    ]
    s.hearts = hPos.map(function(p) {
      return {
        widget: hmUI.createWidget(hmUI.widget.IMG, {
          x:px(OFFSCREEN), y:px(OFFSCREEN), w:px(32), h:px(32), src:'heart.png'
        }),
        bx:px(p.x), by:px(p.y)
      }
    })
  },

  _todayText() {
    const g = gd()
    if (g.fake > 0) return 'Auj: '+(g.d2+g.fake)+' ('+g.d2+'+'+g.fake+')'
    return 'Auj: '+g.d2+' pas'
  },
  _goalText() { return 'Obj: '+gd().goal+' pas' },

  _refreshUI() {
    const s = this.state
    s.wFrog.setProperty(hmUI.prop.MORE, {
      src:s.ls.img, x:px(CX-82), y:px(CY-142), w:px(164), h:px(164)
    })
    const fw = Math.max(0, Math.floor(s.pct/100*s.barW))
    s.wBarFill.setProperty(hmUI.prop.MORE, {
      x:s.barX, y:s.barY,
      w:fw>0 ? Math.max(fw, s.barH) : 0,
      h:s.barH, color:s.ls.col
    })
    s.wPct.setProperty(hmUI.prop.MORE, {
      text:s.pct+'%', x:s.barX, y:s.barY+s.barH+px(5), w:s.barW, h:px(22)
    })
    s.wToday.setProperty(hmUI.prop.MORE, {
      text:this._todayText(), x:0, y:px(CY+97), w:px(DW), h:px(26)
    })
    s.wGoal.setProperty(hmUI.prop.MORE, {
      text:this._goalText(), x:0, y:px(CY+127), w:px(DW), h:px(20)
    })
  },

  _startHeart() {
    const s = this.state
    if (s.heartTimer !== null) return
    s.animStep = 0
    s.hearts.forEach(function(h) {
      h.widget.setProperty(hmUI.prop.MORE, {x:h.bx, y:h.by, w:px(32), h:px(32)})
    })
    const MAX = 24
    s.heartTimer = mkInterval(50, () => {
      s.animStep++
      const step = s.animStep
      s.hearts.forEach(function(h, i) {
        if (step < MAX) {
          h.widget.setProperty(hmUI.prop.MORE, {
            x:h.bx + Math.round(Math.sin(step*0.4+i*1.3)*px(7)),
            y:h.by - step*px(3), w:px(32), h:px(32)
          })
        } else {
          h.widget.setProperty(hmUI.prop.MORE, {
            x:px(OFFSCREEN), y:px(OFFSCREEN), w:px(32), h:px(32)
          })
        }
      })
      if (step >= MAX) { killT(s.heartTimer); s.heartTimer = null }
    })
  }
})
