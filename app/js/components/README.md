# Components

The modules in this directory are all components of the application. A component
is an interactive part of the page (or an interactive _type_ of a part of the
page, e.g. a togglable menu). The vast majority of components are for the online
version of the Turtle System.

Each component calls its `init` method (which adds approprate event listeners,
etc.), and exports the result of that method. This is a formality, so that the
TypeScript compiler recognises the component as a module (and we avoid namespace
clashes).
