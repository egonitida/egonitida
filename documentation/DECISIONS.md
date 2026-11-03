# Decisions

The decisions the core of the engine rests on, each with the question it answers, the criteria it was weighed by, the options it was chosen from, the choice, and the sources behind it. The theory in Lean and the documentation follow from them.

## Requirements

What follows 0.1 asks the core for the following, and every decision is weighed against it.

1. A machine whose structure map gives the successor state and an output.
2. Composition of machines, in series, in parallel, and with feedback.
3. Changes as data.
4. Deterministic mathematics, as the results of functions such as `Math.sin` are not fixed by the JavaScript specification.
5. A persistent state, cheap to copy and to store.
6. Immutable assets addressed by their content.
7. Derived facts, computed from stored facts and never stored themselves.

## 1. Time

**Question.** How does a simulation change in time?

**Options.**

| Option          | Model                                                        |
| --------------- | ------------------------------------------------------------ |
| Discrete time   | The state changes in steps: x′ = f(x, u).                    |
| Continuous time | The state changes continuously: dx/dt = f(x, u).             |
| Hybrid system   | Continuous changes and discrete jumps.                       |
| Discrete event  | The state changes only at events, at arbitrary times (DEVS). |

**Decision.** Discrete time. Continuous and hybrid systems cannot be computed exactly, and every computation of them divides them into steps. Discrete events have no fixed rhythm, which a real-time application needs. Continuous motion is expressed as integration within a step, and events as input.

## 2. State

**Question.** Does the core set the structure of a state, and if so, what is a state made of?

**Criteria.**

1. Mathematical foundation: an established theory, provable in Lean.
2. Generality: a game, a digital twin, architecture, and a mathematical model, with relations between things and hierarchies.
3. Identity: a thing can be referred to and followed in time.
4. Derived facts: rules derive facts from facts.
5. Changes as data: a change is facts added and removed.
6. Checked data: a schema checks the data.
7. Minimality: nothing redundant is stored.
8. Readable to an agent without knowledge of the engine.
9. Performance weighs little, as an implementation stores by column.

**Options.**

| Direction                  | Structure                                                    |
| -------------------------- | ------------------------------------------------------------ |
| The core sets no structure | A state is any value a schema describes, as a model in Elm.  |
| The core sets facts        | A state is always a set of facts.                            |
| Layers                     | The core sets no structure, and facts are a library over it. |

| Form of facts  | Structure                                                                  |
| -------------- | -------------------------------------------------------------------------- |
| ECS            | An entity and the data of its components.                                  |
| Relations      | Named relations of any arity, each with a schema and a key.                |
| Triples        | Every fact is an entity, an attribute, and a value, as in Datomic and RDF. |
| Property graph | Nodes and edges, both with properties, as in GQL.                          |

**Decision.** The core sets the structure, and a state is a set of facts in relations. Every finite data can be written as facts, so nothing is ruled out, and every feature of the engine, from derived facts and changes to the network, the editor, and agents, works over every application alike. Layers would split applications into those that have every feature and those that have some.

Relations win on criteria 1, 2, 4, and 7. A component is a relation of two columns keyed by an entity, so ECS is a special case of them, and triples and graphs express a fact of more than two places only through a detour.

No relational normal form is broken. Every relation is in sixth normal form, which is always reachable and implies the fifth, the essential tuple, the fourth, Boyce–Codd, the third, the second, and the first. Every relation is in domain-key normal form wherever it can be, and the constraints left over are checked as constraints of the whole state, as a decomposition into Boyce–Codd normal form and above does not always preserve every dependency.

A value is atomic: a number, a truth value, the identity of an entity, or a text, which is taken whole. A matrix, an expression, a mesh, or a list is never one value, but facts, and an order is a fact of its own, a position.

**Sources.**

