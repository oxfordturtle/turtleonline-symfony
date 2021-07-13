import Program from './definitions/program'
import { Subroutine } from './definitions/subroutine'
import type { Constant } from './definitions/constant'
import type Variable from './definitions/variable'
import type { Colour } from '../constants/colours'
import type { Command } from '../constants/commands'
import type { Input } from '../constants/inputs'
import { colours } from '../constants/colours'
import { commands } from '../constants/commands'
import { inputs } from '../constants/inputs'

/** looks for a constant visible to the given routine */
export function constant (routine: Program|Subroutine, name: string): Constant|undefined {
  const searchName = (routine.language === 'Pascal') ? name.toLowerCase() : name
  const match = routine.constants.find(x => x.name === searchName)
  if (match) {
    return match
  }
  if (routine instanceof Subroutine) {
    return constant(routine.parent, name)
  }
}

/** looks for a colour */
export function colour (routine: Program|Subroutine, name: string): Colour|undefined {
  const tempName = (routine.language === 'Pascal') ? name.toLowerCase() : name
  const searchName = tempName.replace(/gray$/, 'grey').replace(/GRAY$/, 'GREY') // allow American spelling
  return colours.find(x => x.names[routine.language] === searchName)
}

/** looks for an input query code */
export function input (routine: Program|Subroutine, name: string): Input|undefined {
  const searchName = (routine.language === 'Pascal') ? name.toLowerCase() : name
  return inputs.find(x => x.name === searchName)
}

/** looks for a variable visible to this routine */
export function variable (routine: Program|Subroutine, name: string): Variable|undefined {
  const searchName = (routine.language === 'Pascal') ? name.toLowerCase() : name

  // look for turtle variable first
  const turtleVariables = (routine instanceof Program) ? routine.turtleVariables : routine.program.turtleVariables
  const turtleVariable = turtleVariables.find(x => x.name === searchName)
  if (turtleVariable) {
    return turtleVariable
  }

  // for Python subroutines, look up global variables if the name is declared as global
  if (routine.language === 'Python' && routine instanceof Subroutine) {
    const isGlobal = routine.globals.indexOf(name) > -1
    if (isGlobal) {
      return variable(routine.program, name)
    }
  }

  // otherwise search this routine, then its ancestors recursively
  let match = routine.variables.find(x => x.name === name)
  if (match === undefined && routine instanceof Subroutine) {
    match = variable(routine.parent, name)
  }
  if (match) {
    if (match.private && match.private !== routine) {
      // only return private variables if this is their routine (BASIC only)
      return undefined
    }
    return match
  }
}

/** tests whether a potential variable/constant/subroutine name would clash in this routine's scope */
export function isDuplicate (routine: Program|Subroutine, name: string): boolean {
  const searchName = (routine.language === 'Pascal') ? name.toLowerCase() : name
  if (routine.constants.some(x => x.name === searchName)) return true
  if (routine.language === 'Python' && routine instanceof Subroutine) {
    if (routine.globals.some(x => x === searchName)) return true
    if (routine.nonlocals.some(x => x === searchName)) return true
  }
  if (routine.variables.some(x => x.name === searchName)) return true
  if (routine.subroutines.some(x => x.name === searchName)) return true
  return false
}

/** looks for a subroutine visible to this routine */
export function subroutine (routine: Program|Subroutine, name: string): Subroutine|undefined {
  const searchName = (routine.language === 'Pascal') ? name.toLowerCase() : name
  // search this routine's subroutines
  const match = routine.subroutines.find(x => x.name === searchName)
  if (match) {
    return match
  }
  // if this is a subroutine...
  if (routine instanceof Subroutine) {
    // check for a recursive self-reference
    // N.B. this clause is only necessary for the sake of Pascal, where
    // recursive self-references occur before the subroutine has been added to
    // its parent routine; in other languages the subroutine is added on the
    // first pass, and the self-reference checked on the second pass
    if (routine.name === searchName) {
      return routine
    }
    // otherwise search its parents recursively
    return subroutine(routine.parent, searchName)
  }
}

/** looks for a native turtle command */
export function nativeCommand (routine: Program|Subroutine, name: string): Command|undefined {
  const searchName = (routine.language === 'Pascal') ? name.toLowerCase() : name
  return commands.find(x => x.names[routine.language] === searchName)
}

/** looks for a command (native or custom) visible to this routine */
export function command (routine: Program|Subroutine, name: string): Command|Subroutine|undefined {
  // N.B. custom subroutines have priority
  return subroutine(routine, name) || nativeCommand(routine, name)
}
