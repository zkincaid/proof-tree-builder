// pq = new And(new Var("p"), new Var("q"))
// qp = new And(new Var("q"), new Var("p"))
// sk = new Implies(new Var("s"), new Var("k"))
// p = new Var("p")
// notp = new Not(p)
//
// x = new TermVar("x")
// y = new TermVar("y")
// z = new TermInt(5)
//
// fl = new Forall(x, new LessThan(y, new TermInt(0)))
//
// seq = new Sequent([pq, notp], [notp, pq])
//
// a = new CmdAssign(x, new TermInt(5))
// pre = new GreaterThan(new TermInt(5), new TermInt(0))
// post = new GreaterThan(x, new TermInt(0))
// t = new HoareTriple(pre, a, pre)
// mid = new GreaterThan(x, new TermInt(5))
//
// iff = new CmdIf(pre, a, a)

/* `uservar` is a field used for the cut rule and forall and exists quantifier rules.
   In the former case it is a `Formula`; in the latter it is a `TermVar` that we use in 
   the application of the rule. */
const applyLK = (sequent, rule, uservar, strict=true) => {
  let lhs = sequent.precedents
  let rhs = sequent.antecedents

  if (rule === Cut) {
    if (!(uservar instanceof Formula)) throw new TypeError('Cut rule needs a Formula')
    premise1 = new LKIncomplete(new Sequent(lhs, [uservar, ...rhs]))
    premise2 = new LKIncomplete(new Sequent([...lhs, uservar], rhs))
    return new Cut(premise1, premise2, sequent)
  }

  // what kind of formula are we looking for
  let formula = Formula
  if (rule === NotLeft || rule === NotRight) {
    formula = Not
  } else if (rule === OrLeft || rule === OrRight) {
    formula = Or
  } else if (rule === AndLeft || rule === AndRight) {
    formula = And
  } else if (rule === ImpliesLeft || rule === ImpliesRight) {
    formula = Implies
  } else if (rule === TruthRight) {
    formula = Truth
  } else if (rule === FalsityLeft) {
    formula = Falsity
  } else if (rule === ForallLeft || rule === ForallRight) {
    formula = Forall
  } else if (rule === ExistsLeft || rule === ExistsRight) {
    formula = Exists
  }

  // if dealing with Left rules
  // or, and, implies, not, falsity, forall, exists
  if (rule.name.includes('Left')) {
    // get all applicable indices
    indices = []
    for (i = 0; i < lhs.length; i++) {
      if (lhs[i] instanceof formula) { indices.push(i) }
    }

    // if none, then can't apply rule
    if (indices.length == 0) {
      throw new Error('Rule not applicable.')
    }

    // if more than one, ambiguous
    if (indices.length > 1 && strict) {
      throw new Error('Rule application ambiguous.')
    }

    // this is the index
    idx = indices[0]

    // CASE: FALSITY LEFT
    if (rule === FalsityLeft) {
      return new FalsityLeft(sequent, idx)

    // CASE: NOT
    } else if (rule === NotLeft) {
      // original NOT formula
      og = lhs[idx]
      inner = og.one
      // make shallow copies
      plhs = lhs.slice()
      prhs = rhs.slice()
      // remove NOT from lhs
      plhs.splice(idx, 1)
      // add formula to rhs
      prhs.unshift(inner)
      premise = new LKIncomplete(new Sequent(plhs, prhs))
      tree = new NotLeft(premise, sequent, 0, idx)
      return tree

    // CASE: OR
    } else if (rule === OrLeft) {
      // original OR formula
      og = lhs[idx]
      // subformulas
      left = og.left
      right = og.right

      // make premise1
      plhs = lhs.slice()
      delete plhs[idx]
      plhs[idx] = left
      premise1 = new LKIncomplete(new Sequent(plhs, rhs.slice()))

      // make premise2
      plhs = lhs.slice()
      delete plhs[idx]
      plhs[idx] = right
      premise2 = new LKIncomplete(new Sequent(plhs, rhs.slice()))

      tree = new OrLeft(premise1, premise2, sequent, idx, idx, idx)
      return tree

    // CASE: AND
    } else if (rule === AndLeft) {
      console.log(lhs, rhs, idx)
      // original AND formula
      og = lhs[idx]
      // subformulas
      left = og.left
      right = og.right

      // make premise
      plhs = lhs.slice()
      //delete plhs[idx]
      plhs[idx] = right
      plhs.splice(idx, 0, left)
      premise = new LKIncomplete(new Sequent(plhs, rhs.slice()))

      tree = new AndLeft(premise, sequent, idx, idx + 1, idx)
      return tree
    } else if (rule === ImpliesLeft) {
      // original OR formula
      og = lhs[idx]
      // subformulas
      left = og.left
      right = og.right

      // make premise1
      plhs = lhs.slice()
      plhs.splice(idx, 1)
      prhs = rhs.slice()
      prhs.unshift(left)
      premise1 = new LKIncomplete(new Sequent(plhs, prhs))

      // make premise2
      plhs = lhs.slice()
      delete plhs[idx]
      plhs[idx] = right
      premise2 = new LKIncomplete(new Sequent(plhs, rhs.slice()))

      tree = new ImpliesLeft(premise1, premise2, sequent, 0, idx, idx)
      return tree
    } else if (rule === ForallLeft) {
      // original Forall formula
      og = lhs[idx]
      // subformulas
      v = og.v
      body = og.one
      newbody = substituteTerm(body, v, uservar)

      // make premise
      plhs = lhs.slice()
      delete plhs[idx]
      plhs[idx] = newbody
      premise = new LKIncomplete(new Sequent(plhs, rhs.slice()))

      tree = new ForallLeft(premise, sequent, idx, idx, uservar)
      return tree
    } else if (rule === ExistsLeft) {
      // original Exists formula
      og = lhs[idx]
      // subformulas
      v = og.v
      body = og.one
      newbody = substituteTerm(body, v, uservar)

      // make premise
      plhs = lhs.slice()
      delete plhs[idx]
      plhs[idx] = newbody
      premise = new LKIncomplete(new Sequent(plhs, rhs.slice()))

      tree = new ExistsLeft(premise, sequent, idx, idx, uservar)
      return tree
    }
  }

  // if dealing with Right rules
  // or, and, implies, not, truth
  if (rule.name.includes('Right')) {
    // get all applicable indices
    indices = []
    for (i = 0; i < rhs.length; i++) {
      if (rhs[i] instanceof formula) { indices.push(i) }
    }

    // if none, then can't apply rule
    if (indices.length == 0) {
      throw new Error('Rule not applicable.')
    }

    // if more than one, ambiguous
    if (indices.length > 1) {
      throw new Error('Rule application ambiguous.')
    }

    // this is the index
    idx = indices[0]

    // CASE: TRUTH
    if (rule === TruthRight) {
      return new TruthRight(sequent, idx)

    // CASE: NOT
    } else if (rule === NotRight) {
      // original NOT formula
      og = rhs[idx]
      inner = og.one
      // make shallow copies
      plhs = lhs.slice()
      prhs = rhs.slice()
      // remove NOT from lhs
      prhs.splice(idx, 1)
      // add formula to rhs
      plhs.push(inner)
      premise = new LKIncomplete(new Sequent(plhs, prhs))
      tree = new NotRight(premise, sequent, plhs.length - 1, idx)
      return tree

    // CASE: OR
    } else if (rule === OrRight) {
      // original OR formula
      og = rhs[idx]
      // subformulas
      left = og.left
      right = og.right

      // make premise
      prhs = rhs.slice()
      //delete prhs[idx]
      prhs[idx] = right
      prhs.splice(idx, 0, left)
      premise = new LKIncomplete(new Sequent(lhs.slice(), prhs))

      tree = new OrRight(premise, sequent, idx, idx + 1, idx)
      return tree

    // CASE: AND
    } else if (rule === AndRight) {
      // original AND formula
      og = rhs[idx]
      // subformulas
      left = og.left
      right = og.right

      // make premise1
      prhs = rhs.slice()
      delete prhs[idx]
      prhs[idx] = left
      premise1 = new LKIncomplete(new Sequent(lhs.slice(), prhs))

      // make premise2
      prhs = rhs.slice()
      delete prhs[idx]
      prhs[idx] = right
      premise2 = new LKIncomplete(new Sequent(lhs.slice(), prhs))

      tree = new AndRight(premise1, premise2, sequent, idx, idx, idx)
      return tree
    } else if (rule === ImpliesRight) {
      // original OR formula
      og = rhs[idx]
      // subformulas
      left = og.left
      right = og.right

      // make premise1
      plhs = lhs.slice()
      plhs.push(left)
      prhs = rhs.slice()
      delete prhs[idx]
      prhs[idx] = right
      premise = new LKIncomplete(new Sequent(plhs, prhs))

      tree = new ImpliesRight(premise, sequent, plhs.length - 1, idx, idx)
      return tree
    } else if (rule === ForallRight) {
      // original Forall formula
      og = rhs[idx]
      // subformulas
      v = og.v
      body = og.one
      newbody = substituteTerm(body, v, uservar)

      // make premise
      prhs = rhs.slice()
      delete prhs[idx]
      prhs[idx] = newbody
      premise = new LKIncomplete(new Sequent(lhs.slice(), prhs))

      tree = new ForallRight(premise, sequent, idx, idx, uservar)
      return tree
    } else if (rule === ExistsRight) {
      // original Exists formula
      og = rhs[idx]
      // subformulas
      v = og.v
      body = og.one
      newbody = substituteTerm(body, v, uservar)

      // make premise
      prhs = rhs.slice()
      delete prhs[idx]
      prhs[idx] = newbody
      premise = new LKIncomplete(new Sequent(lhs.slice(), prhs))

      tree = new ExistsRight(premise, sequent, idx, idx, uservar)
      return tree
    }
  }

  // if dealing with both sides
  // identity
  if(rule === Identity) {
    // at least one of the things on the right should be on the left
    let l = 0
    let r = 0
    const found = lhs.find((left, i) => {
      l = i
      return rhs.find((right, j) => {
        r = j
        return deepEqual(left, right)
      })
    })

    if(found) {
      return new Identity(sequent, l, r)
    } else {
      throw new Error('Rule not applicable.')
    }
  }

  if(rule === Z3Rule) {
    return new Z3Rule(sequent)
  }

  throw new Error('no such rule so far')
}