- [Flecs relationships](https://www.flecs.dev/flecs/md_docs_2Relationships.html): added to an ECS engine for relations it lacked.
- [Datomic Data Model](https://docs.datomic.com/whatis/data-model.html): a datom as an immutable fact of an entity, an attribute, a value, and a transaction.
- [Graph Query Language](https://en.wikipedia.org/wiki/Graph_Query_Language): ISO/IEC 39075:2024.
- [Bernstein, 1975](https://www.comp.nus.edu.sg/~lingtw/papers/bernstein.pdf): normalization removes redundancy, governed by functional dependencies.
- [Sixth normal form](https://en.wikipedia.org/wiki/Sixth_normal_form): no nontrivial join dependencies, after Date, Darwen, and Lorentzos.
- [Fagin, 1981](https://researcher.ibm.com/publications/a-normal-form-for-relational-databases-that-is-based-on-domains-and-keys): domain-key normal form, which holds exactly when there are no insertion or deletion anomalies.
- [Databases, Cambridge](https://www.cl.cam.ac.uk/teaching/0809/Databases/lec_07.pdf): a decomposition into Boyce–Codd normal form does not always preserve dependencies.

## 3. Machine

**Question.** What kind of machine is a simulation?

**Criteria.**

1. Mathematical correctness: an established theory, provable in Lean.
2. Determinism: the same state and input always give the same next state and output.
3. Expressive power: every application of the vision.
4. Immediacy: the output reacts to the input within the same tick.
5. Composition within a machine.
6. Composition between machines, and recovery after a crash.
7. Visibility: an editor, an agent, and a save see everything.
8. Minimality: the state holds only what the future state and the future output depend on, and the types keep the output and derived facts out of it.

Performance, Effect, and Foldkit weigh little: an implementation can neutralize a heavy core, and what Effect or Foldkit lack is asked of them.

**Options.**

| Option        | Step      | Output                         |
| ------------- | --------- | ------------------------------ |
| Semiautomaton | Q × Σ → Q | none                           |
| Moore machine | Q × Σ → Q | λ : Q → Γ, read from the state |
| Mealy machine | Q × Σ → Q | λ : Q × Σ → Γ, of a transition |

**Decision.** A Mealy machine. A semiautomaton has no output. A Moore machine reacts to an input within the same tick only by storing the reaction in the state, which criterion 8 forbids, as a message not yet sent does not affect the future. A Mealy machine meets criteria 4 and 8 together. Feedback between machines always passes through a network, so it is delayed and well defined for a Mealy machine as well, and after a crash its output is computed again from the stored state and the recorded inputs.

**Sources.**

- [Kalman, 1963](https://people.duke.edu/~hpgavin/SystemID/References/Kalman-JSIAM-1963.pdf): the state as the minimal information about the past that predicts its effect on the future.
- [Willems](https://homes.esat.kuleuven.be/~sistawww/smc/jwillems/Lectures/2003/kyoto3.pdf): the general definition of a state does not require minimality, so minimality is a choice.
- [Mealy to Moore conversion](https://www.educative.io/answers/how-to-convert-the-mealy-machine-to-the-moore-machine): a Moore machine needs up to |Q| × |Γ| states for a Mealy machine.
- [Wiring diagrams for Mealy machines](https://topos.institute/blog/2024-08-19-wiring-diagrams-mealy-machines/): feedback between Mealy machines can be unsolvable.
- [Mealy and Moore machines in Stateflow](https://cs400-web.cs.wisc.edu/nchou/s/matlab-2020b/amd64_rhel7/help/stateflow/ug/overview-of-mealy-and-moore-machines.html): a Moore machine is safe in a feedback loop.
- [Libkind and Myers](https://arxiv.org/abs/2505.18329v2) and [Niu and Spivak](https://arxiv.org/pdf/2312.00990): categorical systems theory composes Moore machines through lenses.

## 4. Input

**Question.** What does a step see of an input that changes while it runs?

**Decision.** The input is read when the step begins and does not change while it runs, after the synchrony hypothesis of Berry. An input that arrives during a step waits for the next one. Of a demand, only the newest counts. Actions are collected in the order they arrive. When it matters where within a tick an action happened, the input carries it as data. The hypothesis holds only while a step ends before the next tick begins, so a step has a budget of time.

**Sources.** [Lüttgen and Mendler](https://www.Uni-Bamberg.de/fileadmin/uni/fakultaeten/wiai_professuren/grundlagen_informatik/papersMM/slap02.pdf), [Dagstuhl Seminar 01491](https://dagstuhl.de/01491), [a Coq-verified Esterel semantics](https://arxiv.org/pdf/1909.12582).

## 5. Rendering

**Question.** How is a simulation drawn at a rate other than its own?

**Options.** Drawing only ticks, interpolating between the last two, extrapolating past the last, or ticking at the rate of the display.

**Decision.** Interpolation by default, and extrapolation when the next state is late, up to a limit, after which the picture holds. Drawing only ticks remains an option for exact pictures. Ticking at the rate of the display gives different results on different displays. Both run on the side of the output, so the simulation and its determinism are untouched. An interpolated or extrapolated picture is not a state of the simulation.

**Sources.** [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/), [Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking?uselang=zh).

## 6. Servers

**Question.** Where does a simulation run?

**Decision.** Every application has an authoritative server. A single player runs it locally, and the application opens it to others at any point. The server predicts nothing, and its clients predict and draw. Determinism therefore holds between machines, not only within one.

## 7. Rollback

**Question.** What happens to the output of steps that a rollback takes back?

**Options.** Sending the output only from confirmed ticks, sending it at once and reconciling it after a resimulation, or choosing by the kind of the output.

**Decision.** Sending it at once and reconciling it. Every output carries an identity, its tick and its place in it, which a resimulation gives it again. An output with the same identity is skipped, a missing one is stopped, and a new one is sent late. Only the server, which predicts nothing, sends output that cannot be taken back.

**Sources.** [pocket2d](https://github.com/qiulinfan/pocket2d/pull/1), [Rollback Core Pro](https://forums.unrealengine.com/t/gregorigin-rollback-core-pro-accessible-netcode-framework-for-fighting-platform-games/2728262), [Cargo Space devlog](https://johanhelsing.studio/posts/cargo-space-devlog-4/), [implementing audio tools with rollback netcode](https://cohost.org/celechii/post/1771317-implementing-audio-t): implementations, not established standards.

## 8. Code

**Question.** How do the rules change while a simulation runs?

**Options.** The version of the code as a fact, the rules as data, a new beginning, or no change without a restart.

**Decision.** The version of the code as a fact. Code is an immutable asset addressed by its content, the state holds the version in force, and a change of version arrives as input, with a migration of the state where its form changes. A replay uses the version in force at each tick, so determinism holds, and the simulation remains one Mealy machine whose transition chooses the code by the version in the state. The rules as data may come later for rules edited as facts.

**Sources.** [Unison, The big idea](https://www.unison-lang.org/docs/the-big-idea/), [code_change in Erlang/OTP](https://erlang.org/pipermail/erlang-questions/2008-June/036243.html).

## 9. Names

**Question.** What are the parts of a simulation called?

**Decision.** The terms of automata theory, which defines the Mealy machine, as the naming rules of `AGENTS.md` set out: a machine transitions, upon an input, from its current state to a successor state, and produces a corresponding output, as Pattinson words it. The one function f of Jacobs, which gives the successor state and the output together, is the structure map, the name Jacobs gives the map X → F(X) of every coalgebra, so the step of the engine is the structure map and needs no name of its own. Transition function is not its name, as Jacobs and the classical definitions of the Mealy machine give that name to the part that gives the successor state alone, δ : S × A → S. Transition names the move to the successor state alone, as a dictionary gives it.

The notation is that of Jacobs, whose textbook calls a coalgebra f : S → (S × O)^I over arbitrary sets a Mealy machine, with no initial state. Of the definitions found, it alone is as general as the machine of the engine: Bonsangue, Rutten, and Silva take the inputs finite and the outputs a meet-semilattice, and Hansen, Costa, and Rutten call a Mealy machine only one with an initial state and finite sets, and the machine without them a Mealy coalgebra. The figure keeps the curried form and the order of the book, the state before the output, as a figure writes in the notation of the work it cites, and writes one transition on the elements, (s′, o) = f(s)(i). The definition stands in Exercise 2.3.2 of the draft of 2012, version 2.00, and the published edition of 2016 was not checked, so the figure cites the book and not the exercise. No publication was found that writes the output of one transition as a sequence, Λ*, so the output of one transition is a single element of O, and that the engine chooses O to hold sequences of events is a choice of O, not another definition of the machine. Every figure that shows the machine cites Mealy as the origin, as the academic norm credits the origin of an eponymous concept, and Jacobs as the notation. Pattinson, whose lecture notes wrote the joined function as ⟨out, next⟩ : S × I → O × S, is not cited, as the notes are not peer-reviewed. Mealy defined the machine himself, for switching circuits with finite binary inputs, outputs, and states, as two functions of the present state and the input, Q(Qᵢ, Xⱼ) for the next state and Y(Qᵢ, Xⱼ) for the output, so the later definitions generalize the sets and join the functions, and add nothing to the idea.

A transition extends to a finite sequence of inputs by the iterated transition function of Jacobs, δ\* : S × I\* → S, which gives the state reached after the sequence, by δ\*(s, ⟨⟩) = s and δ\*(s, i · σ) = δ\*(s′, σ) where (s′, o) = f(s)(i). The behavior of a state, beh(s) : I⁺ → O, gives the output of the last transition after the prefix, beh(s)(σ · i) = o where (s′, o) = f(δ\*(s, σ))(i), over nonempty sequences, as the final Mealy machine is O^(I⁺). Jacobs defines both for a deterministic automaton on page 42 of the draft, and Exercise 2.3.2 shows a Mealy machine to be a deterministic automaton X → X^A × B^A, so both carry over unchanged. Lean writes a nonempty sequence as a sequence and a last input, so the behavior is total without a proof of nonemptiness. The outputs of a sequence follow from the behavior on its prefixes, and the states passed through follow from the iterated transition function on its prefixes, so no definition returns either. Run is not a name of the engine, as automata theory calls a run the sequence of states a machine passes through. Behavior is spelled as American English spells it, as is the rest of the repository. The pair a transition gives, (s′, o), is a structure in Lean with the fields successor state and output, so each part keeps its term in every language the theory is written into. No work found names the pair, so it is named in academic English an outcome. A transition is not its name, as automata theory takes a transition as the whole quadruple of current state, input, successor state, and output.

**Sources.**

- [Mealy, 1955](https://archive.org/details/bstj34-5-1045): the machine whose output and next state are determined by its present state and its input, defined for switching circuits as two functions.
- [Jacobs, 2016](https://doi.org/10.1017/CBO9781316823187), [draft of 2012](https://www.cs.ru.nl/B.Jacobs/CLG/JacobsCoalgebraIntro.pdf): Exercise 2.3.2 of the draft, coalgebras X → (X × B)^A over arbitrary sets A and B, called Mealy machines, the notation of the figure, and their final coalgebra B^(A⁺). Page 42 of the draft, the iterated transition function δ\* and the behavior of a deterministic automaton.
- [Pattinson, 2003](https://ncatlab.org/nlab/files/Pattinson-Coalgebras.pdf): Definition 1.1.4, the joined transition ⟨out, next⟩ : S × I → O × S, and the wording of the terms, no longer cited by the figure.
- [Mealy machine, nLab](https://ncatlab.org/nlab/show/Mealy+machine): the joined form I × S → O × S, with Pattinson among its references.
- [Ginsburg and Rose, 1962](https://www.ams.org/journals/tran/1962-103-03/S0002-9947-1962-0138546-7/S0002-9947-1962-0138546-7.pdf): a generalized sequential machine, whose output is a word, with two functions apart.
- [Bonsangue, Rutten, and Silva, 2008](https://ir.cwi.nl/pub/11925/11925D.pdf): a Mealy machine (S, f) with f : S → (B × S)^A and no initial state, over a finite set of inputs and a meet-semilattice of outputs, narrower than the machine of the engine.
- [Hansen, Costa, and Rutten, 2006](https://ir.cwi.nl/pub/10858/10858D.pdf): a Mealy coalgebra, and a Mealy machine as one with an initial state and finite sets. Rutten is a peer-reviewed source for the behavior of the machine as a function of streams, which the Determinism section may cite.

## 10. Input and Output

**Question.** What form do an input and an output take?

**Criteria.** Mathematical foundation, one form of data across the machine, generality, order within a tick, the normal forms, checked data, readability to an agent, and a log that can be sent and replayed.

**Options.**

| Option               | Form                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| Any value            | Whatever a schema describes, as a message in Elm.                                      |
| A set of relations   | Relations as in a state, with the order held by a position in each of them.            |
| A sequence of tuples | An ordered sequence of events, each a tuple of a declared relation with atomic values. |

**Decision.** A sequence of tuples. Automata theory takes an input and an output as words over an alphabet, and here the alphabet is the tuples of declared relations, so the form comes from the theory the machine already rests on. A sequence keeps the order in which events arrive and lets one event follow another of the same kind. A sequence of length n is a function from the positions 1 to n, so it is a relation keyed by position, written in order, and wherever a log is stored, it is stored as such a relation, in sixth normal form. The normal forms govern relations, and a sequence passing through the machine is not stored in its state. Any value would give the machine a second form of data, and a set of relations would spread one order across several relations, holding it only by a shared position.

**Sources.** [Ginsburg and Rose, 1962](https://www.ams.org/journals/tran/1962-103-03/S0002-9947-1962-0138546-7/S0002-9947-1962-0138546-7.pdf): the output of a generalized sequential machine is a word over its output alphabet.

## Open

- The duration of a tick. The recommendation is a fixed duration held in the state as a fact, changed only by input.
- A rewind the application itself asks for, such as a mechanic of a game. Either the runtime restores a stored state and records the request, so a replay stays deterministic but a state is reached other than by a transition, or the history is held in the state, so a rewind is a transition but the state grows.
- Whether the model holds the finiteness of the machine, so the theorems of finite automata apply in Lean.
- The random generator. The recommendation is a generator held in the state at the position it has drawn to, so the same position always draws the same numbers, and only a transition moves it, by as much as it draws.
- The identity of an entity. The recommendation is that a new entity gets an identity no entity has had before, so a thing is followed in time without being mistaken for an earlier one.
- Composition of machines, with the statecharts of Harel as a candidate for control logic: animation graphs, behavior, and interfaces.
- Changes as data, derived facts, the persistent state, assets, and deterministic mathematics.
- The part of the state a client predicts. The model holds a world of any size, but a runtime in which every client resimulates the whole state after every correction does not, as a rollback over thousands of entities exceeds the budget of a tick. The candidates are the whole state for a small one, and for a large one the part the player controls, predicted, with the rest interpolated between states of the server. Sources: [Factorio, Friday Facts #83](https://factorio.com/blog/post/fff-83), a deterministic world too large to send, predicted in part in a latency state rebuilt from the real state every tick, and [Factorio, Friday Facts #188](https://factorio.com/blog/post/fff-188), deterministic lockstep at that scale; [Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking), the local player predicted and other entities interpolated.
