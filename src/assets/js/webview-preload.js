const { remote, webFrame } = require('electron')

window.onclick = (e) => {
  remote.getCurrentWindow().webContents.executeJavaScript(`
    $('webview').blur()
    $('webview').focus()
  `)
}

const alignCSS = document.createElement('style')

window.align = async function () {
  /*let zoom = await new Promise((resolve, reject) => {
    remote.getCurrentWindow().webContents.executeJavaScript("$('webview').getBoundingClientRect().width", (result) => {
      resolve(result)
    })
  })
  zoom = zoom / 960
  webFrame.setLayoutZoomLevelLimits(-999999, 999999)
  webFrame.setZoomFactor(zoom)
  const zl = webFrame.getZoomLevel()
  webFrame.setLayoutZoomLevelLimits(zl, zl)*/
  window.scrollTo(0, 0)
  
  alignCSS.innerHTML =
  `html {
    overflow: hidden;
  }
  #w, #main-ntg {
    position: absolute !important;
    top: 0;
    left: 0;
    z-index: 100;
    margin-left: 0 !important;
    margin-top: 0 !important;
  }
  #game_frame {
    width: 960px !important;
    position: absolute;
    top: 0px;
    left: 0;
  }
  .naviapp {
    z-index: -1;
  }
  #ntg-recommend {
    display: none !important;
  }
  `
}

window.sendinput = async function () {
  const mouseclick = () => {
    remote.getCurrentWebContents().sendInputEvent({type: 'mouseDown', x: 855, y: 545, button: 'left', clickCount: 1})
    remote.getCurrentWebContents().sendInputEvent({type: 'mouseUp', x: 855, y: 545, button: 'left', clickCount: 1})
  }
  window.setInterval(mouseclick, 100)
}

const handleDOMContentLoaded = () => {
  window.align()
  //window.sendinput()
  document.querySelector('body').appendChild(alignCSS)
  document.removeEventListener("DOMContentLoaded", handleDOMContentLoaded)
}

document.addEventListener("DOMContentLoaded", handleDOMContentLoaded)
