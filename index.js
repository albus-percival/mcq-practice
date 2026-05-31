import { Bindable } from "./bindable.js";
let timerTimeOut = null;
const count = {
	correct: 0,
	wrong: 0,
	noAnswer: 0
};
const { values : bound } = new Bindable(document.body);

const Page = (new class {
	#_show(page) {
		for (const p of document.querySelectorAll(".page")) {
			p.classList.add("hidden");
		}
		document.querySelector(`.page[data-page="${page}"]`).classList.remove("hidden");
	}
	#show;
	constructor() {
		if (!document.startViewTransition) {
			this.#show = this.#_show;
		} else {
			this.#show = (page) => {
				document.startViewTransition(() => {
					this.#_show(page);
				});
			};
		}		
	}
	showSetup() {
		// Reset timer and scores
		bound.timer = '00:00:00';
		bound.correct = 0;
		bound.wrong = 0;
		bound.noAnswer = 0;
		bound.timeTaken = '00:00:00';
		count.correct = 0;
		count.wrong = 0;
		count.noAnswer = 0;
		// Show setup page
		this.#show('setup');
	}
	showQuestions() {
		// Start timer
		Timer.start();
		timerTimeOut = setInterval(() => {
			bound.timer = Timer.value;
		}, 1000);

		// Show questions page
		this.#show('questions');
	}
	showAnswers() {
		// Stop timer
		Timer.stop();
		clearInterval(timerTimeOut);
		const value = Timer.value;
		bound.timer = value;
		bound.timeTaken = value;
		
		// Show answers page
		this.#show('answers');
	}
});

const Timer = (new class {
	#startTime;
	#endTime;
	start() {
		this.#startTime = performance.now();
		this.#endTime = null;
	}
	stop() {
		this.#endTime = performance.now();
	}
	get value() {
		if (this.#startTime == null) {
			return '00:00:00';
		}
		const end = this.#endTime ?? performance.now();
		const diff = end - this.#startTime;
		const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
		const minutes = Math.floor(diff / 60000).toString().padStart(2, '0');
		const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
		return `${hours}:${minutes}:${seconds}`;
	}
});

function clearChoice({currentTarget}) {
	const tr = currentTarget.closest('tr');
	for (const ip of tr.querySelectorAll('input')) {
		ip.checked = false;
	}
}

function updateCount({currentTarget}) {
	const selected = currentTarget.checked;
	if(selected) {
		count.correct++;
		count.wrong--;
	} else {
		count.correct--;
		count.wrong++;
	}
	bound.correct = count.correct;
	bound.wrong = count.wrong;
}


// On Setup
document.querySelector('#setup').addEventListener('submit', function(e) {
	e.preventDefault();
	const qCount = Number(this.querySelector('#qCount').value);
	
	
	const frag = new DocumentFragment();
	const temp = document.querySelector('#questions').querySelector('template');
	for (let i = 0; i < qCount; i++) {
		const j = i + 1;
		const trClone = temp.content.cloneNode(true);
		// Set question number
		trClone.querySelector('th').textContent = j;
		// Set name of inputs to q1, q2, ...
		for(const ip of trClone.querySelectorAll('input')) {
			ip.name = `q${j}`;
		}
		// Add event listener to clear button
		trClone.querySelector('button').addEventListener('click', clearChoice);
		frag.appendChild(trClone);
	}
	const tbody = document.querySelector('#questions tbody');
	tbody.innerHTML = '';
	tbody.appendChild(frag);
	
	// Show questions page
	Page.showQuestions();
});



// On Questions submit
document.querySelector('#questions > button').addEventListener('click', function(e) {
	const frag = new DocumentFragment();
	const temp = document.querySelector('#answers template');
	for (const tr of document.querySelectorAll('#questions tbody tr')) {
		const trClone = temp.content.cloneNode(true);
		trClone.querySelector('th').textContent = tr.querySelector('th').textContent;
		const selected = tr.querySelector('input:checked');
		if(selected) {
			count.wrong++;
			trClone.querySelector('td').textContent = selected.value;
			trClone.querySelector('input').addEventListener('change', updateCount);
		} else {
			trClone.querySelector('td:last-child').textContent = '---';
			count.noAnswer++;
		}
		frag.appendChild(trClone);
	}
	const tbody = document.querySelector('#answers tbody');
	tbody.innerHTML = '';
	tbody.appendChild(frag);
	bound.correct = count.correct;
	bound.wrong = count.wrong;
	bound.noAnswer = count.noAnswer;

	// Show answers page
	Page.showAnswers();
});

// On answers page, click on "Restart" button
document.querySelector('#answers > button').addEventListener('click', function() {
	Page.showSetup();
});

// Start with setup page
Page.showSetup();