function applyHoare (triple, rule, uservar, uservar2) {
  pre = triple.pre
  command = triple.command
  post = triple.post

  if (rule === Assignment) {
    v = command.v
    term = command.t

    if (!(command instanceof CmdAssign) ||
      !deepEqual(substituteTerm(post, v, term), pre)) {
      throw new Error('Rule not applicable.')
    }

    tree = new Assignment(triple)
    return tree
  } else if (rule === Sequencing) {
    if (!(command instanceof CmdSeq)) {
      throw new Error('Rule not applicable.')
    }

    first = command.first
    second = command.second

    premise1 = new HoareIncomplete(new HoareTriple(pre, first, uservar))
    premise2 = new HoareIncomplete(new HoareTriple(uservar, second, post))

    tree = new Sequencing(premise1, premise2, triple)
    return tree
  } else if (rule === Consequence) {
    premise1 = new LKIncomplete(new Sequent([pre], [uservar]))
    premise2 = new HoareIncomplete(new HoareTriple(uservar, command, uservar2))
    premise3 = new LKIncomplete(new Sequent([uservar2], [post]))

    tree = new Consequence(premise1, premise2, premise3, triple)
    return tree
  } else if (rule === Conditional) {
    if (!(command instanceof CmdIf)) {
      throw new Error('Rule not applicable.')
    }
    c = command.condition
    btrue = command.btrue
    bfalse = command.bfalse

    p1 = new And(pre, c)
    p2 = new And(pre, new Not(c))

    premise1 = new HoareIncomplete(new HoareTriple(p1, btrue, post))
    premise2 = new HoareIncomplete(new HoareTriple(p2, bfalse, post))

    tree = new Conditional(premise1, premise2, triple)
    return tree
  } else if (rule === Loop) {
    c = command.condition
    body = command.body

    if (!(command instanceof CmdWhile) &&
      !deepEqual(pre, new And(pre, new Not(c)))) {
      throw new Error('Rule not applicable.')
    }

    p1 = new And(pre, c)
    p2 = new And(pre, new Not(c))

    premise1 = new HoareIncomplete(new HoareTriple(p1, body, pre))

    tree = new Conditional(premise1, premise2, triple)
    return tree
  }

  throw new Error('No rule specified or rule does not exist.')
}
