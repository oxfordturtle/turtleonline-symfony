import './style/container.scss'
import './style/header.scss'
import './style/notice.scss'
import './style/main.scss'
import './style/form.scss'
import './style/footer.scss'
import setImage from '../common/setImage.js'
import computerScienceLogo from './images/computer-science-logo.png'
import governmentLogo from './images/government-logo.png'
import hertfordLogo from './images/hertford-logo.png'
import philosophyLogo from './images/philosophy-logo.jpg'
import oxfordLogo from './images/oxford-logo.jpg'
import queenMaryLogo from './images/queen-mary-logo.jpg'
import merivale from './images/merivale.jpg'
import millican from './images/millican.jpg'
import switchedOnIssue15 from './images/switchedon-issue15.jpg'
import switchedOnIssue16 from './images/switchedon-issue16.jpg'
import switchedOnIssue21 from './images/switchedon-issue21.jpg'

function init () {
  setImage('.computer-science-logo', computerScienceLogo)
  setImage('.government-logo', governmentLogo)
  setImage('.hertford-logo', hertfordLogo)
  setImage('.philosophy-logo', philosophyLogo)
  setImage('.oxford-logo', oxfordLogo)
  setImage('.queen-mary-logo', queenMaryLogo)
  setImage('.merivale', merivale)
  setImage('.millican', millican)
  setImage('.switchedon-issue15', switchedOnIssue15)
  setImage('.switchedon-issue16', switchedOnIssue16)
  setImage('.switchedon-issue21', switchedOnIssue21)
}

document.addEventListener('DOMContentLoaded', init)
