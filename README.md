# proof-tree-builder
Class project for COS516: A web-based interactive proof tree builder for LK and Hoare logic.

# Generating the parser

```
pegjs --format globals --export-var peg --allowed-start-rules "Sequent,Formula,Term,HoareTriple,Command" parser.pegjs
```
