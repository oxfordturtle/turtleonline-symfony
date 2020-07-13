import { div } from '../tools'
import menu from '../menu/index'
import main from './main'

const body = div({ className: 'turtle-body' }, [menu, main])

export default body
