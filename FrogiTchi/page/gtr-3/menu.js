/**
 * FrogiTchi — menu.js
 * Zepp OS 1.0 / GTR 3 — designWidth = 480
 */

const DW = 480, DH = 480, CX = 240
const GOAL_STEP = 500, GOAL_MIN = 1000, GOAL_MAX = 30000
const FAKE_STEP = 500, FAKE_MAX = 20000
const FS_FILE   = 'frogitchi.json'

function str2ab(str) {
  const buf  = new ArrayBuffer(str.length * 2)
  const view = new Uint16Array(buf)
  for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i)
  return buf
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
function todayKey() {
  const d = new Date()
  return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate()
}
function gd() { return getApp()._options.globalData }

// ═══════════════════════════════════════════════════════════════════════════
Page({

  state: { goal:0, fake:0, wGoalVal:null, wFakeVal:null },

  build() {
    const g = gd()
    this.state.goal = g.goal
    this.state.fake = g.fake
    this._buildUI()
  },

  _buildUI() {
    const s = this.state

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x:0, y:0, w:px(DW), h:px(DH), color:0x0D1F0D
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x:0, y:px(22), w:px(DW), h:px(38),
      text:'Parametres', color:0x88CC88, text_size:px(30),
      align_h:hmUI.align.CENTER_H
    })

    // ── Objectif ──────────────────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x:0, y:px(74), w:px(DW), h:px(24),
      text:'Objectif journalier', color:0x99BB99, text_size:px(18),
      align_h:hmUI.align.CENTER_H
    })
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x:px(20), y:px(104), w:px(90), h:px(72), radius:px(16),
      normal_color:0x2A1A1A, press_color:0x4A2A2A,
      text:'-', text_size:px(50), color:0xFF8888,
      click_func: () => {
        if (s.goal > GOAL_MIN) { s.goal -= GOAL_STEP; this._save() }
      }
    })
    s.wGoalVal = hmUI.createWidget(hmUI.widget.TEXT, {
      x:px(110), y:px(108), w:px(260), h:px(62),
      text:String(s.goal), color:0xFFFFFF, text_size:px(48),
      align_h:hmUI.align.CENTER_H
    })
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x:px(370), y:px(104), w:px(90), h:px(72), radius:px(16),
      normal_color:0x1A2A1A, press_color:0x2A4A2A,
      text:'+', text_size:px(50), color:0x88DD88,
      click_func: () => {
        if (s.goal < GOAL_MAX) { s.goal += GOAL_STEP; this._save() }
      }
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x:px(60), y:px(188), w:px(360), h:px(2), color:0x224422
    })

    // ── Pas fictifs ────────────────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x:0, y:px(200), w:px(DW), h:px(24),
      text:"Pas fictifs aujourd'hui", color:0x99BB99, text_size:px(18),
      align_h:hmUI.align.CENTER_H
    })
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x:px(20), y:px(232), w:px(90), h:px(72), radius:px(16),
      normal_color:0x2A1A1A, press_color:0x4A2A2A,
      text:'-', text_size:px(50), color:0xFF8888,
      click_func: () => {
        if (s.fake >= FAKE_STEP) { s.fake -= FAKE_STEP; this._save() }
      }
    })
    s.wFakeVal = hmUI.createWidget(hmUI.widget.TEXT, {
      x:px(110), y:px(236), w:px(260), h:px(62),
      text:String(s.fake), color:0xFFFFFF, text_size:px(48),
      align_h:hmUI.align.CENTER_H
    })
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x:px(370), y:px(232), w:px(90), h:px(72), radius:px(16),
      normal_color:0x1A2A1A, press_color:0x2A4A2A,
      text:'+', text_size:px(50), color:0x88DD88,
      click_func: () => {
        if (s.fake < FAKE_MAX) { s.fake += FAKE_STEP; this._save() }
      }
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x:0, y:px(314), w:px(DW), h:px(22),
      text:'(marche sans montre ?)',
      color:0x446644, text_size:px(15),
      align_h:hmUI.align.CENTER_H
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x:px(60), y:px(346), w:px(360), h:px(2), color:0x224422
    })

    // ── Retour ────────────────────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x:px(CX-105), y:px(360), w:px(210), h:px(58), radius:px(29),
      normal_color:0x1A3A1A, press_color:0x2D5C2D,
      text:'Retour', text_size:px(24), color:0xAADDAA,
      click_func: () => {
        gd().menuDirty = true
        hmApp.goBack()
      }
    })
  },

  _save() {
    const s = this.state
    const g = gd()
    g.goal = s.goal
    g.fake = s.fake
    fsWrite({ goal:g.goal, d2:g.d2, fake:g.fake, date:todayKey() })
    s.wGoalVal.setProperty(hmUI.prop.MORE, {
      text:String(s.goal), x:px(110), y:px(108), w:px(260), h:px(62)
    })
    s.wFakeVal.setProperty(hmUI.prop.MORE, {
      text:String(s.fake), x:px(110), y:px(236), w:px(260), h:px(62)
    })
  }
})
