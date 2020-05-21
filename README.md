# proof-tree-builder
A web-based interactive proof tree builder for LK and Hoare logic. 

[Live here.](https://joom.github.io/proof-tree-builder/src/)

For the Z3 rule, we are using a version of Z3 compiled to WebAssembly, which we run in browser, thanks to [cpitclaudel/z3.wasm](https://github.com/cpitclaudel/z3.wasm).

There are still some bugs so please report them by creating issues.

Initially written as a class project for Fall 2018 COS516 with Prof. Zak Kincaid, later improved as a class project for Spring 2020 COS598B with Prof. Aarti Gupta.

# Guide

You can click the "Add LK goal" button to add a new sequent calculus goal to prove, such as

* `exists x. g(x) |- exists y. g(y)`
* `exists x. g(k,x) |- exists y. g(k,y)`
* `|- ((p -> q) -> p) -> p`
* `x > 1 |- x > 0` (needs Z3)
* `x <= y, y <= z |- x <= z` (needs Z3)
* `|- (P(0) && (forall x. (P(x) => P(x + 1)))) => P(3)` (needs Z3)

Or you can click the "Add Hoare logic goal" button to add a new Hoare triple, such as

* `{true} if true then x := 3 else x := 5 {x = 3}`
* `{true} if x < 0 then x := -1 * x else x := x {x >= 0}`

Then you can click on the orange plus button to apply proof rules to incomplete proof trees.

# Generating the parser

```
pegjs --format globals --export-var peg --allowed-start-rules "Sequent,Formula,Term,HoareTriple,Command,Name" parser.pegjs
```

# Running the project locally

In order to run Z3 in browser, we use the web workers API. Hence if you want to run the project locally, you cannot simply open the HTML file, you need to run a local file server and connect to that instead. You can do that by running `python -m SimpleHTTPServer 80` in the `src` directory. Then you can connect to `localhost` in your browser to run the app.
