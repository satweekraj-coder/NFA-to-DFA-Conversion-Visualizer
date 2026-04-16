# 🌐 Live project URL

[(https://satweek2024ucs1504tafl.netlify.app/)](https://satweek2024ucs1504tafl.netlify.app/)# 🚀 NFA → DFA Conversion Visualizer

A modern web application that demonstrates the **conversion of a Non-deterministic Finite Automaton (NFA) into a Deterministic Finite Automaton (DFA)** using the **Subset Construction Algorithm**.

This tool provides **step-by-step visualization**, making it easier for students to understand how multiple NFA states combine into a single DFA state.

---

## 📌 What This Project Does

This web application allows users to:

* Input an NFA (states, alphabet, transitions, etc.)
* Compute ε-closure and move functions
* Convert NFA into DFA using subset construction
* Visualize:

  * NFA graph
  * DFA graph
  * Step-by-step conversion process
* Generate DFA transition table automatically

---

## 🧠 Concepts Used

* Finite Automata
* NFA (Non-deterministic Finite Automaton)
* DFA (Deterministic Finite Automaton)
* ε-closure
* Move function
* Subset Construction Algorithm

---

## 🛠️ Tech Stack

* **HTML5** → Structure
* **CSS3** → Styling (Modern UI + Dark Mode)
* **JavaScript (Vanilla)** → Logic & Algorithm
* **Cytoscape.js** → Graph Visualization

---

## 📂 Folder Structure

```bash id="e8a4bc"
NFA-to-DFA-Visualizer/
│
├── index.html        # Main UI structure
├── style.css         # Styling and layout
├── script.js         # Core logic (conversion + visualization)
│
└── README.md         # Project documentation
```

---

## ⚙️ How the System Works

### 1️⃣ Input Phase

User enters:

* States
* Alphabet
* Start state
* Final states
* Transition table (including ε transitions)

---

### 2️⃣ Processing Phase

The system performs:

* **ε-closure calculation**
* **Move function**
* **Subset construction algorithm**

Each DFA state is generated as a **set of NFA states**.

---

### 3️⃣ Output Phase

The application generates:

* DFA Transition Table
* Step-by-step conversion trace
* Graph visualization of:

  * Original NFA
  * Equivalent DFA

---

## 🧪 Sample Input

```bash id="7u0kn2"
States: q0, q1, q2
Alphabet: a, b
Start State: q0
Final States: q2

Transitions:
q0 —ε→ q1
q1 —a→ q1
q1 —b→ q2
q2 —a→ q2
```

---

## 🚀 How to Run This Project

### ✅ Method 1: Run Locally

1. Download or clone the repository:

```bash id="38i3p0"
git clone https://github.com/your-username/nfa-to-dfa-visualizer.git
```

2. Open the project folder

3. Open `index.html` in any browser (Chrome recommended)

---

### ✅ Method 2: Run via Live Server (Recommended)

1. Open project in VS Code
2. Install **Live Server Extension**
3. Right click on `index.html`
4. Click **"Open with Live Server"**

---

### 🌐 Method 3: On
```
https://github.com/satweekraj-coder/NFA-to-DFA-Conversion-Visualizer.git
```
---

## 🎮 Controls in the App

* Convert to DFA → Starts conversion
* Next Step → Shows next step
* Previous Step → Goes back
* Auto Play → Automatic step visualization
* Reset → Clears everything

---

## ✨ Features

* Interactive UI
* Step-by-step visualization
* Graph rendering (NFA & DFA)
* DFA transition table
* Dark mode toggle
* Export DFA as JSON

---

## ❗ Error Handling

* Invalid input detection
* Missing transitions handling
* Dead state (∅) generation

---

## 🎓 Use Cases

* Academic projects
* Viva demonstrations
* Learning Automata Theory
* Visual understanding of subset construction

---

## 👨‍💻 Author

**satweek raj**
Netaji Subhash University of Technology

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

## 🚀 Future Improvements

* Animation for transitions
* DFA minimization
* Better UI enhancements
* Save/load automata
